import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const customerSchema = z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
});

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');

        const where = search
            ? {
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' as const } },
                    { email: { contains: search, mode: 'insensitive' as const } },
                    { phone: { contains: search, mode: 'insensitive' as const } },
                ],
            }
            : {};

        const customers = await prisma.customer.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(customers);
    } catch (error) {
        console.error('Failed to fetch customers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch customers' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validatedData = customerSchema.parse(body);

        const customer = await prisma.customer.create({
            data: {
                fullName: validatedData.fullName,
                email: validatedData.email || null,
                phone: validatedData.phone || null,
            },
        });

        return NextResponse.json(customer);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }
        console.error('Failed to create customer:', error);
        return NextResponse.json(
            { error: 'Failed to create customer' },
            { status: 500 }
        );
    }
}
