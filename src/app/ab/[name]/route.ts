import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { log } from '@/shared/utils';
import { collectRequestMeta } from '@/shared/utils';
import { getRoutingDataFromRedis, RouteConfig, Funnel } from '@/entities/ab-test-routing';

export const dynamic = 'force-dynamic';

interface RouteParams {
    params: {
        name: string;
    };
}

// Функция для выбора воронки на основе percent
function selectFunnelByPercent(funnels: Funnel[]): { funnel: Funnel; bucket: string } {
    const totalPercent = funnels.reduce((sum, funnel) => sum + funnel.percent, 0);
    const random = Math.random() * totalPercent;

    let cumulative = 0;

    for (let i = 0; i < funnels.length; i++) {
        const funnel = funnels[i];
        cumulative += funnel.percent;

        if (random <= cumulative) {
            return {
                funnel,
                bucket: `Funnel_${i + 1}`, // Funnel_1, Funnel_2 и т.д.
            };
        }
    }

    // Fallback - первая воронка
    return { funnel: funnels[0], bucket: 'Funnel_1' };
}

export async function GET(request: Request, { params }: RouteParams) {
    const { name } = params;
    const { origin, search } = new URL(request.url);

    const meta = collectRequestMeta(request);

    try {
        // 1. Получаем данные о роутах из Redis
        const routingData = await getRoutingDataFromRedis();

        if (!routingData || !routingData.data?.routing) {
            console.error('No AB test routing data found in Redis for slug:', name);
            return NextResponse.redirect(`${origin}/404`, { status: 302 });
        }

        const { routing: routingList } = routingData.data;

        // 2. Ищем конфигурацию для текущего name
        let foundConfig: RouteConfig | null = null;

        for (const [url, config] of Object.entries(routingList)) {
            // Извлекаем name из URL (последняя часть пути)
            const urlParts = url.split('/');
            const urlName = urlParts[urlParts.length - 1];

            if (urlName === name) {
                foundConfig = config;
                break;
            }
        }

        if (!foundConfig) {
            console.error('No routing config found for name:', name);
            return NextResponse.redirect(`${origin}/404`, { status: 302 });
        }

        const { routeName, funnels } = foundConfig;

        // 3. Проверяем что есть funnels для A/B теста
        if (!funnels || funnels.length === 0) {
            console.error('No funnels found for route:', routeName);
            return NextResponse.redirect(`${origin}/404`, { status: 302 });
        }

        const AB_TEST_NAME = routeName;
        const AB_COOKIE = `ab-${AB_TEST_NAME}`;

        // 4. Путь для ботов: редиректим на первую воронку
        if (meta.isBot) {
            const targetURL = `${origin}${funnels[0].url}${search}`;

            log('[A/B test]:', {
                targetURL,
                ip: meta.ip,
                isBot: true,
                userAgentRaw: meta.uaRaw,
                referer: meta.referer,
                geo: meta.geo,
            });

            return NextResponse.redirect(targetURL, {
                status: 302,
            });
        }

        // 5. Людской путь: A/B логика с учетом percent
        const jar = await cookies();
        let bucket = jar.get(AB_COOKIE)?.value;
        const isFirstVisit = !bucket;

        let targetFunnel: Funnel;

        if (!bucket) {
            // Выбираем воронку на основе percent
            const selection = selectFunnelByPercent(funnels);
            targetFunnel = selection.funnel;
            bucket = selection.bucket;

            jar.set(AB_COOKIE, bucket, {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                secure: origin.startsWith('https://'),
                maxAge: 60 * 60 * 24 * 30, // 30 дней
            });
        } else {
            // Если кука уже есть, находим соответствующую воронку
            const bucketMatch = bucket.match(/Funnel_(\d+)/);
            if (bucketMatch) {
                const funnelIndex = parseInt(bucketMatch[1]) - 1;
                targetFunnel = funnels[funnelIndex] || funnels[0];
            } else {
                // Если кука в неправильном формате, выбираем заново
                const selection = selectFunnelByPercent(funnels);
                targetFunnel = selection.funnel;
                bucket = selection.bucket;
            }
        }

        // Собираем целевой URL
        const targetUrl = new URL(`${origin}${targetFunnel.url}${search || ''}`);
        targetUrl.searchParams.set('ab_test_group', bucket);
        targetUrl.searchParams.set('ab_test_name', AB_TEST_NAME);

        const targetURL = targetUrl.toString();

        log('[A/B test]:', {
            testName: AB_TEST_NAME,
            targetURL,
            isFirstVisit,
            groupName: bucket,
            ip: meta.ip,
            isBot: meta.isBot,
            userAgentRaw: meta.uaRaw,
            userAgent: meta.ua,
            referer: meta.referer,
            geo: meta.geo,
        });

        return NextResponse.redirect(targetURL, { status: 302 });
    } catch (error: unknown) {
        console.error('Error in funnel AB routing:', error);
        const { origin } = new URL(request.url);
        return NextResponse.redirect(`${origin}/500`, { status: 302 });
    }
}
