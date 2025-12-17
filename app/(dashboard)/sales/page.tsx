"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { SaleDetails } from "@/components/sales/sale-details";
import { Search, Calendar, Eye, Download } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/export-utils";

export default function SalesPage() {
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [detailOpen, setDetailOpen] = useState(false);

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
        fetchSales();
    }, [search, selectedCashier, startDate, endDate]);

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

            const response = await fetch(`/api/sales?${params}`);
            if (!response.ok) throw new Error("Failed to fetch sales");

            const data = await response.json();
            setSales(data);

            // Calculate total
            const total = data.reduce((sum: number, sale: any) => sum + Number(sale.totalAmount), 0);
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

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead>Date</TableHead>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Cashier</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : sales.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                            No sales found matching criteria
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sales.map((sale) => (
                                        <TableRow key={sale.id}>
                                            <TableCell className="text-slate-600">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{new Date(sale.createdAt).toLocaleDateString()}</span>
                                                    <span className="text-xs">{new Date(sale.createdAt).toLocaleTimeString()}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-slate-500">
                                                {sale.id.slice(0, 8)}...
                                            </TableCell>
                                            <TableCell>
                                                {sale.customer ? (
                                                    <span className="font-medium text-slate-900">{sale.customer.fullName}</span>
                                                ) : (
                                                    <span className="text-slate-500 italic">Walk-in</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-slate-600">
                                                {sale.user?.fullName}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-slate-900">
                                                ${Number(sale.totalAmount).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {sale.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewDetails(sale)}
                                                    className="gap-2"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
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
