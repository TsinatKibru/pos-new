'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ReceiptItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discountAmount?: number;
}

interface ReceiptProps {
  saleId: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  amountPaid?: number;
  change?: number;
  cashierName: string;
  transactionTime: Date;
  onClose: () => void;
}

export function Receipt({
  saleId,
  items,
  subtotal,
  discount,
  tax,
  total,
  paymentMethod,
  amountPaid,
  change,
  cashierName,
  transactionTime,
  onClose,
}: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=600,height=800');
    if (printWindow && receiptRef.current) {
      printWindow.document.write(receiptRef.current.innerHTML);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-slate-900">Receipt</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-500"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div
          ref={receiptRef}
          className="flex-1 overflow-y-auto p-4 font-mono text-sm"
          style={{ fontSize: '12px', lineHeight: '1.4' }}
        >
          <div className="text-center mb-4">
            <p className="font-bold text-base">RECEIPT</p>
            <p className="text-xs text-slate-500">Transaction: {saleId}</p>
            <p className="text-xs text-slate-500">
              {formatDistanceToNow(new Date(transactionTime), { addSuffix: true })}
            </p>
          </div>

          <div className="border-t border-dashed my-2"></div>

          <div className="mb-4">
            {items.map((item) => (
              <div key={item.productId} className="mb-2">
                <div className="flex justify-between">
                  <span className="flex-1">{item.name}</span>
                  <span className="ml-2">
                    ${item.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex justify-between">
                  <span>
                    {item.quantity} x ${item.unitPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed my-2"></div>

          <div className="space-y-1 mb-4">
            <div className="flex justify-between text-xs">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs text-green-600">
                <span>Discount:</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span>Tax:</span>
              <span>${tax.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-b border-dashed py-2 mb-4">
            <div className="flex justify-between font-bold text-sm">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-1 text-xs mb-4">
            <div className="flex justify-between">
              <span>Payment:</span>
              <span className="capitalize">{paymentMethod}</span>
            </div>
            {amountPaid && (
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span>${amountPaid.toFixed(2)}</span>
              </div>
            )}
            {change !== undefined && change > 0 && (
              <div className="flex justify-between font-semibold">
                <span>Change:</span>
                <span>${change.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed my-2"></div>

          <div className="text-center space-y-1 text-xs">
            <p>Cashier: {cashierName}</p>
            <p className="text-slate-500">
              {new Date(transactionTime).toLocaleString()}
            </p>
          </div>

          <div className="border-t border-dashed my-2"></div>

          <div className="text-center text-xs text-slate-500">
            <p>Thank you for your purchase!</p>
          </div>
        </div>

        <div className="border-t p-4 flex gap-2">
          <Button
            onClick={handlePrint}
            className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
