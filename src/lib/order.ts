import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "./cart";
import type { Coupon, Order } from "./types";

export async function validateCoupon(code: string): Promise<Coupon | null> {
  const { data } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .eq("active", true)
    .maybeSingle();
  if (!data) return null;
  const c = data as Coupon;
  if (c.expiration && new Date(c.expiration) < new Date()) return null;
  return c;
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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: session?.user?.id ?? null,
      customer_name: input.customer_name,
      customer_email: input.customer_email,
      customer_phone: input.customer_phone,
      delivery_address: input.delivery_address,
      phone: input.customer_phone,
      address: input.delivery_address,
      wilaya: input.wilaya,
      notes: input.notes ?? null,
      coupon_code: input.coupon_code ?? null,
      status: "pending",
      payment_method: "cod",
      subtotal,
      discount,
      shipping_fee: input.shipping_fee,
      total,
      products: input.items.map((item) => ({
        id: item.id,
        name_ar: item.name_ar,
        name_fr: item.name_fr,
        quantity: item.quantity,
        price: item.price,
      })),
    } as Record<string, unknown>)
    .select()
    .single();

  if (error) throw error;
  const o = order as Order;

  const { error: itemsError } = await supabase.from("order_items").insert(
    input.items.map((i) => ({
      order_id: o.id,
      product_id: i.id,
      name_ar: i.name_ar,
      name_fr: i.name_fr,
      image_url: i.image_url,
      quantity: i.quantity,
      price: i.price,
    })),
  );
  if (itemsError) throw itemsError;

  return o;
}
