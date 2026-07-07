import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, ResponsiveContainer, Tooltip as RTooltip,
} from "recharts";
import { ShoppingCart, Package, Users, DollarSign, Home, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/i18n";
import { formatPrice, productName } from "@/lib/format";
import { firstImage } from "@/lib/images";
import { ORDER_STATUSES, type Order, type OrderStatus, type Product } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/admin")({
  component: Admin,
});

const STATUS_KEY = {
  pending: "status_pending", confirmed: "status_confirmed", preparing: "status_preparing",
  shipped: "status_shipped", delivered: "status_delivered", cancelled: "status_cancelled",
} as const;

function Admin() {
  const { isAdmin, loading } = useAuth();
  const { t, lang, dir } = useI18n();
  const qc = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Order[];
    },
  });
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Product[];
    },
  });
  const { count: customerCount = 0 } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      return { count: count ?? 0 };
    },
    select: (d) => d,
  }).data ?? { count: 0 };

  const revenue = useMemo(
    () => orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0),
    [orders],
  );

  const chartData = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days[d.toISOString().slice(5, 10)] = 0;
    }
    orders.forEach((o) => {
      const k = o.created_at.slice(5, 10);
      if (k in days && o.status !== "cancelled") days[k] += Number(o.total);
    });
    return Object.entries(days).map(([date, total]) => ({ date, total }));
  }, [orders]);

  const updateStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error("Erreur");
    toast.success("OK");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">{t("loading")}</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-4 text-center">
        <h1 className="font-display text-2xl font-bold">
          {lang === "ar" ? "الوصول محظور" : "Accès réservé aux administrateurs"}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {lang === "ar"
            ? "هذا الحساب ليس لديه صلاحيات المدير."
            : "Ce compte n'a pas les droits d'administration."}
        </p>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/"><ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("back_home")}</Link>
        </Button>
      </div>
    );
  }

  const stats = [
    { icon: DollarSign, label: t("revenue"), value: formatPrice(revenue, lang) },
    { icon: ShoppingCart, label: t("orders_count"), value: String(orders.length) },
    { icon: Package, label: t("products_count"), value: String(products.length) },
    { icon: Users, label: t("customers_count"), value: String(customerCount) },
  ];

  return (
    <div dir={dir} className="min-h-screen bg-cream">
      <header className="border-b border-border bg-card">
        <div className="container-page flex items-center justify-between py-4">
          <h1 className="font-display text-xl font-bold text-olive-dark">{t("admin_dashboard")}</h1>
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link to="/"><Home className="h-4 w-4" /> {t("nav_home")}</Link>
          </Button>
        </div>
      </header>

      <div className="container-page py-8">
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="dashboard">
          <TabsList className="mb-6 flex-wrap rounded-full bg-muted">
            <TabsTrigger value="dashboard" className="rounded-full">{t("admin_dashboard")}</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-full">{t("admin_orders")}</TabsTrigger>
            <TabsTrigger value="products" className="rounded-full">{t("admin_products")}</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 font-display text-lg font-semibold">{t("sales_chart")}</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                  <RTooltip formatter={(v: number) => formatPrice(v, lang)} />
                  <Bar dataKey="total" fill="var(--olive)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>{t("customer")}</TableHead>
                    <TableHead>{t("phone")}</TableHead>
                    <TableHead>{t("total")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.order_number}</TableCell>
                      <TableCell>{o.customer_name}<br /><span className="text-xs text-muted-foreground">{o.wilaya}</span></TableCell>
                      <TableCell dir="ltr">{o.phone}</TableCell>
                      <TableCell className="font-semibold">{formatPrice(o.total, lang)}</TableCell>
                      <TableCell>
                        <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as OrderStatus)}>
                          <SelectTrigger className="h-8 w-36 rounded-full text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUSES.map((st) => (
                              <SelectItem key={st} value={st}>{t(STATUS_KEY[st])}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("price")}</TableHead>
                    <TableHead>{t("stock")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="flex items-center gap-3">
                        <img src={firstImage(p.images)} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        <span className="font-medium">{productName(p, lang)}</span>
                      </TableCell>
                      <TableCell>{formatPrice(p.price, lang)}</TableCell>
                      <TableCell>{p.stock}</TableCell>
                      <TableCell>
                        <span className={p.active ? "text-primary" : "text-muted-foreground"}>
                          {p.active ? "●" : "○"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {lang === "ar"
                ? "إدارة كاملة للمنتجات (إضافة/تعديل/حذف) في التحديث القادم."
                : "Gestion complète des produits (ajout/édition) à venir."}
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
