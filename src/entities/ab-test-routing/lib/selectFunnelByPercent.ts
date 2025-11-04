import { Funnel } from '../model';

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
                bucket: `Funnel_${i + 1}`, // Funnel_1, Funnel_2 и т.д.
            };
        }
    }

    // Fallback - первая воронка
    return { funnel: funnels[0], bucket: 'Funnel_1' };
};
