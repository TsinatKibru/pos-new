import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySales = await prisma.sale.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        saleItems: {
          include: {
            product: true,
          },
        },
      },
    });

    const totalSales = todaySales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    const transactionCount = todaySales.length;

    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
    todaySales.forEach((sale) => {
      sale.saleItems.forEach((item) => {
        const key = item.productId;
        const existing = productSales.get(key) || {
          name: item.product.name,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue += Number(item.subtotal);
        productSales.set(key, existing);
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const products = await prisma.product.findMany();
    const productCount = products.length;
    const lowStockCount = products.filter((p) => p.stockQuantity < 10).length;

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const salesTrend = await Promise.all(
      last7Days.map(async (date) => {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const sales = await prisma.sale.findMany({
          where: {
            userId: user.id,
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
        });

        const total = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sales: total,
          transactions: sales.length,
        };
      })
    );

    return NextResponse.json({
      todaySummary: {
        totalSales,
        transactionCount,
        productCount,
        lowStockCount,
      },
      topProducts,
      salesTrend,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
