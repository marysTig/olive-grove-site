import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { getApiBaseUrl } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────

export type AdminRole = "admin" | "client";

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Permissions that can be checked against the user's role */
export type Permission =
  | "dashboard"
  | "manage_products"
  | "manage_orders"
  | "manage_users"
  | "manage_settings"
  | "view_analytics"
  | "view_product_analytics"
  | "manage_employees"
  | "manage_reviews";

/** Role → Permission mapping */
const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  admin: [
    "dashboard",
    "manage_products",
    "manage_orders",
    "manage_users",
    "manage_settings",
    "view_analytics",
    "view_product_analytics",
    "manage_employees",
    "manage_reviews",
  ],
  client: [],
};

interface AdminAuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  restoreSession: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

const API_BASE = getApiBaseUrl();

// ── Provider ───────────────────────────────────────────────────

/**
 * AdminAuthProvider — provides auth context for the admin panel.
 *
 * SSR-safe: does NOT fetch /auth/me on mount. Session restore is
 * triggered explicitly by the admin layout route so that public
 * pages never make unnecessary auth requests.
 */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  // Start with loading=false so public pages render immediately.
  // The admin layout will set loading=true when it calls restoreSession().
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);

  const restoreSession = useCallback(async () => {
    // Guard: skip during SSR
    if (typeof window === "undefined") return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        credentials: "include",
      });

      if (res.ok) {
        const json = await res.json();
        setUser(json.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.message || "Login failed");
    }

    setUser(json.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Clear local state even if the request fails
    }
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!user) return false;
      return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
    },
    [user],
  );

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        hasPermission,
        restoreSession,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
