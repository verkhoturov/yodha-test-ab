function getHeader(headers: Headers, name: string): string | undefined {
    if (headers instanceof Headers) return headers.get(name) ?? undefined;

    const v = headers[name.toLowerCase()] ?? headers[name];

    if (Array.isArray(v)) return v[0];

    return v as string | undefined;
}

function normalizeLocalhost(ip: string): string {
    if (ip === '::1') return '127.0.0.1';

    return ip;
}

export function extractClientIp(headers: Headers): string {
    const xff = getHeader(headers, 'x-forwarded-for');

    if (xff) {
        // XFF — это список через запятую. Берём левый (первый) IP.
        const first = xff
            .split(',')
            .map((s) => s.trim())
            .find(Boolean);
        if (first) return normalizeLocalhost(first);
    }

    const cf = getHeader(headers, 'cf-connecting-ip'); // Cloudflare
    if (cf) return normalizeLocalhost(cf);

    const real = getHeader(headers, 'x-real-ip'); // Nginx/прочие
    if (real) return normalizeLocalhost(real);

    // Платформенные штуки Vercel (не обязаны присутствовать вне Vercel)
    const vercel =
        getHeader(headers, 'x-vercel-forwarded-for') || getHeader(headers, 'x-vercel-ip');
    if (vercel) {
        const first = vercel
            .split(',')
            .map((s) => s.trim())
            .find(Boolean);
        if (first) return normalizeLocalhost(first);
    }

    return 'unknown';
}
