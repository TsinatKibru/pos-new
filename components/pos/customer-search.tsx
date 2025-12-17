"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Search, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface Customer {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    loyaltyPoints: number;
}

interface CustomerSearchProps {
    onSelectCustomer: (customer: Customer | null) => void;
    selectedCustomer: Customer | null;
}

export function CustomerSearch({ onSelectCustomer, selectedCustomer }: CustomerSearchProps) {
    const [open, setOpen] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const params = new URLSearchParams();
                if (search) params.append("search", search);

                const response = await fetch(`/api/customers?${params}`, { cache: 'no-store' });
                if (response.ok) {
                    const data = await response.json();
                    setCustomers(data);
                }
            } catch (error) {
                console.error("Failed to fetch customers", error);
            }
        };

        const timeoutId = setTimeout(() => {
            if (open || search) {
                fetchCustomers();
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [search, open]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between"
                >
                    {selectedCustomer ? (
                        <span className="truncate">{selectedCustomer.fullName}</span>
                    ) : (
                        <span className="text-slate-500">Select Customer...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command shouldFilter={false}>
                    <CommandInput placeholder="Search customers..." value={search} onValueChange={setSearch} />
                    <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup heading="Customers">
                            {customers.map((customer) => (
                                <CommandItem
                                    key={customer.id}
                                    value={customer.id}
                                    onSelect={() => {
                                        onSelectCustomer(customer);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{customer.fullName}</span>
                                        <span className="text-xs text-slate-500">{customer.phone || customer.email}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        {selectedCustomer && (
                            <CommandGroup>
                                <CommandItem onSelect={() => {
                                    onSelectCustomer(null);
                                    setOpen(false);
                                }} className="text-red-500">
                                    <X className="mr-2 h-4 w-4" />
                                    Clear Selection
                                </CommandItem>
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
