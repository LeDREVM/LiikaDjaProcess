-- ================================================================
-- LANMOU DOUVAN — SETUP SUPABASE COMPLET (entrées / sorties)
-- Dashboard Dja & Liika  ·  LiikaDjaProcess
--
-- À FAIRE UNE SEULE FOIS :
--   1. https://supabase.com → ton projet → SQL Editor
--   2. Coller CE fichier entier → Run
--
-- Idempotent : peut être relancé sans risque (IF NOT EXISTS / OR REPLACE).
-- Gère TOUTES les lectures (entrées) et écritures (sorties) de l'app :
--   • app_state      → l'état complet de l'app (1 ligne JSON 'main')
--   • user_accounts  → les PIN (dja / liika)
--   • app_sessions   → la présence « qui est en ligne »
-- ================================================================


-- ================================================================
-- 1) TABLE app_state — état global (une seule ligne, id = 'main')
--    La colonne data (JSONB) contient TOUT : dja, liika, couple,
--    recipes, ferments, games, + métadonnées de synchro (_t, updatedAt).
-- ================================================================
CREATE TABLE IF NOT EXISTS app_state (
  id          TEXT        PRIMARY KEY DEFAULT 'main',
  data        JSONB       NOT NULL    DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  device_id   TEXT        NOT NULL    DEFAULT ''
);
-- Bases déjà créées sans la colonne :
ALTER TABLE app_state ADD COLUMN IF NOT EXISTS device_id TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_app_state_data ON app_state USING GIN (data);

-- RLS : accès lecture/écriture via la clé « publishable » (anon). App privée par PIN côté front.
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all" ON app_state;
CREATE POLICY "allow_all" ON app_state FOR ALL USING (true) WITH CHECK (true);


-- ================================================================
-- 2) TABLE user_accounts — PIN par compte ('dja' / 'liika')
-- ================================================================
CREATE TABLE IF NOT EXISTS user_accounts (
  id          TEXT        PRIMARY KEY,           -- 'dja' ou 'liika'
  pin         TEXT        NOT NULL DEFAULT '',   -- PIN 4 chiffres (app privée)
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all" ON user_accounts;
CREATE POLICY "allow_all" ON user_accounts FOR ALL USING (true) WITH CHECK (true);


-- ================================================================
-- 3) TABLE app_sessions — présence en ligne (ping toutes les 60 s)
-- ================================================================
CREATE TABLE IF NOT EXISTS app_sessions (
  id          TEXT        PRIMARY KEY,           -- device_id (localStorage "ld-device-id")
  user_name   TEXT        NOT NULL DEFAULT 'Appareil',
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_online   BOOLEAN     NOT NULL DEFAULT TRUE
);

ALTER TABLE app_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all" ON app_sessions;
CREATE POLICY "allow_all" ON app_sessions FOR ALL USING (true) WITH CHECK (true);


-- ================================================================
-- 4) REALTIME — pour que les changements d'un appareil arrivent sur l'autre
-- ================================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['app_state','user_accounts','app_sessions'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END $$;


-- ================================================================
-- 5) NETTOYAGE présence (optionnel) — marque hors-ligne après 5 min
--    À appeler manuellement ou via un cron / Edge Function.
-- ================================================================
CREATE OR REPLACE FUNCTION cleanup_offline_sessions()
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE app_sessions
  SET    is_online = FALSE
  WHERE  last_seen < NOW() - INTERVAL '5 minutes' AND is_online = TRUE;
END;
$$;


-- ================================================================
-- 6) LIGNE INITIALE app_state — créée seulement si absente (squelette vide).
--    L'app remplit ensuite via ses propres écritures (sorties).
-- ================================================================
INSERT INTO app_state (id, data, updated_at, device_id)
VALUES (
  'main',
  jsonb_build_object(
    'dja',    jsonb_build_object('objectives','[]'::jsonb,'actions','[]'::jsonb,'notes','[]'::jsonb,'meals','[]'::jsonb,'sport','[]'::jsonb,'budget','{"revenus":[],"depenses":[]}'::jsonb,'vision',''),
    'liika',  jsonb_build_object('objectives','[]'::jsonb,'actions','[]'::jsonb,'notes','[]'::jsonb,'meals','[]'::jsonb,'sport','[]'::jsonb,'budget','{"revenus":[],"depenses":[]}'::jsonb,'vision',''),
    'couple', jsonb_build_object('objectives','[]'::jsonb,'actions','[]'::jsonb,'notes','[]'::jsonb,'meals','[]'::jsonb,'sport','[]'::jsonb,'budget','{"revenus":[],"depenses":[]}'::jsonb,'vision','','planning','{}'::jsonb,'maison','{"checked":{},"custom":[],"lastReset":""}'::jsonb,'objMensuels','[]'::jsonb,'ideeJour','{"liste":[],"custom":[]}'::jsonb),
    'recipes',  '[]'::jsonb,
    'ferments', '[]'::jsonb,
    'games',    jsonb_build_object('chess','{"fen":"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1","lastBy":"","result":""}'::jsonb,'crossword','{"filled":{},"done":false}'::jsonb,'streak','{"count":0,"lastDay":""}'::jsonb,'badges','[]'::jsonb),
    '_t',        '{}'::jsonb,
    'updatedAt', ''
  ),
  NOW(),
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Lignes PIN initiales (vides) — créées seulement si absentes.
INSERT INTO user_accounts (id, pin) VALUES ('dja',''), ('liika','')
ON CONFLICT (id) DO NOTHING;


-- ================================================================
-- VÉRIFICATION
-- ================================================================
SELECT 'app_state'     AS table, COUNT(*) FROM app_state
UNION ALL SELECT 'user_accounts', COUNT(*) FROM user_accounts
UNION ALL SELECT 'app_sessions',  COUNT(*) FROM app_sessions;

SELECT tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
  AND tablename IN ('app_state','user_accounts','app_sessions')
ORDER BY tablename;
