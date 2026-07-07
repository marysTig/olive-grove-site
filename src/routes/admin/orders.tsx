import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAdminAuth } from "@/lib/admin-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";
import { ORDER_STATUSES } from "@/lib/types";
import { Package, Search, ShoppingCart, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

interface AdminOrder extends Order {
  items: OrderItem[];
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  preparing: "Préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const STATUS_VARIANTS: Record<OrderStatus, "secondary" | "outline" | "default" | "destructive"> = {
  pending: "secondary",
  confirmed: "default",
  preparing: "outline",
  shipped: "outline",
  delivered: "default",
  cancelled: "destructive",
};

function AdminOrders() {
  const { hasPermission } = useAdminAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasPermission("manage_orders")) {
      navigate({ to: "/admin/unauthorized" });
      return;
    }

    void fetchOrders();
  }, [hasPermission, navigate]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      if (!matchesStatus) return false;

      if (!query) return true;

      const haystack = [
        order.customer_name,
        order.phone,
        order.wilaya,
        order.address,
        String(order.order_number),
        order.coupon_code ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [orders, search, statusFilter]);

  const stats = useMemo(() => {
    const totals = {
      all: orders.length,
      pending: orders.filter((order) => order.status === "pending").length,
      shipped: orders.filter((order) => order.status === "shipped").length,
      delivered: orders.filter((order) => order.status === "delivered").length,
    };

    return totals;
  }, [orders]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const orderIds = (ordersData ?? []).map((order) => order.id);
      let itemsData: Array<Partial<OrderItem>> = [];

      if (orderIds.length > 0) {
        const { data, error: itemsError } = await supabase
          .from("order_items")
          .select("*")
          .in("order_id", orderIds);

        if (itemsError) throw itemsError;
        itemsData = data ?? [];
      }

      const itemsByOrder = itemsData.reduce<Record<string, OrderItem[]>>((acc, item) => {
        const orderId = item.order_id as string | undefined;
        if (!orderId) return acc;
        if (!acc[orderId]) acc[orderId] = [];
        acc[orderId].push(item as OrderItem);
        return acc;
      }, {});

      const nextOrders: AdminOrder[] = (ordersData ?? []).map((order) => ({
        ...(order as Order),
        items: itemsByOrder[order.id] ?? [],
      }));

      setOrders(nextOrders);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les commandes pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (error) throw error;

      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status } : order))
      );
      toast.success("Statut mis à jour.");
    } catch (error) {
      console.error(error);
      toast.error("La mise à jour du statut a échoué.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-olive-dark">
          Gestion des commandes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consultez, filtrez et mettez à jour les commandes reçues par votre boutique.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total" value={stats.all} icon={ShoppingCart} />
        <StatCard title="En attente" value={stats.pending} icon={Package} />
        <StatCard title="Expédiées" value={stats.shipped} icon={Truck} />
        <StatCard title="Livrées" value={stats.delivered} icon={Package} />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Commandes</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {filteredOrders.length} commande(s) visible(s)
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher…"
                className="w-full pl-9 sm:w-56"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | OrderStatus)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
              Chargement des commandes…
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
              Aucune commande ne correspond à votre recherche.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">Commande #{order.order_number}</p>
                        <Badge variant={STATUS_VARIANTS[order.status]}>{STATUS_LABELS[order.status]}</Badge>
                      </div>
                      <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                        <p>
                          <span className="font-medium text-foreground">Client :</span> {order.customer_name}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Téléphone :</span> {order.phone}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Wilaya :</span> {order.wilaya}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Date :</span>{" "}
                          {new Date(order.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Adresse :</span> {order.address}
                      </p>
                    </div>

                    <div className="space-y-3 lg:min-w-60">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-lg font-semibold">{formatPrice(order.total, "fr")}</p>
                      </div>
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateStatus(order.id, value as OrderStatus)}
                        disabled={updatingId === order.id}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {STATUS_LABELS[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {order.items.length > 0 && (
                    <div className="mt-4 rounded-xl border border-border/70 bg-muted/20 p-4">
                      <p className="mb-3 text-sm font-semibold">Articles</p>
                      <div className="space-y-2 text-sm">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3">
                            <span>{item.name_fr}</span>
                            <span className="text-muted-foreground">
                              {item.quantity} × {formatPrice(item.price, "fr")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string; value: number; icon: typeof ShoppingCart }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
