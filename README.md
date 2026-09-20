# Lanmou Douvan — Mix Vibz

**Une web app de gestion de vie, en solo ou en couple.**

Un seul tableau de bord pour tout ce qui fait tourner une vie au quotidien : objectifs,
santé, sport, repas, budget, maison, voyages, sorties, projets pro, jardin, culture.
Elle s'utilise **à deux** (deux profils + un espace commun) ou **tout seul** (un seul
profil) — le mode se change à tout moment dans « Mon profil », sans rien perdre.

Pas de compte à créer, pas d'abonnement, pas de serveur applicatif : une page statique,
les données dans le navigateur, et une synchronisation Supabase pour retrouver la même
chose sur tous ses appareils.

---

## Solo ou couple : comment ça marche

Le mode de gestion est un réglage de l'app (bouton profil → **👫 Couple** / **🧑 Solo**) :

| | Couple | Solo |
|---|---|---|
| Profils | `dja` + `liika` + `couple` (espace commun) | un seul profil, au choix |
| Catégories visibles | les 5 | 4 — l'espace « Pro » du partenaire est masqué |
| Sélecteurs (repas, budget, sport, objectifs…) | 3 colonnes | 1 colonne |
| En-tête | « A & B » | le prénom de la personne |

Côté code, deux fonctions portent tout le mécanisme (`app.js`) :

```js
let ACTIVE_MODE = 'couple'; // 'couple' | 'solo'
let ACTIVE_SOLO = 'dja';    // 'dja' | 'liika'

function personKeys(){ return ACTIVE_MODE === 'solo' ? [ACTIVE_SOLO] : ['dja', 'liika', 'couple']; }

function visibleCategories(){
  if (ACTIVE_MODE !== 'solo') return CATEGORIES;
  const hide = ACTIVE_SOLO === 'dja' ? 'prolia' : 'prodja';
  return CATEGORIES.filter(c => c.id !== hide);
}
```

Les prénoms et les rôles sont **éditables** : rien n'oblige à s'appeler Dja ou Liika.

---

## Ce qu'il y a dedans — 5 espaces, 35 vues

### 🌺 Lifestyle
Sorties · Album photo · Idées · Maison · Nous deux · Culture GWA · Agenda Paris · Vision

### 💚 Santé & Finance
Sport · Program Dja · Budget · Repas · Courses · Suivi médical · DrevmCook ·
Konsèvasyon · Potager GWA · Voyages · Stats

### 🎖️ Pro · Purple Moon
Planning · Objectifs du mois · REMC · Survie · Calendrier · Profil

### 🎨 Pro · Negus Dja
Art & Projets · Entretien méca · Profil · Young Boudha · Vision board · Calendrier

### 🎬 Multimédia
Playlist · Jeux · Recettes · Culture GWA

Quelques modules un peu particuliers :

- **DrevmCook** — recettes (51 fiches livrées d'origine) et ferments maison, avec journal
  de suivi.
- **Konsèvasyon** — combien de temps garder chaque aliment, selon le lieu de stockage
  (frigo, bac à légumes, placard…) ; « rézèv » cochable avec date d'entrée.
- **Germination** — suivi des graines germées, rinçages matin/soir sur 10 jours.
- **Voyages** — protocole de départ en 8 phases avec échéances (J-60, J-7, retour…),
  liste « le nécessaire » et onglet « préparer sa valise ».
- **Agenda Paris** — envies de sorties culturelles à basculer en sortie datée, avec lien
  d'itinéraire Google Maps et bons plans parisiens.
- **Potager GWA** — calendrier lunaire et associations de cultures, contexte Guadeloupe.

---

## Stack

Volontairement minimale, et assumée comme telle :

- **`app.js`** (~15 600 lignes) — toute la logique de l'app, en **React sans JSX** :
  uniquement des `React.createElement(...)`. **Aucune étape de build, aucun bundler.**
- **`index.html`** (24 lignes) — le point d'entrée : une `<div id="root">` et les scripts.
- **`styles.css`** — le thème (variables CSS : or, violet Dja, rose Liika, fond vert sombre).
- **Librairies par CDN** : React 18.2, ReactDOM 18.2, Chart.js 4.4.1,
  `@supabase/supabase-js@2`, `chess.js@0.12.1`. Pas de `npm install` pour l'app principale,
  pas d'import de module.

> Conséquence directe : **une seule erreur de syntaxe casse toute l'app**. D'où la règle
> non négociable ci-dessous.

### Sous-projet `nutrition/` (celui-là a un build)

Le dépôt contient aussi une app nutrition séparée (`src/`, JSX + Vite + Tailwind), compilée
vers `nutrition/` par `npm run build`. Elle est indépendante de `app.js` et n'en partage
ni le code ni les données.

---

## Données & synchro

- **localStorage** — clé `dja-liika-goals` ; c'est la source immédiate, l'app marche hors ligne.
- **Supabase** — table `app_state` (une ligne `main`, tout l'état en JSONB), plus des tables
  dédiées pour les gros volumes : `recipes`, `ferments`, `rezev`, `courses`, `media`.
  `app_sessions` sert à la présence « qui est en ligne », avec du temps réel.
- **Fusion par section** : chaque modification horodate sa section (`data._t`), de sorte que
  deux appareils qui écrivent en même temps ne s'écrasent pas.
- **`normalize()`** garantit la forme des données à chaque chargement (clés manquantes,
  valeurs aberrantes, anciens formats). **La casser produit un écran blanc** — c'est
  l'invariant le plus sensible du projet.

### Mise en place de la base

Les scripts SQL sont dans `supabase/` (à lancer une fois depuis le SQL Editor Supabase) :

| Fichier | Rôle |
|---|---|
| `setup.sql` | tout le socle : `app_state`, `user_accounts`, `app_sessions` |
| `schema.sql` | la table d'état seule |
| `accounts.sql` | table des PIN |
| `drevmcook.sql` · `konsevasyon.sql` · `courses.sql` · `media.sql` | les tables dédiées |
| `realtime.sql` | publication temps réel |
| `save_app_state.sql` | écriture avec fusion côté serveur (verrou de ligne) |

---

## Démo publique — Highdrevm

`/highdrevm/` sert la **même `app.js`** en mode démo : aucune lecture ni écriture Supabase,
`localStorage` préfixé `hd:`, données d'exemple neutres (Alex & Sam), marque rebrandée.
Un visiteur peut tout essayer sans jamais toucher aux vraies données.
Détails : [`highdrevm/README.md`](highdrevm/README.md) et [`highdrevm/DOSSIER.md`](highdrevm/DOSSIER.md).

---

## Lancer l'app en local

Aucune compilation. Un serveur statique suffit — `file://` ne marchera pas (les scripts CDN
et les requêtes réseau ont besoin d'une vraie origine) :

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

Pour le sous-projet nutrition uniquement :

```bash
npm install
npm run dev      # Vite
npm run build    # → nutrition/
```

---

## Déploiement

Statique, sur **Netlify** (`netlify.toml` : `publish = "."`, redirection SPA vers
`/index.html`) et **GitHub Pages**.

> ⚠️ **Tout fichier à la racine est publié.** Jamais de secret ici. La clé Supabase
> présente dans `app.js` est la clé *publishable* (anon) — jamais de `service_role`.

---

## Contribuer / modifier

La seule validation dont dispose le projet (pas de tests, pas de linter) :

```bash
node --check app.js
```

**Elle est obligatoire avant toute livraison.** Les autres règles :

- Rester en `React.createElement` — **pas de JSX**, pas d'étape de build ajoutée sans accord.
- Ne pas casser `normalize()` ni la synchro Supabase.
- Développer sur une branche de travail, jamais de push direct sur la branche par défaut.
- L'interface est en français ; garder les variables CSS du thème.

Le contexte complet pour travailler sur le dépôt est dans [`CLAUDE.md`](CLAUDE.md), les
invariants à ne jamais perdre dans [`CONTEXT_PIN.md`](CONTEXT_PIN.md), et les pièges déjà
rencontrés dans [`lessons.md`](lessons.md).

---

## Structure

```
app.js          toute l'app (React sans JSX)
index.html      point d'entrée
styles.css      thème
supabase/       scripts SQL (setup unique)
highdrevm/      démo publique
src/            sous-app nutrition (JSX + Vite)
scripts/        post-build nutrition
files/          documents de travail (DrevmCook)
nutrition.html · planrepasdja.html · kalandriye-lalin-concombre-giraumon.html
                pages autonomes
```

---

Projet personnel — Dja & Liika · Guadeloupe 🇬🇵
