import { supabase } from "@server/database/supabase";

const REQUIRED_TABLES = [
  "user_roles",
  "profiles",
  "products",
  "orders",
  "order_items",
  "store_settings",
  "reviews",
  "gallery",
] as const;

export async function assertSupabaseSchemaReady(): Promise<void> {
  for (const table of REQUIRED_TABLES) {
    const { error } = await supabase.from(table).select("*").limit(1);
    if (error?.message?.includes("Could not find the table")) {
      throw new Error(
        `Supabase schema is not migrated (missing public.${table}). ` +
          "Set SUPABASE_DB_PASSWORD in .env and run: npm run setup:db",
      );
    }
    if (error && !error.message.includes("0 rows")) {
      throw new Error(`Supabase schema check failed for ${table}: ${error.message}`);
    }
  }

  const { data: productSample } = await supabase.from("products").select("stock").limit(1);
  if (productSample?.[0] && !("stock" in productSample[0])) {
    throw new Error(
      "Supabase products table is using legacy mongo schema (quantity). " +
        "Run npm run setup:db after setting SUPABASE_DB_PASSWORD to apply migrations.",
    );
  }
}
