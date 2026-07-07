import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Truck, Tag } from "lucide-react";
import { toast } from "sonner";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/i18n";
import { settingsQuery } from "@/lib/queries";
import { formatPrice, productName } from "@/lib/format";
import { resolveImage } from "@/lib/images";
import { validateCoupon, createOrder } from "@/lib/order";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

const WILAYAS = [
  "Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra","Béchar","Blida","Bouira",
  "Tamanrasset","Tébessa","Tlemcen","Tiaret","Tizi Ouzou","Alger","Djelfa","Jijel","Sétif","Saïda",
  "Skikda","Sidi Bel Abbès","Annaba","Guelma","Constantine","Médéa","Mostaganem","M'Sila","Mascara","Ouargla",
  "Oran","El Bayadh","Illizi","Bordj Bou Arréridj","Boumerdès","El Tarf","Tindouf","Tissemsilt","El Oued","Khenchela",
  "Souk Ahras","Tipaza","Mila","Aïn Defla","Naâma","Aïn Témouchent","Ghardaïa","Relizane",
];

const schema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(20),
  address: z.string().trim().min(5).max(300),
  wilaya: z.string().min(1),
  notes: z.string().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

function CheckoutPage() {
  const { t, lang } = useI18n();
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: settings } = useQuery(settingsQuery());
  const [coupon, setCoupon] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const shippingFee = settings
    ? (settings.free_shipping_threshold > 0 && subtotal >= settings.free_shipping_threshold ? 0 : settings.shipping_fee)
    : 0;
  const discount = discountPct > 0 ? subtotal * (discountPct / 100) : 0;
  const total = subtotal - discount + shippingFee;

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    const c = await validateCoupon(coupon);
    if (c) {
      setDiscountPct(c.discount_pct);
      setAppliedCode(c.code);
      toast.success(t("coupon_ok"));
    } else {
      setDiscountPct(0);
      setAppliedCode(null);
      toast.error(t("coupon_invalid"));
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      const order = await createOrder({
        items,
        ...values,
        coupon_code: appliedCode,
        discount_pct: discountPct,
        shipping_fee: shippingFee,
        user_id: user?.id ?? null,
      });
      clear();
      navigate({ to: "/order-confirmation/$id", params: { id: String(order.order_number) } });
    } catch (e) {
      console.error(e);
      toast.error(lang === "ar" ? "حدث خطأ. حاول مرة أخرى." : "Une erreur est survenue. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <StoreLayout>
        <div className="container-page py-40 text-center">
          <p className="text-muted-foreground">{t("cart_empty")}</p>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container-page pt-28 pb-16">
        <h1 className="mb-8 font-display text-3xl font-bold sm:text-4xl">{t("checkout_title")}</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-5 font-display text-xl font-semibold">{t("customer_info")}</h2>
              <div className="grid gap-4">
                <Field label={t("full_name")} error={errors.customer_name?.message}>
                  <Input {...register("customer_name")} className="rounded-xl" />
                </Field>
                <Field label={t("phone")} error={errors.phone?.message}>
                  <Input {...register("phone")} type="tel" dir="ltr" className="rounded-xl" />
                </Field>
                <Field label={t("wilaya")} error={errors.wilaya?.message}>
                  <Select onValueChange={(v) => setValue("wilaya", v, { shouldValidate: true })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {WILAYAS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t("address")} error={errors.address?.message}>
                  <Textarea {...register("address")} rows={2} className="rounded-xl" />
                </Field>
                <Field label={t("order_notes")}>
                  <Textarea {...register("notes")} rows={2} className="rounded-xl" />
                </Field>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 font-display text-xl font-semibold">{t("payment_method")}</h2>
              <div className="flex items-center gap-3 rounded-xl border-2 border-primary bg-primary/5 p-4">
                <Truck className="h-5 w-5 text-primary" />
                <span className="font-medium">{t("cod")}</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
            <h2 className="mb-4 font-display text-xl font-semibold">{t("order_summary")}</h2>
            <div className="max-h-52 space-y-3 overflow-y-auto">
              {items.map((i) => (
                <div key={i.id} className="flex items-center gap-3 text-sm">
                  <img src={resolveImage(i.image_url)} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <span className="flex-1 line-clamp-1">{productName(i, lang)} × {i.quantity}</span>
                  <span className="font-medium">{formatPrice(i.price * i.quantity, lang)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder={t("coupon_placeholder")} className="ps-9 rounded-xl" />
              </div>
              <Button type="button" variant="outline" className="rounded-xl" onClick={applyCoupon}>{t("coupon_apply")}</Button>
            </div>

            <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              <Row label={t("subtotal")} value={formatPrice(subtotal, lang)} />
              {discount > 0 && <Row label={`${t("discount")} (${appliedCode})`} value={`- ${formatPrice(discount, lang)}`} accent />}
              <Row label={t("shipping")} value={shippingFee === 0 ? (lang === "ar" ? "مجاني" : "Gratuit") : formatPrice(shippingFee, lang)} />
              <div className="flex items-center justify-between border-t border-border pt-3 text-lg font-bold">
                <span>{t("total")}</span>
                <span className="text-primary">{formatPrice(total, lang)}</span>
              </div>
            </div>

            <Button type="submit" size="lg" disabled={submitting} className="mt-5 w-full rounded-full">
              {submitting ? t("loading") : t("place_order")}
            </Button>
          </div>
        </form>
      </div>
    </StoreLayout>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm">{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? "font-medium text-accent-foreground" : "font-medium"}>{value}</span>
    </div>
  );
}
