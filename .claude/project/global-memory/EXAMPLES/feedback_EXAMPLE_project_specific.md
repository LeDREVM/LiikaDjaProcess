---
name: feedback_EXAMPLE_project_specific
description: Modèle — un feedback né d'un bug/correction propre à un projet (cause racine + comment l'éviter)
metadata:
  type: feedback
---

> EXEMPLE de feedback `project-specific`. Quand un bug a une cause racine non évidente, on la grave
> ici pour ne pas retomber dedans. Crée-en un à chaque correction qui t'a appris quelque chose.

Symptôme : (ce qu'on observait — ex. « le changement CSS ne s'appliquait pas en prod »).

Cause racine : (la vraie cause — ex. « le navigateur servait une version en cache ; il fallait
invalider le cache »).

**Why:** sans noter la cause racine, on rejoue le même diagnostic à chaque occurrence.

**How to apply:** (le réflexe à avoir la prochaine fois — ex. « toujours recharger avec cache-bust
avant de conclure qu'un fix CSS ne marche pas »). Voir [[feedback_test_fix_methodology]].
