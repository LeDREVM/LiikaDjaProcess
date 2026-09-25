# Yife — ta vie, solo ou à deux

Version **commerciale** de l'app « Lanmou Douvan », sous forme de **copie autonome** : ce
dossier a son propre `app.js`, son propre `styles.css` et son propre projet Supabase. Rien
n'est partagé avec l'app privée du couple : ni code, ni données, ni stockage local.

## Ce que l'utilisateur obtient

- **Un vrai compte** : inscription par e-mail et mot de passe, confirmation de l'adresse,
  mot de passe oublié, déconnexion, **suppression du compte** (effacement de ses données).
- **Un espace de vie**, créé au premier lancement :
  - **Solo** → un seul profil ;
  - **À deux** → deux profils et un espace commun. Le/la partenaire crée son propre compte
    puis rejoint l'espace avec le **code d'invitation** affiché dans 👤 Mon profil.
- **Tous les tableaux vides**, prêts à remplir : objectifs, actions, notes, repas, budget,
  sport, planning, maison, voyages, suivi médical, véhicules, stocks, album…
  Les contenus de référence restent (recettes DrevmCook, Konsèvasyon, potager, culture).
- **Synchro en temps réel** entre les appareils et entre les deux partenaires.
- **Sauvegarde** : export / import d'un fichier `.json` depuis 👤 Mon profil.

## Mettre les comptes en ligne (une seule fois)

1. Créer un **nouveau projet Supabase** dédié à Yife (surtout pas celui du couple).
2. Dans *SQL Editor*, exécuter [`supabase/yife.sql`](supabase/yife.sql) (ré-exécutable sans risque).
3. *Authentication → URL Configuration* : mettre l'adresse du site (ex.
   `https://<site>/highdrevm/`) dans **Site URL** et **Redirect URLs**. C'est là que mènent
   les liens de confirmation et de mot de passe oublié.
4. Recopier l'URL du projet et la clé **publishable / anon** (*Project Settings → API*)
   dans [`config.js`](config.js). **Jamais** la clé `service_role`.

Tant que `config.js` est vide, Yife démarre en **mode local** : pas de compte, données dans
le navigateur. Pratique pour tester, pas pour vendre.

## Organisation du dossier

```
highdrevm/
├── index.html        entrée (CDN + config.js + app.js, chemins relatifs)
├── app.js            copie de l'app, adaptée (comptes, espace, données vides)
├── styles.css        copie du thème (fond neutre, sans photo perso)
├── config.js         URL + clé publishable Supabase Yife (publiques par nature)
├── supabase/yife.sql schéma : tables, RLS, fonctions (NON publié)
└── README.md         ce fichier (NON publié)
```

Seuls `index.html`, `app.js`, `styles.css` et `config.js` sont en ligne (liste blanche de
`scripts/build-site.js`).

## Comment c'est construit

- **Même stack que l'app d'origine** : mono-fichier, React sans JSX, librairies via CDN, pas de
  build. Validation : `node --check highdrevm/app.js`.
- **Données** : tout l'espace tient dans **un seul blob JSON** (`yife_spaces.data`). Il est fusionné
  section par section, et c'est la modification la plus récente qui gagne (même mécanique
  que l'app d'origine : `stampChanges` / `mergeStates`).
  Les tables dédiées de l'original (recettes, courses, médias…) sont neutralisées :
  tout passe par le blob.
- **Qui est qui** : le créateur de l'espace occupe la place `dja` (profil A), le/la partenaire
  la place `liika` (profil B). Les clés internes gardent ces noms pour ne rien casser. À
  l'écran, seuls les prénoms saisis apparaissent.
- **Mode solo/couple** : il appartient à l'espace (`data.profil.mode`), donc il est partagé
  entre les deux partenaires.
- **Stockage local** : préfixé `yife:<id du compte>:`. Deux comptes sur le même navigateur
  ne se voient jamais.
- **Vues retirées** (trop liées à l'app d'origine) : Program Dja, REMC (code de la route),
  Young Boudha. Le code est encore là, mais ces vues sont absentes du menu (`YIFE_HIDDEN_VIEWS`).

## Sécurité (voir `supabase/yife.sql`)

- RLS sur les deux tables : on ne lit et on n'écrit **que** les espaces dont on est membre.
- Les membres peuvent modifier le contenu (`name`, `data`), mais jamais le propriétaire ni
  le code d'invitation.
- Création d'espace, invitation et suppression de compte passent par des fonctions
  `SECURITY DEFINER` qui vérifient `auth.uid()`. Elles sont inaccessibles aux visiteurs
  anonymes.
- Un espace compte au maximum 2 membres, et un compte appartient à un seul espace (v1).

## Limites connues / prochaines étapes

- Les **photos** (album, véhicules, potager) sont stockées dans le blob en base64
  compressé. Si l'album grossit beaucoup, il faudra passer à Supabase Storage, avec un
  dossier par espace.
- Un compte = un espace. Plusieurs espaces par compte (famille, colocation) : v2.
- Pour **vendre** : paiement/abonnement (Stripe), CGU + politique de confidentialité, nom de
  domaine dédié, e-mails d'authentification personnalisés (SMTP) — rien de tout ça n'est fait.
