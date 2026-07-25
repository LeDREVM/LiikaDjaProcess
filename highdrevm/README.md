# Highdrevm — bêta publique (mode démo)

Version d'essai **publique** de l'app, **totalement isolée** de l'app privée du couple.

> 📘 **Dossier complet du projet : [`DOSSIER.md`](./DOSSIER.md)** — présentation, architecture,
> fonctionnement du mode démo, mode Couple/Solo, déploiement, sécurité et tests.

## Ce qu'elle fait
- **Aucune synchro Supabase** : rien n'est lu ni écrit sur la vraie base. Toutes les
  fonctions de chargement/sauvegarde distantes, la présence temps réel et l'upload
  de photos sont neutralisés en mode démo (voir `const DEMO` en tête de `app.js`).
- **Données 100 % d'exemple** : au démarrage, l'app part du seed neutre `demoData`
  (noms génériques *Alex* / *Sam*, objectifs, finances, repas… fictifs). Aucune
  donnée personnelle du couple n'est référencée.
- **Stockage local isolé** : les clés `localStorage` sont préfixées `hd:` → la démo
  ne touche jamais au cache de l'app réelle, même sur le même navigateur.
- **Marque rebrandée** : « Highdrevm », mention « Bêta publique », pastille démo.

Un visiteur peut donc tout tester (ajouter, modifier, supprimer) sans jamais
affecter les vraies données. Ses modifications restent locales à son navigateur.

## Comment le mode démo s'active
`app.js` est **partagé** avec l'app réelle. Le mode démo s'active si l'une de ces
conditions est vraie (sinon l'app réelle fonctionne exactement comme avant) :
1. `window.__HIGHDREVM_DEMO__ === true` (défini par cette page `index.html`) ;
2. le chemin de l'URL est `/highdrevm/` ;
3. le paramètre `?demo=1` est présent.

## Déploiement

### Option A — même site (le plus simple)
Rien à faire : le dossier `highdrevm/` est publié à la racine. La démo est
accessible à l'adresse **`https://<votre-site>/highdrevm/`**.
(Le `netlify.toml` utilise `force=false` → les fichiers réels sont servis avant
la redirection SPA, donc `/highdrevm/` sert bien cette page.)

### Option B — déploiement / site DISTINCT (isolation totale)
Pour un domaine séparé (localStorage naturellement isolé par origine) :
1. Créer un **nouveau site Netlify** (ou GitHub Pages) depuis **le même dépôt**.
2. Laisser `publish = "."` (racine).
3. Rediriger l'accueil du site distinct vers la démo. Sur Netlify, ajouter un
   fichier `_redirects` **propre à ce site** (ou une règle) :
   ```
   /            /highdrevm/    200
   ```
   Ainsi la racine du site distinct affiche directement Highdrevm.

Dans les deux cas, `app.js` et `styles.css` sont chargés en **chemin absolu**
(`/app.js`, `/styles.css`) : une seule source de vérité, aucune duplication.
