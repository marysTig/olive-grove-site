import { Link } from "@tanstack/react-router";
import { Trash2, Minus, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/i18n";
import { formatPrice, productName } from "@/lib/format";
import { resolveImage } from "@/lib/images";

export function CartDrawer() {
  const { items, subtotal, drawerOpen, setDrawerOpen, remove, setQty } = useCart();
  const { t, lang, dir } = useI18n();

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent
        side={dir === "rtl" ? "left" : "right"}
        className="flex w-full flex-col sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">{t("cart_title")}</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <p className="text-muted-foreground">{t("cart_empty")}</p>
            <Button
              asChild
              variant="outline"
              className="rounded-full"
              onClick={() => setDrawerOpen(false)}
            >
              <Link to="/products">{t("cart_continue")}</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto py-2">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <img
                    src={resolveImage(item.image_url)}
                    alt={productName(item, lang)}
                    className="h-20 w-20 rounded-xl object-cover"
                    width={80}
                    height={80}
                  />
                  <div className="flex flex-1 flex-col">
                    <p className="text-sm font-medium leading-tight">{productName(item, lang)}</p>
                    <p className="text-sm text-accent-foreground/80">
                      {formatPrice(item.price, lang)}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-full border border-border">
                        <button
                          className="p-1.5 text-muted-foreground hover:text-foreground"
                          onClick={() => setQty(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <button
                          className="p-1.5 text-muted-foreground hover:text-foreground"
                          onClick={() => setQty(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => remove(item.id)}
                        aria-label={t("remove")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <SheetFooter className="border-t border-border pt-4">
              <div className="mb-3 flex items-center justify-between text-base font-semibold">
                <span>{t("subtotal")}</span>
                <span>{formatPrice(subtotal, lang)}</span>
              </div>
              <div className="grid gap-2">
                <Button
                  asChild
                  className="w-full rounded-full"
                  onClick={() => setDrawerOpen(false)}
                >
                  <Link to="/checkout">{t("checkout")}</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="w-full rounded-full"
                  onClick={() => setDrawerOpen(false)}
                >
                  <Link to="/cart">{t("cart_title")}</Link>
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
