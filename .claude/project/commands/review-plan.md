---
description: Fait critiquer le plan courant par un subagent « staff engineer sceptique » en lecture seule, avant toute implémentation
---

Avant d'implémenter, fais relire le plan par le subagent `plan-reviewer` (outil Agent,
`subagent_type: plan-reviewer`).

Transmets-lui dans le prompt :
- Le plan complet tel qu'il existe (étapes, fichiers visés, décisions).
- La demande d'origine de l'utilisateur (le besoin réel à satisfaire).
- Les contraintes projet pertinentes (parité multilingue, perf, sections à ne pas casser, fichiers
  sensibles).

Quand il rend sa revue :
1. Affiche-la telle quelle à l'utilisateur.
2. Adresse chaque point **🔴 Bloquant** dans le plan (corrige le plan, ne code pas encore).
3. Reboucle si besoin. N'implémente qu'une fois les bloquants traités et le plan validé.

Plan ou contexte fourni par l'utilisateur (optionnel) : $ARGUMENTS
