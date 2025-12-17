'use client';

import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface Category {
    id: string;
    name: string;
}

interface CategoryFilterProps {
    categories: Category[];
    selectedCategoryId: string | null;
    onSelectCategory: (id: string | null) => void;
}

export function CategoryFilter({
    categories,
    selectedCategoryId,
    onSelectCategory,
}: CategoryFilterProps) {
    return (
        <ScrollArea className="w-full whitespace-nowrap pb-2">
            <div className="flex w-max space-x-2 p-1">
                <Button
                    variant={selectedCategoryId === null ? "default" : "outline"}
                    onClick={() => onSelectCategory(null)}
                    className={cn(
                        "rounded-full px-6",
                        selectedCategoryId === null && "bg-slate-900 text-white hover:bg-slate-800"
                    )}
                >
                    All Items
                </Button>
                {categories.map((category) => (
                    <Button
                        key={category.id}
                        variant={selectedCategoryId === category.id ? "default" : "outline"}
                        onClick={() => onSelectCategory(category.id)}
                        className={cn(
                            "rounded-full px-6",
                            selectedCategoryId === category.id && "bg-slate-900 text-white hover:bg-slate-800"
                        )}
                    >
                        {category.name}
                    </Button>
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
}
