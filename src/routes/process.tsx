import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { useI18n } from "@/i18n";
import { galleryPressing } from "@/lib/images";

export const Route = createFileRoute("/process")({
  head: () => ({
    meta: [
      { title: "Notre Processus — Lem3ansra n Jeddi" },
      { name: "description", content: "De la récolte à la mise en bouteille : découvrez notre processus d'extraction à froid." },
      { property: "og:title", content: "Notre Processus — Lem3ansra n Jeddi" },
      { property: "og:description", content: "De la récolte à la mise en bouteille, extraction à froid." },
    ],
  }),
  component: Process,
});

function Process() {
  const { t, lang } = useI18n();
  const steps = [
    { n: t("process_1"), d: lang === "fr" ? "Cueillette manuelle des olives à maturité." : "قطف الزيتون يدويًا عند النضج." },
    { n: t("process_2"), d: lang === "fr" ? "Nettoyage et tri soigneux des fruits." : "تنظيف وفرز دقيق للثمار." },
    { n: t("process_3"), d: lang === "fr" ? "Extraction à froid pour préserver les arômes." : "عصر على البارد للحفاظ على النكهات." },
    { n: t("process_4"), d: lang === "fr" ? "Filtrage naturel de l'huile." : "تصفية طبيعية للزيت." },
    { n: t("process_5"), d: lang === "fr" ? "Mise en bouteille protectrice." : "تعبئة تحمي الزيت." },
    { n: t("process_6"), d: lang === "fr" ? "Livraison rapide et soignée." : "توصيل سريع وبعناية." },
  ];
  return (
    <StoreLayout>
      <div className="relative h-64 overflow-hidden">
        <img src={galleryPressing} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-olive-dark/60">
          <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">{t("process_title")}</h1>
        </div>
      </div>
      <div className="container-page py-16">
        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 2) * 0.1 }}
              className="flex gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-display font-bold text-primary-foreground">{i + 1}</span>
              <div>
                <h3 className="font-display text-lg font-semibold">{s.n}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </StoreLayout>
  );
}
