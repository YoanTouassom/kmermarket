-- ============================================================
--  KmerMarket — Schéma PostgreSQL
--  Idempotent : peut être exécuté plusieurs fois sans erreur.
-- ============================================================

-- Types énumérés --------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'shipping', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cash', 'mtn_momo', 'orange_money');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Table de suivi des migrations ---------------------------------------
CREATE TABLE IF NOT EXISTS migrations (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Utilisateurs ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  first_name     VARCHAR(80)  NOT NULL,
  last_name      VARCHAR(80)  NOT NULL,
  email          VARCHAR(160) NOT NULL UNIQUE,
  phone          VARCHAR(40),
  password_hash  TEXT         NOT NULL,
  role           user_role    NOT NULL DEFAULT 'customer',
  is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
  avatar         TEXT,
  city           VARCHAR(80),
  neighborhood   VARCHAR(120),
  address        TEXT,
  preferences    JSONB        NOT NULL DEFAULT '{"newsletter":true,"sms":false,"promos":true}'::jsonb,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique
  ON users (phone) WHERE phone IS NOT NULL AND phone <> '';

CREATE INDEX IF NOT EXISTS users_email_idx ON users (lower(email));

-- Adresses (User 1 -> N Addresses) ------------------------------------
CREATE TABLE IF NOT EXISTS addresses (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  city             VARCHAR(80)  NOT NULL,
  neighborhood     VARCHAR(120) NOT NULL,
  address          TEXT         NOT NULL,
  additional_info  TEXT,
  is_default       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS addresses_user_idx ON addresses (user_id);

-- Une seule adresse par défaut par utilisateur
CREATE UNIQUE INDEX IF NOT EXISTS addresses_one_default_per_user
  ON addresses (user_id) WHERE is_default;


-- Catégories -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(120) NOT NULL,
  slug         VARCHAR(140) NOT NULL UNIQUE,
  description  TEXT,
  icon         VARCHAR(60)  NOT NULL DEFAULT 'Leaf',
  color        VARCHAR(20)  NOT NULL DEFAULT '#1b7f52',
  image        TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Produits -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id           SERIAL PRIMARY KEY,
  category_id  INTEGER      REFERENCES categories(id) ON DELETE SET NULL,
  name         VARCHAR(180) NOT NULL,
  slug         VARCHAR(200) NOT NULL UNIQUE,
  description  TEXT,
  tagline      VARCHAR(200),
  price        NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  old_price    NUMERIC(12,2) CHECK (old_price IS NULL OR old_price >= 0),
  unit         VARCHAR(40)  NOT NULL DEFAULT 'Unité',
  stock        INTEGER      NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image        TEXT,
  origin       VARCHAR(140),
  rating       NUMERIC(3,2) NOT NULL DEFAULT 0,
  reviews      INTEGER      NOT NULL DEFAULT 0,
  sold         INTEGER      NOT NULL DEFAULT 0,
  tags         TEXT[]       NOT NULL DEFAULT '{}',
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  is_featured  BOOLEAN      NOT NULL DEFAULT FALSE,
  is_new       BOOLEAN      NOT NULL DEFAULT FALSE,
  is_on_sale   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_idx ON products (category_id);
CREATE INDEX IF NOT EXISTS products_active_idx   ON products (is_active);
CREATE INDEX IF NOT EXISTS products_name_idx     ON products (lower(name));

-- Paniers --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carts (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id          SERIAL PRIMARY KEY,
  cart_id     INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id)
);

CREATE INDEX IF NOT EXISTS cart_items_cart_idx ON cart_items (cart_id);

-- Commandes ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER REFERENCES users(id) ON DELETE SET NULL,
  order_number        VARCHAR(30) NOT NULL UNIQUE,
  status              order_status NOT NULL DEFAULT 'pending',
  subtotal            NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivery_fee        NUMERIC(12,2) NOT NULL DEFAULT 0,
  total               NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method      payment_method NOT NULL DEFAULT 'cash',
  payment_status      payment_status NOT NULL DEFAULT 'pending',
  note                TEXT,
  customer_first_name VARCHAR(80)  NOT NULL,
  customer_last_name  VARCHAR(80)  NOT NULL,
  customer_email      VARCHAR(160),
  customer_phone      VARCHAR(40)  NOT NULL,
  city                VARCHAR(80)  NOT NULL,
  neighborhood        VARCHAR(120) NOT NULL,
  address             TEXT         NOT NULL,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_idx   ON orders (user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
CREATE INDEX IF NOT EXISTS orders_date_idx   ON orders (created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name  VARCHAR(180) NOT NULL,
  unit          VARCHAR(40),
  unit_price    NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  subtotal      NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  image         TEXT
);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);

-- Historique des statuts (timeline affichée côté client) ---------------
CREATE TABLE IF NOT EXISTS order_status_history (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status      order_status NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_status_history_order_idx ON order_status_history (order_id);


-- Réinitialisation de mot de passe -------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT        NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_reset_user_idx ON password_reset_tokens (user_id);

-- Contenu éditorial du site (hero, bandeaux, sections d'accueil) --------
CREATE TABLE IF NOT EXISTS site_content (
  id          SERIAL PRIMARY KEY,
  key         VARCHAR(80) NOT NULL UNIQUE,
  value       JSONB       NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Paramètres de la boutique (livraison, contact, paiement) --------------
CREATE TABLE IF NOT EXISTS site_settings (
  id          SERIAL PRIMARY KEY,
  key         VARCHAR(80) NOT NULL UNIQUE,
  value       JSONB       NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Déclencheur : mise à jour automatique de updated_at -------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users', 'addresses', 'categories', 'products', 'orders', 'carts']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON %1$s', t);
    EXECUTE format(
      'CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON %1$s
         FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t
    );
  END LOOP;
END $$;

