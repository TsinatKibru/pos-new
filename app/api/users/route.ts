import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import { hash } from 'bcryptjs';

export async function GET() {
    try {
        await requireAuth();

        const users = await prisma.user.findMany({
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                imageUrl: true,
                createdAt: true,
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

export async function POST(req: Request) {
    try {
        const currentUser = await requireAuth();

        // Only admin can create users
        if (currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { fullName, email, password, role, imageUrl } = body;

        if (!fullName || !email || !password || !role) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists with this email' },
                { status: 409 }
            );
        }

        const passwordHash = await hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                fullName,
                email,
                passwordHash,
                role,
                imageUrl,
            }
        });

        // Strip password hash from response
        const { passwordHash: _, ...userWithoutPassword } = newUser;

        return NextResponse.json(userWithoutPassword, { status: 201 });

    } catch (error) {
        console.error('Failed to create user:', error);
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        );
    }
}
