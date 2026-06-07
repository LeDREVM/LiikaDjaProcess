# PLACEHOLDERS — le dictionnaire des jetons à remplacer

Tous les fichiers du kit utilisent des jetons `{{COMME_CECI}}`. Voici ce que chacun signifie et
comment le remplir. Claude le fait automatiquement via le prompt de [`00-START-HERE.md`](00-START-HERE.md),
mais tu peux aussi tout remplacer à la main (recherche/remplace dans ton éditeur).

> Règle d'or : après remplacement, **il ne doit plus rester aucun `{{` dans les fichiers installés.**

---

## Identité (cœur)

| Jeton | Signification | Exemple de valeur |
|---|---|---|
| `{{USER_NAME}}` | Le nom/prénom que Claude utilise pour te parler | `Sarah` |
| `{{USER_EMAIL}}` | Ton email (config projet/git). Optionnel | `sarah@exemple.com` |
| `{{USER_LANGUAGE}}` | La langue de communication de Claude | `français` |
| `{{USER_ROLE}}` | Comment tu te décris professionnellement | `rédactrice web indépendante` |
| `{{USER_LEVEL}}` | Ton niveau si tu codes : débutant / intermédiaire / avancé | `débutant` |
| `{{USER_GOAL}}` | Ton objectif principal | `lancer et faire vivre mon site` |

---

## Code & stack (laisse neutre si tu ne codes pas)

| Jeton | Signification | Exemple |
|---|---|---|
| `{{TECH_STACK}}` | Tes langages/frameworks | `Next.js + TypeScript` ou `aucun (pas de code)` |
| `{{BUILD_TOOL}}` | Ton outil de build, si applicable | `Vite` / `n/a` |
| `{{HOST_PLATFORM}}` | Où tu déploies | `Vercel` / `n/a` |
| `{{DEPLOY_CMD}}` | La commande de déploiement | `vercel deploy` / `n/a` |
| `{{BUILD_CMD}}` | La commande de build | `npm run build` / `n/a` |
| `{{TEST_CMD}}` | La commande de tests | `npm test` / `n/a` |
| `{{DEV_PREVIEW_CMD}}` | Comment tu prévisualises en local (fidèle à la prod) | `npm run preview` / `n/a` |

---

## Projet actif (le repo où tu travailles le plus)

| Jeton | Signification | Exemple |
|---|---|---|
| `{{PROJECT_NAME}}` | Nom de ton projet | `MonSite` |
| `{{PROJECT_DESC}}` | Une phrase de description | `boutique en ligne de céramique` |
| `{{PROJECT_PATH}}` | Chemin absolu du repo sur ta machine | `/Users/sarah/Sites/monsite` |
| `{{PROJECT_DOMAIN}}` | Domaine de prod, si site web | `monsite.com` / `n/a` |
| `{{MEMORY_PROJECT_SLUG}}` | Le chemin du projet, `/` → `-` (slug mémoire Claude Code) | `-Users-sarah-Sites-monsite` |

> **Comment trouver le slug mémoire ?** C'est le chemin absolu de ton projet avec chaque `/`
> remplacé par `-`. Exemple : `/Users/sarah/Sites/monsite` → `-Users-sarah-Sites-monsite`.
> Le dossier mémoire complet sera donc : `~/.claude/projects/{{MEMORY_PROJECT_SLUG}}/memory/`.

---

## Domaine « métier » (pour les règles .EXAMPLE)

Ces jetons ne servent qu'aux **exemples de règles métier**. Si tu n'as pas de domaine éditorial
précis, ignore-les (Claude laissera les `.EXAMPLE` de côté).

| Jeton | Signification | Exemple |
|---|---|---|
| `{{DOMAIN_TOPIC}}` | Ton sujet/niche de contenu | `la céramique artisanale` |
| `{{DOMAIN_AUDIENCE}}` | Ton audience cible (persona) | `amateurs de déco, 25-45 ans` |
| `{{DOMAIN_CANONICAL_FACT}}` | Un fait à ne jamais déformer dans ton domaine | `(à toi de définir)` |

---

## Convention de valeur « neutre »

Si un jeton ne te concerne pas, la valeur neutre est :
- `n/a` pour les commandes / outils techniques,
- `aucun (pas de code)` pour la stack si tu ne codes pas,
- une chaîne vide pour l'email.

Claude est instruit de choisir ces valeurs neutres tout seul quand tu ne réponds pas — et de te
les signaler dans son rapport final.
