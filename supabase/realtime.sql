-- ================================================================
-- LANMOU DOUVAN — Synchronisation temps réel entre appareils
-- ================================================================
--
-- INSTRUCTIONS :
--   1. Ouvrir https://supabase.com → ton projet
--   2. Aller dans SQL Editor
--   3. Coller ce fichier entier → Run
--
-- CE SCRIPT FAIT :
--   ① Active Realtime sur app_state → les deux appareils se voient
--   ② Ajoute device_id dans app_state → évite les boucles de sync
--   ③ Crée la table app_sessions → présence en ligne (qui est connecté)
--   ④ Active Realtime sur app_sessions → compteur d'appareils en direct
-- ================================================================


-- ================================================================
-- ① ACTIVER REALTIME SUR app_state
-- Sans ça, les changements de l'un ne arrivent jamais sur l'autre.
-- ================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'app_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE app_state;
  END IF;
END;
$$;


-- ================================================================
-- ② COLONNE device_id — évite qu'un appareil traite ses propres saves
-- Chaque appareil a un ID unique (généré côté app, stocké localStorage).
-- Quand device A sauvegarde, device A voit son propre device_id dans
-- le payload Realtime → il ignore l'update (pas de boucle infinie).
-- ================================================================

ALTER TABLE app_state
  ADD COLUMN IF NOT EXISTS device_id TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN app_state.device_id IS
  'ID unique de l''appareil qui a effectué la dernière sauvegarde';


-- ================================================================
-- ③ TABLE app_sessions — présence en ligne
-- Chaque appareil envoie un "ping" toutes les 60 secondes.
-- Un appareil est considéré "en ligne" si last_seen < 5 minutes.
-- ================================================================

CREATE TABLE IF NOT EXISTS app_sessions (
  id          TEXT        PRIMARY KEY,
  user_name   TEXT        NOT NULL DEFAULT 'Appareil',
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_online   BOOLEAN     NOT NULL DEFAULT true
);

COMMENT ON TABLE app_sessions IS
  'Présence en ligne des appareils Dja & Liika (ping toutes les 60s)';
COMMENT ON COLUMN app_sessions.id IS
  'device_id généré côté client (localStorage "ld-device-id")';
COMMENT ON COLUMN app_sessions.user_name IS
  'Nom affiché (stocké dans localStorage "ld-username")';

-- RLS
ALTER TABLE app_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all" ON app_sessions;
CREATE POLICY "allow_all"
  ON app_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- ================================================================
-- ④ ACTIVER REALTIME SUR app_sessions
-- Permet au compteur "🟢 N appareils" de se mettre à jour en live.
-- ================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'app_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE app_sessions;
  END IF;
END;
$$;


-- ================================================================
-- NETTOYAGE AUTOMATIQUE (optionnel)
-- Marque comme offline les appareils inactifs depuis plus de 5 min.
-- À appeler manuellement ou via un cron Supabase Edge Function.
-- ================================================================

CREATE OR REPLACE FUNCTION cleanup_offline_sessions()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE app_sessions
  SET    is_online = false
  WHERE  last_seen < NOW() - INTERVAL '5 minutes'
    AND  is_online = true;
END;
$$;

COMMENT ON FUNCTION cleanup_offline_sessions IS
  'Marque hors-ligne les appareils sans ping depuis 5 min';


-- ================================================================
-- VÉRIFICATION FINALE
-- ================================================================

-- Tables activées dans Realtime
SELECT tablename
FROM   pg_publication_tables
WHERE  pubname = 'supabase_realtime'
ORDER  BY tablename;

-- Colonnes de app_state (doit inclure device_id)
SELECT column_name, data_type, column_default
FROM   information_schema.columns
WHERE  table_name = 'app_state'
ORDER  BY ordinal_position;

-- Sessions actives (vide au début, se remplit quand l'app est ouverte)
SELECT id, user_name, last_seen, is_online
FROM   app_sessions
ORDER  BY last_seen DESC;
