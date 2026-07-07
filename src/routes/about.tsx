import { createFileRoute } from "@tanstack/react-router";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { useI18n } from "@/i18n";
import { aboutFamily, galleryHarvest } from "@/lib/images";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "À propos — Lem3ansra n Jeddi" },
      { name: "description", content: "L'histoire de notre famille et de notre huile d'olive traditionnelle algérienne." },
      { property: "og:title", content: "À propos — Lem3ansra n Jeddi" },
      { property: "og:description", content: "L'histoire de notre famille et de notre huile d'olive traditionnelle." },
    ],
  }),
  component: About,
});

function About() {
  const { lang } = useI18n();
  const fr = lang === "fr";
  return (
    <StoreLayout>
      <div className="container-page pt-28 pb-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h1 className="font-display text-4xl font-bold sm:text-5xl">{fr ? "Notre histoire" : "قصتنا"}</h1>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              {fr
                ? "Lem3ansra n Jeddi — « le pressoir de mon grand-père » — perpétue un savoir-faire familial transmis de génération en génération. Nos oliviers, cultivés avec patience dans les collines algériennes, donnent une huile pure, extraite à froid et sans aucun additif."
                : "لمعصرة جدي تواصل خبرة عائلية تتوارثها الأجيال. أشجار زيتوننا، المزروعة بصبر في التلال الجزائرية، تمنح زيتًا نقيًا معصورًا على البارد وبدون أي إضافات."}
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {fr
                ? "Chaque bouteille raconte une tradition, un terroir et un engagement pour la qualité et l'authenticité."
                : "كل زجاجة تروي تقليدًا وأرضًا والتزامًا بالجودة والأصالة."}
            </p>
          </div>
          <img src={aboutFamily} alt="" className="rounded-3xl shadow-elegant" loading="lazy" />
        </div>
        <img src={galleryHarvest} alt="" className="mt-10 h-72 w-full rounded-3xl object-cover" loading="lazy" />
      </div>
    </StoreLayout>
  );
}
