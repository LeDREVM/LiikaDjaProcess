-- ================================================================
-- LANMOU DOUVAN — Schéma Supabase
-- Dashboard Dja & Liika
--
-- INSTRUCTIONS :
--   1. Ouvrir https://supabase.com → ton projet
--   2. Aller dans SQL Editor
--   3. Coller ce fichier entier → Run
-- ================================================================


-- ================================================================
-- TABLE PRINCIPALE : état complet de l'application
-- Une seule ligne (id = 'main') contient tout l'état JSON de l'app.
-- ================================================================

CREATE TABLE IF NOT EXISTS app_state (
  id          TEXT        PRIMARY KEY DEFAULT 'main',
  data        JSONB       NOT NULL    DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  device_id   TEXT
);
-- Pour les bases déjà créées sans la colonne :
ALTER TABLE app_state ADD COLUMN IF NOT EXISTS device_id TEXT;

COMMENT ON TABLE  app_state           IS 'État global de l''application Lanmou Douvan (une ligne unique)';
COMMENT ON COLUMN app_state.id        IS 'Toujours "main" — la ligne unique de l''app';
COMMENT ON COLUMN app_state.data      IS 'JSON complet : dja, liika, couple, recipes, planning, ideeJour';
COMMENT ON COLUMN app_state.updated_at IS 'Mis à jour automatiquement à chaque sauvegarde';
COMMENT ON COLUMN app_state.device_id IS 'Appareil ayant fait la dernière sauvegarde (anti-écho Realtime)';

-- Index GIN pour les requêtes JSONB (optionnel, utile si tu recherches dans le JSON)
CREATE INDEX IF NOT EXISTS idx_app_state_data ON app_state USING GIN (data);


-- ================================================================
-- ROW LEVEL SECURITY
-- Accès public lecture/écriture via la clé publiable (anon key).
-- Pas besoin d'authentification pour cette app couple privée.
-- ================================================================

ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

-- Supprimer la politique si elle existe déjà (évite les erreurs)
DROP POLICY IF EXISTS "allow_all" ON app_state;

CREATE POLICY "allow_all"
  ON app_state
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- ================================================================
-- SYNCHRONISATION TEMPS RÉEL
-- Ajoute la table à la publication Realtime de Supabase.
-- C'est ce qui permet aux modifs d'un appareil d'apparaître en direct
-- sur l'autre (abonnement postgres_changes dans index.html).
-- ================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'app_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE app_state;
  END IF;
END $$;


-- ================================================================
-- PRÉSENCE : qui est connecté en ce moment
-- Chaque appareil "ping" sa session ; le front compte les sessions
-- vues il y a moins de 5 min pour afficher le nb d'appareils en ligne.
-- ================================================================

CREATE TABLE IF NOT EXISTS app_sessions (
  id         TEXT        PRIMARY KEY,
  user_name  TEXT,
  last_seen  TIMESTAMPTZ DEFAULT NOW(),
  is_online  BOOLEAN     DEFAULT TRUE
);

ALTER TABLE app_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all" ON app_sessions;
CREATE POLICY "allow_all" ON app_sessions FOR ALL USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'app_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE app_sessions;
  END IF;
END $$;


-- ================================================================
-- LIGNE INITIAL
-- Créée uniquement si elle n'existe pas déjà.
-- ================================================================

INSERT INTO app_state (id, data, updated_at)
VALUES (
  'main',
  '{
    "dja": {
      "name": "Negus Dja",
      "role": "Directeur artistique & Dev",
      "location": "Guadeloupe",
      "color": "dja",
      "objectives": [],
      "actions": [],
      "notes": [],
      "meals": [],
      "budget": { "revenus": [], "depenses": [] },
      "vision": "",
      "sport": []
    },
    "liika": {
      "name": "Liika",
      "role": "Independante transport PL",
      "location": "",
      "color": "liika",
      "objectives": [],
      "actions": [],
      "notes": [],
      "meals": [],
      "budget": { "revenus": [], "depenses": [] },
      "vision": "",
      "sport": []
    },
    "couple": {
      "objectives": [],
      "actions": [],
      "notes": [],
      "meals": [],
      "budget": { "revenus": [], "depenses": [] },
      "vision": "",
      "sport": [],
      "planning": {},
      "ideeJour": { "liste": [], "custom": [] }
    },
    "recipes": []
  }'::jsonb,
  NOW()
)
ON CONFLICT (id) DO NOTHING;


-- ================================================================
-- VÉRIFICATION FINALE
-- Ces requêtes confirment que tout est bien créé.
-- ================================================================

-- Voir la structure de la table
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'app_state'
ORDER BY ordinal_position;

-- Voir la ligne de données
SELECT
  id,
  jsonb_object_keys(data) AS sections,
  updated_at
FROM app_state
CROSS JOIN LATERAL jsonb_object_keys(data)
WHERE id = 'main';

-- Voir les politiques RLS
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'app_state';

-- Confirmer que la table est bien en temps réel
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND tablename = 'app_state';
