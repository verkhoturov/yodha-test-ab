interface Funnel {
    url: string;
    percent: number;
  }
  
  interface Paywall {
    id: string;
    percent: number;
  }
  
  interface RouteConfig {
    routeName: string;
    funnels: Funnel[];
    paywalls: Paywall[];
  }
  
  interface Routing {
    [url: string]: RouteConfig;
  }
  
  export interface FunnelDataResponse {
    routing: Routing;
  }