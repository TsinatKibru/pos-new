"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Tags,
    Users,
    Settings,
    LogOut,
    Store,
    History,
    Shield,
    User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";

interface SidebarLink {
    title: string;
    href: string;
    icon: any;
    disabled?: boolean;
}


const sidebarLinks: SidebarLink[] = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Point of Sale",
        href: "/pos",
        icon: ShoppingCart,
    },
    {
        title: "Sales History",
        href: "/sales",
        icon: History,
    },
    {
        title: "Inventory",
        href: "/inventory",
        icon: Package,
    },
    {
        title: "Products",
        href: "/products",
        icon: Tags,
    },
    {
        title: "Customers",
        href: "/customers",
        icon: Users,
    },
    {
        title: "Staff",
        href: "/users",
        icon: Shield,
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings,
    },
    {
        title: "Profile",
        href: "/profile",
        icon: User,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <div className="flex h-full w-64 flex-col bg-slate-900 text-slate-50">
            <div className="p-6">
                <div className="flex items-center gap-2 font-bold text-xl">
                    <Store className="h-6 w-6 text-blue-400" />
                    <span>POS System</span>
                </div>
            </div>

            <div className="flex-1 px-4 space-y-2">
                {sidebarLinks.map((link) => {
                    // Role-based filtering
                    if (session?.user?.role !== 'ADMIN') {
                        // Hide these for non-admins
                        if (['/users', '/settings', '/products'].includes(link.href)) {
                            return null;
                        }
                    }

                    const Icon = link.icon;
                    const isActive = pathname === link.href;

                    return (
                        <Link
                            key={link.href}
                            href={link.disabled ? "#" : link.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                                isActive
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800",
                                link.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-slate-400"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {link.title}
                        </Link>
                    );
                })}
            </div>

            <div className="p-4 mt-auto border-t border-slate-800">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    <LogOut className="h-5 w-5" />
                    Logout
                </Button>
            </div>
        </div>
    );
}
