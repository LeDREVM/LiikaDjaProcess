# Lanmou Douvan — Mix Vibz (LiikaDjaProcess)

> Contexte SPÉCIFIQUE à ce projet pour Claude. Méthodologie issue du kit DREVM, adaptée à
> CE dépôt. Les invariants à ne jamais perdre sont dans `CONTEXT_PIN.md` (ré-injecté à chaque
> session par le hook `session-start.sh`).

## 🎯 Le projet
Tableau de bord partagé pour un couple (Dja & Liika) : objectifs, actions, notes, repas, sport,
budget, vision, planning, tâches maison, jeux, DrevmCook (recettes & ferments), culture GWA,
route Liika, objectifs mensuels, stats, calendrier exportable ICS, plan de repas imprimable PDF.

## 🧱 Stack & contraintes
- **Mono-fichier** : toute la logique dans `app.js` (≈ 8000+ lignes), styles dans `styles.css`,
  point d'entrée `index.html`.
- **React SANS JSX** : tout en `React.createElement(...)`. Pas de build, pas de transpileur.
- **Librairies via CDN** (React 18, Chart.js, supabase-js, chess.js) chargées dans `index.html`.
  Aucun `npm install`, aucun import de module.
- **Données** : `localStorage` (`dja-liika-goals`) + synchro **Supabase** (`app_state`,
  `user_accounts`, `app_sessions`). `normalize()` garantit la forme — ne pas la casser.
- **Déploiement statique** : Netlify (`publish="."`) + GitHub Pages. Pas de secret à la racine.
- **Validation** (à défaut de tests/lint) : `node --check app.js`.

## 🧭 Protocole de travail — à appliquer CHAQUE session
1. **Reformuler** la demande en français simple avant d'agir (pourquoi → quoi → comment).
2. **Plan-first** pour tout changement non-trivial (>1 fichier ou comportement complexe) :
   rédiger le plan, le faire valider, puis seulement implémenter. Option : `/review-plan`.
3. **Simplicité d'abord** : la solution la plus simple qui marche. Pas d'over-engineering, pas de
   nouvel outil/framework si la stack actuelle suffit.
4. **Subagents** pour la recherche multi-fichiers (synthèse) ; lecture directe si 1-2 fichiers connus.
5. **Vérifier avant de livrer** : jamais « c'est fait » sans preuve réelle (sortie de commande,
   aperçu, capture). Au minimum `node --check app.js` doit passer.
6. **Garder le style existant** : `React.createElement`, variables CSS du thème, français côté UI.
7. **Git** : développer sur une branche de travail, jamais de push direct sur la branche par défaut.
8. **Avant de clôturer un diff conséquent** : option `/review-diff` (relecture indépendante).

## 🔁 Boucle d'apprentissage — `lessons.md`
- **Avant une tâche** : lire `lessons.md` (s'il existe) — pièges connus de CE projet.
- **Après une correction de l'utilisateur** : ajouter (sans demander) une entrée concise
  `L## — Titre / Symptôme / Cause racine / Fix / Date`, et l'annoncer en 1 ligne.

## 🛡️ Garde-fous automatiques (hooks `.claude/settings.json`)
- `pre-bash-guard` — bloque les commandes vraiment destructives + push direct sur la branche défaut.
- `pre-edit-guard` — bloque l'édition de secrets (.env, clés).
- `session-start` — valide la syntaxe de `app.js` et ré-injecte le protocole + `CONTEXT_PIN.md`.
- `context-pin` — ré-injecte `CONTEXT_PIN.md` après compaction du contexte.

## Règles projet (invariants)
- **NE JAMAIS** introduire de JSX ou d'étape de build sans accord explicite.
- **NE JAMAIS** casser `normalize()` ni la synchro Supabase.
- **NE JAMAIS** déposer de secret dans un fichier publié (racine du site).
- **TOUJOURS** `node --check app.js` avant de déclarer terminé.
