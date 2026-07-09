import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, ShoppingCart, Package, Clock } from "lucide-react";
import { useAdminAuth } from "@/lib/admin-auth";
import { dashboardStatsQuery } from "@/lib/queries";
import { formatPrice } from "@/lib/format";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user } = useAdminAuth();
  const { lang } = useI18n();
  const { data: stats, isLoading } = useQuery(dashboardStatsQuery());

  const statItems = [
    {
      icon: BarChart3,
      label: lang === "ar" ? "الإيرادات" : "Revenues",
      value: stats ? formatPrice(stats.revenue, lang) : "—",
      description: lang === "ar" ? "إجمالي الطلبات المسلمة" : "Total delivered orders",
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      icon: ShoppingCart,
      label: lang === "ar" ? "الطلبات" : "Orders",
      value: stats?.orders.toString() ?? "—",
      description: lang === "ar" ? "إجمالي الطلبات" : "Total orders",
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      icon: Package,
      label: lang === "ar" ? "المنتجات" : "Products",
      value: stats?.products.toString() ?? "—",
      description: lang === "ar" ? "إجمالي المنتجات" : "Total products",
      color: "text-yellow-600",
      bg: "bg-yellow-100",
    },
    {
      icon: Clock,
      label: lang === "ar" ? "الطلبات المعلقة" : "Pending orders",
      value: stats?.pendingOrders.toString() ?? "—",
      description: lang === "ar" ? "الطلبات التي لم تُعالج بعد" : "Pending orders",
      color: "text-red-600",
      bg: "bg-red-100",
    },
  ];

  // Prepare chart data
  const chartData =
    stats?.revenueByDay?.map((item) => ({
      name: item._id,
      revenue: item.revenue,
    })) ?? [];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-olive-dark">
          {lang === "ar" ? "لوحة التحكم" : "Tableau de bord"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {lang === "ar"
            ? `مرحبًا، ${user?.fullName}. هذه نظرة عامة على متجرك.`
            : `Bienvenue, ${user?.fullName}. Voici un aperçu de votre boutique.`}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-card p-5 shadow-soft"
          >
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}
            >
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-foreground">{isLoading ? "..." : stat.value}</p>
            <p className="text-sm font-medium text-foreground/80">{stat.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      {chartData.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="mb-4 font-semibold">
            {lang === "ar" ? "الإيرادات على مدار الوقت" : "Revenus au fil du temps"}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatPrice(Number(value), lang)} />
                <Bar dataKey="revenue" fill="#8BC34A" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
