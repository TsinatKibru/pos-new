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
  TableHeaderSticky,
  TableRowStriped,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronLeft, AlertCircle, Plus, Edit2, Trash2, Search, Download, History, Package, TrendingUp, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/export-utils';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

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
  const [historyDialog, setHistoryDialog] = useState(false);
  const [stockLogs, setStockLogs] = useState<any[]>([]);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const handleHistoryClick = async (product: Product) => {
    setSelectedProduct(product);
    setHistoryDialog(true);
    try {
      const res = await fetch(`/api/inventory/logs?productId=${product.id}`);
      if (res.ok) {
        const result = await res.json();
        setStockLogs(result.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load history");
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [search, showLowStockOnly]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, pageSize, search, showLowStockOnly, lowStockThreshold]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/inventory');
      if (res.ok) {
        const data = await res.json();
        setLowStockThreshold(data.lowStockThreshold);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (showLowStockOnly) params.append('lowStock', 'true');
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');

      const result = await response.json();
      setProducts(result.data.map((p: any) => ({
        ...p,
        lowStockThreshold: lowStockThreshold,
      })));
      setTotalPages(result.pagination.totalPages);
      setTotalCount(result.pagination.total);
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
          reason: adjustment.reason,
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
    products.filter((p) => p.stockQuantity <= lowStockThreshold).length;

  const filteredProducts = showLowStockOnly
    ? products.filter((p) => p.stockQuantity <= lowStockThreshold)
    : products;

  const handleExport = () => {
    if (filteredProducts.length === 0) {
      toast.error('No inventory data to export');
      return;
    }

    const exportData = filteredProducts.map((p) => ({
      Name: p.name,
      SKU: p.sku,
      Stock: p.stockQuantity,
      'Cost Price': p.cost,
      'Selling Price': p.price,
      'Total Value': (p.stockQuantity * p.cost).toFixed(2),
      Status: p.stockQuantity <= lowStockThreshold ? 'Low Stock' : 'In Stock'
    }));

    exportToCSV(exportData, `inventory-audit-${new Date().toISOString().split('T')[0]}`);
    toast.success('Inventory exported');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">

            <div>
              <h1 className="text-3xl font-bold text-slate-900">Inventory Management</h1>
              <p className="text-slate-600 mt-1">Track and manage stock levels</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export Inventory
            </Button>
            <Button variant="outline" onClick={() => router.push('/inventory/history')} className="gap-2">
              <History className="h-4 w-4" />
              Full History
            </Button>
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
              <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                <Table>
                  <TableHeaderSticky>
                    <TableRowStriped index={0}>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">
                        Current Stock
                      </TableHead>
                      <TableHead className="text-right">
                        Unit Cost
                      </TableHead>
                      <TableHead className="text-right">
                        Total Value
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">
                        Actions
                      </TableHead>
                    </TableRowStriped>
                  </TableHeaderSticky>
                  <TableBody>
                    {filteredProducts.map((product, index) => {
                      const totalValue = product.stockQuantity * Number(product.cost);
                      const isLowStock = product.stockQuantity <= lowStockThreshold;
                      const stockPercentage = Math.min((product.stockQuantity / (lowStockThreshold * 2)) * 100, 100);

                      return (
                        <TableRowStriped key={product.id} index={index}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-slate-400" />
                              <span className="font-medium text-slate-900">
                                {product.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              {product.sku}
                            </code>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end gap-1">
                              <div className="font-semibold text-slate-900 text-base">
                                {product.stockQuantity}
                              </div>
                              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${isLowStock ? 'bg-orange-500' : 'bg-green-500'
                                    }`}
                                  style={{ width: `${stockPercentage}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-slate-600">
                            ${Number(product.cost).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-slate-900">
                            ${(totalValue / 100).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {isLowStock ? (
                              <Badge variant="warningSubtle" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Low Stock
                              </Badge>
                            ) : (
                              <Badge variant="successSubtle" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                In Stock
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAdjustmentClick(product)}
                                className="gap-1.5 hover:bg-slate-100"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                Adjust
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleHistoryClick(product)}
                                className="gap-1.5 hover:bg-slate-100"
                                title="View History"
                              >
                                <History className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRowStriped>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && filteredProducts.length > 0 && (
              <div className="flex items-center justify-between px-2 py-4 border-t border-slate-200 mt-4">
                <div className="text-sm text-slate-600">
                  Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
                </div>

                <div className="flex items-center gap-4">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="flex h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                  >
                    <option value="10">10 per page</option>
                    <option value="25">25 per page</option>
                    <option value="50">50 per page</option>
                    <option value="100">100 per page</option>
                  </select>

                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="text-sm px-4">Page {currentPage} of {totalPages}</span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
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

      <Dialog open={historyDialog} onOpenChange={setHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Stock History - {selectedProduct?.name}</DialogTitle>
            <DialogDescription>Recent stock movements</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableBody>
                <TableRowStriped index={0}>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="text-right">New Stock</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRowStriped>
                {stockLogs.map((log, index) => (
                  <TableRowStriped key={log.id} index={index + 1}>
                    <TableCell className="text-xs">{new Date(log.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{log.user?.fullName || 'System'}</TableCell>
                    <TableCell>
                      {log.actionType === 'SALE' ? (
                        <Badge variant="successSubtle">Sale</Badge>
                      ) : log.actionType === 'RESTOCK' ? (
                        <Badge variant="infoSubtle">Restock</Badge>
                      ) : (
                        <Badge variant="secondary">{log.actionType}</Badge>
                      )}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${log.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                    </TableCell>
                    <TableCell className="text-right">{log.newStock}</TableCell>
                    <TableCell className="text-sm text-slate-500">{log.reason}</TableCell>
                  </TableRowStriped>
                ))}
                {stockLogs.length === 0 && (
                  <TableRowStriped index={1}>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      <Package className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-medium">No history found</p>
                    </TableCell>
                  </TableRowStriped>
                )}
              </TableBody>
            </Table>
          </div>
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
              onClick={async () => {
                try {
                  const res = await fetch('/api/settings/inventory', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lowStockThreshold }),
                  });

                  if (!res.ok) throw new Error('Failed to update settings');

                  toast.success('Settings updated');
                  setSettingsDialog(false);
                  fetchProducts();
                } catch (error) {
                  toast.error('Failed to update settings');
                  console.error(error);
                }
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
