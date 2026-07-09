import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "./types";
import { finalPrice } from "./types";

export interface CartItem {
  id: string;
  name_ar: string;
  name_fr: string;
  image_url: string | null;
  price: number;
  quantity: number;
  available_quantity: number;
}

interface CartValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  add: (product: Product, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartValue | null>(null);
const STORAGE_KEY = "lnj-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add: CartValue["add"] = (product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      const price = finalPrice(product);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + qty, product.quantity || 99) }
            : i,
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name_ar: product.name_ar,
          name_fr: product.name_fr,
          image_url: product.images?.[0] ?? null,
          price,
          quantity: Math.min(qty, product.quantity || 99),
          available_quantity: product.quantity,
        },
      ];
    });
  };

  const remove: CartValue["remove"] = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const setQty: CartValue["setQty"] = (id, qty) =>
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: Math.max(0, qty) } : i))
        .filter((i) => i.quantity > 0),
    );

  const clear = () => setItems([]);

  const value = useMemo<CartValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return { items, count, subtotal, drawerOpen, setDrawerOpen, add, remove, setQty, clear };
  }, [items, drawerOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
