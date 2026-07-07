import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, ShoppingCart, Package, Users } from "lucide-react";
import { useAdminAuth } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user } = useAdminAuth();

  const stats = [
    {
      icon: BarChart3,
      label: "Revenus",
      value: "—",
      description: "Données bientôt disponibles",
    },
    {
      icon: ShoppingCart,
      label: "Commandes",
      value: "—",
      description: "Données bientôt disponibles",
    },
    {
      icon: Package,
      label: "Produits",
      value: "—",
      description: "Données bientôt disponibles",
    },
    {
      icon: Users,
      label: "Clients",
      value: "—",
      description: "Données bientôt disponibles",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-olive-dark">
          Tableau de bord
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bienvenue, {user?.fullName}. Voici un aperçu de votre boutique.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-elegant"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm font-medium text-foreground/80">
              {stat.label}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      {/* Placeholder for future charts/widgets */}
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
        <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">
          Les graphiques et statistiques détaillées seront disponibles ici.
        </p>
      </div>
    </div>
  );
}
