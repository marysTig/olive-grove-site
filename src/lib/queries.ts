import { queryOptions } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/api";
import type {
  Product,
  Category,
  StoreSettings,
  Review,
  DashboardStats,
  ProductAnalytics,
  ProductDetailsAnalytics,
  RevenueAnalytics,
  OrdersAnalytics,
  ContactSettings,
  GalleryItem,
} from "./types";

export const productsQuery = () =>
  queryOptions({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/products`, { credentials: "include" });
        const json = await response.json();
        if (!response.ok) throw new Error(json?.message || "Unable to load products");
        return (json?.data ?? []) as Product[];
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("fetch") || error.name === "TypeError") {
            throw new Error(
              "Unable to connect to the backend server. Please verify it is running on port 5000.",
            );
          }
          throw error;
        }
        throw new Error("An unexpected error occurred while loading products.");
      }
    },
  });

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product | null> => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/products/${slug}`, {
          credentials: "include",
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json?.message || "Unable to load product");
        return (json?.data as Product) ?? null;
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("fetch") || error.name === "TypeError") {
            throw new Error(
              "Unable to connect to the backend server. Please verify it is running on port 5000.",
            );
          }
          throw error;
        }
        throw new Error("An unexpected error occurred while loading the product.");
      }
    },
  });

export const reviewsByProductQuery = (slug: string) =>
  queryOptions({
    queryKey: ["reviews", "product", slug],
    queryFn: async (): Promise<Review[]> => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/products/${slug}/reviews`, {
          credentials: "include",
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json?.message || "Unable to load reviews");
        return (json?.data ?? []) as Review[];
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("fetch") || error.name === "TypeError") {
            throw new Error(
              "Unable to connect to the backend server. Please verify it is running on port 5000.",
            );
          }
          throw error;
        }
        throw new Error("An unexpected error occurred while loading reviews.");
      }
    },
  });

export const dashboardStatsQuery = () =>
  queryOptions({
    queryKey: ["dashboard", "stats"],
    queryFn: async (): Promise<DashboardStats> => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/dashboard/stats`, {
          credentials: "include",
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json?.message || "Unable to load dashboard stats");
        return json.data as DashboardStats;
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("fetch") || error.name === "TypeError") {
            throw new Error(
              "Unable to connect to the backend server. Please verify it is running on port 5000.",
            );
          }
          throw error;
        }
        throw new Error("An unexpected error occurred while loading dashboard stats.");
      }
    },
  });

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      return [] as Category[];
    },
  });

export const settingsQuery = () =>
  queryOptions({
    queryKey: ["store_settings"],
    queryFn: async (): Promise<StoreSettings | null> => {
      return null;
    },
  });

export const contactSettingsQuery = () =>
  queryOptions({
    queryKey: ["contact_settings"],
    queryFn: async (): Promise<ContactSettings> => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/contact-settings`, {
          credentials: "include",
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json?.message || "Unable to load contact settings");
        return json.data as ContactSettings;
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("fetch") || error.name === "TypeError") {
            throw new Error(
              "Unable to connect to the backend server. Please verify it is running on port 5000.",
            );
          }
          throw error;
        }
        throw new Error("An unexpected error occurred while loading contact settings.");
      }
    },
  });

export const galleryQuery = () =>
  queryOptions({
    queryKey: ["gallery"],
    queryFn: async (): Promise<GalleryItem[]> => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/gallery`, {
          credentials: "include",
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json?.message || "Unable to load gallery");
        return (json.data ?? []) as GalleryItem[];
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("fetch") || error.name === "TypeError") {
            throw new Error(
              "Unable to connect to the backend server. Please verify it is running on port 5000.",
            );
          }
          throw error;
        }
        throw new Error("An unexpected error occurred while loading gallery.");
      }
    },
  });

export const productAnalyticsQuery = () =>
  queryOptions({
    queryKey: ["product_analytics"],
    queryFn: async (): Promise<ProductAnalytics[]> => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/products/analytics`, {
          credentials: "include",
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json?.message || "Unable to load product analytics");
        return (json?.data ?? []) as ProductAnalytics[];
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("fetch") || error.name === "TypeError") {
            throw new Error(
              "Unable to connect to the backend server. Please verify it is running on port 5000.",
            );
          }
          throw error;
        }
        throw new Error("An unexpected error occurred while loading product analytics.");
      }
    },
  });

export const productDetailsAnalyticsQuery = (productId: string) =>
  queryOptions({
    queryKey: ["product_details_analytics", productId],
    queryFn: async (): Promise<ProductDetailsAnalytics> => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/products/analytics/${productId}`, {
          credentials: "include",
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json?.message || "Unable to load product analytics");
        return json.data as ProductDetailsAnalytics;
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("fetch") || error.name === "TypeError") {
            throw new Error(
              "Unable to connect to the backend server. Please verify it is running on port 5000.",
            );
          }
          throw error;
        }
        throw new Error("An unexpected error occurred while loading product analytics.");
      }
    },
  });

export const revenueAnalyticsQuery = () =>
  queryOptions({
    queryKey: ["revenue_analytics"],
    queryFn: async (): Promise<RevenueAnalytics> => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/dashboard/revenue`, {
          credentials: "include",
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json?.message || "Unable to load revenue analytics");
        return json.data as RevenueAnalytics;
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("fetch") || error.name === "TypeError") {
            throw new Error(
              "Unable to connect to the backend server. Please verify it is running on port 5000.",
            );
          }
          throw error;
        }
        throw new Error("An unexpected error occurred while loading revenue analytics.");
      }
    },
  });

export const ordersAnalyticsQuery = () =>
  queryOptions({
    queryKey: ["orders_analytics"],
    queryFn: async (): Promise<OrdersAnalytics> => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/dashboard/orders`, {
          credentials: "include",
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json?.message || "Unable to load orders analytics");
        return json.data as OrdersAnalytics;
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("fetch") || error.name === "TypeError") {
            throw new Error(
              "Unable to connect to the backend server. Please verify it is running on port 5000.",
            );
          }
          throw error;
        }
        throw new Error("An unexpected error occurred while loading orders analytics.");
      }
    },
  });
