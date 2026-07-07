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
  phone: string;
  address: string;
  wilaya: string;
  notes?: string;
  coupon_code?: string | null;
  discount_pct: number;
  shipping_fee: number;
  user_id?: string | null;
}

export async function createOrder(input: CheckoutInput): Promise<Order> {
  const subtotal = input.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = input.discount_pct > 0 ? subtotal * (input.discount_pct / 100) : 0;
  const total = subtotal - discount + input.shipping_fee;

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: input.user_id ?? null,
      customer_name: input.customer_name,
      phone: input.phone,
      address: input.address,
      wilaya: input.wilaya,
      notes: input.notes ?? null,
      coupon_code: input.coupon_code ?? null,
      payment_method: "cod",
      subtotal,
      discount,
      shipping_fee: input.shipping_fee,
      total,
    })
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
