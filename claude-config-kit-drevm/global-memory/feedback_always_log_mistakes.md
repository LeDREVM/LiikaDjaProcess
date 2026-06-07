---
name: feedback_always_log_mistakes
description: Quand l'utilisateur signale une erreur, créer la mémoire feedback AVANT de proposer un fix
metadata:
  type: feedback
---

Dès que l'utilisateur signale une erreur ou un oubli de ma part, créer/mettre à jour la mémoire
feedback correspondante AVANT de proposer le fix.

**Why:** logger l'apprentissage d'abord garantit qu'on ne répétera pas l'erreur. Le faire « plus
tard » = ne jamais le faire.

**How to apply:** reconnaître la faute sans excuse → écrire le `feedback_*.md` (cause + comment
l'éviter) → ajouter la ligne dans `MEMORY.md` → ensuite seulement, traiter le fix. Voir
[[feedback_auto_add_lessons_no_ask]].
