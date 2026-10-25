export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number; // Regular / Retail price (Harga Eceran)
  wholesalePrice: number; // Wholesale price (Harga Grosir)
  minWholesaleQty: number; // Min quantity to trigger wholesale price
  stock: number;
  unit: string; // pcs, dus, bal, renceng, pak, kg, karton, krat
  imageUrl: string;
  sku?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  unit: string;
  quantity: number;
  priceApplied: number;
  isWholesale: boolean;
  subtotal: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  notes?: string;
  userId?: string;
  items: OrderItem[];
  totalAmount: number;
  totalSaved: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  iconName?: string;
}
