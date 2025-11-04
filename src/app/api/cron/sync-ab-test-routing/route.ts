import { NextResponse } from 'next/server';
import { createClient } from 'redis';

import { getAppURL } from '@/shared/utils';
import { REDIS_KEYS } from '@/shared/redis';
import { ABTestRoutingRedis } from '@/entities/ab-test-routing';

export async function GET() {
    const redisClient = createClient({
        url: process.env.REDIS_URL,
    });

    const appUrl = getAppURL();

    try {
        console.log('Starting cron job: sync-ab-test-routing');

        // 1. Сначла дергаем API CRM для получения данных по роутам A/B тестов
        const apiResponse = await fetch(`${appUrl}/api/crm/ab-test-routing`);

        if (!apiResponse.ok) {
            throw new Error(`API responded with status: ${apiResponse.status}`);
        }

        const result = await apiResponse.json();

        if (result.status !== 'success') {
            throw new Error(`API returned error: ${result.message}`);
        }

        // 2. Подключаемся к Redis и сохраняем данные полученные в шаге 1
        await redisClient.connect();

        const timestamp = new Date().toISOString();

        // Сохраняем данные с временной меткой
        const dataToStore: ABTestRoutingRedis = {
            data: result.data, // TO DO: добавить тайпгарды
            lastUpdated: timestamp,
            source: 'cron_job',
        };

        await redisClient.set(REDIS_KEYS.AB_TEST_ROUTING, JSON.stringify(dataToStore));

        await redisClient.quit();

        console.log('Cron job completed successfully:', timestamp);

        return NextResponse.json({
            status: 'success',
            message: 'AB test routing data synced to Redis',
            lastUpdated: timestamp,
            dataLength: Object.keys(result.data.routing || {}).length,
        });
    } catch (error: unknown) {
        // Закрываем подключение Redis в случае ошибки
        try {
            await redisClient.quit();
        } catch {
            // ignore
        }

        console.error('Cron job failed:', error);

        return NextResponse.json(
            {
                status: 'error',
                message: 'Failed to sync AB test routing data',
                error,
            },
            { status: 500 },
        );
    }
}
