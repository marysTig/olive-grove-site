import { createFileRoute } from "@tanstack/react-router";
import { StoreLayout } from "@/components/layout/StoreLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Lem3ansra n Jeddi" },
      {
        name: "description",
        content: "Questions fréquentes sur nos huiles d'olive, la livraison et le paiement.",
      },
      { property: "og:title", content: "FAQ — Lem3ansra n Jeddi" },
      { property: "og:description", content: "Questions fréquentes." },
    ],
  }),
  component: Faq,
});

function Faq() {
  const { t, lang } = useI18n();
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
          { q: "هل يمكن إرجاع المنتج؟", a: "نعم، يمكنك التواصل معنا خلال 48 ساعة من الاستلام." },
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
            a: "Dans un endroit frais et à l'abri de la lumière.",
          },
          {
            q: "Puis-je retourner un produit ?",
            a: "Oui, contactez-nous dans les 48h suivant la réception.",
          },
        ];
  return (
    <StoreLayout>
      <div className="container-page max-w-3xl pt-28 pb-16">
        <h1 className="mb-10 font-display text-4xl font-bold sm:text-5xl">{t("faq_title")}</h1>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`i-${i}`}
              className="rounded-2xl border border-border bg-card px-5"
            >
              <AccordionTrigger className="text-start font-medium hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </StoreLayout>
  );
}
