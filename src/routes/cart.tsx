import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/i18n";
import { formatPrice, productName } from "@/lib/format";
import { resolveImage } from "@/lib/images";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, remove, setQty } = useCart();
  const { t, lang } = useI18n();

  return (
    <StoreLayout>
      <div className="container-page min-h-[60vh] pt-28 pb-16">
        <h1 className="mb-8 font-display text-3xl font-bold sm:text-4xl">{t("cart_title")}</h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">{t("cart_empty")}</p>
            <Button asChild className="rounded-full">
              <Link to="/products">{t("cart_continue")}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
                  <img src={resolveImage(item.image_url)} alt={productName(item, lang)} className="h-24 w-24 rounded-xl object-cover" width={96} height={96} />
                  <div className="flex flex-1 flex-col">
                    <p className="font-medium">{productName(item, lang)}</p>
                    <p className="text-sm text-accent-foreground/80">{formatPrice(item.price, lang)}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-border">
                        <button className="p-2 text-muted-foreground hover:text-foreground" onClick={() => setQty(item.id, item.quantity - 1)}><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button className="p-2 text-muted-foreground hover:text-foreground" onClick={() => setQty(item.id, item.quantity + 1)}><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <button className="text-muted-foreground hover:text-destructive" onClick={() => remove(item.id)}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="font-semibold">{formatPrice(item.price * item.quantity, lang)}</div>
                </div>
              ))}
            </div>

            <div className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
              <h2 className="mb-4 font-display text-xl font-semibold">{t("order_summary")}</h2>
              <div className="flex items-center justify-between border-t border-border py-3 text-lg font-bold">
                <span>{t("subtotal")}</span>
                <span>{formatPrice(subtotal, lang)}</span>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">{t("shipping")} {lang === "ar" ? "تحسب عند الدفع" : "calculée au paiement"}</p>
              <Button asChild size="lg" className="w-full rounded-full">
                <Link to="/checkout">{t("checkout")}</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
