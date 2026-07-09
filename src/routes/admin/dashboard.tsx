import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, ShoppingCart, Package, Clock, Calendar } from "lucide-react";
import { useAdminAuth } from "@/lib/admin-auth";
import { dashboardStatsQuery } from "@/lib/queries";
import { formatPrice } from "@/lib/format";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useI18n } from "@/i18n";
import { useState } from "react";

const COLORS = [
  "#8BC34A", "#2196F3", "#FF9800", "#F44336", "#9C27B0", "#00BCD4", "#FFC107", "#E91E63", "#3F51B5", "#009688", "#4CAF50", "#795548", "#607D8B"
];

const DATE_PRESETS = [
  { label: "Auj.", labelAr: "اليوم",  days: 1   },
  { label: "7j",   labelAr: "٧ أيام", days: 7   },
  { label: "30j",  labelAr: "٣٠ يوم", days: 30  },
  { label: "90j",  labelAr: "٩٠ يوم", days: 90  },
  { label: "365j", labelAr: "سنة",    days: 365 },
  { label: "Tout", labelAr: "الكل",   days: 0   },
];

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user } = useAdminAuth();
  const { lang } = useI18n();
  const [selectedDays, setSelectedDays] = useState(30);
  const { data: stats, isLoading } = useQuery(dashboardStatsQuery(selectedDays));

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
    stats?.revenueByDay?.map((item) => {
      const { _id, ...rest } = item;
      return {
        name: _id,
        ...rest,
      };
    }) ?? [];
  const productNames = stats?.productNames ?? [];

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
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        {/* Chart header with title + date filter */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">
              {lang === "ar" ? "الإيرادات على مدار الوقت" : "Revenus au fil du temps"}
            </h3>
          </div>

          {/* Date preset pill buttons */}
          <div className="flex flex-wrap gap-1.5">
            {DATE_PRESETS.map((preset) => {
              const active = selectedDays === preset.days;
              return (
                <button
                  key={preset.days}
                  onClick={() => setSelectedDays(preset.days)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 border ${
                    active
                      ? "bg-olive-dark text-white border-olive-dark shadow-sm scale-105"
                      : "bg-transparent text-muted-foreground border-border hover:border-olive-dark hover:text-olive-dark"
                  }`}
                >
                  {lang === "ar" ? preset.labelAr : preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart body */}
        {isLoading ? (
          <div className="flex h-80 items-center justify-center text-sm text-muted-foreground animate-pulse">
            {lang === "ar" ? "جارٍ التحميل…" : "Chargement…"}
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
            {lang === "ar"
              ? "لا توجد بيانات للفترة المحددة"
              : "Aucune donnée pour la période sélectionnée"}
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value, name) => [formatPrice(Number(value), lang), name]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                {productNames.map((productName, index) => (
                  <Bar
                    key={productName}
                    dataKey={productName}
                    fill={COLORS[index % COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
