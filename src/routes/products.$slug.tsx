import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "motion/react";
import { Minus, Plus, ShoppingBag, ArrowLeft, Check, Send, User, Star } from "lucide-react";
import { toast } from "sonner";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n";
import { useCart } from "@/lib/cart";
import { productQuery, productsQuery, reviewsByProductQuery } from "@/lib/queries";
import { finalPrice, type ProductStatus, type Review } from "@/lib/types";
import { formatPrice, productName, productDesc } from "@/lib/format";
import { firstImage, resolveImage } from "@/lib/images";
import { format } from "date-fns";
import { fr, ar } from "date-fns/locale";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

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

export const Route = createFileRoute("/products/$slug")({
  component: ProductDetail,
});

function ProductDetail() {
  const { slug } = useParams({ from: "/products/$slug" });
  const { t, lang } = useI18n();
  const { add, setDrawerOpen } = useCart();
  const { data: product, isLoading, isError, error } = useQuery(productQuery(slug));
  const { data: all = [] } = useQuery(productsQuery());
  const { data: reviews = [] } = useQuery(reviewsByProductQuery(slug));
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [reviewForm, setReviewForm] = useState({
    customerName: "",
    customerEmail: "",
    rating: 5,
    comment: "",
  });
  const queryClient = useQueryClient();

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: typeof reviewForm) => {
      const response = await fetch(`${getApiBaseUrl()}/products/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(reviewData),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.message || "Unable to add review");
      return json.data as Review;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "product", slug] });
      setReviewForm({ customerName: "", customerEmail: "", rating: 5, comment: "" });
      toast.success(lang === "ar" ? "تم إضافة التقييم بنجاح!" : "Review added successfully!");
    },
    onError: (err) => {
      toast.error((err as Error).message);
    },
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.customerName || !reviewForm.customerEmail || !reviewForm.comment) return;
    createReviewMutation.mutate(reviewForm);
  };

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

  if (isError) {
    return (
      <StoreLayout>
        <div className="container-page py-40 text-center space-y-4">
          <p className="text-destructive font-medium">
            {lang === "ar"
              ? "عذرًا، حدث خطأ أثناء تحميل المنتج."
              : "Une erreur est survenue lors du chargement du produit."}
          </p>
          <p className="text-xs text-muted-foreground">{error?.message}</p>
          <Button asChild variant="outline" className="mt-4 rounded-full">
            <Link to="/products">{t("nav_products")}</Link>
          </Button>
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
  const images = product?.images?.length ? product.images : ["asset:bottle-classic"];
  const related = all
    .filter((p) => p && product && p.category_id === product.category_id && p.id !== product.id)
    .slice(0, 4);
  const outOfStock = product.status === "out_of_stock";

  const handleAdd = () => {
    add(product, qty);
    toast.success(t("added_toast"));
    setDrawerOpen(true);
  };

  const benefits =
    lang === "ar"
      ? ["غني بمضادات الأكسدة", "يدعم صحة القلب", "طبيعي 100٪", "معصور على البارد"]
      : ["Riche en antioxydants", "Bon pour le cœur", "100% naturelle", "Extraite à froid"];

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
    <StoreLayout>
      <div className="container-page pt-24 pb-16">
        <Link
          to="/products"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
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
            <div className="flex items-center gap-3 mb-2">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold uppercase",
                  getStatusColor(product.status),
                )}
              >
                {getStatusText(product.status, lang)}
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">
              {productName(product, lang)}
            </h1>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold text-primary">
                {formatPrice(price, lang)}
              </span>
              {product.discount_pct > 0 && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.price, lang)}
                </span>
              )}
            </div>

            <p className="mt-5 leading-relaxed text-muted-foreground">
              {productDesc(product, lang)}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              {product.volume_ml && <Spec label={t("volume")} value={`${product.volume_ml} ml`} />}
              {product.origin && <Spec label={t("origin")} value={product.origin} />}
              {harvestDate && <Spec label={t("harvest")} value={harvestDate} />}
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              {product.status === "out_of_stock" ? (
                <span className="font-medium text-destructive">{t("out_of_stock")}</span>
              ) : product.quantity <= 20 ? (
                <span>
                  {lang === "ar"
                    ? `فقط ${product.quantity} في المخزون`
                    : `Only ${product.quantity} left`}
                </span>
              ) : (
                <span>
                  {lang === "ar" ? `متوفر: ${product.quantity}` : `Available: ${product.quantity}`}
                </span>
              )}
            </div>

            <div className="mt-7 flex items-center gap-4">
              <div className="flex items-center rounded-full border border-border">
                <button
                  className="p-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-medium">{qty}</span>
                <button
                  className="p-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setQty((q) => Math.min(product.quantity || 99, q + 1))}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button
                onClick={handleAdd}
                disabled={outOfStock}
                size="lg"
                className="flex-1 rounded-full"
              >
                <ShoppingBag className="h-5 w-5" />
                {outOfStock ? t("out_of_stock") : t("add_to_cart")}
              </Button>
            </div>

            <Tabs defaultValue="benefits" className="mt-8">
              <TabsList className="w-full justify-start rounded-full bg-muted">
                <TabsTrigger value="benefits" className="rounded-full">
                  {t("benefits")}
                </TabsTrigger>
                <TabsTrigger value="desc" className="rounded-full">
                  {t("description")}
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-full">
                  {lang === "ar" ? "التقييمات" : "Reviews"} ({reviews.length})
                </TabsTrigger>
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
              <TabsContent
                value="desc"
                className="pt-4 text-sm leading-relaxed text-muted-foreground"
              >
                {productDesc(product, lang)}
              </TabsContent>
              <TabsContent value="reviews" className="pt-4 space-y-6">
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <h3 className="font-semibold">
                    {lang === "ar" ? "أضف تقييمًا" : "Add a Review"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      placeholder={lang === "ar" ? "اسمك" : "Your Name"}
                      value={reviewForm.customerName}
                      onChange={(e) =>
                        setReviewForm({ ...reviewForm, customerName: e.target.value })
                      }
                      required
                    />
                    <Input
                      type="email"
                      placeholder={lang === "ar" ? "البريد الإلكتروني" : "Your Email"}
                      value={reviewForm.customerEmail}
                      onChange={(e) =>
                        setReviewForm({ ...reviewForm, customerEmail: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {lang === "ar" ? "التقييم" : "Rating"}
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className="text-2xl transition-transform hover:scale-110"
                        >
                          {star <= reviewForm.rating ? "⭐" : "☆"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    placeholder={
                      lang === "ar" ? "اكتب تعليقك هنا..." : "Write your comment here..."
                    }
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    rows={3}
                    required
                  />
                  <Button type="submit" className="rounded-full">
                    <Send className="h-4 w-4 mr-2" />
                    {lang === "ar" ? "إرسال التقييم" : "Submit Review"}
                  </Button>
                </form>

                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      {lang === "ar"
                        ? "لا توجد تقييمات بعد. كن أول من يقيم هذا المنتج!"
                        : "No reviews yet. Be the first to review this product!"}
                    </p>
                  ) : (
                    reviews.map((review) => (
                      <div
                        key={review.id}
                        className="p-4 rounded-2xl border border-border bg-muted/50"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{review.customerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(review.createdAt), "MMM d, yyyy", {
                                locale: lang === "ar" ? ar : fr,
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-0.5 mb-2">
                          {Array.from({ length: review.rating || 5 }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="mb-8 font-display text-2xl font-bold">{t("related_title")}</h2>
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
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
