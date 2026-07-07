export interface Category {
  id: string;
  name_ar: string;
  name_fr: string;
  slug: string;
  image_url: string | null;
  visible: boolean;
  sort_order: number;
}

export interface Product {
  id: string;
  name_ar: string;
  name_fr: string;
  slug: string;
  description_ar: string | null;
  description_fr: string | null;
  price: number;
  discount_pct: number;
  stock: number;
  category_id: string | null;
  images: string[];
  badge: string | null;
  volume_ml: number | null;
  origin: string | null;
  harvest_date: string | null;
  rating: number;
  featured: boolean;
  active: boolean;
  created_at: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  order_number: number;
  user_id: string | null;
  status: OrderStatus;
  payment_method: string;
  customer_name: string;
  phone: string;
  address: string;
  wilaya: string;
  notes: string | null;
  coupon_code: string | null;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  name_ar: string;
  name_fr: string;
  image_url: string | null;
  quantity: number;
  price: number;
}

export interface Coupon {
  id: string;
  code: string;
  discount_pct: number;
  expiration: string | null;
  active: boolean;
  usage_count: number;
}

export interface StoreSettings {
  id: number;
  shipping_fee: number;
  free_shipping_threshold: number;
  whatsapp_number: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  email: string | null;
  address: string | null;
}

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
];

export function finalPrice(p: Pick<Product, "price" | "discount_pct">): number {
  return p.discount_pct > 0 ? p.price * (1 - p.discount_pct / 100) : p.price;
}
