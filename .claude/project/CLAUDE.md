# saasDrevmBot (DREVM)

> Ce fichier va à la racine de ton projet. Il donne à Claude le contexte SPÉCIFIQUE à ce projet
> (en plus de `~/.claude/CLAUDE.md` qui, lui, s'applique partout).

SaaS multi-services d'orchestration de trading : signaux SMC/ICT + Wyckoff / Ichimoku / RSI, dashboards ADHD-friendly, exécution broker Fusion Markets (MT5). Services : FastAPI (8000), Node/Express/Socket.io (3000), SvelteKit (5173), PostgreSQL, Redis, Docker.

## 🔁 Boucle d'apprentissage — `lessons.md`
**AVANT chaque tâche** : lire `lessons.md` à la racine du repo (s'il existe). Il contient les leçons
apprises sur CE projet (bugs récurrents, pièges de cache, conflits connus).

**APRÈS chaque correction de l'utilisateur** : ajouter automatiquement (SANS demander) une entrée
concise dans `lessons.md` au format `L## — Titre / Symptôme / Cause racine / Fix / Date`. Le fichier
devient une mémoire procédurale du projet. Écrire directement et l'annoncer en 1 ligne dans le résumé.

## 🧭 Workflow plan-first (changements non-triviaux)
Pour toute tâche qui touche plus d'un fichier ou un comportement complexe :
1. Rédiger un plan SANS implémenter (fichiers à toucher, diff conceptuel, décisions).
2. Présenter le plan pour validation.
3. Itérer jusqu'à « go ».
4. Implémenter seulement après approbation.
(Optionnel : faire relire le plan par `/review-plan` avant d'implémenter.)

## 🔍 Subagents pour la recherche
Pour les recherches multi-fichiers (exploration codebase), déléguer à un subagent plutôt que tout
faire en contexte principal — le subagent retourne une synthèse. Exception : recherche ciblée
(1-2 fichiers connus) → lecture directe.

## 🧠 Mémoire active session
La session-mémoire de ce projet vit dans `.claude/MEMORY-SESSION.md` (cf la règle globale
`memory-active-capture`). Claude doit : capter chaque info factuelle → l'écrire immédiatement ;
relire la mémoire avant toute réponse longue / modif / dispatch de subagent ; appliquer l'info
récente de l'utilisateur en priorité.

## 🛡️ Garde-fous automatiques (hooks)
Hooks configurés dans `.claude/settings.json` (voir `.claude/settings.README.md`) :
- `pre-bash-guard` — bloque les commandes destructives
- `pre-edit-guard` — bloque l'édition de secrets / du build
- `context-pin` — ré-injecte `CONTEXT_PIN.md` après compaction
- (si projet JS/TS) `post-lint`, `post-deps-audit`, `pre-stop-tests` — lint, audit deps, tests liés

## 🔧 Tech Stack
- Python (FastAPI), SvelteKit, Node.js/Express/Socket.io, MQL5, PineScript, PostgreSQL, Redis, Docker, Nginx
- Build : npm run build · Tests : pytest · Deploy : docker compose up -d

## Commands
- `npm run build` — build production
- `pytest` — tests
- `docker compose up -d` — déploiement
- `npm run preview` — preview prod-fidèle

## Rules (projet)
- **NE JAMAIS** implémenter sans brief validé
- **NE JAMAIS** déclarer « fini » sans vérification réelle
- **TOUJOURS** garder la solution la plus simple qui marche
- (ajoute ici les invariants propres à saasDrevmBot (DREVM))
