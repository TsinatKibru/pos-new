import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth-utils';

const productUpdateSchema = z.object({
  name: z.string().min(1, 'Product name is required').optional(),
  description: z.string().optional().nullable(),
  sku: z.string().min(1, 'SKU is required').optional(),
  barcode: z.string().optional().nullable(),
  price: z.number().positive('Price must be positive').optional(),
  cost: z.number().positive('Cost must be positive').optional(),
  stockQuantity: z.number().int().min(0, 'Stock quantity cannot be negative').optional(),
  imageUrl: z.string().url().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const body = await request.json();
    const validatedData = productUpdateSchema.parse(body);

    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku: validatedData.sku },
      });

      if (skuExists) {
        return NextResponse.json(
          { error: 'Product with this SKU already exists' },
          { status: 400 }
        );
      }
    }

    // Separate reason from validated data
    const { reason, ...dataToUpdate } = body;
    // We can rely on validatedData for the fields, but handle stock logic

    // Calculate stock change
    let quantityChange = 0;
    let actionType = 'ADJUSTMENT'; // Default

    if (validatedData.stockQuantity !== undefined && validatedData.stockQuantity !== existingProduct.stockQuantity) {
      quantityChange = validatedData.stockQuantity - existingProduct.stockQuantity;
      if (reason && reason.toLowerCase().includes('restock')) actionType = 'RESTOCK';
      else if (reason && reason.toLowerCase().includes('return')) actionType = 'RETURN';
      else if (reason && reason.toLowerCase().includes('theft')) actionType = 'THEFT';
      // Add more logic or pass explicit actionType from UI if needed
    }

    // Use transaction
    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: params.id },
        data: validatedData,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (quantityChange !== 0) {
        // Get user ID
        const { getServerSession } = await import("next-auth");
        const { authOptions } = await import("@/lib/auth");
        const session = await getServerSession(authOptions);
        const user = session?.user?.email ? await tx.user.findUnique({ where: { email: session.user.email } }) : null;

        await tx.stockLog.create({
          data: {
            productId: params.id,
            userId: user?.id,
            quantityChange,
            previousStock: existingProduct.stockQuantity,
            newStock: updated.stockQuantity,
            actionType: actionType as any, // Cast to enum
            reason: reason || 'Manual Adjustment',
          }
        });
      }
      return updated;
    });

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
