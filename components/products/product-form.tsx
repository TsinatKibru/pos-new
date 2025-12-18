"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, X } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional(),
  price: z.string().min(0.01, "Price must be positive"),
  cost: z.string().min(0.01, "Cost must be positive"),
  stockQuantity: z.string().min(0, "Stock quantity cannot be negative"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().optional(),
  isActive: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Category {
  id: string;
  name: string;
}

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
}

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  product?: Product | null;
  categories: Category[];
}

export function ProductForm({
  open,
  onOpenChange,
  onSubmit,
  product,
  categories,
}: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      barcode: "",
      price: "0",
      cost: "0",
      stockQuantity: "0",
      imageUrl: "",
      categoryId: "",
      isActive: true,
    },
  });

  const watchImageUrl = watch("imageUrl");
  const watchIsActive = watch("isActive");

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description || "",
        sku: product.sku,
        barcode: product.barcode || "",
        price: product.price.toString(),
        cost: product.cost.toString(),
        stockQuantity: product.stockQuantity.toString(),
        imageUrl: product.imageUrl || "",
        categoryId: product.categoryId || "",
        isActive: product.isActive,
      });
      setImagePreview(product.imageUrl || null);
    } else {
      reset({
        name: "",
        description: "",
        sku: "",
        barcode: "",
        price: "0",
        cost: "0",
        stockQuantity: "0",
        imageUrl: "",
        categoryId: "",
        isActive: true,
      });
      setImagePreview(null);
    }
  }, [product, reset]);

  useEffect(() => {
    if (watchImageUrl) {
      setImagePreview(watchImageUrl);
    }
  }, [watchImageUrl]);

  const handleFormSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        price: parseFloat(data.price),
        cost: parseFloat(data.cost),
        stockQuantity: parseInt(data.stockQuantity),
        imageUrl: data.imageUrl || null,
        barcode: data.barcode || null,
        categoryId: data.categoryId || null,
      };
      await onSubmit(payload);
      onOpenChange(false);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription>
            {product
              ? "Update the product details below."
              : "Fill in the product details below."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter product name"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                {...register("sku")}
                placeholder="Enter SKU"
                disabled={!!product}
              />
              {errors.sku && (
                <p className="text-sm text-red-600">{errors.sku.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                {...register("barcode")}
                placeholder="Enter barcode"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register("price")}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                {...register("cost")}
                placeholder="0.00"
              />
              {errors.cost && (
                <p className="text-sm text-red-600">{errors.cost.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockQuantity">Stock Quantity</Label>
              <Input
                id="stockQuantity"
                type="number"
                {...register("stockQuantity")}
                placeholder="0"
                disabled={!!product}
              />
              {!!product && (
                <p className="text-xs text-slate-500">
                  To adjust stock, use the "Adjust" button in the Inventory page.
                </p>
              )}
              {errors.stockQuantity && (
                <p className="text-sm text-red-600">
                  {errors.stockQuantity.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select
                value={watch("categoryId") || "none"}
                onValueChange={(value) =>
                  setValue("categoryId", value === "none" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* <div className="col-span-2 space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                {...register("imageUrl")}
                placeholder="https://example.com/image.jpg"
              />
              {errors.imageUrl && (
                <p className="text-sm text-red-600">
                  {errors.imageUrl.message}
                </p>
              )}
            </div>

            {imagePreview && (
              <div className="col-span-2">
                <Label>Image Preview</Label>
                <div className="relative mt-2 w-full h-48 bg-slate-100 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setValue("imageUrl", "");
                      setImagePreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )} */}
            <div className="col-span-2">
              <Label>Product Image</Label>
              <ImageUpload
                value={watch("imageUrl") || ""}
                onChange={(url) => setValue("imageUrl", url)}
                onRemove={() => setValue("imageUrl", "")}
              />
              {errors.imageUrl && (
                <p className="text-sm text-red-600">
                  {errors.imageUrl.message}
                </p>
              )}
            </div>

            <div className="col-span-2 flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={watchIsActive}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {product ? "Update Product" : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
