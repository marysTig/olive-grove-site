import { supabase } from "@server/database/supabase";

export type ApiRole = "admin" | "client";

export function toApiRole(dbRole: string | null | undefined): ApiRole {
  return dbRole === "admin" ? "admin" : "client";
}

export function toDbRole(apiRole: string | undefined): "admin" | "customer" {
  return apiRole === "admin" ? "admin" : "customer";
}

export function computeProductStatus(stock: number): "in_stock" | "low_stock" | "out_of_stock" {
  if (stock <= 0) return "out_of_stock";
  if (stock <= 10) return "low_stock";
  return "in_stock";
}

export interface OrderItemRow {
  id?: string;
  order_id?: string;
  product_id: string | null;
  name_ar: string;
  name_fr: string;
  quantity: number;
  price: number;
  image_url: string | null;
}

export async function fetchOrderItems(orderIds: string[]): Promise<Map<string, OrderItemRow[]>> {
  const map = new Map<string, OrderItemRow[]>();
  if (orderIds.length === 0) return map;

  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .in("order_id", orderIds);

  if (error) {
    throw error;
  }

  for (const item of data ?? []) {
    const list = map.get(item.order_id) ?? [];
    list.push(item as OrderItemRow);
    map.set(item.order_id, list);
  }

  return map;
}

export async function getUserRole(userId: string): Promise<"admin" | "customer" | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data.role as "admin" | "customer";
}

export async function setUserRole(userId: string, role: "admin" | "customer"): Promise<void> {
  await supabase.from("user_roles").delete().eq("user_id", userId);
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
  if (error) throw error;
}
