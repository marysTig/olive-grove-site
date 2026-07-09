import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAdminAuth } from "@/lib/admin-auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiBaseUrl } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { Order, OrderItem, OrderStatus, Product } from "@/lib/types";
import { ORDER_STATUSES } from "@/lib/types";
import { Package, Search, ShoppingCart, Truck, Image as ImageIcon, Trash2 } from "lucide-react";
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
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const STATUS_STYLES: Record<
  OrderStatus,
  {
    bg: string;
    text: string;
    border: string;
  }
> = {
  pending: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  confirmed: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  shipped: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  delivered: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  cancelled: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
};

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300 ${style.bg} ${style.text} ${style.border} hover:scale-105`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function AdminOrders() {
  const { hasPermission } = useAdminAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasPermission("manage_orders")) {
      navigate({ to: "/admin/unauthorized" });
      return;
    }

    void Promise.all([fetchOrders(), fetchProducts()]);
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
    try {
      const response = await fetch(`${getApiBaseUrl()}/orders`, {
        credentials: "include",
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || "Unable to load orders");
      }

      const nextOrders: AdminOrder[] = (json?.data ?? []).map((order: Order) => ({
        ...order,
        items: Array.isArray((order as Order & { items?: OrderItem[] }).items)
          ? ((order as Order & { items?: OrderItem[] }).items ?? [])
          : [],
      }));

      setOrders(nextOrders);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les commandes pour le moment.");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/products`, {
        credentials: "include",
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || "Unable to load products");
      }

      setProducts(Array.isArray(json.data) ? json.data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getProductById = (productId: string | null) => {
    if (!productId) return null;
    return products.find((p) => p.id === productId);
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const response = await fetch(`${getApiBaseUrl()}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || "Unable to update order status");
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...json.data, items: order.items } : order,
        ),
      );
      toast.success("Statut mis à jour.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "La mise à jour du statut a échoué.");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm("Supprimer cette commande ?")) return;
    try {
      const response = await fetch(`${getApiBaseUrl()}/orders/${orderId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const json = await response.json();
        throw new Error(json?.message || "Unable to delete order");
      }
      setOrders((current) => current.filter((order) => order.id !== orderId));
      toast.success("Commande supprimée.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Échec de la suppression de la commande.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-olive-dark">Gestion des commandes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consultez, filtrez et mettez à jour les commandes reçues par votre boutique.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total" value={stats.all} icon={ShoppingCart} color="text-olive-dark" bg="bg-olive-100" />
        <StatCard title="En attente" value={stats.pending} icon={Package} color="text-orange-600" bg="bg-orange-100" />
        <StatCard title="Expédiées" value={stats.shipped} icon={Truck} color="text-blue-600" bg="bg-blue-100" />
        <StatCard title="Livrées" value={stats.delivered} icon={Package} color="text-green-600" bg="bg-green-100" />
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
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as "all" | OrderStatus)}
            >
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
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                        <p>
                          <span className="font-medium text-foreground">Client :</span>{" "}
                          {order.customer_name}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Téléphone :</span>{" "}
                          {order.phone}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Wilaya :</span>{" "}
                          {order.wilaya}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Date :</span>{" "}
                          {new Date(order.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Adresse :</span>{" "}
                        {order.address}
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
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </button>
                    </div>
                  </div>

                  {order.items.length > 0 && (
                    <div className="mt-4 rounded-xl border border-border/70 bg-muted/20 p-4">
                      <p className="mb-3 text-sm font-semibold">Produits</p>
                      <div className="space-y-3">
                        {order.items.map((item) => {
                          const product = getProductById(item.product_id);
                          const subtotal = item.quantity * item.price;
                          return (
                            <div key={item.product_id || Math.random().toString()} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 bg-white/50 rounded-lg border border-border/50">
                              <div className="flex-shrink-0">
                                {item.image_url ? (
                                  <img
                                    src={item.image_url}
                                    alt={item.name_fr}
                                    className="h-16 w-16 object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <ImageIcon className="h-6 w-6 text-primary/60" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-grow">
                                <p className="font-semibold text-foreground">{item.name_fr}</p>
                                <p className="text-xs text-muted-foreground">
                                  ID produit: {item.product_id}
                                </p>
                                <div className="flex flex-wrap gap-4 mt-2 text-sm">
                                  <span>
                                    Quantité: <span className="font-medium">{item.quantity}</span>
                                  </span>
                                  <span>
                                    Prix unitaire:{" "}
                                    <span className="font-medium">
                                      {formatPrice(item.price, "fr")}
                                    </span>
                                  </span>
                                  <span>
                                    Sous-total:{" "}
                                    <span className="font-semibold">
                                      {formatPrice(subtotal, "fr")}
                                    </span>
                                  </span>
                                  {product && (
                                    <span className="text-muted-foreground">
                                      Stock disponible: <span className="font-medium">{product.quantity}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
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

interface StatCardProps {
  title: string;
  value: number;
  icon: typeof ShoppingCart;
  color: string;
  bg: string;
}

function StatCard({ title, value, icon: Icon, color, bg }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        <div className={`rounded-full ${bg} p-3 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
