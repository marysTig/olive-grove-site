import { getApiBaseUrl } from "@/lib/api";
import type { CartItem } from "./cart";
import type { Coupon, Order } from "./types";

export async function validateCoupon(code: string): Promise<Coupon | null> {
  return null;
}

export interface CheckoutInput {
  items: CartItem[];
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  wilaya: string;
  notes?: string;
  coupon_code?: string | null;
  discount_pct: number;
  shipping_fee: number;
}

export async function createOrder(input: CheckoutInput): Promise<Order> {
  const subtotal = input.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = input.discount_pct > 0 ? subtotal * (input.discount_pct / 100) : 0;
  const total = subtotal - discount + input.shipping_fee;

  const response = await fetch(`${getApiBaseUrl()}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      customer_name: input.customer_name,
      customer_email: input.customer_email,
      customer_phone: input.customer_phone,
      delivery_address: input.delivery_address,
      wilaya: input.wilaya,
      notes: input.notes ?? null,
      coupon_code: input.coupon_code ?? null,
      subtotal,
      discount,
      shipping_fee: input.shipping_fee,
      total,
      items: input.items.map((item) => ({
        id: item.id,
        name_ar: item.name_ar,
        name_fr: item.name_fr,
        quantity: item.quantity,
        price: item.price,
      })),
    }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.message || "Unable to create order");
  }

  return json.data as Order;
}
