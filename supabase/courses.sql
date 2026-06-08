-- ================================================================
-- LANMOU DOUVAN — Module Courses : table dédiée (liste de courses)
-- ================================================================
--
-- À FAIRE UNE FOIS :  Supabase → SQL Editor → coller → Run
-- Prérequis : setup.sql déjà exécuté.
--
-- Liste de courses partagée Dja & Liika, synchronisée en temps réel.
-- Triable par rayon, avec quantité/unité, prix optionnel et coche.
-- ================================================================

CREATE TABLE IF NOT EXISTS courses (
  id          TEXT        PRIMARY KEY,
  nom         TEXT        NOT NULL DEFAULT '',
  rayon       TEXT        NOT NULL DEFAULT 'Autre',
  qte         NUMERIC     NOT NULL DEFAULT 1,
  unite       TEXT        NOT NULL DEFAULT '',
  prix        NUMERIC,                       -- prix unitaire estimé (optionnel)
  done        BOOLEAN     NOT NULL DEFAULT FALSE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_id   TEXT        NOT NULL DEFAULT ''
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all" ON courses;
CREATE POLICY "allow_all" ON courses FOR ALL USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'courses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE courses;
  END IF;
END $$;

SELECT 'courses' AS table, COUNT(*) FROM courses;
