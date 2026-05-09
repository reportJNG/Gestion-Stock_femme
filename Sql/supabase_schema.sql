-- ============================================================
-- GESTION STOCK — SCHÉMA SUPABASE COMPLET
-- Version: 1.2.0 | Production-ready | Scalable
-- Langue interface: Français | Devise: DZD | Fuseau: Africa/Algiers
--
-- Corrections v1.1.0 :
--   [FIX-1] stock_movements.variant_id → ON DELETE CASCADE
--   [FIX-2] sale_items.variant_id     → nullable + ON DELETE SET NULL
--   [FIX-3] products                  → UNIQUE(category_id, seq_number)
--   [FIX-4] add_stock_to_variant()    → vérifie is_archived
--   [FIX-5] on_variant_quantity_change() → jointure propre via id
--   [FIX-6] v_daily_stats             → JOIN au lieu de sous-requête corrélée
--   [FIX-7] size_presets              → entrées 'free' ajoutées
--
-- Corrections v1.2.0 :
--   [FIX-8]  generate_sale_number()   → timezone Africa/Algiers (était UTC)
--   [FIX-9]  archive_product()        → variable 'count' renommée 'v_count'
--                                       ('count' est un mot réservé PostgreSQL)
--   [FIX-10] create_product_with_all_variants() → RAISE EXCEPTION sur erreurs
--                                       intermédiaires (évite insertions partielles
--                                       non annulées)
--   [FIX-11] create_product_with_all_variants() → IF FOUND pour variants_count
--                                       (le compteur n'est plus incrémenté si
--                                       ON CONFLICT DO NOTHING se déclenche)
--   [FIX-12] sync_queue               → colonne created_by ajoutée (audit trail,
--                                       filtrage par user offline)
--   [FIX-13] RLS categories/colors/size_presets → politique admin_write ajoutée
--                                       (admin peut désormais gérer les référentiels)
--   [FIX-14] on_sale_item_insert()    → apostrophe SQL corrigée dans RAISE EXCEPTION
--                                       ("dun" → "d''un")
-- ============================================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- SECTION 1 — SETTINGS (configuration globale)
-- ============================================================
CREATE TABLE settings (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         TEXT        UNIQUE NOT NULL,
  value       JSONB       NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (key, value) VALUES
  ('low_stock_threshold',    '5'::jsonb),
  ('tva_rate',               '19'::jsonb),
  ('shop_name',              '"Ma Boutique"'::jsonb),
  ('currency',               '"DZD"'::jsonb),
  ('archive_retention_days', '365'::jsonb),
  ('label_width_mm',         '50'::jsonb),
  ('label_height_mm',        '30'::jsonb);

-- ============================================================
-- SECTION 2 — PROFILES (extension auth.users, multi-admin ready)
-- ============================================================
CREATE TABLE profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  full_name   TEXT,
  role        TEXT        NOT NULL DEFAULT 'admin'
                          CHECK (role IN ('admin', 'viewer')),
  is_active   BOOLEAN     DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SECTION 3 — CATEGORIES
-- code: 2 chars utilisé dans l'algorithme barcode
-- size_type: définit le système de taille de la catégorie
-- ============================================================
CREATE TABLE categories (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        CHAR(2)     NOT NULL UNIQUE,
  name_fr     TEXT        NOT NULL,
  size_type   TEXT        NOT NULL
                          CHECK (size_type IN ('clothing', 'shoes', 'waist', 'free')),
  icon        TEXT,
  sort_order  INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (code, name_fr, size_type, icon, sort_order) VALUES
  ('TS', 'T-shirts / Hauts',    'clothing', 'shirt',       1),
  ('SH', 'Chaussures',          'shoes',    'footprints',  2),
  ('PT', 'Pantalons / Jeans',   'waist',    'layers',      3),
  ('JK', 'Vestes / Manteaux',   'clothing', 'wind',        4),
  ('AC', 'Accessoires',         'free',     'watch',       5),
  ('OT', 'Autres Vêtements',    'free',     'package',     6);

-- ============================================================
-- SECTION 4 — TAILLES PRÉDÉFINIES PAR TYPE
-- ============================================================
CREATE TABLE size_presets (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  size_type   TEXT        NOT NULL,
  size_value  TEXT        NOT NULL,
  size_code   CHAR(3)     NOT NULL,
  sort_order  INTEGER     DEFAULT 0,
  UNIQUE(size_type, size_value)
);

INSERT INTO size_presets (size_type, size_value, size_code, sort_order) VALUES
  -- Vêtements (clothing)
  ('clothing', 'XS',     'XSS', 1),
  ('clothing', 'S',      'SML', 2),
  ('clothing', 'M',      'MED', 3),
  ('clothing', 'L',      'LRG', 4),
  ('clothing', 'XL',     'XLG', 5),
  ('clothing', 'XXL',    'XXL', 6),
  ('clothing', '3XL',    '3XL', 7),
  -- Chaussures EU (shoes)
  ('shoes', '35', '035', 1),
  ('shoes', '36', '036', 2),
  ('shoes', '37', '037', 3),
  ('shoes', '38', '038', 4),
  ('shoes', '39', '039', 5),
  ('shoes', '40', '040', 6),
  ('shoes', '41', '041', 7),
  ('shoes', '42', '042', 8),
  ('shoes', '43', '043', 9),
  ('shoes', '44', '044', 10),
  ('shoes', '45', '045', 11),
  ('shoes', '46', '046', 12),
  -- Tour de taille (waist)
  ('waist', '28', '028', 1),
  ('waist', '30', '030', 2),
  ('waist', '32', '032', 3),
  ('waist', '34', '034', 4),
  ('waist', '36', '036', 5),
  ('waist', '38', '038', 6),
  ('waist', '40', '040', 7),
  ('waist', '42', '042', 8),
  -- Taille libre (free) — accessoires, autres vêtements
  ('free', 'Unique', 'UNQ', 1),
  ('free', 'XS',     'XSS', 2),
  ('free', 'S',      'SML', 3),
  ('free', 'M',      'MED', 4),
  ('free', 'L',      'LRG', 5),
  ('free', 'XL',     'XLG', 6),
  ('free', 'XXL',    'XXL', 7),
  ('free', 'S/M',    'SMM', 8),
  ('free', 'M/L',    'MLL', 9);

-- ============================================================
-- SECTION 5 — COULEURS (prédéfinies, code 2 chars unique)
-- ============================================================
CREATE TABLE colors (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        CHAR(2)     NOT NULL UNIQUE,
  name_fr     TEXT        NOT NULL,
  hex         CHAR(7),
  is_active   BOOLEAN     DEFAULT TRUE,
  sort_order  INTEGER     DEFAULT 0
);

INSERT INTO colors (code, name_fr, hex, sort_order) VALUES
  ('BK', 'Noir',      '#1a1a1a', 1),
  ('WH', 'Blanc',     '#f5f5f5', 2),
  ('GY', 'Gris',      '#808080', 3),
  ('RD', 'Rouge',     '#dc2626', 4),
  ('BU', 'Bleu',      '#2563eb', 5),
  ('NV', 'Marine',    '#1e3a5f', 6),
  ('GN', 'Vert',      '#16a34a', 7),
  ('YL', 'Jaune',     '#eab308', 8),
  ('OR', 'Orange',    '#ea580c', 9),
  ('PK', 'Rose',      '#ec4899', 10),
  ('PP', 'Violet',    '#7c3aed', 11),
  ('BR', 'Marron',    '#78350f', 12),
  ('BG', 'Beige',     '#d4c4a0', 13),
  ('CR', 'Crème',     '#fef9ef', 14),
  ('KH', 'Kaki',      '#6b7c47', 15),
  ('CO', 'Corail',    '#f97060', 16),
  ('TQ', 'Turquoise', '#0d9488', 17),
  ('LB', 'Bleu ciel', '#7dd3fc', 18),
  ('MN', 'Bordeaux',  '#881337', 19),
  ('CH', 'Chameau',   '#c4943a', 20);

-- ============================================================
-- SECTION 6 — MARQUES
-- ============================================================
CREATE TABLE brands (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 7 — SÉQUENCES PAR CATÉGORIE (pour barcode)
-- Chaque catégorie a son compteur indépendant (max 9999 produits)
-- ============================================================
CREATE SEQUENCE seq_ts START 1 INCREMENT 1 MINVALUE 1 MAXVALUE 9999 NO CYCLE;
CREATE SEQUENCE seq_sh START 1 INCREMENT 1 MINVALUE 1 MAXVALUE 9999 NO CYCLE;
CREATE SEQUENCE seq_pt START 1 INCREMENT 1 MINVALUE 1 MAXVALUE 9999 NO CYCLE;
CREATE SEQUENCE seq_jk START 1 INCREMENT 1 MINVALUE 1 MAXVALUE 9999 NO CYCLE;
CREATE SEQUENCE seq_ac START 1 INCREMENT 1 MINVALUE 1 MAXVALUE 9999 NO CYCLE;
CREATE SEQUENCE seq_ot START 1 INCREMENT 1 MINVALUE 1 MAXVALUE 9999 NO CYCLE;

CREATE OR REPLACE FUNCTION get_next_seq(cat_code CHAR(2))
RETURNS INTEGER AS $$
DECLARE next_val INTEGER;
BEGIN
  CASE cat_code
    WHEN 'TS' THEN SELECT nextval('seq_ts') INTO next_val;
    WHEN 'SH' THEN SELECT nextval('seq_sh') INTO next_val;
    WHEN 'PT' THEN SELECT nextval('seq_pt') INTO next_val;
    WHEN 'JK' THEN SELECT nextval('seq_jk') INTO next_val;
    WHEN 'AC' THEN SELECT nextval('seq_ac') INTO next_val;
    ELSE             SELECT nextval('seq_ot') INTO next_val;
  END CASE;
  RETURN next_val;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SECTION 8 — PRODUITS (modèle de base)
-- Un produit = un modèle (ex: "Nike Air Force")
-- Les variants couleur × taille sont dans product_variants
-- NOTE: sale_price et cost_price sont stockés HT (hors taxe)
-- ============================================================
CREATE TABLE products (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT          NOT NULL,
  description   TEXT,
  category_id   UUID          NOT NULL REFERENCES categories(id),
  brand_id      UUID          REFERENCES brands(id) ON DELETE SET NULL,
  cost_price    DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  sale_price    DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
  tva_rate      DECIMAL(5,2)  NOT NULL DEFAULT 19 CHECK (tva_rate >= 0 AND tva_rate <= 100),
  image_url     TEXT,
  seq_number    INTEGER       NOT NULL,
  is_archived   BOOLEAN       DEFAULT FALSE,
  archived_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   DEFAULT NOW(),
  -- Garantit qu'un même numéro de séquence ne peut exister
  -- deux fois dans la même catégorie → impossible d'avoir 2 barcodes identiques
  UNIQUE(category_id, seq_number)
);

CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_category  ON products(category_id);
CREATE INDEX idx_products_archived  ON products(is_archived, archived_at);

-- ============================================================
-- SECTION 9 — VARIANTS PRODUIT (SKU = barcode)
-- Algorithme barcode: [CAT(2)][SEQ(4)][CLR(2)][SZ(3)] = 11 chars
-- Exemples:
--   TS0001BKXLG = T-shirt #1, Noir, XL
--   SH0002WH042 = Chaussure #2, Blanc, EU42
--   PT0003BU032 = Pantalon #3, Bleu, W32
-- ============================================================
CREATE TABLE product_variants (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color_id    UUID        NOT NULL REFERENCES colors(id),
  size        TEXT        NOT NULL,
  size_code   CHAR(3)     NOT NULL,
  barcode     TEXT        NOT NULL UNIQUE,
  quantity    INTEGER     NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  is_active   BOOLEAN     DEFAULT TRUE,
  is_archived BOOLEAN     DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, color_id, size)
);

CREATE UNIQUE INDEX idx_variants_barcode   ON product_variants(barcode);
CREATE        INDEX idx_variants_product   ON product_variants(product_id);
CREATE        INDEX idx_variants_quantity  ON product_variants(quantity) WHERE is_archived = FALSE;
CREATE        INDEX idx_variants_low_stock ON product_variants(quantity) WHERE quantity > 0 AND is_archived = FALSE;

-- ============================================================
-- ALGORITHME BARCODE
-- Format: [CAT2][SEQ4][CLR2][SZ3] = 11 caractères, Code128
-- ============================================================
CREATE OR REPLACE FUNCTION generate_sku(
  p_cat_code   CHAR(2),
  p_seq_num    INTEGER,
  p_color_code CHAR(2),
  p_size_code  CHAR(3)
)
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(p_cat_code)
      || LPAD(p_seq_num::TEXT, 4, '0')
      || UPPER(p_color_code)
      || UPPER(p_size_code);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION normalize_size_code(p_size TEXT)
RETURNS CHAR(3) AS $$
BEGIN
  RETURN CASE
    WHEN p_size = 'XS'     THEN 'XSS'
    WHEN p_size = 'S'      THEN 'SML'
    WHEN p_size = 'M'      THEN 'MED'
    WHEN p_size = 'L'      THEN 'LRG'
    WHEN p_size = 'XL'     THEN 'XLG'
    WHEN p_size = 'XXL'    THEN 'XXL'
    WHEN p_size = '3XL'    THEN '3XL'
    WHEN p_size = 'Unique' THEN 'UNQ'
    WHEN p_size = 'S/M'    THEN 'SMM'
    WHEN p_size = 'M/L'    THEN 'MLL'
    WHEN p_size ~ '^\d+$'  THEN LPAD(p_size, 3, '0')
    ELSE UPPER(LEFT(p_size, 3))
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- SECTION 10 — VENTES
-- ============================================================
CREATE SEQUENCE seq_sale_number START 1 INCREMENT 1;

-- [FIX-8] Utilisation du fuseau Africa/Algiers pour la date dans le numéro de vente
-- L'ancienne version utilisait NOW() (UTC) ce qui donnait la mauvaise date
-- entre 00h00 et 01h00 heure locale (UTC+1).
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'VTE-' || TO_CHAR(NOW() AT TIME ZONE 'Africa/Algiers', 'YYYYMMDD') || '-' ||
         LPAD(nextval('seq_sale_number')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE TABLE sales (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_number         TEXT          UNIQUE NOT NULL DEFAULT generate_sale_number(),
  total_ht            DECIMAL(12,2) NOT NULL DEFAULT 0,
  tva_amount          DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_ttc           DECIMAL(12,2) NOT NULL DEFAULT 0,
  customer_name       TEXT,
  notes               TEXT,
  sold_by             UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  synced_from_offline BOOLEAN       DEFAULT FALSE,
  created_at          TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX idx_sales_date   ON sales(created_at DESC);
CREATE INDEX idx_sales_number ON sales(sale_number);

-- variant_id est nullable + ON DELETE SET NULL
-- Raison: purge_expired_archives() supprime les product_variants après 1 an.
-- Toutes les données de vente sont préservées via les colonnes snapshot
-- (barcode, product_name, category_name, size, color_name).
-- variant_id devient NULL uniquement lors de la purge — jamais lors d'une vente normale.
CREATE TABLE sale_items (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id         UUID          NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  variant_id      UUID          REFERENCES product_variants(id) ON DELETE SET NULL,
  -- Snapshots immuables au moment de la vente (historique garanti même après purge)
  barcode         TEXT          NOT NULL,
  product_name    TEXT          NOT NULL,
  category_name   TEXT          NOT NULL,
  size            TEXT          NOT NULL,
  color_name      TEXT          NOT NULL,
  -- Prix
  quantity        INTEGER       NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_ht   DECIMAL(12,2) NOT NULL,
  tva_rate        DECIMAL(5,2)  NOT NULL,
  unit_price_ttc  DECIMAL(12,2) NOT NULL,
  subtotal_ht     DECIMAL(12,2) NOT NULL,
  subtotal_ttc    DECIMAL(12,2) NOT NULL,
  created_at      TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX idx_sale_items_sale    ON sale_items(sale_id);
CREATE INDEX idx_sale_items_variant ON sale_items(variant_id);
CREATE INDEX idx_sale_items_barcode ON sale_items(barcode);

-- ============================================================
-- SECTION 11 — MOUVEMENTS DE STOCK (journal complet)
-- variant_id → ON DELETE CASCADE
-- Raison: quand un variant archivé est purgé après 1 an,
-- ses mouvements de stock n'ont plus d'utilité et sont supprimés.
-- L'historique des ventes est préservé dans sale_items (snapshots).
-- ============================================================
CREATE TABLE stock_movements (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id      UUID        REFERENCES product_variants(id) ON DELETE CASCADE,
  movement_type   TEXT        NOT NULL
                              CHECK (movement_type IN ('IN','OUT','ADJUSTMENT','ARCHIVE','UNARCHIVE')),
  quantity_change INTEGER     NOT NULL,
  quantity_before INTEGER     NOT NULL,
  quantity_after  INTEGER     NOT NULL,
  reference_id    UUID,
  reference_type  TEXT        CHECK (reference_type IN ('sale','manual','adjustment','import','offline_sync')),
  notes           TEXT,
  created_by      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_movements_variant ON stock_movements(variant_id, created_at DESC);
CREATE INDEX idx_movements_date    ON stock_movements(created_at DESC);
CREATE INDEX idx_movements_type    ON stock_movements(movement_type);

-- ============================================================
-- SECTION 12 — NOTIFICATIONS IN-APP
-- ============================================================
CREATE TABLE notifications (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  type            TEXT        NOT NULL
                              CHECK (type IN ('low_stock','out_of_stock','sale_success','sync_complete','error','info')),
  title           TEXT        NOT NULL,
  message         TEXT        NOT NULL,
  reference_id    UUID,
  reference_type  TEXT,
  is_read         BOOLEAN     DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifs_user   ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifs_unread ON notifications(is_read, created_at DESC) WHERE is_read = FALSE;

-- ============================================================
-- SECTION 13 — FILE D'ATTENTE OFFLINE SYNC
-- Les actions offline sont stockées dans IndexedDB (Dexie)
-- puis envoyées ici au retour de la connexion
-- [FIX-12] Colonne created_by ajoutée pour audit trail et filtrage
--          par utilisateur dans un contexte multi-admin futur
-- ============================================================
CREATE TABLE sync_queue (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation     TEXT        NOT NULL
                            CHECK (operation IN ('sale','stock_in','stock_adjustment')),
  payload       JSONB       NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','processing','done','error')),
  error_message TEXT,
  retry_count   INTEGER     DEFAULT 0,
  created_by    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  synced_at     TIMESTAMPTZ
);

CREATE INDEX idx_sync_pending  ON sync_queue(status, created_at) WHERE status = 'pending';
CREATE INDEX idx_sync_user     ON sync_queue(created_by, status);

-- ============================================================
-- SECTION 14 — TRIGGERS ET AUTOMATISMES
-- ============================================================

-- 14.1 — Auto updated_at sur toutes les tables mutables
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_upd BEFORE UPDATE ON products         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_variants_upd BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_profiles_upd BEFORE UPDATE ON profiles         FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 14.2 — Réduction atomique du stock lors d'une vente
-- FOR UPDATE verrouille la ligne: 2 scans simultanés ne créent pas de race condition
-- [FIX-14] Apostrophe SQL corrigée dans le message RAISE EXCEPTION
CREATE OR REPLACE FUNCTION on_sale_item_insert()
RETURNS TRIGGER AS $$
DECLARE
  current_qty INTEGER;
BEGIN
  -- variant_id est toujours fourni lors d'un nouvel INSERT (jamais NULL à ce stade)
  IF NEW.variant_id IS NULL THEN
    RAISE EXCEPTION 'variant_id obligatoire lors de la création d''un sale_item';
  END IF;

  SELECT quantity INTO current_qty
  FROM product_variants WHERE id = NEW.variant_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VARIANT_INTROUVABLE: id=%', NEW.variant_id;
  END IF;

  IF current_qty < NEW.quantity THEN
    RAISE EXCEPTION 'STOCK_INSUFFISANT: % disponible, % demandé pour barcode=%',
      current_qty, NEW.quantity, NEW.barcode;
  END IF;

  UPDATE product_variants
  SET quantity = quantity - NEW.quantity, updated_at = NOW()
  WHERE id = NEW.variant_id;

  INSERT INTO stock_movements
    (variant_id, movement_type, quantity_change, quantity_before, quantity_after, reference_id, reference_type)
  VALUES
    (NEW.variant_id, 'OUT', -NEW.quantity, current_qty, current_qty - NEW.quantity, NEW.sale_id, 'sale');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sale_item_stock
  AFTER INSERT ON sale_items
  FOR EACH ROW EXECUTE FUNCTION on_sale_item_insert();

-- 14.3 — Notification stock faible / épuisé
-- Jointure propre via pv.id (évite le produit-cartésien implicite)
-- Déclenche uniquement quand on PASSE sous le seuil (évite le spam)
CREATE OR REPLACE FUNCTION on_variant_quantity_change()
RETURNS TRIGGER AS $$
DECLARE
  threshold  INTEGER;
  prod_name  TEXT;
  color_name TEXT;
BEGIN
  IF NEW.quantity = OLD.quantity THEN RETURN NEW; END IF;

  SELECT (value#>>'{}')::INTEGER INTO threshold
  FROM settings WHERE key = 'low_stock_threshold';

  IF NEW.quantity <= threshold AND OLD.quantity > threshold THEN
    SELECT p.name, c.name_fr
    INTO prod_name, color_name
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    JOIN colors   c ON c.id = pv.color_id
    WHERE pv.id = NEW.id;

    INSERT INTO notifications (type, title, message, reference_id, reference_type)
    VALUES (
      CASE WHEN NEW.quantity = 0 THEN 'out_of_stock' ELSE 'low_stock' END,
      CASE WHEN NEW.quantity = 0 THEN '⚠️ Stock épuisé' ELSE '📉 Stock faible' END,
      prod_name || ' — ' || color_name || ' — Taille ' || NEW.size
        || ' : ' || NEW.quantity || ' pièce(s) restante(s)',
      NEW.id,
      'product_variant'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_low_stock_notif
  AFTER UPDATE OF quantity ON product_variants
  FOR EACH ROW EXECUTE FUNCTION on_variant_quantity_change();

-- ============================================================
-- SECTION 15 — FONCTIONS MÉTIER PRINCIPALES
-- ============================================================

-- 15.1 — Créer un produit avec TOUS ses variants à quantité 0
-- Logique clé: 1 appel crée le produit + génère tous les barcodes
-- Le front choisit ensuite les quantités variant par variant
--
-- [FIX-10] RAISE EXCEPTION sur toutes les erreurs intermédiaires.
--          L'ancienne version utilisait RETURN jsonb après l'INSERT produit,
--          ce qui committait le produit sans ses variants (données partielles).
--          Avec RAISE EXCEPTION, toute erreur annule l'intégralité de la transaction.
--
-- [FIX-11] IF FOUND utilisé après INSERT ... ON CONFLICT DO NOTHING.
--          variants_count n'est plus incrémenté si un conflit de doublon
--          (même color+size dans p_color_ids ou p_sizes) est ignoré.
CREATE OR REPLACE FUNCTION create_product_with_all_variants(
  p_name        TEXT,
  p_description TEXT,
  p_category_id UUID,
  p_brand_id    UUID,
  p_cost_price  DECIMAL,
  p_sale_price  DECIMAL,
  p_tva_rate    DECIMAL,
  p_image_url   TEXT,
  p_color_ids   UUID[],
  p_sizes       TEXT[]
)
RETURNS JSONB AS $$
DECLARE
  new_product_id UUID;
  cat_code       CHAR(2);
  seq_num        INTEGER;
  col_id         UUID;
  col_code       CHAR(2);
  sz_val         TEXT;
  sz_code        CHAR(3);
  gen_barcode    TEXT;
  variants_count INTEGER := 0;
  barcodes_arr   JSONB   := '[]'::jsonb;
BEGIN
  -- Validations initiales (avant tout INSERT)
  IF array_length(p_color_ids, 1) IS NULL OR array_length(p_color_ids, 1) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Au moins une couleur requise');
  END IF;
  IF array_length(p_sizes, 1) IS NULL OR array_length(p_sizes, 1) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Au moins une taille requise');
  END IF;

  SELECT code INTO cat_code FROM categories WHERE id = p_category_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Catégorie introuvable');
  END IF;

  -- Vérifier toutes les couleurs AVANT d'insérer le produit
  -- (évite d'insérer un produit si une couleur est invalide)
  FOREACH col_id IN ARRAY p_color_ids LOOP
    IF NOT EXISTS (SELECT 1 FROM colors WHERE id = col_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Couleur introuvable: ' || col_id);
    END IF;
  END LOOP;

  -- Tout est valide: on peut commencer les insertions
  seq_num := get_next_seq(cat_code);

  INSERT INTO products
    (name, description, category_id, brand_id, cost_price, sale_price, tva_rate, image_url, seq_number)
  VALUES
    (p_name, p_description, p_category_id, p_brand_id, p_cost_price, p_sale_price, p_tva_rate, p_image_url, seq_num)
  RETURNING id INTO new_product_id;

  -- [FIX-10] À partir d'ici, toute erreur lève une exception (annule tout)
  FOREACH col_id IN ARRAY p_color_ids LOOP
    SELECT code INTO col_code FROM colors WHERE id = col_id;
    -- Cette exception ne devrait jamais se déclencher (pré-validé ci-dessus)
    -- mais reste en sécurité défensive
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Couleur introuvable lors de l''insertion: %', col_id;
    END IF;

    FOREACH sz_val IN ARRAY p_sizes LOOP
      sz_code     := normalize_size_code(sz_val);
      gen_barcode := generate_sku(cat_code, seq_num, col_code, sz_code);

      INSERT INTO product_variants (product_id, color_id, size, size_code, barcode, quantity)
      VALUES (new_product_id, col_id, sz_val, sz_code, gen_barcode, 0)
      ON CONFLICT (product_id, color_id, size) DO NOTHING;

      -- [FIX-11] FOUND = FALSE si ON CONFLICT a ignoré la ligne (doublon dans les tableaux)
      IF FOUND THEN
        barcodes_arr   := barcodes_arr || jsonb_build_object(
          'barcode',    gen_barcode,
          'color_code', col_code,
          'color_id',   col_id,
          'size',       sz_val,
          'size_code',  sz_code
        );
        variants_count := variants_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'success',        true,
    'product_id',     new_product_id,
    'seq_number',     seq_num,
    'variants_count', variants_count,
    'barcodes',       barcodes_arr
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15.2 — Ajouter du stock à un variant existant
-- Vérifie que le variant n'est pas archivé avant d'accepter le stock
CREATE OR REPLACE FUNCTION add_stock_to_variant(
  p_variant_id   UUID,
  p_quantity_add INTEGER,
  p_notes        TEXT DEFAULT NULL,
  p_created_by   UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_rec       RECORD;
  new_qty     INTEGER;
BEGIN
  IF p_quantity_add <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'La quantité doit être supérieure à 0');
  END IF;

  SELECT quantity, is_archived, barcode
  INTO v_rec
  FROM product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Variant introuvable');
  END IF;

  IF v_rec.is_archived THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'VARIANT_ARCHIVE',
      'message', 'Impossible d''ajouter du stock à un article archivé (barcode: ' || v_rec.barcode || ')'
    );
  END IF;

  new_qty := v_rec.quantity + p_quantity_add;

  UPDATE product_variants
  SET quantity = new_qty, updated_at = NOW()
  WHERE id = p_variant_id;

  INSERT INTO stock_movements
    (variant_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, notes, created_by)
  VALUES
    (p_variant_id, 'IN', p_quantity_add, v_rec.quantity, new_qty, 'manual', p_notes, p_created_by);

  RETURN jsonb_build_object(
    'success',         true,
    'variant_id',      p_variant_id,
    'barcode',         v_rec.barcode,
    'quantity_before', v_rec.quantity,
    'quantity_added',  p_quantity_add,
    'quantity_after',  new_qty
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15.3 — Vente par scan de code-barres (fonction principale du scanner)
-- 1 scan = 1 vente = 1 article. Simple, rapide, offline-compatible.
CREATE OR REPLACE FUNCTION sell_by_barcode(
  p_barcode       TEXT,
  p_customer_name TEXT DEFAULT NULL,
  p_sold_by       UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_rec       RECORD;
  new_sale_id UUID;
  sale_num    TEXT;
  price_ht    DECIMAL(12,2);
  tva_rate    DECIMAL(5,2);
  tva_amount  DECIMAL(12,2);
  price_ttc   DECIMAL(12,2);
BEGIN
  SELECT
    pv.id       AS variant_id,
    pv.quantity,
    pv.size,
    p.name      AS product_name,
    p.sale_price,
    p.tva_rate  AS prod_tva,
    cat.name_fr AS category_name,
    col.name_fr AS color_name
  INTO v_rec
  FROM product_variants pv
  JOIN products   p   ON p.id   = pv.product_id
  JOIN categories cat ON cat.id = p.category_id
  JOIN colors     col ON col.id = pv.color_id
  WHERE pv.barcode    = p_barcode
    AND pv.is_archived = FALSE
    AND p.is_archived  = FALSE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'CODE_INTROUVABLE',
      'message', 'Ce code-barres n''existe pas ou le produit est archivé'
    );
  END IF;

  IF v_rec.quantity < 1 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'STOCK_EPUISE',
      'message', 'Stock épuisé — ' || v_rec.product_name || ' ' || v_rec.color_name || ' taille ' || v_rec.size
    );
  END IF;

  price_ht   := v_rec.sale_price;
  tva_rate   := v_rec.prod_tva;
  tva_amount := ROUND(price_ht * tva_rate / 100, 2);
  price_ttc  := price_ht + tva_amount;

  sale_num := generate_sale_number();
  INSERT INTO sales (sale_number, total_ht, tva_amount, total_ttc, customer_name, sold_by)
  VALUES (sale_num, price_ht, tva_amount, price_ttc, p_customer_name, p_sold_by)
  RETURNING id INTO new_sale_id;

  -- L'INSERT sur sale_items déclenche trg_sale_item_stock → réduit stock + journal
  INSERT INTO sale_items
    (sale_id, variant_id, barcode, product_name, category_name, size, color_name,
     quantity, unit_price_ht, tva_rate, unit_price_ttc, subtotal_ht, subtotal_ttc)
  VALUES
    (new_sale_id, v_rec.variant_id, p_barcode, v_rec.product_name, v_rec.category_name,
     v_rec.size, v_rec.color_name,
     1, price_ht, tva_rate, price_ttc, price_ht, price_ttc);

  RETURN jsonb_build_object(
    'success',      true,
    'sale_id',      new_sale_id,
    'sale_number',  sale_num,
    'product_name', v_rec.product_name,
    'color',        v_rec.color_name,
    'size',         v_rec.size,
    'category',     v_rec.category_name,
    'price_ht',     price_ht,
    'tva',          tva_amount,
    'price_ttc',    price_ttc
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15.4 — Archiver un variant (soft delete, purge après 1 an)
CREATE OR REPLACE FUNCTION archive_variant(
  p_variant_id UUID,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE current_qty INTEGER;
BEGIN
  SELECT quantity INTO current_qty
  FROM product_variants WHERE id = p_variant_id AND is_archived = FALSE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Variant introuvable ou déjà archivé');
  END IF;

  UPDATE product_variants
  SET is_archived = TRUE, archived_at = NOW(), is_active = FALSE, updated_at = NOW()
  WHERE id = p_variant_id;

  INSERT INTO stock_movements
    (variant_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, created_by)
  VALUES
    (p_variant_id, 'ARCHIVE', 0, current_qty, current_qty, 'manual', p_created_by);

  RETURN jsonb_build_object('success', true, 'archived_at', NOW(), 'quantity_at_archive', current_qty);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15.5 — Archiver un produit entier (tous ses variants)
-- [FIX-9] Variable 'count' renommée 'v_count'
--         'count' est une fonction système réservée en PostgreSQL.
--         L'ancienne déclaration causait une ambiguïté potentielle avec
--         l'utilisation future de COUNT() dans la même portée.
CREATE OR REPLACE FUNCTION archive_product(
  p_product_id UUID,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_id    UUID;
  v_count INTEGER := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE id = p_product_id AND is_archived = FALSE) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Produit introuvable ou déjà archivé');
  END IF;

  UPDATE products
  SET is_archived = TRUE, archived_at = NOW(), updated_at = NOW()
  WHERE id = p_product_id;

  FOR v_id IN
    SELECT id FROM product_variants
    WHERE product_id = p_product_id AND is_archived = FALSE
  LOOP
    PERFORM archive_variant(v_id, p_created_by);
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'variants_archived', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15.6 — Purge automatique des archives > 1 an
-- À appeler via un cron Supabase Edge Function (ex: tous les jours à 03h00 Algiers)
-- stock_movements ON DELETE CASCADE → supprimés avec leurs variants
-- sale_items.variant_id ON DELETE SET NULL → sale_items conservés avec variant_id = NULL
CREATE OR REPLACE FUNCTION purge_expired_archives()
RETURNS JSONB AS $$
DECLARE
  deleted_variants INTEGER;
  deleted_products INTEGER;
  retention_days   INTEGER;
BEGIN
  SELECT (value#>>'{}')::INTEGER INTO retention_days
  FROM settings WHERE key = 'archive_retention_days';

  DELETE FROM product_variants
  WHERE is_archived = TRUE
    AND archived_at < NOW() - (retention_days || ' days')::INTERVAL;
  GET DIAGNOSTICS deleted_variants = ROW_COUNT;

  -- Supprimer les produits archivés sans plus aucun variant
  DELETE FROM products
  WHERE is_archived = TRUE
    AND archived_at < NOW() - (retention_days || ' days')::INTERVAL
    AND id NOT IN (SELECT DISTINCT product_id FROM product_variants);
  GET DIAGNOSTICS deleted_products = ROW_COUNT;

  RETURN jsonb_build_object(
    'success',          true,
    'deleted_variants', deleted_variants,
    'deleted_products', deleted_products,
    'purged_at',        NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SECTION 16 — VUES ANALYTIQUES (dashboard + rapports)
-- ============================================================

-- Vue complète d'un variant avec tous ses détails (utilisée partout)
CREATE OR REPLACE VIEW v_variant_full AS
SELECT
  pv.id,
  pv.barcode,
  pv.size,
  pv.size_code,
  pv.quantity,
  pv.is_active,
  pv.is_archived,
  pv.created_at              AS variant_created_at,
  p.id                       AS product_id,
  p.name                     AS product_name,
  p.description,
  p.cost_price,
  p.sale_price,
  p.tva_rate,
  ROUND(p.sale_price * (1 + p.tva_rate/100), 2)          AS price_ttc,
  ROUND(p.sale_price - p.cost_price, 2)                   AS margin_ht,
  ROUND((p.sale_price - p.cost_price) / NULLIF(p.sale_price, 0) * 100, 1) AS margin_pct,
  p.image_url,
  p.seq_number,
  p.is_archived              AS product_archived,
  cat.id                     AS category_id,
  cat.code                   AS category_code,
  cat.name_fr                AS category_name,
  cat.size_type,
  col.id                     AS color_id,
  col.code                   AS color_code,
  col.name_fr                AS color_name,
  col.hex                    AS color_hex,
  b.name                     AS brand_name
FROM product_variants pv
JOIN products   p   ON p.id   = pv.product_id
JOIN categories cat ON cat.id = p.category_id
JOIN colors     col ON col.id = pv.color_id
LEFT JOIN brands b  ON b.id   = p.brand_id;

-- Statistiques journalières
-- JOIN direct (évite la sous-requête corrélée de la v1.0)
CREATE OR REPLACE VIEW v_daily_stats AS
SELECT
  DATE(s.created_at AT TIME ZONE 'Africa/Algiers') AS sale_date,
  COUNT(DISTINCT s.id)                              AS transactions_count,
  SUM(s.total_ht)                                   AS revenue_ht,
  SUM(s.tva_amount)                                 AS tva_total,
  SUM(s.total_ttc)                                  AS revenue_ttc,
  COALESCE(SUM(si.quantity), 0)                     AS units_sold,
  COALESCE(
    SUM(si.quantity * (si.unit_price_ht - COALESCE(p2.cost_price, 0))), 0
  )                                                 AS profit_ht
FROM sales s
JOIN sale_items             si  ON si.sale_id    = s.id
LEFT JOIN product_variants  pv2 ON pv2.id        = si.variant_id
LEFT JOIN products          p2  ON p2.id         = pv2.product_id
GROUP BY DATE(s.created_at AT TIME ZONE 'Africa/Algiers')
ORDER BY sale_date DESC;

-- Top produits vendus
CREATE OR REPLACE VIEW v_top_products AS
SELECT
  p.id                  AS product_id,
  p.name                AS product_name,
  cat.name_fr           AS category_name,
  b.name                AS brand_name,
  SUM(si.quantity)      AS total_sold,
  SUM(si.subtotal_ttc)  AS total_revenue_ttc,
  COUNT(DISTINCT s.id)  AS sale_count
FROM sale_items si
JOIN product_variants pv ON pv.id  = si.variant_id
JOIN products   p  ON p.id  = pv.product_id
JOIN categories cat ON cat.id = p.category_id
LEFT JOIN brands b  ON b.id   = p.brand_id
JOIN sales s ON s.id = si.sale_id
WHERE si.variant_id IS NOT NULL
GROUP BY p.id, p.name, cat.name_fr, b.name
ORDER BY total_sold DESC;

-- Produits en stock faible ou épuisé
CREATE OR REPLACE VIEW v_low_stock AS
SELECT
  vf.*,
  (SELECT (value#>>'{}')::INTEGER FROM settings WHERE key = 'low_stock_threshold') AS threshold
FROM v_variant_full vf
WHERE vf.is_archived    = FALSE
  AND vf.product_archived = FALSE
  AND vf.quantity <= (SELECT (value#>>'{}')::INTEGER FROM settings WHERE key = 'low_stock_threshold')
ORDER BY vf.quantity ASC, vf.product_name;

-- Valeur totale du stock par catégorie
CREATE OR REPLACE VIEW v_stock_value AS
SELECT
  cat.name_fr                                                          AS category_name,
  COUNT(DISTINCT pv.product_id)                                        AS product_count,
  SUM(pv.quantity)                                                     AS total_units,
  ROUND(SUM(pv.quantity * p.cost_price), 2)                            AS total_cost_value,
  ROUND(SUM(pv.quantity * p.sale_price), 2)                            AS total_sale_value_ht,
  ROUND(SUM(pv.quantity * p.sale_price * (1 + p.tva_rate/100)), 2)    AS total_sale_value_ttc
FROM product_variants pv
JOIN products   p   ON p.id   = pv.product_id
JOIN categories cat ON cat.id = p.category_id
WHERE pv.is_archived = FALSE AND p.is_archived = FALSE
GROUP BY cat.name_fr
ORDER BY total_sale_value_ttc DESC;

-- ============================================================
-- SECTION 17 — ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands            ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE colors            ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_presets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales             ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue        ENABLE ROW LEVEL SECURITY;

-- Helper is_admin: vérifie que l'user connecté est actif et admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ---- Lecture: tout utilisateur authentifié peut lire ----
CREATE POLICY "read_all_auth" ON products         FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "read_all_auth" ON product_variants FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "read_all_auth" ON brands           FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "read_all_auth" ON categories       FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "read_all_auth" ON colors           FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "read_all_auth" ON size_presets     FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "read_all_auth" ON sales            FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "read_all_auth" ON sale_items       FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "read_all_auth" ON stock_movements  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "read_all_auth" ON settings         FOR SELECT TO authenticated USING (TRUE);

-- ---- Écriture: admin uniquement pour les données sensibles ----
CREATE POLICY "admin_write" ON products         FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_write" ON product_variants FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_write" ON brands           FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_write" ON settings         FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- [FIX-13] Politiques d'écriture admin pour les référentiels (manquaient en v1.1.0)
-- Sans ces politiques, même un admin ne pouvait pas ajouter/modifier/supprimer
-- des catégories, couleurs ou tailles via l'interface.
CREATE POLICY "admin_write" ON categories   FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_write" ON colors       FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_write" ON size_presets FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ---- Ventes: tout user authentifié peut créer (scan hors-ligne inclus) ----
CREATE POLICY "auth_insert_sale"      ON sales      FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "auth_insert_sale_item" ON sale_items FOR INSERT TO authenticated WITH CHECK (TRUE);

-- ---- Sync queue: accessible à tous les users authentifiés ----
CREATE POLICY "auth_sync" ON sync_queue FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- ---- Notifications: chaque user voit les siennes + les notifications système (user_id NULL) ----
CREATE POLICY "own_notifs" ON notifications FOR ALL TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (TRUE);

-- ---- Profils ----
CREATE POLICY "view_profiles"  ON profiles FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "update_own"     ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "admin_profiles" ON profiles FOR ALL    TO authenticated USING (is_admin());

-- ============================================================
-- SECTION 18 — BUCKET STORAGE (images produits)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public_read_images" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'product-images');

CREATE POLICY "auth_upload_images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "admin_delete_images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND is_admin());

-- ============================================================
-- SECTION 19 — DONNÉES INITIALES
-- ============================================================
INSERT INTO brands (name) VALUES
  ('Nike'), ('Adidas'), ('Zara'), ('H&M'), ('Puma'),
  ('New Balance'), ('Lacoste'), ('Sans marque')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- FIN DU SCHÉMA — VERSION 1.2.0 PRODUCTION
-- ============================================================
-- Tests de validation à lancer après import:
--
-- 1. Barcode algorithm
-- SELECT generate_sku('TS', 1, 'BK', 'XLG');   -- → 'TS0001BKXLG' (11 chars)
-- SELECT generate_sku('SH', 2, 'WH', '042');   -- → 'SH0002WH042' (11 chars)
-- SELECT generate_sku('PT', 3, 'BU', '032');   -- → 'PT0003BU032' (11 chars)
--
-- 2. Vérifier le timezone dans generate_sale_number [FIX-8]
-- SELECT generate_sale_number();
-- -- Le numéro doit afficher la date en heure Algérienne (UTC+1), pas UTC.
--
-- 3. Vues analytiques
-- SELECT * FROM v_variant_full LIMIT 5;
-- SELECT * FROM v_low_stock;
-- SELECT * FROM v_stock_value;
-- SELECT * FROM v_daily_stats;
--
-- 4. Tailles free disponibles
-- SELECT * FROM size_presets WHERE size_type = 'free' ORDER BY sort_order;
--
-- 5. Contrainte unique category+seq (doit exister)
-- SELECT conname FROM pg_constraint WHERE conname LIKE '%products%seq%';
--
-- 6. FK sale_items.variant_id nullable
-- SELECT column_name, is_nullable FROM information_schema.columns
-- WHERE table_name='sale_items' AND column_name='variant_id';  -- → YES
--
-- 7. FK stock_movements ON DELETE CASCADE
-- SELECT confdeltype FROM pg_constraint
-- JOIN pg_class ON pg_class.oid = conrelid
-- WHERE relname = 'stock_movements' AND contype = 'f'
-- AND conname LIKE '%variant%';  -- → 'c' (cascade)
--
-- 8. sync_queue a bien la colonne created_by [FIX-12]
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'sync_queue';  -- doit inclure 'created_by'
--
-- 9. RLS write sur categories/colors/size_presets [FIX-13]
-- SELECT polname, polcmd FROM pg_policy
-- JOIN pg_class ON pg_class.oid = pg_policy.polrelid
-- WHERE relname IN ('categories','colors','size_presets');
-- ============================================================
