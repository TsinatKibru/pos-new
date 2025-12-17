import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';

export async function GET() {
    try {
        await requireAuth();

        const users = await prisma.user.findMany({
            select: {
                id: true,
                fullName: true,
                role: true,
            },
            orderBy: { fullName: 'asc' },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
