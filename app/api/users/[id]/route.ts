import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import { hash } from 'bcryptjs';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const currentUser = await requireAuth();

        // Only admin can update other users (except potentially self-update, but let's restrict to admin for now)
        if (currentUser.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = params;
        const body = await req.json();
        const { fullName, email, role, password, imageUrl } = body;

        const updateData: any = {
            fullName,
            email,
            role,
            imageUrl,
        };

        // Only update password if provided
        if (password) {
            updateData.passwordHash = await hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
        });

        const { passwordHash: _, ...userWithoutPassword } = updatedUser;

        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        console.error('Failed to update user:', error);
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const currentUser = await requireAuth();

        if (currentUser.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = params;

        // Prevent deleting yourself
        if (currentUser.id === id) {
            return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
        }

        // Optional: Check for related sales and handle cleanup or prevent deletion?
        // For now, let's just delete. If there are foreign key constraints, Prisma will throw.
        // Ideally we should soft delete or set isActive=false, but user requested delete.
        // Prisma schema might need updates for cascading deletes or we catch the error.
        // Sale -> User is a relation. If we delete user, sales lose their link?
        // In Sale model: user User @relation(fields: [userId], references: [id])
        // No onDelete action specified, so it defaults to restrict probably?
        // Let's check schema.

        // To be safe, let's check for sales.
        const hasSales = await prisma.sale.findFirst({ where: { userId: id } });
        if (hasSales) {
            return NextResponse.json({ error: "Cannot delete user with associated sales history. Consider deactivating instead." }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete user:', error);
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        );
    }
}
