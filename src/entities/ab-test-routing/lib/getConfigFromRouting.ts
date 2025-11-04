import { RouteConfig, Routing } from '../model';

export const getConfigFromRouting = (routingList: Routing, targetName: string) => {
    let foundConfig: RouteConfig | null = null;

    for (const [url, config] of Object.entries(routingList)) {
        // Извлекаем name из URL (последняя часть пути)
        const urlParts = url.split('/');
        const urlName = urlParts[urlParts.length - 1];

        if (urlName === targetName) {
            foundConfig = config;
            break;
        }
    }

    return foundConfig;
};
