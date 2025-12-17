"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { Receipt } from "@/components/pos/receipt";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface SaleDetailsProps {
    sale: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SaleDetails({ sale, open, onOpenChange }: SaleDetailsProps) {
    const [showReceipt, setShowReceipt] = useState(false);
    const [storeSettings, setStoreSettings] = useState<any>(null);

    useEffect(() => {
        if (open) {
            const fetchSettings = async () => {
                try {
                    const res = await fetch('/api/settings');
                    if (res.ok) {
                        setStoreSettings(await res.json());
                    }
                } catch (e) {
                    console.error("Failed to fetch store settings:", e);
                }
            };
            fetchSettings();
        }
    }, [open]);

    if (!sale) return null;

    if (showReceipt) {
        return (
            <Receipt
                saleId={sale.id}
                items={sale.saleItems.map((item: any) => ({
                    productId: item.productId,
                    name: item.product.name,
                    quantity: item.quantity,
                    unitPrice: Number(item.unitPrice),
                    subtotal: Number(item.subtotal),
                    discountAmount: Number(item.discountAmount),
                }))}
                subtotal={Number(sale.totalAmount) - Number(sale.taxAmount)}
                discount={Number(sale.discountAmount)}
                tax={Number(sale.taxAmount)}
                total={Number(sale.totalAmount)}
                paymentMethod={sale.paymentMethod}
                cashierName={sale.user?.fullName || "Unknown"}
                transactionTime={sale.createdAt}
                customerName={sale.customer?.fullName}
                storeSettings={storeSettings}
                onClose={() => setShowReceipt(false)}
            />
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Sale Details</DialogTitle>
                    <DialogDescription>
                        Transaction ID: {sale.id}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-slate-500">Date</p>
                            <p className="font-medium">
                                {new Date(sale.createdAt).toLocaleString()} (
                                {formatDistanceToNow(new Date(sale.createdAt), { addSuffix: true })})
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-500">Cashier</p>
                            <p className="font-medium">{sale.user?.fullName || "Unknown"}</p>
                        </div>
                        <div>
                            <p className="text-slate-500">Customer</p>
                            <p className="font-medium">{sale.customer?.fullName || "Walk-in Customer"}</p>
                        </div>
                        <div>
                            <p className="text-slate-500">Payment Method</p>
                            <p className="font-medium capitalize">{sale.paymentMethod?.toLowerCase()}</p>
                        </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-slate-500">Item</th>
                                    <th className="px-4 py-2 text-right font-medium text-slate-500">Qty</th>
                                    <th className="px-4 py-2 text-right font-medium text-slate-500">Price</th>
                                    <th className="px-4 py-2 text-right font-medium text-slate-500">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {sale.saleItems.map((item: any) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-2">{item.product.name}</td>
                                        <td className="px-4 py-2 text-right">{item.quantity}</td>
                                        <td className="px-4 py-2 text-right">${Number(item.unitPrice).toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right font-medium">
                                            ${Number(item.subtotal).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t font-medium">
                                <tr>
                                    <td colSpan={3} className="px-4 py-2 text-right">Subtotal</td>
                                    <td className="px-4 py-2 text-right">
                                        ${(Number(sale.totalAmount) - Number(sale.taxAmount)).toFixed(2)}
                                    </td>
                                </tr>
                                {Number(sale.taxAmount) > 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-2 text-right">Tax</td>
                                        <td className="px-4 py-2 text-right">${Number(sale.taxAmount).toFixed(2)}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td colSpan={3} className="px-4 py-2 text-right text-base text-slate-900">
                                        Total
                                    </td>
                                    <td className="px-4 py-2 text-right text-base text-slate-900">
                                        ${Number(sale.totalAmount).toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setShowReceipt(true)} className="gap-2">
                            <Printer className="h-4 w-4" />
                            Reprint Receipt
                        </Button>
                        <Button onClick={() => onOpenChange(false)}>Close</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
