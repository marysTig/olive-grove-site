import { randomUUID } from "node:crypto";

export interface StoreUser {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: "admin" | "client";
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoreProduct {
  id: string;
  name_fr: string;
  name_ar: string;
  slug: string;
  description_fr: string;
  description_ar: string;
  price: number;
  discount_pct: number;
  stock: number;
  category_id: string | null;
  images: string[];
  image_public_ids: string[];
  badge: string | null;
  volume_ml: number | null;
  origin: string | null;
  harvest_date: string | null;
  featured: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreState {
  users: StoreUser[];
  products: StoreProduct[];
}

const now = () => new Date().toISOString();

export function createInitialStore(): StoreState {
  return {
    users: [
      {
        id: randomUUID(),
        fullName: "Administrateur",
        email: "admin@olivegrove.test",
        passwordHash: "$2a$12$FQY1QxXoYlIGYABQ9boM5uJ6QzA5mYhD5sT4i9rR3D8gk7v7k7jQ2",
        role: "admin",
        isActive: true,
        lastLogin: null,
        createdAt: now(),
        updatedAt: now(),
      },
    ],
    products: [
      {
        id: randomUUID(),
        name_fr: "Huile d’olive premium",
        name_ar: "زيت زيتون فاخر",
        slug: "huile-dolive-premium",
        description_fr: "Huile d’olive extra vierge artisanale.",
        description_ar: "زيت زيتون بكر يدوي فاخر.",
        price: 3200,
        discount_pct: 10,
        stock: 24,
        category_id: null,
        images: [
          "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
        ],
        image_public_ids: ["demo-product-1"],
        badge: "Nouveau",
        volume_ml: 500,
        origin: "Sétif",
        harvest_date: "2025-10",
        featured: true,
        active: true,
        createdAt: now(),
        updatedAt: now(),
      },
    ],
  };
}
