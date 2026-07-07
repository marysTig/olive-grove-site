import { createFileRoute } from "@tanstack/react-router";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { useI18n } from "@/i18n";
import { galleryLifestyle } from "@/lib/images";

export const Route = createFileRoute("/recipes")({
  head: () => ({
    meta: [
      { title: "Recettes — Lem3ansra n Jeddi" },
      { name: "description", content: "Des idées de recettes méditerranéennes pour sublimer notre huile d'olive." },
      { property: "og:title", content: "Recettes — Lem3ansra n Jeddi" },
      { property: "og:description", content: "Recettes méditerranéennes à l'huile d'olive." },
    ],
  }),
  component: Recipes,
});

function Recipes() {
  const { lang } = useI18n();
  const fr = lang === "fr";
  const recipes = fr
    ? [
        { t: "Pain à l'huile d'olive", d: "Trempez du pain rustique dans notre huile avec un peu de sel et d'origan." },
        { t: "Salade méditerranéenne", d: "Tomates, olives, feta et un filet généreux d'huile extra vierge." },
        { t: "Chakchouka", d: "Œufs pochés dans une sauce tomate parfumée à l'huile d'olive." },
        { t: "Poisson grillé", d: "Arrosez le poisson d'huile et de citron avant de servir." },
      ]
    : [
        { t: "خبز بزيت الزيتون", d: "اغمس خبزًا ريفيًا في زيتنا مع قليل من الملح والزعتر." },
        { t: "سلطة متوسطية", d: "طماطم وزيتون وجبن مع رشة سخية من الزيت البكر." },
        { t: "شكشوكة", d: "بيض مسلوق في صلصة طماطم معطرة بزيت الزيتون." },
        { t: "سمك مشوي", d: "رش السمك بالزيت والليمون قبل التقديم." },
      ];
  return (
    <StoreLayout>
      <div className="container-page pt-28 pb-16">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">{fr ? "Recettes" : "وصفات"}</h1>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {recipes.map((r) => (
            <div key={r.t} className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
              <img src={galleryLifestyle} alt="" className="h-48 w-full object-cover" loading="lazy" />
              <div className="p-6">
                <h3 className="font-display text-xl font-semibold">{r.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{r.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </StoreLayout>
  );
}
