export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  discountAmount?: number;
}

export interface CartState {
  items: CartItem[];
  discountPercentage: number;
  taxRate: number;
}

export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((total, item) => {
    const itemSubtotal = item.price * item.quantity;
    const discount = item.discountAmount || 0;
    return total + (itemSubtotal - discount);
  }, 0);
}

export function calculateTax(subtotal: number, taxRate: number): number {
  return Math.round(subtotal * (taxRate / 100) * 100) / 100;
}

export function calculateDiscountAmount(
  subtotal: number,
  discountPercentage: number
): number {
  return Math.round(subtotal * (discountPercentage / 100) * 100) / 100;
}

export function calculateTotal(
  subtotal: number,
  tax: number,
  discountAmount: number
): number {
  return Math.round((subtotal - discountAmount + tax) * 100) / 100;
}

export function getCartSummary(state: CartState) {
  const subtotal = calculateSubtotal(state.items);
  const discountAmount = calculateDiscountAmount(
    subtotal,
    state.discountPercentage
  );
  const tax = calculateTax(subtotal - discountAmount, state.taxRate);
  const total = calculateTotal(subtotal, tax, 0);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    itemCount: state.items.reduce((count, item) => count + item.quantity, 0),
  };
}
