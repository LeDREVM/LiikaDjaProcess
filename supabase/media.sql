-- ================================================================
-- LANMOU DOUVAN — Module Médias : table dédiée (liens YouTube)
-- ================================================================
--
-- À FAIRE UNE FOIS :  Supabase → SQL Editor → coller → Run
-- Prérequis : setup.sql déjà exécuté.
--
-- Bibliothèque multimédia partagée Dja & Liika : vidéos & playlists
-- YouTube, lecture intégrée dans l'app. Miniature via img.youtube.com,
-- titre via oEmbed (aucune clé API). Synchronisée en temps réel.
--
-- Le câblage côté app.js lit/écrit cette table et migre automatiquement
-- au premier chargement les médias déjà présents dans le blob app_state
-- (dont la playlist Mix Vibz par défaut).
-- ================================================================

CREATE TABLE IF NOT EXISTS media (
  id          TEXT        PRIMARY KEY,
  kind        TEXT        NOT NULL DEFAULT 'video',   -- 'video' | 'playlist'
  yt_id       TEXT        NOT NULL DEFAULT '',        -- ID vidéo (11 car.) ou ID playlist (PL…)
  title       TEXT        NOT NULL DEFAULT '',
  thumb       TEXT        NOT NULL DEFAULT '',         -- URL miniature (optionnel)
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_id   TEXT        NOT NULL DEFAULT ''
);

ALTER TABLE media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all" ON media;
CREATE POLICY "allow_all" ON media FOR ALL USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'media'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE media;
  END IF;
END $$;

SELECT 'media' AS table, COUNT(*) FROM media;
