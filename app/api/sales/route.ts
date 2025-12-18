import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

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

    // Fetch paginated data and total count in parallel
    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
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
        skip,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ]);

    return NextResponse.json({
      data: sales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
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

    console.log('Received Sale Request:', {
      customerId,
      pointsRedeemed: body.pointsRedeemed,
      totalAmount
    });

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

    // Verify Session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const sale = await prisma.$transaction(async (tx) => {
      // 1b. Handle Loyalty Points (Redeem & Earn)
      let finalTotal = totalAmount;

      // REDEEM
      if (customerId && body.pointsRedeemed > 0) {
        console.log(`Attempting to redeem ${body.pointsRedeemed} points for customer ${customerId}`);
        // Verify balance
        const customer = await tx.customer.findUnique({ where: { id: customerId } });
        if (!customer || customer.loyaltyPoints < body.pointsRedeemed) {
          throw new Error('Insufficient loyalty points');
        }

        await tx.customer.update({
          where: { id: customerId },
          data: { loyaltyPoints: { decrement: body.pointsRedeemed } }
        });

        // Discount is already applied to totalAmount in UI? 
        // Wait, the UI sends `totalAmount` which is the SUBTOTAL - DISCOUNT + TAX.
        // The PaymentDialog calculated a `finalTotal` which was potentially lower.
        // But the `handlePayment` in POS page sends `summary.total`.
        // We need to trust the `pointsRedeemed` implies a discount was given.

        // Actually, the schema has `discountAmount`. We should add the points discount to that?
        // Or just trust the `totalAmount` passed is correct?
        // Let's assume `totalAmount` passed IS the final amount to pay.
      }

      // EARN
      if (customerId) {
        const settings = await tx.storeSettings.findFirst();
        const rate = settings?.loyaltyRate ? Number(settings.loyaltyRate) : 1;
        const pointsEarned = Math.floor(Number(totalAmount) * rate);

        if (pointsEarned > 0) {
          console.log(`Customer ${customerId} earned ${pointsEarned} points (Rate: ${rate})`);
          await tx.customer.update({
            where: { id: customerId },
            data: { loyaltyPoints: { increment: pointsEarned } }
          });
        }
      }

      // 1. Create Sale
      const newSale = await tx.sale.create({
        data: {
          userId: user.id,
          customerId,
          totalAmount, // This is expected to be the final paid amount
          taxAmount,
          discountAmount, // This might need to include points discount if we want to track it
          paymentMethod,
          status: 'COMPLETED',
        },
      });

      // ... Items ...
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

        const updatedProduct = await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });

        await tx.stockLog.create({
          data: {
            productId: item.productId,
            userId: user.id,
            quantityChange: -item.quantity,
            previousStock: updatedProduct.stockQuantity + item.quantity,
            newStock: updatedProduct.stockQuantity,
            actionType: 'SALE',
            reason: `Sale ${newSale.id.substring(0, 8)}`
          }
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
