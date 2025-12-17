'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
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
  customer?: any; // Accepting customer object
  onClose: () => void;
  onConfirm: (data: PaymentData) => void;
  isLoading: boolean;
}

export interface PaymentData {
  paymentMethod: 'CASH' | 'CARD' | 'DIGITAL';
  customerId?: string;
  amountPaid?: number;
  pointsRedeemed?: number;
}

export function PaymentDialog({
  open,
  total,
  customer,
  onClose,
  onConfirm,
  isLoading,
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'DIGITAL'>('CASH');
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  // Constants
  const POINTS_PER_DOLLAR_DISCOUNT = 20;
  const VALUE_PER_POINT = 1 / POINTS_PER_DOLLAR_DISCOUNT; // $0.05

  // Reset state when dialog opens/closes or customer changes
  useEffect(() => {
    if (open) {
      setRedeemPoints(false);
      setPointsToRedeem(0);
      setPaymentMethod('CASH');
    }
  }, [open, customer]);

  // Max points user can use is limited by their balance AND the total bill
  const maxRedeemableByBalance = customer?.loyaltyPoints || 0;
  const maxRedeemableByTotal = Math.ceil(total / VALUE_PER_POINT);
  const maxPoints = Math.min(maxRedeemableByBalance, maxRedeemableByTotal);

  const discountFromPoints = redeemPoints ? pointsToRedeem * VALUE_PER_POINT : 0;
  const finalTotal = Math.max(0, total - discountFromPoints);

  // Initialize amountPaid with finalTotal whenever finalTotal changes (unless user manually editing?)
  // Simple approach: Always default amountPaid to finalTotal when payment method is not CASH or when points change
  const [amountPaid, setAmountPaid] = useState<number>(finalTotal);

  useEffect(() => {
    setAmountPaid(finalTotal);
  }, [finalTotal]);


  const change = Math.round((amountPaid - finalTotal) * 100) / 100;

  const handleConfirm = useCallback(() => {
    if (paymentMethod === 'CASH' && amountPaid < finalTotal) {
      toast.error('Amount paid must be at least the total amount');
      return;
    }

    onConfirm({
      paymentMethod,
      amountPaid: paymentMethod === 'CASH' ? amountPaid : finalTotal,
      pointsRedeemed: redeemPoints ? pointsToRedeem : 0,
    });
  }, [paymentMethod, amountPaid, finalTotal, redeemPoints, pointsToRedeem, onConfirm]);

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
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-slate-900">
                ${finalTotal.toFixed(2)}
              </p>
              {discountFromPoints > 0 && (
                <span className="text-sm text-green-600 font-medium line-through">
                  ${total.toFixed(2)}
                </span>
              )}
            </div>

            {discountFromPoints > 0 && (
              <p className="text-xs text-green-600 mt-1">
                You saved ${discountFromPoints.toFixed(2)} using {pointsToRedeem} points
              </p>
            )}
          </div>

          {/* Loyalty Section */}
          {customer && maxPoints > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Use Loyalty Points</p>
                  <p className="text-xs text-blue-700">Balance: {customer.loyaltyPoints} pts</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">Off</span>
                  <Switch
                    checked={redeemPoints}
                    onCheckedChange={(checked) => {
                      setRedeemPoints(checked);
                      if (checked) {
                        // Default to max possible
                        setPointsToRedeem(maxPoints);
                      }
                    }}
                  />
                  <span className="text-xs font-medium text-slate-600">On</span>
                </div>
              </div>

              {redeemPoints && (
                <div className="space-y-2 pt-2 border-t border-blue-200">
                  <div className="flex justify-between text-xs text-blue-800">
                    <span>Redeem</span>
                    <span>{pointsToRedeem} pts (-${(pointsToRedeem * VALUE_PER_POINT).toFixed(2)})</span>
                  </div>
                  <Slider
                    value={[pointsToRedeem]}
                    min={0}
                    max={maxPoints}
                    step={20} // Enforce increments of 20 ($1)
                    onValueChange={(vals) => setPointsToRedeem(vals[0])}
                    className="py-1"
                  />
                  <p className="text-xs text-blue-600 text-center">
                    20 points = $1.00 discount
                  </p>
                </div>
              )}
            </div>
          )}

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
                min={finalTotal}
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
            {isLoading ? 'Processing...' : `Pay $${finalTotal.toFixed(2)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
