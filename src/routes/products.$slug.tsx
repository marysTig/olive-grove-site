import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "motion/react";
import { Minus, Plus, Star, ShoppingBag, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";
import { useCart } from "@/lib/cart";
import { productQuery, productsQuery } from "@/lib/queries";
import { finalPrice } from "@/lib/types";
import { formatPrice, productName, productDesc } from "@/lib/format";
import { firstImage, resolveImage } from "@/lib/images";

export const Route = createFileRoute("/products/$slug")({
  component: ProductDetail,
});

function ProductDetail() {
  const { slug } = useParams({ from: "/products/$slug" });
  const { t, lang } = useI18n();
  const { add, setDrawerOpen } = useCart();
  const { data: product, isLoading } = useQuery(productQuery(slug));
  const { data: all = [] } = useQuery(productsQuery());
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="container-page grid gap-10 pt-28 pb-16 md:grid-cols-2">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (!product) {
    return (
      <StoreLayout>
        <div className="container-page py-40 text-center">
          <p className="text-muted-foreground">{t("no_products")}</p>
          <Button asChild variant="outline" className="mt-4 rounded-full">
            <Link to="/products">{t("nav_products")}</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  const price = finalPrice(product);
  const images = product.images.length ? product.images : ["asset:bottle-classic"];
  const related = all.filter((p) => p.category_id === product.category_id && p.id !== product.id).slice(0, 4);
  const outOfStock = product.stock <= 0;

  const handleAdd = () => {
    add(product, qty);
    toast.success(t("added_toast"));
    setDrawerOpen(true);
  };

  const benefits = lang === "ar"
    ? ["غني بمضادات الأكسدة", "يدعم صحة القلب", "طبيعي 100٪", "معصور على البارد"]
    : ["Riche en antioxydants", "Bon pour le cœur", "100% naturelle", "Extraite à froid"];

  return (
    <StoreLayout>
      <div className="container-page pt-24 pb-16">
        <Link to="/products" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("nav_products")}
        </Link>

        <div className="grid gap-10 md:grid-cols-2">
          {/* Gallery */}
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative aspect-square overflow-hidden rounded-3xl border border-border bg-cream"
            >
              <img
                src={resolveImage(images[activeImg])}
                alt={productName(product, lang)}
                width={800}
                height={800}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-125"
              />
            </motion.div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`h-20 w-20 overflow-hidden rounded-xl border-2 ${i === activeImg ? "border-primary" : "border-transparent"}`}
                  >
                    <img src={resolveImage(img)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.badge && (
              <span className="mb-3 inline-block rounded-full bg-olive-dark px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
                {product.badge}
              </span>
            )}
            <h1 className="font-display text-3xl font-bold sm:text-4xl">{productName(product, lang)}</h1>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex text-accent">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className={`h-4 w-4 ${s < Math.round(product.rating) ? "fill-accent" : ""}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{product.rating.toFixed(1)}</span>
            </div>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold text-primary">{formatPrice(price, lang)}</span>
              {product.discount_pct > 0 && (
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.price, lang)}</span>
              )}
            </div>

            <p className="mt-5 leading-relaxed text-muted-foreground">{productDesc(product, lang)}</p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              {product.volume_ml && <Spec label={t("volume")} value={`${product.volume_ml} ml`} />}
              {product.origin && <Spec label={t("origin")} value={product.origin} />}
              {product.harvest_date && <Spec label={t("harvest")} value={product.harvest_date} />}
            </div>

            <div className="mt-7 flex items-center gap-4">
              <div className="flex items-center rounded-full border border-border">
                <button className="p-3 text-muted-foreground hover:text-foreground" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-medium">{qty}</span>
                <button className="p-3 text-muted-foreground hover:text-foreground" onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}>
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button onClick={handleAdd} disabled={outOfStock} size="lg" className="flex-1 rounded-full">
                <ShoppingBag className="h-5 w-5" />
                {outOfStock ? t("out_of_stock") : t("add_to_cart")}
              </Button>
            </div>

            <Tabs defaultValue="benefits" className="mt-8">
              <TabsList className="w-full justify-start rounded-full bg-muted">
                <TabsTrigger value="benefits" className="rounded-full">{t("benefits")}</TabsTrigger>
                <TabsTrigger value="desc" className="rounded-full">{t("description")}</TabsTrigger>
              </TabsList>
              <TabsContent value="benefits" className="pt-4">
                <ul className="space-y-2">
                  {benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary" /> {b}
                    </li>
                  ))}
                </ul>
              </TabsContent>
              <TabsContent value="desc" className="pt-4 text-sm leading-relaxed text-muted-foreground">
                {productDesc(product, lang)}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="mb-8 font-display text-2xl font-bold">{t("related_title")}</h2>
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted px-4 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
