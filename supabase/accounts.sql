-- ================================================================
-- LANMOU DOUVAN — Comptes utilisateurs & PIN cross-appareils
-- ================================================================
--
-- INSTRUCTIONS :
--   1. Ouvrir https://supabase.com → ton projet
--   2. Aller dans SQL Editor
--   3. Coller ce fichier entier → Run
--
-- CE SCRIPT FAIT :
--   ① Crée la table user_accounts (id='dja'|'liika', pin, updated_at)
--   ② Active RLS (accès public lecture/écriture via anon key)
--   ③ Active Realtime sur user_accounts (optionnel — pour future sync)
-- ================================================================


-- ================================================================
-- ① TABLE user_accounts — stocke le PIN de chaque compte
-- Une ligne par compte ('dja' et 'liika').
-- Le PIN est stocké en clair (app privée sans données sensibles).
-- ================================================================

CREATE TABLE IF NOT EXISTS user_accounts (
  id          TEXT        PRIMARY KEY,           -- 'dja' ou 'liika'
  pin         TEXT        NOT NULL DEFAULT '',   -- PIN 4 chiffres
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  user_accounts          IS 'PIN des comptes Negus Dja & Purple Moon (Liika)';
COMMENT ON COLUMN user_accounts.id       IS '"dja" ou "liika"';
COMMENT ON COLUMN user_accounts.pin      IS 'Code PIN 4 chiffres — synchronisé entre appareils';
COMMENT ON COLUMN user_accounts.updated_at IS 'Dernière mise à jour du PIN';


-- ================================================================
-- ② ROW LEVEL SECURITY
-- Accès public lecture/écriture (même clé anon que le reste de l'app).
-- ================================================================

ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all" ON user_accounts;
CREATE POLICY "allow_all"
  ON user_accounts
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- ================================================================
-- ③ ACTIVER REALTIME (optionnel)
-- ================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE user_accounts;


-- ================================================================
-- VÉRIFICATION FINALE
-- ================================================================

SELECT id, LENGTH(pin) AS pin_len, updated_at
FROM   user_accounts
ORDER  BY id;
