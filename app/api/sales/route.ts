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
