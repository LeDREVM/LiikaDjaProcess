---
name: feedback_visual_diff_for_all_fixes
description: Capturer l'état AVANT (buggy) et APRÈS (fixé) et comparer — jamais « fait » sans preuve visuelle
metadata:
  type: feedback
---

Pour tout fix, capturer l'état buggy AVANT et l'état corrigé APRÈS, puis comparer explicitement.

**Why:** la comparaison avant/après est la seule preuve qu'un fix a réellement changé quelque chose.
Sans elle, on annonce des fix qui ne prennent pas effet.

**How to apply:** screenshot/observation AVANT le changement → appliquer → screenshot/observation
APRÈS → comparer dans la réponse. Vaut pour le visuel comme pour le comportemental (état DOM,
console, réseau). Complément direct de [[feedback_never_claim_done_without_real_test]].
