import { ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAdminAuth } from "@/lib/admin-auth";

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

/**
 * ProtectedAdminRoute redirects non-admin users away from the admin panel.
 * The backend enforces the same restriction via JWT + RBAC middleware.
 */
export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { user: adminUser, loading: adminAuthLoading } = useAdminAuth();
  const navigate = useNavigate();

  const isSystemAdmin = adminUser?.role === "admin";
  const isLoading = adminAuthLoading;

  useEffect(() => {
    if (!isLoading && !isSystemAdmin) {
      navigate({ to: "/" });
    }
  }, [isLoading, isSystemAdmin, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isSystemAdmin) {
    return null;
  }

  return <>{children}</>;
}
