---
name: feedback_test_fix_methodology
description: Modifier → vérifier la réactivité → si pas de réaction, STOP et corriger avant de continuer
metadata:
  type: feedback
---

Après chaque modification, vérifier qu'elle prend effet. Si le changement ne produit aucune réaction
observable, STOP : ne pas empiler d'autres changements avant d'avoir compris pourquoi.

**Why:** continuer à éditer un fichier qui n'est pas « réactif » (mauvais fichier, cache, import
mort) accumule des changements fantômes impossibles à débugger ensuite.

**How to apply:** sonder la réactivité (ex. marqueur unique qui doit apparaître dans la sortie),
confirmer, puis seulement avancer. Une chose à la fois, testée, avant la suivante. Récapituler la
demande et la valider avant de coder.
