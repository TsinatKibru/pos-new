import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    const where: any = {};

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { customer: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (userId && userId !== 'all') {
      where.userId = userId;
    }

    if (startDate && endDate) {
      // Adjust end date to end of day if it's just a date string
      const end = new Date(endDate);
      if (endDate.length <= 10) { // YYYY-MM-DD
        end.setHours(23, 59, 59, 999);
      }

      where.createdAt = {
        gte: new Date(startDate),
        lte: end,
      };
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        user: true,
        saleItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to 100 for now to prevent overload
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error('Failed to fetch sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      items,
      totalAmount,
      taxAmount,
      discountAmount,
      paymentMethod,
      customerId,
    } = body;

    // TODO: Get actual user ID from session/auth context
    // For now we might need to rely on what's passed or a default if not authenticated in API context properly yet
    // But this valid route should be protected.
    // Let's assume we can get user.
    // In a real app we'd use getServerSession(authOptions) here.

    // For this fixing step, I'll import getServerSession or just check if we can get a userId from body if sent?
    // The previous implementation of GET used userId from query.
    // Let's assume we need to fetch the current user.

    // Quick fix: Since I can't easily import authOptions without checking where it is (found it in lib/auth.ts earlier),
    // I will try to use a placeholder or better yet, fetch the session.

    // Wait, I see `requireAuth` helper used in other routes? Let's check imports.
    // app/api/users/route.ts used `requireAuth`. Let's see if I can use it.
    // If not, I'll use prisma interaction directly but need a userId.

    // Let's look for a valid user ID. 
    // I'll assume the request might need to include userId or I fetch the first user as fallback if no session?
    // No, that's bad security.

    // Let's import getServerSession.
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const sale = await prisma.$transaction(async (tx) => {
      // 1. Create Sale
      const newSale = await tx.sale.create({
        data: {
          userId: user.id,
          customerId,
          totalAmount,
          taxAmount,
          discountAmount,
          paymentMethod,
          status: 'COMPLETED',
        },
      });

      // 2. Create Sale Items and Update Stock
      for (const item of items) {
        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            discountAmount: item.discountAmount,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      return newSale;
    });

    // Fetch complete sale with relations to return
    const completeSale = await prisma.sale.findUnique({
      where: { id: sale.id },
      include: {
        saleItems: {
          include: {
            product: true
          }
        },
        customer: true,
        user: true
      }
    });

    return NextResponse.json(completeSale);
  } catch (error) {
    console.error('Failed to create sale:', error);
    return NextResponse.json(
      { error: 'Failed to create sale' },
      { status: 500 }
    );
  }
}
