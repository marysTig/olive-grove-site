import { Link } from "@tanstack/react-router";
import { ShoppingBag, Star } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { Product } from "@/lib/types";
import { finalPrice } from "@/lib/types";
import { useI18n } from "@/i18n";
import { useCart } from "@/lib/cart";
import { formatPrice, productName } from "@/lib/format";
import { firstImage } from "@/lib/images";
import { cn } from "@/lib/utils";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { t, lang } = useI18n();
  const { add, setDrawerOpen } = useCart();
  const price = finalPrice(product);
  const outOfStock = product.stock <= 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (outOfStock) return;
    add(product);
    toast.success(t("added_toast"));
    setDrawerOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.08 }}
    >
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="group block overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
      >
        <div className="relative aspect-square overflow-hidden bg-cream">
          <img
            src={firstImage(product.images)}
            alt={productName(product, lang)}
            loading="lazy"
            width={512}
            height={512}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute start-3 top-3 flex flex-col gap-1.5">
            {product.badge && (
              <span className="rounded-full bg-olive-dark px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
                {product.badge}
              </span>
            )}
            {product.discount_pct > 0 && (
              <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
                -{product.discount_pct}%
              </span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className={cn(
              "absolute bottom-3 end-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-gold transition-all duration-300 hover:bg-olive-dark",
              "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100",
              outOfStock && "cursor-not-allowed opacity-40",
            )}
            aria-label={t("quick_add")}
          >
            <ShoppingBag className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-1 flex items-center gap-1 text-accent-foreground">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
            {product.volume_ml && (
              <span className="ms-auto text-xs text-muted-foreground">{product.volume_ml} ml</span>
            )}
          </div>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-foreground">
            {productName(product, lang)}
          </h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-bold text-primary">{formatPrice(price, lang)}</span>
            {product.discount_pct > 0 && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.price, lang)}
              </span>
            )}
          </div>
          {outOfStock && (
            <p className="mt-1 text-xs font-medium text-destructive">{t("out_of_stock")}</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
