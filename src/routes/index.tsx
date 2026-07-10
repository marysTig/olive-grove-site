import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import {
  Leaf,
  Hand,
  Snowflake,
  Package,
  HeartPulse,
  BadgeCheck,
  ShieldCheck,
  Truck,
  Sprout,
  CreditCard,
  Star,
  ArrowRight,
} from "lucide-react";
import type { GalleryItem } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { ProductCard } from "@/components/ProductCard";
import { useI18n } from "@/i18n";
import { galleryQuery, productsQuery, publicReviewsQuery } from "@/lib/queries";
import {
  heroGrove,
  galleryHarvest,
  galleryPressing,
  galleryLifestyle,
  aboutFamily,
} from "@/lib/images";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { t, lang } = useI18n();
  const { data: products = [], isLoading, isError, error } = useQuery(productsQuery());
  const { data: gallery = [] } = useQuery(galleryQuery());
  const { data: publicReviews = [], isLoading: isLoadingReviews } = useQuery(publicReviewsQuery());

  const defaultGallery: GalleryItem[] = [
    {
      id: "static-1",
      title: "Harvest",
      description: "",
      imageUrl: galleryHarvest,
      imagePublicId: "static-1",
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "static-2",
      title: "Pressing",
      description: "",
      imageUrl: galleryPressing,
      imagePublicId: "static-2",
      order: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "static-3",
      title: "Lifestyle",
      description: "",
      imageUrl: galleryLifestyle,
      imagePublicId: "static-3",
      order: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const displayGallery = gallery.length > 0 ? gallery : defaultGallery;

  const featured = products.filter((p) => p && p.active !== false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 160]);

  const trust = [
    { icon: Leaf, label: t("trust_natural") },
    { icon: Snowflake, label: t("trust_cold") },
    { icon: BadgeCheck, label: t("trust_made") },
    { icon: Sprout, label: t("trust_additives") },
    { icon: Truck, label: t("trust_delivery") },
    { icon: CreditCard, label: t("trust_secure") },
  ];

  const why = [
    { icon: Hand, t: t("why_1_t"), d: t("why_1_d") },
    { icon: Leaf, t: t("why_2_t"), d: t("why_2_d") },
    { icon: Snowflake, t: t("why_3_t"), d: t("why_3_d") },
    { icon: Package, t: t("why_4_t"), d: t("why_4_d") },
    { icon: HeartPulse, t: t("why_5_t"), d: t("why_5_d") },
    { icon: ShieldCheck, t: t("why_6_t"), d: t("why_6_d") },
  ];

  const process = [
    t("process_1"),
    t("process_2"),
    t("process_3"),
    t("process_4"),
    t("process_5"),
    t("process_6"),
  ];



  const faqs =
    lang === "ar"
      ? [
          {
            q: "هل الزيت طبيعي 100٪؟",
            a: "نعم، زيتنا بكر ممتاز، معصور على البارد وبدون أي إضافات.",
          },
          { q: "كم تستغرق مدة التوصيل؟", a: "عادة من 2 إلى 5 أيام عمل عبر كامل التراب الوطني." },
          { q: "ما هي طرق الدفع؟", a: "الدفع عند الاستلام متاح حاليًا في جميع أنحاء الجزائر." },
          { q: "كيف أحفظ الزيت؟", a: "في مكان بارد وبعيد عن الضوء للحفاظ على جودته." },
        ]
      : [
          {
            q: "L'huile est-elle 100% naturelle ?",
            a: "Oui, notre huile est extra vierge, extraite à froid et sans aucun additif.",
          },
          {
            q: "Quel est le délai de livraison ?",
            a: "Généralement de 2 à 5 jours ouvrables sur tout le territoire national.",
          },
          {
            q: "Quels moyens de paiement acceptez-vous ?",
            a: "Le paiement à la livraison est disponible partout en Algérie.",
          },
          {
            q: "Comment conserver l'huile ?",
            a: "Dans un endroit frais et à l'abri de la lumière pour préserver sa qualité.",
          },
        ];

  return (
    <StoreLayout>
      {/* HERO */}
      <section ref={heroRef} className="relative flex min-h-[92vh] items-center overflow-hidden">
        <motion.img
          src={heroGrove}
          alt=""
          style={{ y }}
          width={1920}
          height={1200}
          className="absolute inset-0 h-[115%] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-olive-dark/70 via-olive-dark/45 to-olive-dark/75" />
        <div className="container-page relative z-10 py-32 text-center text-white">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 text-sm font-medium uppercase tracking-[0.25em] text-accent"
          >
            {t("brand")}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto max-w-3xl font-display text-4xl font-bold leading-tight text-balance sm:text-5xl md:text-6xl"
          >
            {t("hero_title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mx-auto mt-6 max-w-xl text-base text-white/85 sm:text-lg"
          >
            {t("hero_subtitle")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Button
              asChild
              size="lg"
              className="rounded-full bg-accent px-8 text-accent-foreground hover:bg-accent/90"
            >
              <Link to="/products">
                {t("hero_shop")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/40 bg-white/10 px-8 text-white backdrop-blur hover:bg-white/20"
            >
              <Link to="/process">{t("hero_learn")}</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-b border-border bg-card">
        <div className="container-page grid grid-cols-2 gap-6 py-8 sm:grid-cols-3 lg:grid-cols-6">
          {trust.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2 text-center">
              <item.icon className="h-6 w-6 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="container-page py-20">
        <SectionHeading title={t("featured_title")} subtitle={t("featured_sub")} />
        {isLoading ? (
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-3xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="py-10 text-center text-muted-foreground space-y-2">
            <p className="text-sm">
              {lang === "ar"
                ? "عذرًا، تعذر تحميل المنتجات المميزة."
                : "Impossible de charger les produits phares."}
            </p>
            <p className="text-xs text-destructive">{error?.message}</p>
          </div>
        ) : featured.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">{t("no_products")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
        <div className="mt-10 text-center">
          <Button asChild variant="outline" size="lg" className="rounded-full px-8">
            <Link to="/products">
              {t("nav_products")} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* WHY */}
      <section className="bg-cream py-20">
        <div className="container-page">
          <SectionHeading title={t("why_title")} subtitle={t("why_sub")} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {why.map((item, i) => (
              <motion.div
                key={item.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
                className="rounded-3xl border border-border/60 bg-card p-7 shadow-soft"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold">{item.t}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS TIMELINE */}
      <section className="container-page py-20">
        <SectionHeading title={t("process_title")} subtitle={t("process_sub")} />
        <div className="relative mx-auto max-w-4xl">
          <div className="absolute start-[27px] top-2 bottom-2 w-px bg-border md:start-1/2 md:-translate-x-px" />
          <div className="space-y-8">
            {process.map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: i % 2 ? 30 : -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className={`relative flex items-center gap-5 md:w-1/2 ${i % 2 ? "md:ms-auto md:flex-row" : "md:flex-row-reverse md:text-end"}`}
              >
                <div className="z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground shadow-gold">
                  {i + 1}
                </div>
                <div className="rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-soft">
                  <span className="font-display text-lg font-semibold">{step}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-olive-dark py-20 text-white">
        <div className="container-page">
          <h2 className="mb-12 text-center font-display text-3xl font-bold sm:text-4xl">
            {t("testi_title")}
          </h2>
          {isLoadingReviews ? (
            <div className="grid gap-6 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-3xl bg-white/10" />
              ))}
            </div>
          ) : publicReviews.length === 0 ? (
            <div className="py-10 text-center text-white/70">
              <p>{t("no_reviews")}</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {publicReviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex flex-col rounded-3xl bg-white/10 p-7 backdrop-blur"
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="flex gap-0.5 shrink-0">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${
                            s < review.rating ? "fill-accent text-accent" : "text-white/30"
                          }`}
                        />
                      ))}
                    </div>
                    {review.product && (
                      <Link
                        to={`/products/${review.product.slug}`}
                        className="line-clamp-1 max-w-[150px] text-end text-xs text-white/60 underline-offset-2 hover:text-white/90 hover:underline"
                      >
                        {lang === "ar" ? review.product.name_ar : review.product.name_fr}
                      </Link>
                    )}
                  </div>
                  <p className="mb-5 flex-grow text-sm leading-relaxed text-white/90">
                    "{review.comment}"
                  </p>
                  <div className="mt-auto flex items-end justify-between gap-4">
                    <p className="font-display font-semibold text-accent line-clamp-1">{review.customerName}</p>
                    <span className="text-xs text-white/50 shrink-0">
                      {new Date(review.createdAt).toLocaleDateString(
                        lang === "ar" ? "ar-DZ" : "fr-DZ",
                      )}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* GALLERY */}
      <section className="container-page py-20">
        <SectionHeading title={t("gallery_title")} subtitle="" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {displayGallery.map((item: GalleryItem, i: number) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`overflow-hidden rounded-2xl ${i === 0 ? "col-span-2 row-span-2" : ""}`}
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-cream py-20">
        <div className="container-page max-w-3xl">
          <h2 className="mb-10 text-center font-display text-3xl font-bold sm:text-4xl">
            {t("faq_title")}
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-2xl border border-border/60 bg-card px-5"
              >
                <AccordionTrigger className="text-start font-medium hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </StoreLayout>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-12 text-center">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-display text-3xl font-bold text-foreground sm:text-4xl"
      >
        {title}
      </motion.h2>
      {subtitle && <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
