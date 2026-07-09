import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { Product, ProductStatus } from "@/lib/types";
import { finalPrice } from "@/lib/types";
import { useI18n } from "@/i18n";
import { useCart } from "@/lib/cart";
import { formatPrice, productName } from "@/lib/format";
import { firstImage } from "@/lib/images";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr, ar } from "date-fns/locale";

function getStatusColor(status: ProductStatus) {
  switch (status) {
    case "in_stock":
      return "bg-green-100 text-green-800";
    case "low_stock":
      return "bg-yellow-100 text-yellow-800";
    case "out_of_stock":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusText(status: ProductStatus, lang: string) {
  switch (status) {
    case "in_stock":
      return lang === "ar" ? "متوفر" : "In Stock";
    case "low_stock":
      return lang === "ar" ? "قليل في المخزون" : "Low Stock";
    case "out_of_stock":
      return lang === "ar" ? "نفد المخزون" : "Out of Stock";
    default:
      return "";
  }
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { t, lang } = useI18n();
  const { add, setDrawerOpen } = useCart();
  const price = finalPrice(product);
  const outOfStock = product.status === "out_of_stock";

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (outOfStock) return;
    add(product);
    toast.success(t("added_toast"));
    setDrawerOpen(true);
  };

  const formatHarvestDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      const locale = lang === "ar" ? ar : fr;
      return format(date, "MMMM yyyy", { locale });
    } catch {
      return null;
    }
  };

  const harvestDate = formatHarvestDate(product.harvest_date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.08 }}
    >
      <Link
        to="/product/$slug"
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
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                getStatusColor(product.status),
              )}
            >
              {getStatusText(product.status, lang)}
            </span>
            {product.volume_ml && (
              <span className="ms-auto text-xs text-muted-foreground">{product.volume_ml} ml</span>
            )}
          </div>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-foreground">
            {productName(product, lang)}
          </h3>

          {harvestDate && (
            <p className="mt-1 text-xs text-muted-foreground">
              {lang === "ar" ? "تاريخ الحصاد:" : "Harvest Date:"} {harvestDate}
            </p>
          )}

          <div className="mt-2 flex items-baseline gap-2 flex-grow">
            <span className="text-base font-bold text-primary">{formatPrice(price, lang)}</span>
            {product.discount_pct > 0 && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.price, lang)}
              </span>
            )}
          </div>

          <div className="mt-4">
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all duration-300",
                outOfStock 
                  ? "bg-muted text-muted-foreground cursor-not-allowed" 
                  : "bg-primary text-primary-foreground hover:bg-olive-dark shadow-sm hover:shadow-md"
              )}
            >
              <ShoppingBag className="h-4 w-4" />
              {outOfStock ? t("out_of_stock") : (lang === "ar" ? "شراء الآن" : "Acheter")}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
