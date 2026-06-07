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
  jsonb_build_object(
    'dja', jsonb_build_object(
      'name', 'Negus Dja',
      'role', 'Directeur artistique & Dev',
      'location', 'Guadeloupe',
      'color', 'dja',
      'objectives', '[]'::jsonb,
      'actions',    '[]'::jsonb,
      'notes',      '[]'::jsonb,
      'meals',      '[]'::jsonb,
      'budget',     '{"revenus":[],"depenses":[]}'::jsonb,
      'vision',     '',
      'sport',      '[]'::jsonb
    ),
    'liika', jsonb_build_object(
      'name', 'Liika',
      'role', 'Independante transport PL',
      'location', '',
      'color', 'liika',
      'objectives', '[]'::jsonb,
      'actions',    '[]'::jsonb,
      'notes',      '[]'::jsonb,
      'meals',      '[]'::jsonb,
      'budget',     '{"revenus":[],"depenses":[]}'::jsonb,
      'vision',     '',
      'sport',      '[]'::jsonb
    ),
    'couple', jsonb_build_object(
      'objectives', '[]'::jsonb,
      'actions',    '[]'::jsonb,
      'notes',      '[]'::jsonb,
      'meals',      '[]'::jsonb,
      'budget',     '{"revenus":[],"depenses":[]}'::jsonb,
      'vision',     '',
      'sport',      '[]'::jsonb,
      'planning',   '{}'::jsonb,
      'ideeJour',   '{"liste":[],"custom":[]}'::jsonb
    ),

    -- ── Recettes seed ──────────────────────────────────────────
    'recipes', '[
      {
        "id": "r6",
        "nom": "Carottes Épicées Fermentées",
        "categorie": "Fermentés",
        "tags": ["vegan","sans-gluten","fermenté"],
        "ingredients": ["1 kg carottes","10 g sel marin","Gingembre","Cannelle","Ail"],
        "preparation": "1. Râper les carottes. 2. Ajouter sel et épices. 3. Malaxer pour faire sortir le jus. 4. Tasser en bocal. 5. Compléter avec eau si besoin. 6. Garder immergé. 7. Fermenter 2-3 semaines.",
        "apports": "Carotte : bêta-carotène, fibres, potassium. Gingembre : gingérols, digestion. Cannelle : antioxydants. Ail : allicine.",
        "budget": "≈ 4 à 6 €"
      },
      {
        "id": "r7",
        "nom": "Chou Rouge Lactofermenté",
        "categorie": "Fermentés",
        "tags": ["vegan","sans-gluten","fermenté"],
        "ingredients": ["Chou rouge","Sel marin (2% du poids)","Ail (optionnel)","Gingembre (optionnel)"],
        "preparation": "Émincer finement le chou, saler, malaxer vigoureusement jusqu''à ce que le jus sorte. Tasser en bocal, garder immergé sous le liquide. Fermenter 1 à 3 semaines à température ambiante.",
        "apports": "Chou rouge : anthocyanes, vitamine C, fibres, antioxydants. Probiotiques naturels après fermentation.",
        "budget": "≈ 3 à 5 €"
      },
      {
        "id": "r8",
        "nom": "Sauce Piquante Fermentée",
        "categorie": "Fermentés",
        "tags": ["vegan","sans-gluten","fermenté"],
        "ingredients": ["Piments locaux (bonda man jak, habanero)","Ail","Sel","Eau filtrée","Gingembre (optionnel)"],
        "preparation": "Mettre piments et ail en saumure (eau + sel). Fermenter 1-2 semaines en bocal recouvert d''un tissu. Mixer finement. Conserver au frais après ouverture.",
        "apports": "Piment : capsaïcine, circulation, métabolisme. Ail : allicine, immunité. Gingembre : anti-inflammatoire.",
        "budget": "≈ 4 à 6 €"
      }
    ]'::jsonb,

    -- ── Ferments seed ──────────────────────────────────────────
    'ferments', '[
      {
        "id": "f-seed-001",
        "nom": "Carottes Gingembre",
        "type": "Légumes",
        "startDate": "2026-06-01",
        "durationDays": 14,
        "notes": "1 kg carottes râpées, 10 g sel, 1 c.s. gingembre frais. Bocal 1 L, poids de fermentation posé dessus.",
        "journal": [
          {
            "id": "j-001-a",
            "date": "2026-06-03",
            "note": "J+2 : bullage visible, bonne odeur acidulée.",
            "pH": "4.2",
            "odeur": "acidulée",
            "couleur": "orange vif"
          }
        ],
        "done": false
      },
      {
        "id": "f-seed-002",
        "nom": "Chou Rouge Classique",
        "type": "Légumes",
        "startDate": "2026-05-28",
        "durationDays": 21,
        "notes": "500 g chou rouge émincé, 2% sel. Bocal 750 mL, tassé à fond.",
        "journal": [
          {
            "id": "j-002-a",
            "date": "2026-05-30",
            "note": "J+2 : jus rouge vif, légèrement pétillant.",
            "pH": "4.5",
            "odeur": "chou, légèrement acide",
            "couleur": "rouge-violet"
          },
          {
            "id": "j-002-b",
            "date": "2026-06-04",
            "note": "J+7 : goût bien acide, texture croquante conservée.",
            "pH": "3.8",
            "odeur": "franche et acidulée",
            "couleur": "violet profond"
          }
        ],
        "done": false
      },
      {
        "id": "f-seed-003",
        "nom": "Sauce Piquante Bonda Man Jak",
        "type": "Sauce",
        "startDate": "2026-05-20",
        "durationDays": 14,
        "notes": "Piments habanero + ail + sel 3%. Bocal 500 mL, tissu respirant.",
        "journal": [
          {
            "id": "j-003-a",
            "date": "2026-06-03",
            "note": "J+14 : prête ! Mixée et mise en bouteille.",
            "pH": "3.5",
            "odeur": "puissante et fruitée",
            "couleur": "orange-rouge"
          }
        ],
        "done": true
      }
    ]'::jsonb,

    'games', jsonb_build_object(
      'chess',     '{"fen":"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1","lastBy":"","result":""}'::jsonb,
      'crossword',  '{"filled":{},"done":false}'::jsonb,
      'streak',     '{"count":0,"lastDay":""}'::jsonb,
      'badges',     '[]'::jsonb
    )
  ),
  NOW()
)
ON CONFLICT (id) DO UPDATE
  SET data       = EXCLUDED.data,
      updated_at = EXCLUDED.updated_at
  WHERE app_state.data->'ferments' = '[]'::jsonb
     OR app_state.data->'recipes'  = '[]'::jsonb;


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
