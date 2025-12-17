import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const settingsSchema = z.object({
    storeName: z.string().min(1, 'Store name is required'),
    address: z.string().optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    email: z.string().optional().or(z.literal('')),
    currency: z.string().min(1, 'Currency is required'),
    taxRate: z.number().min(0, 'Tax rate must be positive'),
});

export async function GET() {
    console.log('GET /api/settings called');
    try {
        console.log('Fetching settings from prisma...');
        let settings = await prisma.storeSettings.findFirst();
        console.log('Settings fetched:', settings);

        if (!settings) {
            console.log('No settings found, creating default...');
            settings = await prisma.storeSettings.create({
                data: {
                    storeName: 'My Store',
                    currency: 'USD',
                    taxRate: 10,
                },
            });
            console.log('Created default settings:', settings);
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Failed to fetch settings DETAILED:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settings', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validatedData = settingsSchema.parse(body);

        const firstSettings = await prisma.storeSettings.findFirst();

        const settings = await prisma.storeSettings.upsert({
            where: { id: firstSettings?.id || 'placeholder' },
            update: {
                storeName: validatedData.storeName,
                address: validatedData.address || null,
                phone: validatedData.phone || null,
                email: validatedData.email || null,
                currency: validatedData.currency,
                taxRate: validatedData.taxRate,
            },
            create: {
                storeName: validatedData.storeName,
                address: validatedData.address || null,
                phone: validatedData.phone || null,
                email: validatedData.email || null,
                currency: validatedData.currency,
                taxRate: validatedData.taxRate,
            },
        });

        return NextResponse.json(settings);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }
        console.error('Failed to update settings:', error);
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}
