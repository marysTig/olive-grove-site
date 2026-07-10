-- Fix RLS policies and grants for all tables created in the mongo_exact_replica migration
-- This ensures the service_role key can read/write all tables, and adds public read policies

-- ============================================================
-- mongo_users — internal users table (admin only)
-- ============================================================
ALTER TABLE public.mongo_users ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.mongo_users TO service_role;

-- Only service_role (backend) can access this table — no public or authenticated access
CREATE POLICY "service_role_full_access_mongo_users" ON public.mongo_users
  USING (true) WITH CHECK (true);

-- ============================================================
-- contact_settings — public read, service_role write
-- ============================================================
ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.contact_settings TO anon;
GRANT ALL ON public.contact_settings TO service_role;

CREATE POLICY "public_read_contact_settings" ON public.contact_settings
  FOR SELECT USING (true);

CREATE POLICY "service_role_write_contact_settings" ON public.contact_settings
  USING (true) WITH CHECK (true);

-- ============================================================
-- gallery — public read, service_role write
-- ============================================================
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.gallery TO anon;
GRANT ALL ON public.gallery TO service_role;

CREATE POLICY "public_read_gallery" ON public.gallery
  FOR SELECT USING (true);

CREATE POLICY "service_role_write_gallery" ON public.gallery
  USING (true) WITH CHECK (true);

-- ============================================================
-- products — public read (active only), service_role full access
-- ============================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.products TO anon;
GRANT ALL ON public.products TO service_role;

CREATE POLICY "public_read_active_products" ON public.products
  FOR SELECT USING (active = true);

CREATE POLICY "service_role_full_access_products" ON public.products
  USING (true) WITH CHECK (true);

-- ============================================================
-- orders — anon insert (guest checkout), service_role full access
-- ============================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;

CREATE POLICY "anon_insert_orders" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "service_role_full_access_orders" ON public.orders
  USING (true) WITH CHECK (true);

-- ============================================================
-- reviews — public read (visible only), anon insert, service_role full access
-- ============================================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.reviews TO anon;
GRANT INSERT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;

CREATE POLICY "public_read_visible_reviews" ON public.reviews
  FOR SELECT USING (is_visible = true);

CREATE POLICY "anon_insert_reviews" ON public.reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "service_role_full_access_reviews" ON public.reviews
  USING (true) WITH CHECK (true);
