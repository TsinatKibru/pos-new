'use client';

import { Product } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProductGridProps {
    products: Product[];
    onAddToCart: (product: Product) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
    if (products.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50">
                <p className="text-slate-500">No products found</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
                const isLowStock = product.stockQuantity <= 10;
                const outOfStock = product.stockQuantity <= 0;

                return (
                    <Card
                        key={product.id}
                        className={cn(
                            "cursor-pointer transition-all hover:border-blue-400 hover:shadow-md active:scale-95",
                            outOfStock && "opacity-60 grayscale"
                        )}
                        onClick={() => {
                            if (!outOfStock) {
                                onAddToCart(product);
                            }
                        }}
                    >
                        <CardContent className="p-4">
                            <div className="mb-3 aspect-square w-full overflow-hidden rounded-md bg-slate-100">
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xl font-bold text-slate-300">
                                        {product.name.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="line-clamp-2 text-sm font-medium text-slate-900 leading-tight">
                                        {product.name}
                                    </h3>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-lg font-bold text-blue-600">
                                        ${Number(product.price).toFixed(2)}
                                    </span>

                                    {outOfStock ? (
                                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                                            Out of Stock
                                        </Badge>
                                    ) : isLowStock ? (
                                        <Badge variant="secondary" className="h-5 bg-orange-100 text-orange-700 hover:bg-orange-100 px-1.5 text-[10px]">
                                            {product.stockQuantity} Left
                                        </Badge>
                                    ) : (
                                        <span className="text-xs text-slate-400">
                                            Stock: {product.stockQuantity}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
