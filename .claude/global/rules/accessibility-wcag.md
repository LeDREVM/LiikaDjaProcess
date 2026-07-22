# [DEV] Accessibility WCAG 2.1 AA — Global Rule

> Étiquette **[DEV]** : pertinent si tu produis des interfaces web.

Audit WCAG 2.1 AA complet (souvent une obligation légale). Va au-delà des détecteurs automatiques.
Skill associé : `design:accessibility-review`.

---

## Quand l'utiliser AUTOMATIQUEMENT
1. **Après chaque nouvelle UI / page** créée (avant d'annoncer « fini »).
2. **Avant chaque deploy** (audit du build ou des pages modifiées).
3. **Sur toute modification** de : formulaire (labels, erreurs) · navigation (focus, skip links,
   clavier) · modale/dropdown (focus trap, ESC) · tableau (caption, scope) · média (transcript,
   captions) · image significative (alt) · couleurs/contraste.

---

## Critères CRITIQUES (jamais ignorer)
| Critère WCAG | Niveau | Impact |
|---|---|---|
| 1.1.1 Alt text | A | Lecteur d'écran ne décrit pas l'image |
| 1.4.3 Contraste 4.5:1 (body) | AA | Texte illisible pour malvoyants |
| 1.4.4 Resize 200% | AA | Site cassé en zoom |
| 2.1.1 Keyboard accessible | A | Site inutilisable sans souris |
| 2.4.3 Focus order | A | Tabulation chaotique |
| 2.4.7 Focus visible | AA | Utilisateur perdu au clavier |
| 2.5.5 Touch target 44×44px | AAA | Boutons ratés sur mobile |
| 3.3.2 Labels formulaires | A | Lecteur d'écran ne nomme pas le champ |
| 4.1.2 ARIA correct | A | Lecteur d'écran trompé |

---

## Workflow type
1. Modifier / créer une UI
2. Détecteur rapide automatique (ex. `npx --yes impeccable detect <fichier>`)
3. Audit complet (`design:accessibility-review`)
4. Violations critiques → fixer
5. Re-audit → 0 violation critique
6. Annoncer « fini » avec score + screenshot

## Interdictions
- NEVER annoncer une UI livrable sans audit a11y préalable
- NEVER ignorer un critère niveau A (obligatoire)
- NEVER dire « j'ajouterai l'a11y plus tard » — impossible à rattraper proprement
