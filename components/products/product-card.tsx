import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Package } from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  description?: string | null;
  sku: string;
  barcode?: string | null;
  price: number;
  cost: number;
  stockQuantity: number;
  imageUrl?: string | null;
  categoryId?: string | null;
  isActive: boolean;
  category?: {
    id: string;
    name: string;
  } | null;
}

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const isLowStock = product.stockQuantity <= 10;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 bg-slate-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="h-16 w-16 text-slate-300" />
          </div>
        )}
        {!product.isActive && (
          <Badge
            variant="destructive"
            className="absolute top-2 right-2"
          >
            Inactive
          </Badge>
        )}
        {isLowStock && product.isActive && (
          <Badge
            variant="default"
            className="absolute top-2 right-2 bg-orange-500"
          >
            Low Stock
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg line-clamp-1">
              {product.name}
            </h3>
            <span className="text-lg font-bold text-slate-900">
              ${Number(product.price).toFixed(2)}
            </span>
          </div>

          {product.description && (
            <p className="text-sm text-slate-600 line-clamp-2">
              {product.description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">SKU: {product.sku}</span>
            <span
              className={`font-medium ${
                isLowStock ? 'text-orange-600' : 'text-slate-700'
              }`}
            >
              Stock: {product.stockQuantity}
            </span>
          </div>

          {product.category && (
            <Badge variant="secondary" className="text-xs">
              {product.category.name}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-2"
          onClick={() => onEdit(product)}
        >
          <Edit className="h-4 w-4" />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="flex-1 gap-2"
          onClick={() => onDelete(product.id)}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
