import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const customerSchema = z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
});

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const customer = await prisma.customer.findUnique({
            where: { id: params.id },
            include: {
                sales: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });

        if (!customer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(customer);
    } catch (error) {
        console.error('Failed to fetch customer:', error);
        return NextResponse.json(
            { error: 'Failed to fetch customer' },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const validatedData = customerSchema.parse(body);

        const customer = await prisma.customer.update({
            where: { id: params.id },
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
        console.error('Failed to update customer:', error);
        return NextResponse.json(
            { error: 'Failed to update customer' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.customer.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete customer:', error);
        return NextResponse.json(
            { error: 'Failed to delete customer' },
            { status: 500 }
        );
    }
}
