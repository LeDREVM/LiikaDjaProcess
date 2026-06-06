# 🟢 LIS-MOI D'ABORD — Kit pré-personnalisé pour Négus Dja (DREVM)

Ce kit est la version **déjà personnalisée** du `claude-config-kit`. J'ai rempli tous les
placeholders avec ton profil, adapté les exemples à ta stack et transformé les fichiers `.EXAMPLE`
en vraies règles DREVM. Tu n'as **plus à répondre aux 5 questions** — saute l'ÉTAPE B.

---

## ✅ Ce que j'ai pré-rempli (valeurs devinées depuis ton profil)

| Jeton | Valeur retenue |
|---|---|
| USER_NAME | Négus Dja |
| USER_EMAIL | *(vide — non fourni, à compléter si tu veux la config git)* |
| USER_LANGUAGE | français |
| USER_ROLE | Directeur artistique & développeur (Guadeloupe, UTC-4, sans DST) |
| USER_LEVEL | avancé |
| USER_GOAL | pipeline trading auto (DREVM) + apps métier (ingé son, vidéaste, resto végétal) |
| TECH_STACK | Python/FastAPI, SvelteKit, Node/Express/Socket.io, MQL5, PineScript, PostgreSQL, Redis, Docker, Nginx |
| HOST_PLATFORM | Hostinger Forex VPS Windows + NSSM · Netlify (front) · Docker (back) |
| BUILD_CMD / TEST_CMD / DEV_PREVIEW_CMD | `npm run build` / `pytest` / `npm run preview` |
| DEPLOY_CMD | `docker compose up -d` *(front: `netlify deploy --prod` ; bot MT5: via NSSM)* |
| PROJECT_NAME | saasDrevmBot (DREVM) |
| PROJECT_PATH | `/storage/emulated/0/dxpedrevm/goldyxbotdrevm` ⚠️ **à vérifier** (machine où tourne Claude Code) |
| MEMORY_PROJECT_SLUG | `-storage-emulated-0-dxpedrevm-goldyxbotdrevm` ⚠️ **à vérifier** |

> ⚠️ **2 valeurs à confirmer** : `PROJECT_PATH` et `MEMORY_PROJECT_SLUG` dépendent de la machine où
> tu lances **Claude Code**. Si ce n'est pas le chemin Termux/Android ci-dessus, corrige-les (le
> slug = le chemin avec chaque `/` remplacé par `-`).

## 🔧 Ce que j'ai adapté pour ton profil
- **Tu codes → j'ai gardé tous les fichiers `[DEV]`** et reformulé leurs exemples web vers ta stack
  (SvelteKit/HMR, FastAPI endpoints, MT5/MQL5 backtest, `pip-audit`, secrets broker/MT5/Anthropic).
- **`.EXAMPLE` → vraies règles** :
  - `global-memory/user_profile.md` (ton profil, mémoire active)
  - `global-memory/project_drevm_canonical_facts.md` (faits figés : SMC/ICT, OB=violet/FVG=bleu,
    grades A+/A/B/C/D, no-repaint M5, sortie partielle 1R, Windows-only, Fusion Markets)
  - `global/rules/trading-integrity-drevm.md` (veto avant déploiement de logique de signal/exécution)
  - `project/CONTEXT_PIN.md` (invariants ré-injectés après compaction)
  - hooks `pre-deploy` (SvelteKit/Netlify) et `post-content-edit` (fichiers logique DREVM)
- `MEMORY.md` : index mis à jour (profil + faits canoniques enregistrés).
- Les `*.EXAMPLE` restants sont laissés comme **modèles** pour créer plus tard tes règles métier
  « ingé son / vidéaste / resto végétal » (même structure que la règle trading).

---

## 🚀 Installation (2 minutes)

1. Décompresse ce dossier où tu veux (Bureau, ou racine de projet).
2. Ouvre **Claude Code** dans ton terminal, à la racine de ton projet.
3. Colle le prompt ci-dessous (le chemin du kit est déjà placé — **ajuste-le si besoin**).

```
Tu vas installer une config Claude Code DÉJÀ personnalisée pour moi (profil rempli). Les fichiers
n'ont plus de placeholders de profil : NE refais PAS l'étape « questions ». Procédure :

KIT : <CHEMIN_VERS_claude-config-kit-drevm>

1. Lis 00-LIS-MOI-DREVM.md, README.md, skills-and-plugins.md, puis liste global/, global-memory/, project/.
2. Vérifie qu'il ne reste aucun {{PLACEHOLDER}} de profil dans global/ global-memory/ project/
   (un {{PLACEHOLDERS}} littéral subsiste volontairement dans content-quality-EXAMPLE.md, c'est ok).
3. Confirme avec moi PROJECT_PATH et MEMORY_PROJECT_SLUG (ils dépendent de CETTE machine) avant de
   créer le dossier mémoire. Le slug = chemin du projet avec les "/" remplacés par "-".
4. Installe aux emplacements :
   - global/CLAUDE.md            -> ~/.claude/CLAUDE.md
   - global/rules/*.md           -> ~/.claude/rules/
   - global/skills/prompt-optimizer/ -> ~/.claude/skills/prompt-optimizer/
   - global-memory/*.md          -> ~/.claude/projects/<SLUG>/memory/   (garde EXAMPLES/ comme modèles)
   - project/CLAUDE.md           -> <racine_projet>/CLAUDE.md           (fusionne si existe)
   - project/settings.json       -> <racine_projet>/.claude/settings.json  (fusionne, n'écrase pas)
   - project/hooks/*.sh          -> <racine_projet>/.claude/hooks/   puis chmod +x
   - project/commands/*.md       -> <racine_projet>/.claude/commands/
   - project/agents/*.md         -> <racine_projet>/.claude/agents/
   - project/CONTEXT_PIN.md      -> <racine_projet>/CONTEXT_PIN.md
   Montre un diff avant d'écraser un fichier existant. Fichiers neufs : vas-y.
5. Lis skills-and-plugins.md et donne-moi les commandes /plugin à lancer (superpowers, etc.).
   Ne lance rien sans mon OK.
6. Vérifie : .claude/settings.json référence des hooks présents sur le disque ; rappelle-moi que
   les hooks ne s'activent qu'au PROCHAIN lancement de Claude Code.
7. Rapport final : fichiers installés + où, action manuelle restante (relancer Claude Code).
```

4. Quand c'est fini : **ferme et rouvre Claude Code** (les hooks s'activent au démarrage).

---

## 📦 Skills à installer ensuite (rappel)
- **superpowers** (essentiel) : `/plugin` → installer `superpowers`.
- **prompt-optimizer** : fourni dans le kit (`global/skills/prompt-optimizer/`) — requis par la
  règle `auto-invoke-prompt-optimizer`.
- **frontend-design** (utile pour tes dashboards Svelte / apps).
- Détails dans `skills-and-plugins.md`.
