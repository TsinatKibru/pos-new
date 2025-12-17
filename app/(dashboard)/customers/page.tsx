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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CustomerForm } from "@/components/customers/customer-form";
import { Search, Plus, Edit2, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

interface Customer {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    loyaltyPoints: number;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchCustomers();
    }, [search]);

    const fetchCustomers = async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);

            const response = await fetch(`/api/customers?${params}`);
            if (!response.ok) throw new Error("Failed to fetch customers");

            const data = await response.json();
            setCustomers(data);
        } catch (error) {
            console.error("Error fetching customers:", error);
            toast.error("Failed to load customers");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCustomer = async (data: any) => {
        try {
            const response = await fetch("/api/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create customer");
            }

            toast.success("Customer created successfully");
            fetchCustomers();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Failed to create customer"
            );
            throw error;
        }
    };

    const handleUpdateCustomer = async (data: any) => {
        if (!selectedCustomer) return;

        try {
            const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update customer");
            }

            toast.success("Customer updated successfully");
            fetchCustomers();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Failed to update customer"
            );
            throw error;
        }
    };

    const handleDeleteCustomer = async () => {
        if (!customerToDelete) return;

        try {
            const response = await fetch(`/api/customers/${customerToDelete}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete customer");

            toast.success("Customer deleted successfully");
            fetchCustomers();
        } catch (error) {
            toast.error("Failed to delete customer");
        } finally {
            setDeleteDialogOpen(false);
            setCustomerToDelete(null);
        }
    };

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setFormOpen(true);
    };

    const handleDelete = (id: string) => {
        setCustomerToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleAddNew = () => {
        setSelectedCustomer(null);
        setFormOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
                        <p className="text-slate-600 mt-1">Manage customer database</p>
                    </div>
                    <Button onClick={handleAddNew} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Customer
                    </Button>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-200">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search customers..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead>No.</TableHead>
                                    <TableHead>Full Name</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead className="text-right">Loyalty Points</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : customers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <Users className="h-8 w-8 text-slate-400" />
                                                <p>No customers found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    customers.map((customer, index) => (
                                        <TableRow key={customer.id}>
                                            <TableCell className="font-medium text-slate-600">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-900">
                                                {customer.fullName}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <p className="text-slate-900">{customer.email || "-"}</p>
                                                    <p className="text-slate-500 text-xs">{customer.phone}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-slate-900">
                                                {customer.loyaltyPoints}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(customer)}
                                                        className="h-8 w-8"
                                                    >
                                                        <Edit2 className="h-4 w-4 text-slate-500" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(customer.id)}
                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            <CustomerForm
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={selectedCustomer ? handleUpdateCustomer : handleCreateCustomer}
                customer={selectedCustomer}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the customer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCustomer}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
