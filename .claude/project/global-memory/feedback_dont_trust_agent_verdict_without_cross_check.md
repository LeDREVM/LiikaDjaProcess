---
name: feedback_dont_trust_agent_verdict_without_cross_check
description: Ne jamais supprimer une info sur le seul verdict d'un sous-agent — cross-check dans tout le repo d'abord
metadata:
  type: feedback
---

Ne jamais retirer un fait, une donnée ou du code sur la seule base du verdict d'un sous-agent.
Cross-checker soi-même dans l'ensemble du repo avant d'agir.

**Why:** un sous-agent a un contexte partiel. Suivre son verdict aveuglément peut supprimer une info
réellement sourcée ou casser une dépendance qu'il n'a pas vue.

**How to apply:** avant de retirer quoi que ce soit (un fait, une référence, une fonction),
rechercher toutes ses occurrences/usages dans le repo. Confirmer indépendamment. En cas de doute,
poser la question plutôt que supprimer. Voir [[feedback_no_invented_facts]].
