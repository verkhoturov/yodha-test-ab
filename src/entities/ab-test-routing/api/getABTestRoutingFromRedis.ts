import { createClient } from 'redis';
import { REDIS_KEYS } from '@/shared/redis';
import { ABTestRoutingRedis } from '@/entities/ab-test-routing';

export const getRoutingDataFromRedis = async () => {
    const redisClient = createClient({
        url: process.env.REDIS_URL,
    });

    try {
        await redisClient.connect();
        const strData = await redisClient.get(REDIS_KEYS.AB_TEST_ROUTING);

        if (!strData) {
            return null;
        }

        const data: ABTestRoutingRedis = JSON.parse(strData);

        // TO DO: добавить тайпгарды
        return data;
    } catch (error) {
        console.error('Redis error:', error);

        return null;
    } finally {
        await redisClient.quit();
    }
};
