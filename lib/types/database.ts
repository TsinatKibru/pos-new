export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'admin' | 'cashier' | 'manager';
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  barcode: string | null;
  price: number;
  cost: number;
  stock_quantity: number;
  category_id: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Sale {
  id: string;
  user_id: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  payment_method: 'cash' | 'card' | 'digital';
  status: 'completed' | 'refunded' | 'pending';
  created_at: Date;
  updated_at: Date;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  subtotal: number;
  created_at: Date;
}

export interface Customer {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string;
  loyalty_points: number;
  created_at: Date;
  updated_at: Date;
}

export type CreateUser = Omit<User, 'id' | 'created_at' | 'updated_at'>;
export type UpdateUser = Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;

export type CreateProduct = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
export type UpdateProduct = Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>;

export type CreateSale = Omit<Sale, 'id' | 'created_at' | 'updated_at'>;
export type CreateSaleItem = Omit<SaleItem, 'id' | 'created_at'>;
