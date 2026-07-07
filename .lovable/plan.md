Lem3ansra n Jeddi — MVP Build Plan

A premium, bilingual (Arabic + French, RTL-aware) olive oil storefront with a full admin dashboard, built on Lovable's stack. This is Phase 1 of your PRD: storefront + cash-on-delivery checkout + admin.

## Stack mapping (important)

Your PRD suggested Express + Prisma + Neon + Vercel/Railway. Lovable apps don't run that architecture — I'll deliver the same capabilities natively:


| Your spec                                                                       | Built as                                                   |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| React 19, Vite, TS, Tailwind 4, shadcn, Framer Motion, TanStack Query, RHF, Zod | Same — all native to this stack                            |
| Express + Prisma + PostgreSQL                                                   | Lovable Cloud (managed Postgres + server functions)        |
| JWT + refresh + RBAC                                                            | Lovable Cloud auth + a `user_roles` table (admin/customer) |
| Cloudinary                                                                      | Lovable Cloud Storage                                      |
| Vercel/Railway/Neon                                                             | Lovable hosting                                            |


## Design system (from your brand spec)

- **Colors** (as CSS tokens in `src/styles.css`, oklch): Olive Green `#556B2F`, Dark Olive `#3E4E1F`, Light Olive `#8A9A5B`, Cream `#F8F7F2`, Golden accent `#C8A44D`, Pure White. Dark-olive CTAs with gold hover.
- **Fonts** (self-hosted via `@fontsource`): Playfair Display (headings), Inter (body), Poppins (buttons).
- **Feel**: whitespace-heavy, rounded cards, soft shadows, large imagery, Framer Motion transitions, skeleton loaders, subtle parallax hero, sticky nav that changes on scroll, AJAX cart drawer, product badges, floating WhatsApp button.

## Internationalization

- Bilingual **Arabic + French** with a language switcher; `dir="rtl"` applied for Arabic.
- Lightweight i18n via a React context + JSON dictionaries (`src/i18n/ar.ts`, `fr.ts`) — no heavy framework. Product/category content stored with `name_ar/name_fr`, `description_ar/description_fr` columns so the catalog itself is bilingual.

## Database (Lovable Cloud)

Tables with RLS + grants:

- `profiles` (id→auth.users, name, phone) + auto-create trigger on signup
- `user_roles` (user_id, role enum `admin`/`customer`) + `has_role()` security-definer fn
- `categories` (name_ar, name_fr, image_url, visible, sort)
- `products` (name_ar/fr, description_ar/fr, price, stock, category_id, images[], featured, badge, volume_ml, origin, harvest_date, rating, active)
- `orders` (user_id nullable for guest COD, status enum, payment_method, customer_name, phone, address, wilaya, subtotal, shipping_fee, discount, total, created_at)
- `order_items` (order_id, product_id, name snapshot, quantity, price)
- `coupons` (code, discount_pct, expiration, active, usage_count)
- `store_settings` (singleton: shipping fee, WhatsApp number, social links)

RLS: products/categories/coupons public-read (active/visible only); orders insertable by anyone (COD guest checkout), readable by owner or admin; admin full CRUD via `has_role(auth.uid(),'admin')`; `user_roles` never client-writable.

## Routes — Storefront (public)

- `/` Landing: parallax hero, trust bar, featured products, why-choose-us, production-process timeline, testimonials, gallery, FAQ accordion, newsletter, footer
- `/products` catalog: filters (price, category, bottle size, availability), sort, search
- `/products/$id` details: gallery + zoom, bilingual description, nutrition/origin/harvest, badges, related products
- `/cart` (also an AJAX drawer), `/checkout` (COD: name, phone, wilaya, address, coupon, order summary), `/order-confirmation/$id`
- `/about`, `/process`, `/recipes`, `/faq`, `/contact` (each own SEO `head()`)
- `/auth` (customer login/register), `/account` (orders, profile) under `_authenticated/`
- 404 handled by root

Cart state persists in localStorage (client-side, hydration-safe).

## Routes — Admin (`/_authenticated/admin/*`, admin role only)

- Dashboard home: revenue / orders / products / stats cards + sales chart (Recharts) + latest orders
- Orders: table with status workflow (Pending→Confirmed→Preparing→Shipped→Delivered/Cancelled), customer details, actions
- Products: create/edit/delete, image upload to Storage, stock, price, discount, badge, featured, category
- Categories: CRUD + visibility
- Customers: list with order count / total spent
- Coupons: CRUD
- Settings: shipping fee, WhatsApp number, social links

Server functions (`createServerFn` + `requireSupabaseAuth` + role check) power all admin writes and order placement; public catalog reads via publishable-key server client.

## Imagery

Generate premium AI placeholders into `src/assets/`: cinematic olive-grove hero, bottle product shots (multiple SKUs), process/lifestyle gallery, category tiles. Swappable later from the admin.

## SEO & performance

Per-route `head()` (title/description/OG/Twitter), Product + Organization + FAQ JSON-LD, semantic HTML, lazy images, AVIF/WebP via imagetools, LCP hero preload, sitemap.xml + robots.txt.

## Build order

1. Enable Lovable Cloud; migrations (tables, RLS, grants, roles, trigger, settings seed).
2. Design tokens + fonts + i18n scaffolding + layout shell (sticky nav, footer, WhatsApp button, cart drawer).
3. Generate imagery + seed sample products/categories.
4. Storefront pages (landing → catalog → details → cart → checkout → confirmation → content pages).
5. Auth + customer account.
6. Admin dashboard + all management modules.
7. SEO, polish, motion, verify build.

## Out of scope for this build (later phases, per your PRD)

Online payments (BaridiMob/SATIM/Stripe), wishlist, reviews submission UI, inventory incoming-stock, email notifications, English/multi-language beyond AR+FR, wholesale, subscriptions, 2FA. The schema leaves room for these.

This is a large MVP; I'll build it in the order above across the turn. Approve to start with Cloud + schema + design system.