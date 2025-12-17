'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronLeft, AlertCircle, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  price: number;
  cost: number;
  lowStockThreshold: number;
}

interface StockAdjustment {
  productId: string;
  quantity: number;
  type: 'add' | 'subtract';
  reason: string;
}

export default function InventoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [adjustmentDialog, setAdjustmentDialog] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustment, setAdjustment] = useState<StockAdjustment>({
    productId: '',
    quantity: 0,
    type: 'add',
    reason: '',
  });
  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchProducts();
  }, [search, showLowStockOnly]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (showLowStockOnly) params.append('lowStock', 'true');

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      const productsWithThreshold = data.map((p: any) => ({
        ...p,
        lowStockThreshold: lowStockThreshold,
      }));
      setProducts(productsWithThreshold);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustmentClick = (product: Product) => {
    setSelectedProduct(product);
    setAdjustment({
      productId: product.id,
      quantity: 0,
      type: 'add',
      reason: '',
    });
    setAdjustmentDialog(true);
  };

  const handleSubmitAdjustment = async () => {
    if (!selectedProduct || adjustment.quantity === 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      const newQuantity =
        adjustment.type === 'add'
          ? selectedProduct.stockQuantity + adjustment.quantity
          : Math.max(0, selectedProduct.stockQuantity - adjustment.quantity);

      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockQuantity: newQuantity,
        }),
      });

      if (!response.ok) throw new Error('Failed to update stock');

      toast.success(
        `Stock ${adjustment.type === 'add' ? 'increased' : 'decreased'} by ${adjustment.quantity}`
      );
      setAdjustmentDialog(false);
      fetchProducts();
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      toast.error('Failed to update stock');
    }
  };

  const getLowStockCount = () =>
    products.filter((p) => p.stockQuantity < lowStockThreshold).length;

  const filteredProducts = showLowStockOnly
    ? products.filter((p) => p.stockQuantity < lowStockThreshold)
    : products;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Inventory Management</h1>
              <p className="text-slate-600 mt-1">Track and manage stock levels</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{getLowStockCount()}</div>
              <p className="text-xs text-slate-500 mt-1">Below {lowStockThreshold} units</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(
                  products.reduce((sum, p) => sum + p.cost * p.stockQuantity, 0) / 100
                ).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Inventory</CardTitle>
              <Button
                onClick={() => setSettingsDialog(true)}
                variant="outline"
                size="sm"
              >
                Settings
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by product name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant={showLowStockOnly ? 'default' : 'outline'}
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className="gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Low Stock
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading inventory...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No products found</div>
            ) : (
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 border-b border-slate-200 hover:bg-slate-50">
                      <TableHead className="font-semibold text-slate-700">Product</TableHead>
                      <TableHead className="font-semibold text-slate-700">SKU</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">
                        Current Stock
                      </TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">
                        Unit Cost
                      </TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">
                        Total Value
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const totalValue = product.stockQuantity * Number(product.cost);
                      const isLowStock = product.stockQuantity < lowStockThreshold;

                      return (
                        <TableRow key={product.id} className="border-b border-slate-200 hover:bg-slate-50">
                          <TableCell className="font-medium text-slate-900">
                            {product.name}
                          </TableCell>
                          <TableCell className="text-slate-600">{product.sku}</TableCell>
                          <TableCell className="text-right">
                            <div className="font-semibold text-slate-900">
                              {product.stockQuantity}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-slate-600">
                            ${Number(product.cost).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-slate-900">
                            ${(totalValue / 100).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                isLowStock
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {isLowStock ? 'Low Stock' : 'In Stock'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAdjustmentClick(product)}
                              className="gap-2"
                            >
                              <Edit2 className="h-4 w-4" />
                              Adjust
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={adjustmentDialog} onOpenChange={setAdjustmentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Stock - {selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              Current stock: <span className="font-semibold text-slate-900">{selectedProduct?.stockQuantity}</span> units
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Type</label>
              <div className="flex gap-4">
                <Button
                  variant={adjustment.type === 'add' ? 'default' : 'outline'}
                  onClick={() => setAdjustment({ ...adjustment, type: 'add' })}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stock
                </Button>
                <Button
                  variant={adjustment.type === 'subtract' ? 'default' : 'outline'}
                  onClick={() => setAdjustment({ ...adjustment, type: 'subtract' })}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Stock
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Quantity</label>
              <Input
                type="number"
                min="1"
                value={adjustment.quantity}
                onChange={(e) =>
                  setAdjustment({
                    ...adjustment,
                    quantity: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="Enter quantity"
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Reason (optional)</label>
              <Input
                value={adjustment.reason}
                onChange={(e) =>
                  setAdjustment({ ...adjustment, reason: e.target.value })
                }
                placeholder="e.g., Stock take, damaged goods, returned items"
              />
            </div>

            {selectedProduct && (
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-slate-600">New quantity:</p>
                <p className="text-2xl font-bold text-slate-900">
                  {adjustment.type === 'add'
                    ? selectedProduct.stockQuantity + adjustment.quantity
                    : Math.max(0, selectedProduct.stockQuantity - adjustment.quantity)}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustmentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAdjustment}>
              Update Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsDialog} onOpenChange={setSettingsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Inventory Settings</DialogTitle>
            <DialogDescription>
              Configure alerts and thresholds
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Low Stock Threshold
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Products with stock below this level will be marked as low stock
              </p>
              <Input
                type="number"
                min="1"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 10)}
                className="text-lg"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                Current low stock items: <span className="font-semibold">{getLowStockCount()}</span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSettingsDialog(false);
                fetchProducts();
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
