import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Mail, MapPin, Phone, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import { contactSettingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Lem3ansra n Jeddi" },
      {
        name: "description",
        content: "Contactez-nous pour toute question sur nos huiles d'olive premium.",
      },
      { property: "og:title", content: "Contact — Lem3ansra n Jeddi" },
      { property: "og:description", content: "Contactez notre équipe." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { t, lang } = useI18n();
  const { data: contactSettings } = useQuery(contactSettingsQuery());
  const [sent, setSent] = useState(false);
  
  const whatsappUrl = contactSettings?.whatsappNumber
    ? `https://wa.me/${contactSettings.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
        lang === "ar" ? "مرحبا، أود الاستفسار عن منتجاتكم" : "Bonjour, je souhaiterais avoir des informations sur vos produits"
      )}`
    : "#";

  return (
    <StoreLayout>
      <div className="container-page pt-28 pb-16">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">{t("nav_contact")}</h1>
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
              toast.success(lang === "ar" ? "تم إرسال رسالتك!" : "Message envoyé !");
            }}
            className="space-y-4 rounded-3xl border border-border bg-card p-7"
          >
            <div>
              <Label className="mb-1.5 block text-sm">{t("full_name")}</Label>
              <Input required className="rounded-xl" />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">{t("email")}</Label>
              <Input required type="email" className="rounded-xl" />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Message</Label>
              <Textarea required rows={4} className="rounded-xl" />
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={sent}>
              {lang === "ar" ? "إرسال" : "Envoyer"}
            </Button>
          </form>
          <div className="space-y-4">
            {contactSettings?.email && <InfoRow icon={Mail} label={contactSettings.email} />}
            {contactSettings?.phone && <InfoRow icon={Phone} label={contactSettings.phone} />}
            {contactSettings?.whatsappNumber && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <InfoRow icon={MessageCircle} label={contactSettings.whatsappNumber} />
              </a>
            )}
            {contactSettings?.address && <InfoRow icon={MapPin} label={contactSettings.address} />}
            <div className="rounded-3xl bg-cream p-6">
              <p className="font-display text-lg font-semibold">{t("footer_hours")}</p>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}

function InfoRow({ icon: Icon, label }: { icon: typeof Mail; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <span dir="ltr">{label}</span>
    </div>
  );
}
