import heroGrove from "@/assets/hero-grove.jpg";
import bottleClassic from "@/assets/bottle-classic.jpg";
import bottlePremium from "@/assets/bottle-premium.jpg";
import bottleInfused from "@/assets/bottle-infused.jpg";
import bottleGift from "@/assets/bottle-gift.jpg";
import galleryHarvest from "@/assets/gallery-harvest.jpg";
import galleryPressing from "@/assets/gallery-pressing.jpg";
import galleryLifestyle from "@/assets/gallery-lifestyle.jpg";
import aboutFamily from "@/assets/about-family.jpg";
import logo from "@/assets/logo.png";

export const assets = {
  "hero-grove": heroGrove,
  "bottle-classic": bottleClassic,
  "bottle-premium": bottlePremium,
  "bottle-infused": bottleInfused,
  "bottle-gift": bottleGift,
  "gallery-harvest": galleryHarvest,
  "gallery-pressing": galleryPressing,
  "gallery-lifestyle": galleryLifestyle,
  "about-family": aboutFamily,
  logo,
} as const;

export { logo, heroGrove, aboutFamily, galleryHarvest, galleryPressing, galleryLifestyle };

const PLACEHOLDER = bottleClassic;

/** Resolves a stored image reference. Bundled assets are stored as "asset:<key>". */
export function resolveImage(ref: string | null | undefined): string {
  if (!ref) return PLACEHOLDER;
  if (ref.startsWith("asset:")) {
    const key = ref.slice(6) as keyof typeof assets;
    return assets[key] ?? PLACEHOLDER;
  }
  return ref;
}

export function firstImage(images: string[] | null | undefined): string {
  return resolveImage(images?.[0]);
}
