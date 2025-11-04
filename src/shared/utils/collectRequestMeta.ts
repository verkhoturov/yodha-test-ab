import { isbot } from 'isbot';
import { UAParser } from 'ua-parser-js';

import { extractClientIp } from './extractClientIp';

export function collectRequestMeta(request: Request) {
    const headers = request.headers;

    const ip = extractClientIp(headers);

    const uaRaw = headers.get('user-agent') || undefined;
    const parser = new UAParser(uaRaw);
    const result = parser.getResult();

    const acceptLanguage = headers.get('accept-language') || '';
    const locale = acceptLanguage.split(',')[0]?.trim() || undefined;

    // Vercel Geo headers (будут пустыми вне Vercel)
    const geo = {
        country: headers.get('x-vercel-ip-country') || undefined,
        region: headers.get('x-vercel-ip-country-region') || undefined,
        city: headers.get('x-vercel-ip-city') || undefined,
        timezone: headers.get('x-vercel-ip-timezone') || undefined,
        latitude: headers.get('x-vercel-ip-latitude') || undefined,
        longitude: headers.get('x-vercel-ip-longitude') || undefined,
        vercelRegion: headers.get('x-vercel-region') || undefined,
    };

    // Определяем тип устройства
    let deviceType = 'unknown';
    if (result.device?.type) {
        deviceType = result.device.type;
    }

    return {
        isBot: isbot(uaRaw || ''),
        ip,
        uaRaw,
        ua: {
            browser: result.browser?.name || undefined,
            os: result.os?.name || undefined,
            deviceType,
            deviceVendor: result.device?.vendor || undefined,
            deviceModel: result.device?.model || undefined,
            engine: (result.engine?.name as string) || undefined,
            cpu: (result.cpu?.architecture as string) || undefined,
        },
        locale,
        referer: headers.get('referer') || undefined,
        geo,
    };
}
