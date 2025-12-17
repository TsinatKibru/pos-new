import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      items,
      customerId,
      totalAmount,
      taxAmount,
      discountAmount,
      paymentMethod,
    } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sale = await prisma.sale.create({
      data: {
        userId: user.id,
        customerId,
        totalAmount: parseFloat(totalAmount),
        taxAmount: parseFloat(taxAmount),
        discountAmount: parseFloat(discountAmount),
        paymentMethod,
        saleItems: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice),
            discountAmount: parseFloat(item.discountAmount || 0),
            subtotal: parseFloat(item.subtotal),
          })),
        },
      },
      include: {
        saleItems: {
          include: {
            product: true,
          },
        },
        user: true,
        customer: true,
      },
    });

    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error('Sale creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create sale' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const sales = await prisma.sale.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        saleItems: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    const total = await prisma.sale.count({
      where: { userId: user.id },
    });

    return NextResponse.json({
      sales,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Failed to fetch sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}
