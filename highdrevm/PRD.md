# PRD — Highdrevm (bêta publique)

> **Product Requirements Document** · Version 1.0
> Produit : **Highdrevm** — déclinaison publique de « Lanmou Douvan » en outil de gestion de vie personnalisé.
> Statut : bêta publique en ligne. Public : ouvert (aucun compte requis).

---

## 1. Contexte & problème

« Lanmou Douvan » est un tableau de bord de vie privé conçu pour un couple (données réelles,
synchronisation Supabase). Il concentre une valeur produit forte (objectifs, repas, budget, sport,
projets, jeux, culture…) mais est **verrouillé sur un usage privé et nominatif**.

**Problème :** aucune manière pour le public de découvrir et d'utiliser l'app sans exposer les
données réelles du couple, ni de l'adopter pour un usage solo.

**Opportunité :** exposer une **version publique, anonyme et sûre** — *Highdrevm* — qui sert à la fois
de démonstration et d'outil réellement utilisable (solo ou couple), sans backend ni inscription.

---

## 2. Vision produit

> Un tableau de bord de vie **prêt à l'emploi, privé par défaut et sans friction** : on arrive, on
> choisit solo ou à deux, on entre son prénom, et on gère sa vie — sans compte, sans installation,
> sans donnée envoyée en ligne.

---

## 3. Objectifs & indicateurs

### Objectifs (Goals)
- **G1.** Permettre à un visiteur d'utiliser l'app **en < 30 s**, sans inscription.
- **G2.** **Zéro risque** pour les données réelles du couple (isolation totale).
- **G3.** Rendre l'app **générique** (solo/couple, profils éditables) sans nuire à l'app privée.
- **G4.** Fournir une **démonstration crédible** de toute la valeur produit.

### Non-objectifs (Non-goals)
- Pas de comptes / authentification publique.
- Pas de persistance serveur des données publiques (tout reste local au navigateur).
- Pas de collecte de données personnelles ni d'analytics nominatif.
- Pas de monétisation à ce stade.

### Indicateurs de succès (à instrumenter ultérieurement, sans PII)
- Taux de complétion de l'onboarding.
- Part des visiteurs qui créent/éditent au moins un élément.
- Répartition mode solo vs couple.
- Rétention locale (revisites sur le même appareil).

---

## 4. Personas

- **P1 — Le curieux** : découvre l'app via un lien, veut voir à quoi ça ressemble en 1 min.
- **P2 — Le solo** : cherche un tableau de bord perso simple (objectifs, budget, repas, sport).
- **P3 — Le duo** : couple/colocataires voulant un espace partagé de gestion de vie.
- **P4 — L'évaluateur** : recruteur / partenaire évaluant le produit et sa qualité d'exécution.

---

## 5. Parcours utilisateur

1. **Arrivée** sur `/highdrevm/` → écran d'ouverture animé (splash).
2. **Onboarding** (1er passage uniquement) :
   - Bienvenue + rappel « données d'exemple, rien n'est enregistré en ligne ».
   - Choix **À deux / Solo** + saisie du/des prénom(s). Option « passer ».
3. **App** : dashboard par catégories, contenu d'exemple neutre déjà présent.
4. **Personnalisation à tout moment** via **👤** dans l'en-tête (mode + noms + rôles).
5. **Réinitialisation** possible (bouton dédié) → retour aux données d'exemple.

---

## 6. Exigences fonctionnelles

### 6.1 Mode démo (public)
- **FR1.** Activation du mode démo via page dédiée (`/highdrevm/`), chemin, drapeau `window.__HIGHDREVM_DEMO__`, ou `?demo=1`.
- **FR2.** **Aucun appel Supabase** en démo (lecture, écriture, présence, upload).
- **FR3.** **Stockage local isolé** : toutes les clés `localStorage` préfixées `hd:`.
- **FR4.** **Données de départ neutres** (`demoData`) sans aucune information personnelle.
- **FR5.** **Marque** « Highdrevm / Bêta publique » et pastille démo.

### 6.2 Onboarding
- **FR6.** Affiché **une seule fois** par appareil (clé `hd-onboarded`), après le splash.
- **FR7.** Permet de choisir le mode et de saisir le(s) prénom(s), ou de passer.
- **FR8.** N'apparaît **jamais** dans l'app réelle.

### 6.3 Mode de gestion Couple / Solo
- **FR9.** L'utilisateur choisit **Couple** (2 profils) ou **Solo** (1 profil).
- **FR10.** En solo : sélecteurs de personne réduits à l'utilisateur ; catégorie « Pro » du partenaire masquée.
- **FR11.** En-tête : nom de la personne en solo, « A & B » (noms éditables) en couple.
- **FR12.** Défaut = **Couple** (comportement historique inchangé).

### 6.4 Édition du profil
- **FR13.** Panneau **« 👤 »** accessible depuis l'en-tête (desktop + mobile).
- **FR14.** Édition des **noms** et **rôles** des profils ; choix du mode.

### 6.5 Fonctionnalités de gestion de vie (héritées, disponibles en démo)
- **FR15.** Objectifs & actions, notes, repas (+ PDF), courses, budget, sport, suivi médical.
- **FR16.** Vision, planning, objectifs du mois, potager, voyages, stats, calendrier (ICS).
- **FR17.** DrevmCook (ferments/recettes), jeux, playlist, culture.
- **FR18.** **Guide « Code de la route »** (Référentiel, Révision, Sécurité, Loi, EDPM, Élèves, Fiches, Notes).
- **FR19.** *(Retirés du produit)* : module RSMA/pédagogie PL et module Route Liika.

---

## 7. Exigences non-fonctionnelles

- **NFR1 — Vie privée :** aucune donnée personnelle collectée ; rien n'est envoyé en ligne en démo.
- **NFR2 — Isolation :** impossible d'accéder/modifier les données réelles ou de polluer leur cache local.
- **NFR3 — Sans friction :** aucun compte, aucune installation ; utilisable immédiatement.
- **NFR4 — Compatibilité :** navigateurs modernes desktop & mobile ; responsive.
- **NFR5 — Robustesse :** une entrée de données invalide ne casse pas l'app (`normalize()`).
- **NFR6 — Performance :** app statique, chargement rapide (CDN), pas de build lourd.
- **NFR7 — Maintenabilité :** **une seule** base de code (`app.js`) pour l'app réelle et la démo.
- **NFR8 — Sécurité :** aucun secret publié ; la clé « publishable » n'est pas utilisée en démo.

---

## 8. Contraintes techniques

- **Mono-fichier** : logique dans `app.js` (React **sans JSX**, `React.createElement`). Pas de build.
- **Librairies via CDN** (React 18, Chart.js, supabase-js, chess.js).
- **Données réelles** : `localStorage` + Supabase (`app_state`, `recipes`, `ferments`, `courses`, `media`, `app_sessions`).
- **Déploiement statique** : Netlify (`publish = "."`) + GitHub Pages.
- **Validation** : `node --check app.js` + sandbox Node (isolation démo, non-régression app réelle, rendu des composants).

---

## 9. Design & contenu

- Thème visuel partagé (variables CSS : or/violet/rose, fond vert sombre voilé).
- UI en **français**.
- Ton onboarding : accueillant, rassurant sur la vie privée, concis.
- Contenu d'exemple neutre (Alex / Sam), crédible mais impersonnel.

---

## 10. Lancement & déploiement

- **Option A** — même site : accessible à `/highdrevm/` (aucune config supplémentaire).
- **Option B** — site distinct : 2ᵉ déploiement depuis le même dépôt + `_redirects` (`/ → /highdrevm/`).

---

## 11. Risques & mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| Fuite de données réelles via la démo | Élevé | Supabase désactivé + namespace `hd:` (isolation vérifiée en test) |
| Collision `localStorage` même origine | Moyen | Préfixe `hd:` sur toutes les clés en démo |
| Divergence code démo / réel | Moyen | Une seule base `app.js`, comportement piloté par `DEMO` |
| Régression app privée | Élevé | Défauts inchangés + tests de non-régression (sandbox `DEMO=false`) |
| Confusion démo/réel pour l'utilisateur | Faible | Marque « Highdrevm », mention bêta, onboarding explicite |

---

## 12. Roadmap (post-v1)

- **v1 (livré)** : isolation démo, données neutres, mode Couple/Solo, profil éditable, onboarding public, dossier + PRD.
- **v1.x** : thèmes/avatars par profil, export/import du profil démo, i18n, mini-analytics anonymes (taux d'onboarding).
- **v2 (exploratoire)** : synchronisation optionnelle opt-in (compte léger) pour un usage public persistant multi-appareils.

---

## 13. Questions ouvertes

- Faut-il un **rappel récurrent** discret « données d'exemple » au-delà de l'onboarding ?
- Le **bouton profil** doit-il rester dans l'en-tête ou devenir un vrai menu réglages ?
- Souhaite-t-on un **partage** (lien) de configuration démo, ou tout reste-t-il strictement local ?

---

*Voir aussi : [`DOSSIER.md`](./DOSSIER.md) (documentation technique complète) et [`README.md`](./README.md) (démarrage/déploiement).*
