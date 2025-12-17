import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import { startOfDay, subDays, format } from 'date-fns';

export async function GET() {
  try {
    await requireAuth();

    // 1. Sales Trend (Last 7 Days)
    const sevenDaysAgo = startOfDay(subDays(new Date(), 6));
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: 'COMPLETED',
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    const salesTrendMap = new Map<string, number>();
    // Initialize last 7 days with 0
    for (let i = 0; i < 7; i++) {
      const date = subDays(new Date(), i);
      salesTrendMap.set(format(date, 'MMM dd'), 0);
    }

    sales.forEach(sale => {
      const dateKey = format(sale.createdAt, 'MMM dd');
      const current = salesTrendMap.get(dateKey) || 0;
      salesTrendMap.set(dateKey, current + Number(sale.totalAmount));
    });

    // Convert map to array and reverse to show oldest first
    const salesTrend = Array.from(salesTrendMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .reverse();


    // 2. Top Products (by Quantity)
    const topProductsRaw = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const topProductIds = topProductsRaw.map(p => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, price: true },
    });

    const topProducts = topProductsRaw.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        name: product?.name || 'Unknown',
        quantity: item._sum.quantity || 0,
        price: Number(product?.price || 0),
      };
    });


    // 3. Payment Methods
    const paymentMethodsRaw = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      _count: { id: true },
      where: { status: 'COMPLETED' },
    });

    const paymentMethods = paymentMethodsRaw.map(pm => ({
      name: pm.paymentMethod,
      value: pm._count.id,
    }));

    return NextResponse.json({
      salesTrend,
      topProducts,
      paymentMethods,
    });

  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
