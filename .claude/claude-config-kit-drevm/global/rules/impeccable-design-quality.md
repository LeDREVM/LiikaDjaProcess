# [DEV] Impeccable Design Quality — Global Rule

> Étiquette **[DEV]** : pertinent si tu produis des interfaces (sites, apps, composants UI).

Détecteur déterministe d'anti-patterns frontend (sans LLM). Catch les défauts visuels classiques
des sites « AI-generated » : gradients gratuits, glow sur fond sombre, easing élastique daté,
contraste insuffisant, polices génériques, noir pur, hiérarchie typographique plate.
Repo : https://github.com/pbakaus/impeccable

---

## Quand l'utiliser AUTOMATIQUEMENT
1. **Avant chaque deploy** : scanner le dossier de build. `npx --yes impeccable detect <dir>`.
   Exit 0 → OK. Exit ≠ 0 → BLOQUER le deploy, fixer d'abord.
2. **Après chaque modification visuelle** : scanner UNIQUEMENT le fichier modifié (rapide).
3. **Avant de partager un preview** : scan obligatoire pour ne pas livrer un design cliché.
4. **Audit spontané** si tu détectes du code suspect (`gradient-text`, glow `box-shadow`,
   `cubic-bezier` élastique, noir pur `#000`).

---

## Anti-patterns CRITIQUES à fixer immédiatement
| Code | Impact |
|---|---|
| `low-contrast` | Accessibilité — texte mal lisible (WCAG AA fail) |
| `tiny-text` | Mobile illisible (body < 12px) |
| `gradient-text` | Signature « site AI » — décrédibilise la marque |
| `dark-glow` | Signature « site AI » — look daté |
| `pure-black-white` | Manque de raffinement — tinter le noir avec la couleur de marque |
| `bounce-easing` | Animations datées (easing élastique) |
| `wide-tracking` body | Letter-spacing trop large sur le body ralentit la lecture |
| `flat-type-hierarchy` | Tailles de police trop proches → hiérarchie illisible |

---

## Workflow type
1. Modifier le code (CSS / markup / composant)
2. `npx --yes impeccable detect <fichier modifié>`
3. Fixer : d'abord les CRITIQUES (contraste, tiny-text), puis les clichés AI, puis le reste
4. Re-scanner → 0 violation
5. Screenshot (preuve visuelle)
6. Annoncer « fini » avec exit code + screenshot

## Interdictions
- NEVER annoncer une feature visuelle « finie » sans scan préalable
- NEVER ignorer une violation `low-contrast` ou `tiny-text` (vrais bugs accessibilité)
- NEVER considérer un build OK juste parce qu'il compile — le scan doit aussi passer
- NEVER désactiver une règle pour faire passer un check — toujours fixer le code

## Exception
Si l'utilisateur demande explicitement « skip » → respecter, mais signaler le risque en 1 phrase.
