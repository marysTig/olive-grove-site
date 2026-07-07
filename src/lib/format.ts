import type { Lang } from "@/i18n";
import type { Product, Category } from "./types";

export function formatPrice(amount: number, lang: Lang): string {
  const rounded = Math.round(amount);
  const nf = new Intl.NumberFormat(lang === "ar" ? "ar-DZ" : "fr-DZ");
  const suffix = lang === "ar" ? "دج" : "DA";
  return `${nf.format(rounded)} ${suffix}`;
}

export function productName(p: Pick<Product, "name_ar" | "name_fr">, lang: Lang): string {
  return lang === "ar" ? p.name_ar : p.name_fr;
}

export function productDesc(
  p: Pick<Product, "description_ar" | "description_fr">,
  lang: Lang,
): string {
  return (lang === "ar" ? p.description_ar : p.description_fr) ?? "";
}

export function categoryName(
  c: Pick<Category, "name_ar" | "name_fr">,
  lang: Lang,
): string {
  return lang === "ar" ? c.name_ar : c.name_fr;
}
