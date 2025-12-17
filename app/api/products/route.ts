import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireAuth } from '@/lib/auth-utils';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional().nullable(),
  price: z.number().positive('Price must be positive'),
  cost: z.number().positive('Cost must be positive'),
  stockQuantity: z.number().int().min(0, 'Stock quantity cannot be negative'),
  imageUrl: z.string().url().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const isActive = searchParams.get('isActive');
    const lowStock = searchParams.get('lowStock');

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (lowStock === 'true') {
      where.stockQuantity = { lte: 10 };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const validatedData = productSchema.parse(body);

    const existingProduct = await prisma.product.findUnique({
      where: { sku: validatedData.sku },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this SKU already exists' },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        sku: validatedData.sku,
        barcode: validatedData.barcode,
        price: validatedData.price,
        cost: validatedData.cost,
        stockQuantity: validatedData.stockQuantity,
        imageUrl: validatedData.imageUrl,
        categoryId: validatedData.categoryId,
        isActive: validatedData.isActive ?? true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(product, { status: 201 });
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
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
