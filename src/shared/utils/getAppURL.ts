const BASE_PATH = 'funnel';

export const getAppURL = () => {
    const appUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';

    return `${appUrl}/${BASE_PATH}`;
};
