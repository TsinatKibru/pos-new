
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId');

        const where: any = {};
        if (productId) {
            where.productId = productId;
        }

        const logs = await prisma.stockLog.findMany({
            where,
            include: {
                user: {
                    select: { fullName: true }
                },
                product: {
                    select: { name: true, sku: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error('Failed to fetch logs:', error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
