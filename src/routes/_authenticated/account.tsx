import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/i18n";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/account")({
  component: Account,
});

const STATUS_KEY = {
  pending: "status_pending", confirmed: "status_confirmed", preparing: "status_preparing",
  shipped: "status_shipped", delivered: "status_delivered", cancelled: "status_cancelled",
} as const;

function Account() {
  const { user, signOut } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();

  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Order[];
    },
  });

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <StoreLayout>
      <div className="container-page min-h-[60vh] pt-28 pb-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">{t("account_title")}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" className="rounded-full" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> {t("nav_signout")}
          </Button>
        </div>

        <Tabs defaultValue="orders">
          <TabsList className="rounded-full bg-muted">
            <TabsTrigger value="orders" className="rounded-full">{t("my_orders")}</TabsTrigger>
          </TabsList>
          <TabsContent value="orders" className="pt-6">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                <Package className="h-10 w-10 opacity-50" />
                {t("no_orders")}
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-5">
                    <div>
                      <p className="font-semibold">#{o.order_number}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {t(STATUS_KEY[o.status])}
                    </span>
                    <span className="font-bold text-primary">{formatPrice(o.total, lang)}</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </StoreLayout>
  );
}
