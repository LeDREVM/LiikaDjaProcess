---
name: feedback_cascade_impact_audit_universal
description: Avant un changement, identifier tous les impacts en cascade ; en tester un échantillon après ; 3 preuves avant « fini »
metadata:
  type: feedback
---

Tout changement a des effets en cascade. Les identifier AVANT, en tester un échantillon APRÈS,
fournir au moins 3 preuves avant d'annoncer « fini ».

**Why:** un changement « local » casse souvent autre chose (sélecteur partagé, donnée réutilisée,
section adjacente). Sans audit d'impact, on découvre les régressions en prod.

**How to apply:** lister N éléments potentiellement impactés (fichiers qui importent, pages qui
réutilisent, langues à synchroniser), tester un échantillon représentatif après le changement,
documenter les preuves. Vaut pour tout, pas seulement le CSS. Voir
[[feedback_measure_gap_dont_assume_synced]].
