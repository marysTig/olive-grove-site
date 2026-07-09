-- Disable RLS for dropping
-- Drop existing tables from previous migrations if they exist and conflict
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.store_settings CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.contact_settings CASCADE;
DROP TABLE IF EXISTS public.gallery CASCADE;
DROP TABLE IF EXISTS public.mongo_users CASCADE;

DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.product_status CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

-- CREATE TYPES
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
CREATE TYPE public.product_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock');
CREATE TYPE public.user_role AS ENUM ('admin', 'client');

-- 1. USERS TABLE
CREATE TABLE public.mongo_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role public.user_role DEFAULT 'client',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  language VARCHAR(5) DEFAULT 'fr',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CONTACT SETTINGS TABLE
CREATE TABLE public.contact_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_number TEXT NOT NULL DEFAULT '',
  contact_name TEXT NOT NULL DEFAULT 'Lem3ansra n Jeddi',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure only one document exists via constraint or let the backend handle it as before.

-- 3. GALLERY TABLE
CREATE TABLE public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  image_public_id TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. PRODUCTS TABLE
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_fr VARCHAR(120) NOT NULL,
  name_ar TEXT DEFAULT '',
  slug TEXT UNIQUE NOT NULL,
  description_fr TEXT DEFAULT '',
  description_ar TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0 CHECK (price >= 0),
  discount_pct NUMERIC DEFAULT 0 CHECK (discount_pct >= 0 AND discount_pct <= 100),
  quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
  status public.product_status DEFAULT 'out_of_stock',
  category_id TEXT,
  images TEXT[] DEFAULT '{}',
  image_public_ids TEXT[] DEFAULT '{}',
  badge TEXT,
  volume_ml INTEGER,
  origin TEXT,
  harvest_date DATE,
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. ORDERS TABLE
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.mongo_users(id) ON DELETE SET NULL,
  status public.order_status DEFAULT 'pending',
  payment_method TEXT DEFAULT 'cash_on_delivery',
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  notes TEXT,
  coupon_code TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  shipping_fee NUMERIC NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  discount NUMERIC NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total NUMERIC NOT NULL DEFAULT 0 CHECK (total >= 0),
  items JSONB NOT NULL DEFAULT '[]', -- matching the embedded array
  inventory_deducted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. REVIEWS TABLE
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.mongo_users(id) ON DELETE SET NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_email TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment VARCHAR(1000) NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- helper triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_mongo_users_updated_at BEFORE UPDATE ON public.mongo_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contact_settings_updated_at BEFORE UPDATE ON public.contact_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_gallery_updated_at BEFORE UPDATE ON public.gallery
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SEED ADMIN USER
INSERT INTO public.mongo_users (full_name, email, password_hash, role, is_active)
VALUES ('Admin', 'admin@lem3ansra.dz', '$2a$12$n0A8h5K1TdS0z7bcErg10uGFCnfIHjSVBMDvjd1Qp02g1Ks02xC/q', 'admin', true);
