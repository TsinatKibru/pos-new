'use client';

import { CartItem, getCartSummary } from '@/lib/cart-utils';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface CartSummaryProps {
  items: CartItem[];
  discountPercentage: number;
  taxRate: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onUpdateDiscount: (percentage: number) => void;
  onCheckout: () => void;
  isCheckingOut: boolean;
}

export function CartSummary({
  items,
  discountPercentage,
  taxRate,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateDiscount,
  onCheckout,
  isCheckingOut,
}: CartSummaryProps) {
  const summary = getCartSummary({
    items,
    discountPercentage,
    taxRate,
  });

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Cart</h2>

      <div className="flex-1 overflow-y-auto mb-4 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            No items in cart
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.productId}
              className="bg-slate-50 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    ${item.price.toFixed(2)} each
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(item.productId)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onUpdateQuantity(
                      item.productId,
                      Math.max(1, item.quantity - 1)
                    )
                  }
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    onUpdateQuantity(
                      item.productId,
                      parseInt(e.target.value) || 1
                    )
                  }
                  className="h-8 w-12 text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onUpdateQuantity(item.productId, item.quantity + 1)
                  }
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <div className="ml-auto text-right">
                  <p className="font-semibold text-slate-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-3 border-t pt-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-600">
            Discount (%)
          </label>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={discountPercentage}
            onChange={(e) => onUpdateDiscount(parseFloat(e.target.value) || 0)}
            className="h-8"
          />
        </div>

        <div className="space-y-2 bg-slate-50 rounded p-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Subtotal:</span>
            <span className="font-medium text-slate-900">
              ${summary.subtotal.toFixed(2)}
            </span>
          </div>
          {summary.discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Discount:</span>
              <span className="font-medium text-green-600">
                -${summary.discountAmount.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Tax ({taxRate}%):</span>
            <span className="font-medium text-slate-900">
              ${summary.tax.toFixed(2)}
            </span>
          </div>
          <div className="border-t pt-2 mt-2 flex justify-between">
            <span className="font-semibold text-slate-900">Total:</span>
            <span className="text-lg font-bold text-slate-900">
              ${summary.total.toFixed(2)}
            </span>
          </div>
        </div>

        <Button
          onClick={onCheckout}
          disabled={items.length === 0 || isCheckingOut}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isCheckingOut ? 'Processing...' : 'Checkout'}
        </Button>
      </div>
    </div>
  );
}
