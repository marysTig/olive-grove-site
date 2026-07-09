import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAdminAuth } from "@/lib/admin-auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiBaseUrl } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { Product, Order, Review } from "@/lib/types";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Package, ShoppingCart, AlertCircle, Star, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});

interface AnalyticsProduct extends Product {
  total_sold: number;
  total_revenue: number;
}

interface AnalyticsData {
  ordersByStatus: Record<string, number>;
  averageOrderValue: number;
  revenueByMonth: Record<string, number>;
  revenueByYear: Record<string, number>;
  dailySales: Record<string, number>;
  monthlySales: Record<string, number>;
  yearlySales: Record<string, number>;
  topSellingProducts: AnalyticsProduct[];
  worstSellingProducts: AnalyticsProduct[];
  allSellingProducts: AnalyticsProduct[];
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
  newestProducts: Product[];
  latestOrders: Order[];
  recentReviews: Review[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];
const STATUS_COLORS: Record<string, string> = {
  pending: "#facc15",
  confirmed: "#22c55e",
  preparing: "#3b82f6",
  shipped: "#06b6d4",
  delivered: "#16a34a",
  cancelled: "#ef4444",
};

function AdminAnalytics() {
  const { hasPermission } = useAdminAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasPermission("view_dashboard")) {
      navigate({ to: "/admin/unauthorized" });
      return;
    }

    void fetchAnalytics();
  }, [hasPermission, navigate]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/dashboard/analytics`, {
        credentials: "include",
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || "Unable to load analytics");
      }

      setAnalytics(json.data);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les analyses pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyChartData = () => {
    if (!analytics) return [];
    return Object.entries(analytics.revenueByMonth).map(([month, revenue]) => ({
      name: month,
      revenue,
    })).sort((a, b) => a.name.localeCompare(b.name));
  };

  const getOrdersByStatusChartData = () => {
    if (!analytics) return [];
    return Object.entries(analytics.ordersByStatus).map(([status, count]) => ({
      name: status,
      value: count,
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-olive-dark">Tableau de bord analytique</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visualisez les performances de votre boutique en détail.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
          Chargement des analyses…
        </div>
      ) : !analytics ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
          Impossible de charger les analyses.
        </div>
      ) : (
        <>
          {/* Key Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Valeur moyenne de commande"
              value={formatPrice(analytics.averageOrderValue, "fr")}
              icon={ShoppingCart}
              trend="neutral"
            />
            <StatCard
              title="Produits en rupture"
              value={analytics.outOfStockProducts.length}
              icon={AlertCircle}
              trend={analytics.outOfStockProducts.length > 0 ? "down" : "neutral"}
            />
            <StatCard
              title="Produits à faible stock"
              value={analytics.lowStockProducts.length}
              icon={Package}
              trend={analytics.lowStockProducts.length > 5 ? "down" : "neutral"}
            />
            <StatCard
              title="Dernières commandes"
              value={analytics.latestOrders.length}
              icon={Clock}
              trend="neutral"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue by Month Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenu par mois</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getMonthlyChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => formatPrice(value, "fr")}
                      contentStyle={{ borderRadius: "12px", border: "none" }}
                    />
                    <Bar dataKey="revenue" fill="#8BC34A" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Orders by Status Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Commandes par statut</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getOrdersByStatusChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getOrdersByStatusChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* All Selling Products (Most to Least) */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Classement des produits par ventes</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.allSellingProducts.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucun produit vendu</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.allSellingProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-olive-100 text-olive-dark font-bold">
                            {index + 1}
                          </span>
                          {product.images[0] && (
                            <img src={product.images[0]} alt={product.name_fr} className="h-12 w-12 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-medium">{product.name_fr}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.total_sold} vendus
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold">{formatPrice(product.total_revenue, "fr")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Low Stock Products */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Produits à faible stock</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.lowStockProducts.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Tous les produits ont un stock suffisant</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.lowStockProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-center gap-3">
                          {product.images[0] && (
                            <img src={product.images[0]} alt={product.name_fr} className="h-12 w-12 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-medium">{product.name_fr}</p>
                            <p className="text-sm text-amber-700">
                              Seulement {product.quantity} en stock
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                          Faible
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Out of Stock Products */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Produits en rupture</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.outOfStockProducts.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucun produit en rupture</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.outOfStockProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-3">
                          {product.images[0] && (
                            <img src={product.images[0]} alt={product.name_fr} className="h-12 w-12 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-medium">{product.name_fr}</p>
                            <p className="text-sm text-red-700">
                              En rupture de stock
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                          Rupture
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Derniers avis clients</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.recentReviews.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucun avis pour le moment</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.recentReviews.map((review) => (
                      <div key={review.id} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{review.customer_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Latest Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dernières commandes</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.latestOrders.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucune commande pour le moment</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.latestOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-medium">Commande #{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(order.total, "fr")}</p>
                          <Badge variant="outline" className="text-xs">
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  icon: any;
  trend: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${
          trend === "up" ? "bg-green-100 text-green-600" :
          trend === "down" ? "bg-red-100 text-red-600" :
          "bg-primary/10 text-primary"
        }`}>
          {trend === "up" ? <TrendingUp className="h-5 w-5" /> :
           trend === "down" ? <TrendingDown className="h-5 w-5" /> :
           <Icon className="h-5 w-5" />}
        </div>
      </CardContent>
    </Card>
  );
}
