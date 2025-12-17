'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CartItem } from '@/lib/cart-utils';
import { useHotkeys } from '@/hooks/use-hotkeys';

interface PaymentDialogProps {
  open: boolean;
  total: number;
  onClose: () => void;
  onConfirm: (data: PaymentData) => void;
  isLoading: boolean;
}

export interface PaymentData {
  paymentMethod: 'CASH' | 'CARD' | 'DIGITAL';
  customerId?: string;
  amountPaid?: number;
}

export function PaymentDialog({
  open,
  total,
  onClose,
  onConfirm,
  isLoading,
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'DIGITAL'>('CASH');
  const [amountPaid, setAmountPaid] = useState<number>(total);

  const change = Math.round((amountPaid - total) * 100) / 100;

  const handleConfirm = useCallback(() => {
    if (paymentMethod === 'CASH' && amountPaid < total) {
      alert('Amount paid must be at least the total amount');
      return;
    }

    onConfirm({
      paymentMethod,
      amountPaid: paymentMethod === 'CASH' ? amountPaid : total,
    });
  }, [paymentMethod, amountPaid, total, onConfirm]);

  useHotkeys('Enter', () => {
    if (open && !isLoading) {
      handleConfirm();
    }
  }, [open, isLoading, handleConfirm]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600">Total Amount</p>
            <p className="text-3xl font-bold text-slate-900">
              ${total.toFixed(2)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="DIGITAL">Digital Wallet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === 'CASH' && (
            <div className="space-y-2">
              <Label htmlFor="amount-paid">Amount Paid</Label>
              <Input
                id="amount-paid"
                type="number"
                step="0.01"
                min={total}
                value={amountPaid}
                onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
              />
              {change > 0 && (
                <div className="bg-green-50 rounded p-2 mt-2">
                  <p className="text-sm text-slate-600">Change</p>
                  <p className="text-xl font-bold text-green-600">
                    ${change.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
