import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiAuth } from '@/lib/auth-utils';
import { startOfDay, subDays, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { response } = await validateApiAuth();
    if (response) return response;

    const [salesTrend, topProducts, paymentMethods, lowStockProducts] = await Promise.all([
      // 1. Sales Trend (Last 7 days)
      (async () => {
        const sevenDaysAgo = subDays(new Date(), 7);
        const sales = await prisma.sale.findMany({
          where: {
            createdAt: { gte: sevenDaysAgo },
            status: 'COMPLETED',
          },
          select: {
            createdAt: true,
            totalAmount: true,
          },
          orderBy: { createdAt: 'asc' },
        });

        const grouped = sales.reduce((acc: any, sale) => {
          const date = format(sale.createdAt, 'MMM dd');
          acc[date] = (acc[date] || 0) + Number(sale.totalAmount);
          return acc;
        }, {});

        return Object.entries(grouped).map(([date, amount]) => ({
          date,
          amount,
        }));
      })(),

      // 2. Top Selling Products
      (async () => {
        const topItems = await prisma.saleItem.groupBy({
          by: ['productId'],
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5,
        });

        const products = await prisma.product.findMany({
          where: { id: { in: topItems.map((i) => i.productId) } },
          select: { id: true, name: true, price: true },
        });

        return topItems.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return {
            name: product?.name || 'Unknown',
            quantity: item._sum.quantity,
            price: Number(product?.price || 0),
          };
        });
      })(),

      // 3. Payment Methods
      (async () => {
        const methods = await prisma.sale.groupBy({
          by: ['paymentMethod'],
          _count: true,
        });
        return methods.map((m) => ({
          name: m.paymentMethod,
          value: m._count,
        }));
      })(),

      // 4. Low Stock Products
      (async () => {
        const settings = await prisma.storeSettings.findFirst();
        const threshold = settings?.lowStockThreshold ?? 10;

        return prisma.product.findMany({
          where: {
            stockQuantity: { lte: threshold },
          },
          select: {
            id: true,
            name: true,
            stockQuantity: true,
          },
          take: 5,
          orderBy: { stockQuantity: 'asc' },
        });
      })(),
    ]);

    return NextResponse.json({
      salesTrend,
      topProducts,
      paymentMethods,
      lowStockProducts,
    });

  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
