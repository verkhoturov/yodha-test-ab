import { NextResponse } from 'next/server';
import { createClient } from 'redis';

import { REDIS_KEYS } from '@/shared/redis';
import { ABTestRoutingRedis } from '@/entities/ab-test-routing';
import { getABTestRoutingFromCRM } from '@/entities/ab-test-routing';

export async function GET() {
    const redisClient = createClient({
        url: process.env.REDIS_URL,
    });

    try {
        console.log('Starting cron job: sync-ab-test-routing');

        // 1. Напрямую вызываем функцию получения данных из CRM
        const data = await getABTestRoutingFromCRM();

        // 2. Подключаемся к Redis и сохраняем данные
        await redisClient.connect();

        const timestamp = new Date().toISOString();

        // Сохраняем данные с временной меткой
        const dataToStore: ABTestRoutingRedis = {
            data: data,
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
            dataLength: Object.keys(data.routing || {}).length,
        });
    } catch (error: unknown) {
        // Закрываем подключение Redis в случае ошибки
        try {
            await redisClient.quit();
        } catch {
            // ignore
        }

        console.error('Cron job failed:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        return NextResponse.json(
            {
                status: 'error',
                message: 'Failed to sync AB test routing data',
                error: errorMessage,
            },
            { status: 500 },
        );
    }
}
