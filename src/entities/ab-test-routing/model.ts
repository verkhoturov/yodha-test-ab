export interface Funnel {
    url: string;
    percent: number;
}

interface Paywall {
    id: string;
    percent: number;
}

export interface RouteConfig {
    routeName: string;
    funnels: Funnel[];
    paywalls: Paywall[];
}

interface Routing {
    [url: string]: RouteConfig;
}

export interface ABTestRouting {
    routing: Routing;
}

export interface ABTestRoutingRedis {
    data: ABTestRouting;
    lastUpdated: string;
    source: string;
}
