'use client';

import { useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Product } from '@prisma/client';

interface ProductSearchProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function ProductSearch({
  products,
  onAddToCart,
}: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);

      if (query.trim().length === 0) {
        setFilteredProducts([]);
        setShowResults(false);
        return;
      }

      const query_lower = query.toLowerCase();
      const results = products.filter((product) => {
        return (
          product.name.toLowerCase().includes(query_lower) ||
          product.sku.toLowerCase().includes(query_lower) ||
          product.barcode?.toLowerCase().includes(query_lower)
        );
      });

      setFilteredProducts(results);
      setShowResults(true);
    },
    [products]
  );

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="text"
          placeholder="Search by name, SKU, or barcode..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => searchQuery && setShowResults(true)}
          onBlur={() =>
            setTimeout(() => setShowResults(false), 200)
          }
          className="pl-9 py-2 bg-white"
        />
      </div>

      {showResults && filteredProducts.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => {
                onAddToCart(product);
                setSearchQuery('');
                setFilteredProducts([]);
                setShowResults(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between border-b last:border-b-0 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">
                  {product.name}
                </p>
                <p className="text-xs text-slate-500">
                  SKU: {product.sku}
                </p>
              </div>
              <div className="ml-4 text-right">
                <p className="font-semibold text-slate-900">
                  ${Number(product.price).toFixed(2)}
                </p>
                <p className="text-xs text-slate-500">
                  Stock: {product.stockQuantity}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && filteredProducts.length === 0 && searchQuery && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-lg shadow-lg px-4 py-3">
          <p className="text-sm text-slate-500">No products found</p>
        </div>
      )}
    </div>
  );
}
