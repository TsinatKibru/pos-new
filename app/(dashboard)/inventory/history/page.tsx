"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeaderSticky,
    TableRowStriped,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Download, RefreshCw, TrendingUp, TrendingDown, Package, AlertTriangle, ShoppingCart } from "lucide-react";
import { exportToCSV } from "@/lib/export-utils";
import { toast } from "sonner";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface StockLog {
    id: string;
    createdAt: string;
    user: { fullName: string } | null;
    product: { name: string; sku: string };
    actionType: string;
    quantityChange: number;
    previousStock: number;
    newStock: number;
    reason: string | null;
}

export default function StockHistoryPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<StockLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("page", currentPage.toString());
            params.append("limit", pageSize.toString());

            const res = await fetch(`/api/inventory/logs?${params}`);
            if (!res.ok) throw new Error("Failed to fetch logs");
            const result = await res.json();
            setLogs(result.data);
            setTotalPages(result.pagination.totalPages);
            setTotalCount(result.pagination.total);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [currentPage, pageSize]);

    const handleExport = () => {
        if (logs.length === 0) return;
        const data = logs.map(log => ({
            Date: new Date(log.createdAt).toLocaleString(),
            Product: log.product.name,
            SKU: log.product.sku,
            Action: log.actionType,
            User: log.user?.fullName || 'System',
            Change: log.quantityChange,
            'New Stock': log.newStock,
            Reason: log.reason || ''
        }));
        exportToCSV(data, `stock-history-${new Date().toISOString().split('T')[0]}`);
        toast.success("History exported");
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Stock History</h1>
                            <p className="text-slate-600 mt-1">Audit log of all inventory movements</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchLogs} className="gap-2">
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button variant="outline" onClick={handleExport} className="gap-2">
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeaderSticky>
                                    <TableRowStriped index={0}>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead className="text-right">Change</TableHead>
                                        <TableHead className="text-right">Stock Level</TableHead>
                                        <TableHead>Reason</TableHead>
                                    </TableRowStriped>
                                </TableHeaderSticky>
                                <TableBody>
                                    {loading ? (
                                        <TableRowStriped index={0}>
                                            <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                                                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                                                Loading history...
                                            </TableCell>
                                        </TableRowStriped>
                                    ) : logs.length === 0 ? (
                                        <TableRowStriped index={0}>
                                            <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                                                <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                                <p className="font-medium">No history found</p>
                                            </TableCell>
                                        </TableRowStriped>
                                    ) : (
                                        logs.map((log, index) => (
                                            <TableRowStriped key={log.id} index={index}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-900 text-sm">
                                                            {new Date(log.createdAt).toLocaleDateString()}
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            {new Date(log.createdAt).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Package className="h-4 w-4 text-slate-400" />
                                                        <div>
                                                            <div className="font-medium text-slate-900">{log.product.name}</div>
                                                            <div className="text-xs text-slate-500">{log.product.sku}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {log.actionType === 'SALE' ? (
                                                        <Badge variant="successSubtle" className="gap-1">
                                                            <ShoppingCart className="h-3 w-3" />
                                                            Sale
                                                        </Badge>
                                                    ) : log.actionType === 'RESTOCK' ? (
                                                        <Badge variant="infoSubtle" className="gap-1">
                                                            <TrendingUp className="h-3 w-3" />
                                                            Restock
                                                        </Badge>
                                                    ) : log.actionType === 'THEFT' ? (
                                                        <Badge variant="errorSubtle" className="gap-1">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            Theft
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">{log.actionType}</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-700 font-medium">
                                                    {log.user?.fullName || 'System'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className={`inline-flex items-center gap-1 font-semibold ${log.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {log.quantityChange > 0 ? (
                                                            <TrendingUp className="h-4 w-4" />
                                                        ) : (
                                                            <TrendingDown className="h-4 w-4" />
                                                        )}
                                                        {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="text-xs text-slate-400">{log.previousStock}</span>
                                                        <span className="text-slate-400">→</span>
                                                        <span className="font-semibold text-slate-900">{log.newStock}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-600 max-w-[200px] truncate" title={log.reason || ''}>
                                                    {log.reason || <span className="text-slate-400 italic">No reason</span>}
                                                </TableCell>
                                            </TableRowStriped>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Controls */}
                        {!loading && logs.length > 0 && (
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
        </div>
    );
}
