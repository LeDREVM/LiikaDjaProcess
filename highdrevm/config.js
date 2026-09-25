// Configuration publique de Yife — projet Supabase DÉDIÉ (jamais celui du couple).
//
// Renseigner l'URL du projet et sa clé « publishable » (anon) : Supabase →
// Project Settings → API. Ces deux valeurs sont faites pour être publiques ; la
// sécurité repose sur les politiques RLS de supabase/yife.sql.
// NE JAMAIS mettre ici la clé service_role ni un autre secret.
//
// Laissés vides → Yife démarre en mode local (sans compte, données dans le navigateur).
window.YIFE_CONFIG = {
  supabaseUrl: '',
  supabaseKey: ''
};
