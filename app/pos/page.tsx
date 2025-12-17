'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Product } from '@prisma/client';
import { CartSummary } from '@/components/pos/cart-summary';
import { PaymentDialog, PaymentData } from '@/components/pos/payment-dialog';
import { Receipt } from '@/components/pos/receipt';
import { CustomerSearch } from '@/components/pos/customer-search';
import { KeyboardShortcutsHelp } from '@/components/pos/keyboard-shortcuts-help';
import { CartItem, getCartSummary } from '@/lib/cart-utils';
import { CategoryFilter } from '@/components/pos/category-filter';
import { ProductGrid } from '@/components/pos/product-grid';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useHotkeys } from '@/hooks/use-hotkeys';

interface Customer {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
}

interface StoreSettings {
  storeName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  taxRate: number;
}

export default function POSPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State from previous implementation
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [taxRate, setTaxRate] = useState(10);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  // New State for Categories and Grid
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Authentication Check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setStoreSettings(data);
          if (data.taxRate) setTaxRate(Number(data.taxRate));
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Fetch Products and Categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories')
        ]);

        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(Array.isArray(data) ? data : data.products || []);
        }

        if (categoriesRes.ok) {
          setCategories(await categoriesRes.json());
        }
      } catch (error) {
        toast.error('Failed to load POS data');
      }
    };
    fetchData();
  }, []);

  // Handlers
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
          customerId: selectedCustomer?.id || null,
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
        customerName: selectedCustomer?.fullName,
        storeSettings: storeSettings,
      });

      setShowReceipt(true);
      setShowPaymentDialog(false);

      setCartItems([]);
      setDiscountPercentage(0);
      setSelectedCustomer(null);

      toast.success('Sale completed successfully');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategoryId === null || product.categoryId === selectedCategoryId;

    return matchesSearch && matchesCategory;
  });

  // Shortcuts
  useHotkeys('F2', () => {
    document.getElementById('product-search-input')?.focus();
  });

  useHotkeys('Enter', () => {
    if (!showPaymentDialog && !showReceipt && cartItems.length > 0) {
      handleCheckout();
    }
  }, [showPaymentDialog, showReceipt, cartItems]);

  useHotkeys('Escape', () => {
    if (showPaymentDialog) setShowPaymentDialog(false);
    if (showReceipt) setShowReceipt(false);
  }, [showPaymentDialog, showReceipt]);

  const summary = getCartSummary({
    items: cartItems,
    discountPercentage,
    taxRate,
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-slate-900 hidden md:block">POS</h1>

          {/* Search Bar */}
          <div className="relative max-w-md w-full ml-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="product-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products... (F2)"
              className="pl-9 bg-slate-100 border-none"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900">{session?.user?.name}</p>
          </div>
          <CustomerSearch selectedCustomer={selectedCustomer} onSelectCustomer={setSelectedCustomer} />
          <KeyboardShortcutsHelp />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Grid Area */}
        <div className="flex-1 flex flex-col md:p-4 overflow-hidden">
          <div className="shrink-0 mb-4 px-4 md:px-0">
            <CategoryFilter
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
            />
          </div>

          <ScrollArea className="flex-1 px-4 md:px-0 pb-4">
            <ProductGrid products={filteredProducts} onAddToCart={handleAddToCart} />
          </ScrollArea>
        </div>

        {/* Cart Sidebar */}
        <div className="w-full md:w-[400px] shrink-0 bg-white border-l flex flex-col">
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

      {/* Dialogs */}
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
