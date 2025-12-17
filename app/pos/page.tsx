'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Product } from '@prisma/client';
import { ProductSearch } from '@/components/pos/product-search';
import { CartSummary } from '@/components/pos/cart-summary';
import { PaymentDialog, PaymentData } from '@/components/pos/payment-dialog';
import { Receipt } from '@/components/pos/receipt';
import { CartItem, getCartSummary } from '@/lib/cart-utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function POSPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [taxRate] = useState(10);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchProducts = async () => {
      console.log("🔄 Fetching products from /api/products...");
      try {
        const response = await fetch('/api/products');
        console.log("📡 Response status:", response.status);

        if (!response.ok) throw new Error('Failed to fetch products');

        const data = await response.json();
        console.log("📦 Raw API data:", data);

        const productsArray = Array.isArray(data) ? data : data.products || [];
        console.log(`✅ Loaded ${productsArray.length} products`);

        setProducts(productsArray);
      } catch (error) {
        console.error('❌ Failed to fetch products:', error);
        toast.error('Failed to load products');
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.productId === product.id);

      if (existingItem) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: Number(product.price),
          quantity: 1,
          imageUrl: product.imageUrl || undefined,
        },
      ];
    });
    toast.success(`${product.name} added to cart`);
  }, []);

  const handleUpdateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity < 1) {
        handleRemoveItem(productId);
        return;
      }

      setCartItems((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        )
      );
    },
    []
  );

  const handleRemoveItem = useCallback((productId: string) => {
    setCartItems((prev) =>
      prev.filter((item) => item.productId !== productId)
    );
  }, []);

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setShowPaymentDialog(true);
  };

  const handlePayment = async (paymentData: PaymentData) => {
    setIsCheckingOut(true);

    try {
      const summary = getCartSummary({
        items: cartItems,
        discountPercentage,
        taxRate,
      });

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price,
            discountAmount: item.discountAmount || 0,
            subtotal: item.price * item.quantity - (item.discountAmount || 0),
          })),
          totalAmount: summary.total,
          taxAmount: summary.tax,
          discountAmount: summary.discountAmount,
          paymentMethod: paymentData.paymentMethod,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process sale');
      }

      const sale = await response.json();

      const change =
        paymentData.paymentMethod === 'CASH'
          ? (paymentData.amountPaid || summary.total) - summary.total
          : 0;

      setReceipt({
        saleId: sale.id,
        items: sale.saleItems.map((item: any) => ({
          productId: item.productId,
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
          discountAmount: Number(item.discountAmount),
        })),
        subtotal: summary.subtotal,
        discount: summary.discountAmount,
        tax: summary.tax,
        total: summary.total,
        paymentMethod: paymentData.paymentMethod,
        amountPaid: paymentData.amountPaid,
        change: Math.round(change * 100) / 100,
        cashierName: session?.user?.name || 'Unknown',
        transactionTime: new Date(),
      });

      setShowReceipt(true);
      setShowPaymentDialog(false);

      setCartItems([]);
      setDiscountPercentage(0);

      toast.success('Sale completed successfully');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  const summary = getCartSummary({
    items: cartItems,
    discountPercentage,
    taxRate,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">Point of Sale</h1>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">
              {session?.user?.name}
            </p>
            <p className="text-xs text-slate-500 capitalize">
              {session?.user?.role?.toLowerCase()}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <ProductSearch products={products} onAddToCart={handleAddToCart} />
          </div>

          <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-500">
                  Search and add products to cart
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Items ({summary.itemCount})
                </h2>
                {cartItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.quantity} x ${item.price.toFixed(2)} = $
                        {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <CartSummary
            items={cartItems}
            discountPercentage={discountPercentage}
            taxRate={taxRate}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onUpdateDiscount={setDiscountPercentage}
            onCheckout={handleCheckout}
            isCheckingOut={isCheckingOut}
          />
        </div>
      </div>

      <PaymentDialog
        open={showPaymentDialog}
        total={summary.total}
        onClose={() => setShowPaymentDialog(false)}
        onConfirm={handlePayment}
        isLoading={isCheckingOut}
      />

      {showReceipt && receipt && (
        <Receipt
          {...receipt}
          onClose={() => {
            setShowReceipt(false);
            setReceipt(null);
          }}
        />
      )}
    </div>
  );
}
