import { Funnel } from '../model';

const bucketNames: Record<number, string> = {
    1: 'A',
    2: 'B',
    3: 'D',
    4: 'C',
};

export const selectFunnelByPercent = (funnels: Funnel[]): { funnel: Funnel; bucket: string } => {
    const totalPercent = funnels.reduce((sum, funnel) => sum + funnel.percent, 0);
    const random = Math.random() * totalPercent;

    let cumulative = 0;

    for (let i = 0; i < funnels.length; i++) {
        const funnel = funnels[i];
        cumulative += funnel.percent;

        if (random <= cumulative) {
            return {
                funnel,
                bucket: bucketNames[i] || 'X',
            };
        }
    }

    // Fallback - первая воронка
    return { funnel: funnels[0], bucket: bucketNames[0] };
};
