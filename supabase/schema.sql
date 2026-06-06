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
  updated_at  TIMESTAMPTZ NOT NULL    DEFAULT NOW()
);

COMMENT ON TABLE  app_state           IS 'État global de l''application Lanmou Douvan (une ligne unique)';
COMMENT ON COLUMN app_state.id        IS 'Toujours "main" — la ligne unique de l''app';
COMMENT ON COLUMN app_state.data      IS 'JSON complet : dja, liika, couple, recipes, planning, ideeJour';
COMMENT ON COLUMN app_state.updated_at IS 'Mis à jour automatiquement à chaque sauvegarde';

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
-- LIGNE INITIALE
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
