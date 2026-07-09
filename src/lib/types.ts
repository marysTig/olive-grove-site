export interface Category {
  id: string;
  name_ar: string;
  name_fr: string;
  slug: string;
  image_url: string | null;
  visible: boolean;
  sort_order: number;
}

export type ProductStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface Product {
  id: string;
  name_ar: string;
  name_fr: string;
  slug: string;
  description_ar: string | null;
  description_fr: string | null;
  price: number;
  discount_pct: number;
  quantity: number;
  status: ProductStatus;
  category_id: string | null;
  images: string[];
  image_public_ids: string[];
  badge: string | null;
  volume_ml: number | null;
  origin: string | null;
  harvest_date: string | null;
  featured: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  order_number: number;
  user_id: string | null;
  status: OrderStatus;
  payment_method: string;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  delivery_address?: string | null;
  phone: string;
  address: string;
  wilaya: string;
  notes: string | null;
  coupon_code: string | null;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;
  products?: Array<Record<string, unknown>>;
  items?: OrderItem[];
  inventory_deducted: boolean;
  created_at: string;
}

export interface OrderItem {
  product_id: string | null;
  name_ar: string;
  name_fr: string;
  image_url: string | null;
  quantity: number;
  price: number;
}

export interface Review {
  id: string;
  productId: string;
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface ContactSettings {
  id: string;
  whatsappNumber: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imagePublicId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  revenue: number;
  orders: number;
  products: number;
  pendingOrders: number;
  deliveredOrders: number;
  customers: number;
  revenueByDay: Array<{ _id: string } & Record<string, number>>;
  productNames: string[];
}

export interface ProductAnalytics extends Product {
  sold_today: number;
  sold_7d: number;
  sold_30d: number;
  sold_365d: number;
  sold_total: number;
  revenue: number;
  avg_units_per_month: number;
}

export interface ProductDetailsAnalytics {
  product: Product;
  sales: {
    sold_today: number;
    sold_7d: number;
    sold_30d: number;
    sold_365d: number;
    sold_total: number;
    revenue_today: number;
    revenue_7d: number;
    revenue_30d: number;
    revenue_365d: number;
    revenue_total: number;
  };
  trends: {
    daily_sales: Array<{ date: string; units: number; revenue: number }>;
    weekly_sales: Array<{ week: string; units: number; revenue: number }>;
    monthly_sales: Array<{ month: string; units: number; revenue: number }>;
    yearly_sales: Array<{ year: string; units: number; revenue: number }>;
  };
  inventory: {
    current_stock: number;
    remaining_percentage: number;
    status: string;
    estimated_days_out_of_stock: number;
  };
}

export interface RevenueAnalytics {
  revenue: {
    today: number;
    week: number;
    month: number;
    year: number;
    total: number;
  };
  chart: Array<{ month: string; revenue: number }>;
  best_revenue_month: string;
  average_order_value: number;
}

export interface OrdersAnalytics {
  orders: {
    total: number;
    delivered: number;
    pending: number;
    cancelled: number;
    returned: number;
    today: number;
    week: number;
    month: number;
    year: number;
  };
  chart: Array<{ month: string; count: number }>;
  recent_orders: Order[];
}

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export function finalPrice(
  p: Partial<Pick<Product, "price" | "discount_pct">> | null | undefined,
): number {
  if (!p) return 0;
  const price = p.price ?? 0;
  const discount = p.discount_pct ?? 0;
  return discount > 0 ? price * (1 - discount / 100) : price;
}
