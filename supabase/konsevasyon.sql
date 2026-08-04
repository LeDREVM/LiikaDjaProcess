-- ================================================================
-- LANMOU DOUVAN — Konsèvasyon : table dédiée (rézèv)
-- ================================================================
--
-- À FAIRE UNE FOIS :  Supabase → SQL Editor → coller → Run
-- Prérequis : setup.sql et drevmcook.sql déjà exécutés.
--
-- La « rézèv » est l'inventaire de ce qui est rentré à la maison : une
-- ligne par ingrédient suivi, avec sa date d'entrée. Le compte à rebours
-- (durée restante, alerte « à cuisiner en priorité ») est recalculé côté
-- app à partir du catalogue KV_ITEMS — il n'est donc PAS stocké ici.
--
-- Même choix que recipes/ferments : hors du blob app_state, table propre
-- et synchronisée en temps réel. Le câblage app.js migre automatiquement
-- la rézèv déjà présente en localStorage au premier chargement.
-- ================================================================


-- ================================================================
-- 1) TABLE rezev — inventaire de conservation
-- ================================================================
-- id : identifiant dérivé du nom de l'ingrédient (kvIdOf), ex. 'fruit-pain'.
--      Un ingrédient = une seule ligne : le racheter met à jour date_entree.
CREATE TABLE IF NOT EXISTS rezev (
  id          TEXT        PRIMARY KEY,
  nom         TEXT        NOT NULL DEFAULT '',
  emoji       TEXT        NOT NULL DEFAULT '',
  date_entree DATE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_id   TEXT        NOT NULL DEFAULT ''
);

ALTER TABLE rezev ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all" ON rezev;
CREATE POLICY "allow_all" ON rezev FOR ALL USING (true) WITH CHECK (true);


-- ================================================================
-- 2) REALTIME — sync de la rézèv entre appareils
-- ================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'rezev'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rezev;
  END IF;
END $$;


-- ================================================================
-- VÉRIFICATION
-- ================================================================
SELECT 'rezev' AS table, COUNT(*) FROM rezev;
