import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useAdminAuth } from "@/lib/admin-auth";

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * AdminOnly component renders its children only if the current user
 * is authenticated as an administrator via the local Express auth flow.
 */
export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const { role, isAdmin } = useAuth();
  const { user: adminUser } = useAdminAuth();

  const isSystemAdmin = role === "admin" || isAdmin || adminUser?.role === "admin";

  if (isSystemAdmin) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
