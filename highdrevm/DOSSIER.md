# Dossier complet — Highdrevm (bêta publique)

> Version bêta **publique** et **anonymisée** de l'application « Lanmou Douvan — Mix Vibz »,
> transformée en **outil de gestion de vie personnalisé** (solo ou couple), totalement isolée
> de l'application privée et de ses données réelles.

---

## 1. Présentation

**Highdrevm** est la déclinaison publique de l'app privée du couple (Dja & Liika). Objectif :
permettre à **n'importe qui** de tester et d'utiliser l'application comme un tableau de bord de
vie personnalisé — **sans jamais** accéder ni modifier les données réelles du couple, et sans
aucune information personnelle à l'écran.

En clair :
- L'app privée (`/`) reste inchangée : données réelles, synchronisation Supabase.
- La bêta Highdrevm (`/highdrevm/`) part de **données d'exemple neutres**, **sans réseau**,
  avec un **stockage local isolé**, et une **marque « Highdrevm »**.

---

## 2. Ce que contient l'app (fonctionnalités)

L'application est un tableau de bord organisé en **catégories**, chacune regroupant des vues :

| Catégorie | Vues principales |
|---|---|
| 🌺 **Lifestyle** | Sorties · Album photo · Idées · Maison · Nous deux · Culture · Vision |
| 💚 **Santé & Finance** | Sport · Budget · Repas · Courses · Suivi médical · DrevmCook (ferments/recettes) · Potager · Voyages · Stats |
| 🎖️ **Pro · (profil B)** | Planning · Objectifs du mois · **Code de la route (REMC)** · Survie · Calendrier · Profil |
| 🎨 **Pro · (profil A)** | Art & Projets · Profil · Vision board · Calendrier |
| 🎬 **Multimédia** | Playlist · Jeux · Recettes · Culture |

Fonctions transverses : objectifs & actions par personne, notes, repas imprimables (PDF),
calendrier exportable (ICS), synchronisation multi-appareils (app privée uniquement),
popup de motivation quotidienne, écran d'ouverture animé.

> **Modules retirés** (app réelle + démo) : le module **RSMA / pédagogie Permis PL** et le module
> **Route Liika**. Le **guide « Code de la route »** (Référentiel, Révision, Sécurité, Loi, EDPM,
> Élèves, Fiches, Notes) est **conservé**.

---

## 3. Mode de gestion : Couple ⟷ Solo (+ profil éditable)

Nouveauté pensée pour un usage public/perso : chacun choisit son mode et personnalise son profil.

- **Bouton « 👤 Couple/Solo »** intégré à l'en-tête (barre latérale sur desktop, barre de
  navigation sur mobile) → ouvre le panneau **« Mon profil »**.
- Dans le panneau :
  - **Choix du mode** : Couple (2 profils) ou Solo (1 profil).
  - En solo : **choix de « c'est moi »**.
  - **Édition des noms et des rôles** des profils.
- **Effet du mode Solo** :
  - Les sélecteurs de personne (repas, budget, sport, objectifs…) n'affichent que la personne active.
  - La catégorie « Pro » du partenaire est masquée (retour à l'accueil si la catégorie active devient masquée).
  - L'en-tête affiche le nom de la personne (au lieu de « A & B »).
- **Défaut = Couple** → comportement historique inchangé.

Implémentation : état `ui.mode` (`couple`/`solo`) + `ui.soloWho`, helpers module `personKeys()` et
`visibleCategories()`, composant `ProfilModal`.

---

## 4. Architecture technique

- **Mono-fichier** : toute la logique dans `app.js` (React **sans JSX**, en `React.createElement`).
  Pas de build, pas de transpileur. Point d'entrée : `index.html`. Styles : `styles.css`.
- **Librairies via CDN** (chargées dans le HTML) : React 18, Chart.js, `@supabase/supabase-js`, chess.js.
- **Données (app privée)** : `localStorage` (`dja-liika-goals`) + synchronisation **Supabase**
  (tables `app_state`, `recipes`, `ferments`, `courses`, `media`, présence `app_sessions`),
  avec `normalize()` qui garantit la forme des données.
- **Validation** : `node --check app.js` (aucune étape de lint/tests).
- **Déploiement statique** : Netlify (`publish = "."`) + GitHub Pages.

---

## 5. Le mode démo Highdrevm — fonctionnement

Le **même `app.js`** sert l'app privée et la démo. Un drapeau `DEMO`, évalué une fois au démarrage,
bascule tout le comportement.

### 5.1 Activation
`DEMO` est vrai si **l'une** de ces conditions est remplie (sinon l'app réelle fonctionne comme avant) :
1. `window.__HIGHDREVM_DEMO__ === true` (défini par `highdrevm/index.html`) ;
2. le chemin de l'URL est `/highdrevm/` ;
3. le paramètre `?demo=1` est présent dans l'URL.

### 5.2 Isolation totale (quand `DEMO` est vrai)
| Aspect | Comportement en démo |
|---|---|
| **Supabase** | **Désactivé** : `sbLoad`/`sbSave` court-circuités, présence temps réel coupée, uploads photos gardés en local (data-URL). Aucune lecture/écriture des vraies données. |
| **Stockage local** | Toutes les clés `localStorage` sont **préfixées `hd:`** via le wrapper `LS` → aucune collision avec l'app réelle, même dans le même navigateur. |
| **Données de départ** | Seed **`demoData`** 100 % neutre (voir §6). `normalize()` ne retombe jamais sur les vraies données car `defaultData = DEMO ? demoData : realDefaultData`. |
| **Marque** | « Highdrevm », mention « Bêta publique », noms/indicatifs anonymisés, pastille démo. |

Un visiteur peut donc **tout tester** (ajouter, modifier, supprimer) sans jamais affecter les vraies
données. Ses modifications restent **locales à son navigateur**.

---

## 6. Données d'exemple (`demoData`)

Seed neutre, même forme exacte que les données réelles, mais **sans aucune information personnelle** :
- Noms génériques **Alex** / **Sam**, rôles « exemple ».
- Objectifs, actions, finances, repas, sport, vision, plan de survie… fictifs et neutres.
- Playlist « Playlist démo ».

Aucune mention réelle (noms, lieux, métier, indicatif) n'apparaît en démo.

---

## 7. Différences app privée ⟷ bêta Highdrevm

| | App privée (`/`) | Bêta Highdrevm (`/highdrevm/`) |
|---|---|---|
| Données | Réelles (localStorage + Supabase) | `demoData` neutres, local uniquement |
| Réseau | Synchro Supabase active | Aucun appel Supabase |
| Stockage | clés `dja-liika-*`, `ld-*` | clés préfixées `hd:` |
| Marque | Lanmou Douvan — Mix Vibz | Highdrevm — Bêta publique |
| Identité | Noms/rôles réels | Anonymisés |
| Code applicatif | **Le même `app.js`** | **Le même `app.js`** (branché par `DEMO`) |

---

## 8. Déploiement

### Option A — même site (le plus simple)
Le dossier `highdrevm/` est publié à la racine. La démo est accessible à
**`https://<votre-site>/highdrevm/`** (le `netlify.toml` sert les fichiers réels avant la
redirection SPA grâce à `force = false`).

### Option B — site / déploiement DISTINCT (isolation par origine)
1. Créer un **nouveau site Netlify** (ou GitHub Pages) depuis **le même dépôt**, `publish = "."`.
2. Rediriger l'accueil vers la démo via un `_redirects` propre à ce site :
   ```
   /            /highdrevm/    200
   ```

Dans les deux cas, `app.js` et `styles.css` sont chargés en **chemin absolu** (`/app.js`,
`/styles.css`) : une seule source de vérité, aucune duplication.

---

## 9. Sécurité & vie privée

- **Aucune donnée réelle** n'est jamais exposée ni modifiable depuis la démo (Supabase désactivé).
- **Aucune fuite localStorage** : namespace `hd:` isolé de l'app réelle.
- **Aucune information personnelle** à l'écran (données `demoData` neutres, identités anonymisées).
- Aucun secret n'est ajouté (la clé Supabase « publishable » existante n'est pas utilisée en démo).

---

## 10. Vérification & tests

À défaut de tests automatisés, la validation repose sur :
- `node --check app.js` (syntaxe — invariant du projet).
- **Bac à sable Node** (stubs navigateur) : charge `app.js`, vérifie que le mode démo produit des
  données neutres (aucune fuite) **et** que l'app réelle reste inchangée.
- **Rendu fonctionnel** (stub React exécutant réellement les composants) : `ProfilModal` et
  `CategoryHome` rendus sans erreur en Couple et Solo ; `personKeys()` / `visibleCategories()`
  corrects dans les 3 configurations.

---

## 11. Structure des fichiers (démo)

```
highdrevm/
├── index.html     # Entrée de la démo : pose window.__HIGHDREVM_DEMO__ = true,
│                  # charge /styles.css, les CDN, puis /app.js. Pastille « démo ».
├── README.md      # Démarrage rapide + options de déploiement.
└── DOSSIER.md     # Ce dossier complet.
```

Le reste (logique, styles) est **partagé** avec l'app réelle :
```
/app.js            # Toute la logique (drapeau DEMO, demoData, personKeys, ProfilModal…)
/styles.css        # Thème visuel partagé
/index.html        # Entrée de l'app réelle
```

---

## 12. Limites connues & pistes

- La bascule Couple/Solo prend pleinement effet à la navigation (une vue déjà ouverte garde sa
  sélection jusqu'au prochain changement d'onglet).
- En solo, la catégorie « Pro » du partenaire est **masquée** (non grisée).
- Pistes : personnalisation plus poussée (avatars, thème par profil), onboarding public,
  export/import du profil démo, internationalisation.

---

*Ce dossier documente l'état de la bêta Highdrevm. Il vit dans le dépôt à côté du code — à mettre
à jour quand le comportement évolue.*
