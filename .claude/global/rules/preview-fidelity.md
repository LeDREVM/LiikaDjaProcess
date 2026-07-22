# [DEV] Preview Fidelity — Global Rule

> Étiquette **[DEV]** : pertinent si tu développes des sites/apps avec une étape de build.
> Si tu ne codes pas, ce fichier peut être retiré.

**RÈGLE ABSOLUE :** le preview utilisé pour valider visuellement un site/app DOIT correspondre
EXACTEMENT au rendu final servi en prod. Aucun preview « approximatif » ne compte comme preuve.

---

## Pourquoi
Un dev server (HMR) sert les fichiers source directement. Le résultat diverge SOUVENT du build prod :
minification, ordre des déclarations CSS, bundle vs imports directs, tree-shaking, variables
d'environnement, logique serveur/edge absente en dev. → Tester sur dev server est une **preuve
invalide** pour les bugs visuels/fonctionnels rapportés en prod.

---

## Règles d'application

### NEVER
- NEVER valider un fix visuel/fonctionnel uniquement en mode dev server (HMR)
- NEVER dire « fixé » en se basant uniquement sur le HMR
- NEVER assumer que dev = prod quand un build step existe

### ALWAYS — valider via un de ces modes (fidélité décroissante)
1. **Navigateur réel sur la PROD** (après deploy) — fidélité 100 %
2. **Serveur de preview sur le build** (`npm run preview` sur le dossier de sortie) — ~95 %
3. **Build local + serveur statique** sur le dossier de sortie — ~80 % (pas de logique serveur)

- ALWAYS mentionner quel mode a servi à valider.
- ALWAYS rebuild + relancer le serveur prod-fidèle après chaque modif source.

---

## Workflow type pour un fix visuel
1. Reproduire le bug en mode prod-fidèle
2. Screenshot AVANT (preuve buggy)
3. Fixer la source
4. **REBUILD** (`npm run build`) — sinon le fix n'est pas servi
5. Relancer le serveur prod-fidèle
6. Reload (cache-bust)
7. Screenshot APRÈS
8. Comparer : fix visible → validé. Sinon → loop fix.
9. Validé → commit + deploy + vérif finale sur la prod réelle

Le rebuild entre chaque modif est plus lent que le HMR, mais c'est le SEUL moyen d'avoir une preuve
fiable. Trade-off non négociable.

---

## 🎯 Adapté à ta stack DREVM
- **SvelteKit** : `npm run dev` (port 5173, HMR) ≠ build. Valider via `npm run preview` sur le
  build, ou sur le déploiement Netlify réel. Le HMR n'est pas une preuve.
- **Backend FastAPI** : un endpoint « marche » seulement après appel réel (status + body vérifiés),
  pas parce que le serveur démarre. Tester via la doc `/docs` ou un appel `httpx`/curl.
- **Bot MT5 / EA MQL5** : la « prod-fidélité » = backtest sur l'historique réel + run sur compte
  démo Fusion Markets avant le live. Un compile MQL5 sans erreur ≠ stratégie validée.
- **Preuve no-repaint** : rejouer le signal sur bougies clôturées historiques, jamais sur live tick.
