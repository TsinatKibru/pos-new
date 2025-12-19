
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiAuth } from '@/lib/auth-utils';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
    lowStockThreshold: z.number().int().min(1),
});

export async function GET() {
    try {
        const { response } = await validateApiAuth();
        if (response) return response;

        const settings = await prisma.storeSettings.findFirst();
        return NextResponse.json({
            lowStockThreshold: settings?.lowStockThreshold ?? 10
        });
    } catch (error) {
        console.error('Failed to fetch inventory settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { user, response } = await validateApiAuth();
        if (response) return response;

        if (user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const result = updateSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.errors },
                { status: 400 }
            );
        }

        const { lowStockThreshold } = result.data;

        // Update or create settings
        const currentSettings = await prisma.storeSettings.findFirst();

        if (currentSettings) {
            await prisma.storeSettings.update({
                where: { id: currentSettings.id },
                data: { lowStockThreshold },
            });
        } else {
            await prisma.storeSettings.create({
                data: {
                    storeName: 'My Store', // Default required field
                    currency: 'USD',
                    lowStockThreshold
                },
            });
        }

        return NextResponse.json({ success: true, lowStockThreshold });
    } catch (error) {
        console.error('Failed to update inventory settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
