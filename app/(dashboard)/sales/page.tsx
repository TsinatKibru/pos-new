"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeaderSticky,
    TableRowStriped,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { SaleDetails } from "@/components/sales/sale-details";
import { Search, Calendar, Eye, Download, CheckCircle2, Receipt, User } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/export-utils";

export default function SalesPage() {
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Filters
    const [cashiers, setCashiers] = useState<any[]>([]);
    const [selectedCashier, setSelectedCashier] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [totalSales, setTotalSales] = useState(0);

    useEffect(() => {
        fetchCashiers();
    }, []);

    useEffect(() => {
        setCurrentPage(1); // Reset to page 1 when filters change
    }, [search, selectedCashier, startDate, endDate]);

    useEffect(() => {
        fetchSales();
    }, [currentPage, pageSize, search, selectedCashier, startDate, endDate]);

    const fetchCashiers = async () => {
        try {
            const res = await fetch('/api/users');
            if (res.ok) setCashiers(await res.json());
        } catch (error) {
            console.error("Failed to fetch cashiers", error);
        }
    };

    const fetchSales = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (selectedCashier && selectedCashier !== 'all') params.append("userId", selectedCashier);
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);
            params.append("page", currentPage.toString());
            params.append("limit", pageSize.toString());

            const response = await fetch(`/api/sales?${params}`);
            if (!response.ok) throw new Error("Failed to fetch sales");

            const result = await response.json();
            setSales(result.data);
            setTotalPages(result.pagination.totalPages);
            setTotalCount(result.pagination.total);

            // Calculate total
            const total = result.data.reduce((sum: number, sale: any) => sum + Number(sale.totalAmount), 0);
            setTotalSales(total);
        } catch (error) {
            console.error("Error fetching sales:", error);
            toast.error("Failed to load sales history");
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (sale: any) => {
        setSelectedSale(sale);
        setDetailOpen(true);
    };

    const handleExport = () => {
        if (sales.length === 0) {
            toast.error("No data to export");
            return;
        }

        const exportData = sales.map(sale => ({
            Date: format(new Date(sale.createdAt), 'yyyy-MM-dd'),
            Time: format(new Date(sale.createdAt), 'HH:mm:ss'),
            'Invoice #': sale.id,
            Customer: sale.customer?.fullName || 'Walk-in',
            Cashier: sale.user?.fullName || 'Unknown',
            Total: sale.totalAmount,
            Status: sale.status,
            'Payment Method': sale.paymentMethod
        }));

        exportToCSV(exportData, `sales-report-${new Date().toISOString().split('T')[0]}`);
        toast.success("Sales report exported");
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Sales History</h1>
                        <p className="text-slate-600 mt-1">View past transactions</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={handleExport} className="gap-2">
                            <Download className="h-4 w-4" />
                            Export CSV
                        </Button>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center gap-4">
                            <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">Total Sales</div>
                            <div className="text-2xl font-bold text-green-600">${totalSales.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by ID or customer..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <div className="w-full md:w-48">
                            <select
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedCashier}
                                onChange={(e) => setSelectedCashier(e.target.value)}
                            >
                                <option value="all">All Cashiers</option>
                                {cashiers.map(c => (
                                    <option key={c.id} value={c.id}>{c.fullName}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-auto"
                            />
                            <span className="self-center text-slate-400">-</span>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-auto"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                        <Table>
                            <TableHeaderSticky>
                                <TableRowStriped index={0}>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Cashier</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRowStriped>
                            </TableHeaderSticky>
                            <TableBody>
                                {loading ? (
                                    <TableRowStriped index={0}>
                                        <TableCell colSpan={7} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600"></div>
                                                <p className="text-slate-500">Loading sales...</p>
                                            </div>
                                        </TableCell>
                                    </TableRowStriped>
                                ) : sales.length === 0 ? (
                                    <TableRowStriped index={0}>
                                        <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                                            <Receipt className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                            <p className="font-medium">No sales found matching criteria</p>
                                        </TableCell>
                                    </TableRowStriped>
                                ) : (
                                    sales.map((sale, index) => (
                                        <TableRowStriped key={sale.id} index={index}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900 text-sm">{new Date(sale.createdAt).toLocaleDateString()}</span>
                                                    <span className="text-xs text-slate-500">{new Date(sale.createdAt).toLocaleTimeString()}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Receipt className="h-3.5 w-3.5 text-slate-400" />
                                                    <code className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                                        {sale.id.slice(0, 8)}
                                                    </code>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {sale.customer ? (
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-3.5 w-3.5 text-slate-400" />
                                                        <span className="font-medium text-slate-900">{sale.customer.fullName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-500 italic text-sm">Walk-in</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-slate-700 font-medium">
                                                {sale.user?.fullName}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="font-bold text-slate-900 text-base">
                                                    ${Number(sale.totalAmount).toFixed(2)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="successSubtle" className="gap-1">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    {sale.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewDetails(sale)}
                                                    className="gap-1.5 hover:bg-slate-100"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRowStriped>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    {!loading && sales.length > 0 && (
                        <div className="flex items-center justify-between px-2 py-4 border-t border-slate-200">
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
                </div>
            </div>

            <SaleDetails
                sale={selectedSale}
                open={detailOpen}
                onOpenChange={setDetailOpen}
            />
        </div>
    );
}
