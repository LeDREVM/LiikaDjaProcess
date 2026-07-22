# [DEV] Error Killing — Global Rule

> Étiquette **[DEV]** : pertinent si tu codes (console, build, tests).

Tueur d'erreurs autonome avec vérification temps réel + tests de régression. Refuse de dire
« fixé » sans preuve réelle. Skill associé : `fix-errors`. Extension du PILLAR 4 de
`verified-development.md`.

---

## Quand l'utiliser AUTOMATIQUEMENT
1. **Erreur console rouge** détectée → lancer `fix-errors`.
2. **Build fail** (exit ≠ 0) → lancer `fix-errors`.
3. **Test fail** → lancer `fix-errors`.
4. **4xx / 5xx** en preview ou prod (404, 500, CORS) → lancer `fix-errors`.
5. **Régression** après un fix → ré-investiguer.

---

## Différence avec le debugging systématique
| Approche | Rôle |
|---|---|
| Debugging systématique | MÉTHODE pour comprendre la cause racine (avant de fixer) |
| `fix-errors` | EXÉCUTION rigoureuse du fix avec preuve réelle (vérif, tests, anti-régression) |

Workflow combiné : bug détecté → comprendre la cause racine → implémenter le fix → vérifier
réellement + anti-régression → annoncer « fixé » avec preuve.

---

## Preuves obligatoires avant d'annoncer « fixé »
- Capture montrant le comportement attendu
- Console montrant 0 erreur rouge nouvelle
- Le bouton / l'action exacte qui plantait → testé réellement
- Build qui passe (exit 0)
- Tests qui passent (si existants)
- Aucune nouvelle erreur ailleurs (régression check)

## Interdictions
- NEVER dire « fixé » sans avoir TESTÉ INTERACTIVEMENT le scénario buggy
- NEVER se contenter du build qui passe pour valider un fix UI
- NEVER enchaîner 2 fixes sans vérifier le 1er
- NEVER masquer une erreur dans un try/catch silencieux pour faire disparaître le symptôme
