-- ================================================================
-- LANMOU DOUVAN — DrevmCook : tables dédiées (recettes & ferments)
-- ================================================================
--
-- À FAIRE UNE FOIS :  Supabase → SQL Editor → coller → Run
-- Prérequis : setup.sql déjà exécuté.
--
-- Sort les recettes & ferments du gros blob app_state pour leur donner
-- de vraies tables, requêtables et synchronisées en temps réel.
-- Le câblage côté app.js lit/écrit ces tables et migre automatiquement
-- les données déjà présentes dans le blob au premier chargement.
--
-- Choix : le journal d'un ferment reste un champ JSONB sur la table
-- ferments (l'app lit/écrit toujours le journal entier d'un coup → une
-- table séparée n'apporterait que de la complexité). Variante normalisée
-- (table ferment_journal) possible sur demande.
-- ================================================================


-- ================================================================
-- 1) TABLE recipes — recettes DrevmCook
-- ================================================================
CREATE TABLE IF NOT EXISTS recipes (
  id           TEXT        PRIMARY KEY,
  nom          TEXT        NOT NULL DEFAULT '',
  categorie    TEXT        NOT NULL DEFAULT 'Salés',
  tags         JSONB       NOT NULL DEFAULT '[]',   -- liste de chaînes
  ingredients  JSONB       NOT NULL DEFAULT '[]',   -- liste de chaînes
  preparation  TEXT        NOT NULL DEFAULT '',
  apports      TEXT        NOT NULL DEFAULT '',
  budget       TEXT        NOT NULL DEFAULT '',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_id    TEXT        NOT NULL DEFAULT ''
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all" ON recipes;
CREATE POLICY "allow_all" ON recipes FOR ALL USING (true) WITH CHECK (true);


-- ================================================================
-- 2) TABLE ferments — bocaux / lactofermentations
--    journal : tableau JSONB d'entrées {id,date,ph,odeur,couleur,note}
-- ================================================================
CREATE TABLE IF NOT EXISTS ferments (
  id            TEXT        PRIMARY KEY,
  nom           TEXT        NOT NULL DEFAULT '',
  type          TEXT        NOT NULL DEFAULT 'Légumes',
  start_date    DATE,
  duration_days INT         NOT NULL DEFAULT 14,
  notes         TEXT        NOT NULL DEFAULT '',
  done          BOOLEAN     NOT NULL DEFAULT FALSE,
  journal       JSONB       NOT NULL DEFAULT '[]',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_id     TEXT        NOT NULL DEFAULT ''
);

ALTER TABLE ferments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all" ON ferments;
CREATE POLICY "allow_all" ON ferments FOR ALL USING (true) WITH CHECK (true);


-- ================================================================
-- 3) REALTIME — sync recettes/ferments entre appareils
-- ================================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['recipes','ferments'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END $$;


-- ================================================================
-- VÉRIFICATION
-- ================================================================
SELECT 'recipes' AS table, COUNT(*) FROM recipes
UNION ALL SELECT 'ferments', COUNT(*) FROM ferments;
