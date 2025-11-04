import { getABTestRoutingFromCRM } from '@/entities/ab-test-routing';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const data = await getABTestRoutingFromCRM();

        return NextResponse.json({
            status: 'success',
            data,
        });
    } catch (error: unknown) {
        console.error('CRM get funnel routing error:', error);

        return NextResponse.json(
            {
                status: 'error',
                message: 'Failed to fetch funnel data',
                error,
            },
            { status: 500 },
        );
    }
}
