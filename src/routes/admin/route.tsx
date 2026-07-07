import {
  createFileRoute,
  Outlet,
  Link,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { useAdminAuth, type Permission } from "@/lib/admin-auth";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Home,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { logo } from "@/lib/images";
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

// ── Navigation items with permission gating ────────────────────
interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  permission: Permission;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Tableau de bord",
    to: "/admin/dashboard",
    icon: LayoutDashboard,
    permission: "dashboard",
  },
  {
    label: "Produits",
    to: "/admin/products",
    icon: Package,
    permission: "manage_products",
  },
  {
    label: "Commandes",
    to: "/admin/orders",
    icon: ShoppingCart,
    permission: "manage_orders",
  },
  {
    label: "Employés",
    to: "/admin/employees",
    icon: Users,
    permission: "manage_employees",
  },
  {
    label: "Paramètres",
    to: "/admin/settings",
    icon: Settings,
    permission: "manage_settings",
  },
];

function AdminLayout() {
  const {
    user,
    loading,
    isAuthenticated,
    logout,
    hasPermission,
    restoreSession,
  } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Restore session only when admin routes are visited (client-side only)
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      await restoreSession();
      if (!cancelled) setSessionChecked(true);
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [restoreSession]);

  // Show loading spinner while restoring session
  if (!sessionChecked || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Vérification de l'authentification...
          </p>
        </div>
      </div>
    );
  }

  // Allow /admin/login to render without auth
  if (location.pathname === "/admin/login") {
    return <Outlet />;
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    navigate({ to: "/admin/login" });
    return null;
  }

  // Filter nav items based on user role
  const filteredNavItems = NAV_ITEMS.filter((item) =>
    hasPermission(item.permission)
  );

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/admin/login" });
  };

  const isActive = (to: string) => location.pathname === to;

  return (
    <ProtectedAdminRoute>
      <div className="flex min-h-screen bg-cream">
        {/* ── Mobile overlay ─────────────────────────────────────── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ────────────────────────────────────────────── */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:static lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Logo & brand */}
          <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
            <img
              src={logo}
              alt=""
              className="h-10 w-10 rounded-full object-contain"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Lem3ansra n Jeddi</p>
              <p className="truncate text-xs text-sidebar-accent-foreground/60">
                Administration
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {filteredNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(item.to)
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User info & logout */}
          <div className="border-t border-sidebar-border px-4 py-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                <Shield className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {user?.fullName}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/50">
                  {user?.role === "admin" ? "Administrateur" : "Employé"}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start gap-2 rounded-xl text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                asChild
              >
                <a href="/">
                  <Home className="h-3.5 w-3.5" />
                  Site
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex-1 justify-start gap-2 rounded-xl text-xs text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
                Déconnexion
              </Button>
            </div>
          </div>
        </aside>

        {/* ── Main content ───────────────────────────────────────── */}
        <div className="flex flex-1 flex-col">
          {/* Mobile header */}
          <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 lg:hidden">
            <button onClick={() => setSidebarOpen(true)} aria-label="Ouvrir le menu">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-display text-lg font-semibold text-olive-dark">
              Administration
            </h1>
          </header>

          {/* Admin quick actions */}
          <div className="border-b border-border bg-card px-4 py-4 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Accédez rapidement au site public.
              </p>
              <Button variant="secondary" size="sm" asChild>
                <Link to="/">Retour au site</Link>
              </Button>
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1 p-4 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </ProtectedAdminRoute>
  );
}
