"use client";

import Link from "next/link";
import Image from "next/image";
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


interface SidebarSection {
    title: string;
    items: SidebarLink[];
}

const sidebarSections: SidebarSection[] = [
    {
        title: "Overview",
        items: [
            { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { title: "Point of Sale", href: "/pos", icon: ShoppingCart },
        ]
    },
    {
        title: "Business",
        items: [
            { title: "Sales History", href: "/sales", icon: History },
            { title: "Inventory", href: "/inventory", icon: Package },
            { title: "Customers", href: "/customers", icon: Users },
        ]
    },
    {
        title: "Management",
        items: [
            { title: "Products", href: "/products", icon: Tags },
            { title: "Staff", href: "/users", icon: Shield },
        ]
    },
    {
        title: "System",
        items: [
            { title: "Profile", href: "/profile", icon: User },
            { title: "Settings", href: "/settings", icon: Settings },
        ]
    }
];

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <div className={cn("flex h-full w-64 flex-col bg-slate-900 text-slate-50", className)}>
            <div className="p-6">
                <div className="flex items-center gap-2 font-bold text-xl">
                    <Store className="h-6 w-6 text-blue-400" />
                    <span>POS System</span>
                </div>
            </div>

            {/* User Profile Section */}
            {session?.user && (
                <div className="mx-4 mb-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                        {/* Avatar with image or initials */}
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg overflow-hidden">
                            {session.user.image ? (
                                <Image
                                    src={session.user.image}
                                    alt={session.user.name || 'User'}
                                    width={40}
                                    height={40}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <span>
                                    {session.user.name
                                        ?.split(' ')
                                        .map(n => n[0])
                                        .join('')
                                        .toUpperCase()
                                        .slice(0, 2) || 'U'}
                                </span>
                            )}
                        </div>

                        {/* User info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {session.user.name || 'User'}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                                {session.user.email}
                            </p>
                            {session.user.role && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-300 mt-1">
                                    {session.user.role}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 px-4 space-y-6 overflow-y-auto py-2">
                {sidebarSections.map((section, idx) => {
                    // Filter items based on role
                    const visibleItems = section.items.filter(link => {
                        if (session?.user?.role !== 'ADMIN') {
                            if (['/users', '/settings', '/products'].includes(link.href)) {
                                return false;
                            }
                        }
                        return true;
                    });

                    // Don't render empty sections
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={idx}>
                            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                {section.title}
                            </h3>
                            <div className="space-y-1">
                                {visibleItems.map((link) => {
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
                        </div>
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
