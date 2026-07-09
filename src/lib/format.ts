import type { Lang } from "@/i18n";
import type { Product, Category } from "./types";

export function formatPrice(amount: number | null | undefined, lang: Lang): string {
  const rounded = Math.round(amount ?? 0);
  const nf = new Intl.NumberFormat(lang === "ar" ? "ar-DZ" : "fr-DZ");
  const suffix = lang === "ar" ? "دج" : "DA";
  return `${nf.format(rounded)} ${suffix}`;
}

export function productName(
  p: Pick<Product, "name_ar" | "name_fr"> | null | undefined,
  lang: Lang,
): string {
  if (!p) return "";
  return lang === "ar" ? p.name_ar : p.name_fr;
}

export function productDesc(
  p: Pick<Product, "description_ar" | "description_fr"> | null | undefined,
  lang: Lang,
): string {
  if (!p) return "";
  return (lang === "ar" ? p.description_ar : p.description_fr) ?? "";
}

export function categoryName(
  c: Pick<Category, "name_ar" | "name_fr"> | null | undefined,
  lang: Lang,
): string {
  if (!c) return "";
  return lang === "ar" ? c.name_ar : c.name_fr;
}
