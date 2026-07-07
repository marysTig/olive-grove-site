import { generateUniqueSlug } from './slugGenerator';

export interface ProductPayload {
  name_fr?: string;
  name_ar?: string;
  description_fr?: string;
  description_ar?: string;
  price?: string | number;
  discount_pct?: string | number;
  stock?: string | number;
  category_id?: string | null;
  images?: string[];
  image_public_ids?: string[];
  badge?: string | null;
  volume_ml?: string | number | null;
  origin?: string | null;
  harvest_date?: string | null;
  featured?: string | boolean;
  active?: string | boolean;
  slug?: string;
}

export const normalizeProductPayload = (payload: ProductPayload) => {
  const normalized = {
    ...payload,
    name_fr: payload.name_fr?.trim() || '',
    name_ar: payload.name_ar?.trim() || '',
    description_fr: payload.description_fr?.trim() || '',
    description_ar: payload.description_ar?.trim() || '',
    price: typeof payload.price === 'string' ? Number(payload.price) : payload.price ?? 0,
    discount_pct:
      typeof payload.discount_pct === 'string'
        ? Number(payload.discount_pct)
        : payload.discount_pct ?? 0,
    stock: typeof payload.stock === 'string' ? Number(payload.stock) : payload.stock ?? 0,
    featured: payload.featured === true || payload.featured === 'true',
    active: payload.active === true || payload.active === 'true',
    images: payload.images ?? [],
    image_public_ids: payload.image_public_ids ?? [],
    badge: payload.badge?.trim() || null,
    volume_ml:
      payload.volume_ml === null || payload.volume_ml === undefined
        ? null
        : typeof payload.volume_ml === 'string'
          ? Number(payload.volume_ml)
          : payload.volume_ml,
    origin: payload.origin?.trim() || null,
    harvest_date: payload.harvest_date?.trim() || null,
    slug: payload.slug?.trim() || generateUniqueSlug(payload.name_fr || 'product'),
  };

  return normalized;
};
