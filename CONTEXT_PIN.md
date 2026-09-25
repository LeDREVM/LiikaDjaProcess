# INVARIANTS CRITIQUES — Lanmou Douvan / LiikaDjaProcess

> Ré-injecté automatiquement au démarrage de session et après chaque compaction
> (hooks `session-start.sh` / `context-pin.sh`). UNIQUEMENT les invariants à ne JAMAIS perdre.

- **Appli mono-fichier sans build** : toute la logique vit dans `app.js` (≈ 8000+ lignes). Pas
  d'étape de transpilation/bundling → une simple erreur de syntaxe casse TOUTE l'appli. Toujours
  `node --check app.js` avant de terminer.
- **React sans JSX** : tout est écrit en `React.createElement(...)` (pas de JSX, pas de Babel).
  Garder ce style — ne pas introduire de JSX qui ne serait pas transpilé.
- **Librairies via CDN** : React 18, Chart.js, `@supabase/supabase-js`, chess.js sont chargés par
  `<script>` dans `index.html`. Pas de `npm install`, pas d'imports de modules. (Dans cet
  environnement distant, les CDN sont souvent bloqués → on ne peut pas rendre l'appli live.)
- **Données** : état persistant en `localStorage` (`dja-liika-goals`) + synchro Supabase (tables
  `app_state`, `user_accounts`, `app_sessions`), avec debounce. Ne JAMAIS casser `normalize()` qui
  garantit la forme des données (sinon écran blanc). Accès protégé par PIN.
- **Thème visuel** : variables CSS dans `styles.css` (`--gold` or, `--accent-dja` violet,
  `--accent-liika` rose, `--accent-couple` or, fond vert sombre). Le fond photo doit rester
  fortement voilé pour la lisibilité du contenu.
- **Déploiement statique** : Netlify + GitHub Pages publient `_site`, assemblé par
  `scripts/build-site.js` à partir d'une **liste blanche** (index.html, app.js, styles.css,
  l'image de fond, les pages autonomes, highdrevm, nutrition). Ce qui n'y est pas nommé n'est
  pas en ligne : `.claude/`, `src/`, `scripts/`, `supabase/`, la config et les notes restent
  privés. Une nouvelle page publique doit être ajoutée à la liste, sinon elle sera absente.
  Clé Supabase « publishable » OK ; jamais de `service_role` ni de secret en dur.
- **Git** : développer sur une branche de travail, JAMAIS de push direct sur la branche par défaut.
- **Communication** : français, expliquer simplement (pourquoi → quoi → comment), jamais « c'est
  fait » sans preuve réelle (sortie de commande / capture / aperçu).
