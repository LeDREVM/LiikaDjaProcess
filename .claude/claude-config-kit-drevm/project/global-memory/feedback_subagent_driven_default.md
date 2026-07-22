---
name: feedback_subagent_driven_default
description: Plan d'implémentation avec tâches indépendantes → dispatch en subagents par défaut, sans demander le mode
metadata:
  type: feedback
---

Quand un plan d'implémentation contient des tâches indépendantes, les exécuter en développement
piloté par subagents par défaut, sans demander quel mode utiliser.

**Why:** déléguer les recherches et tâches parallèles à des subagents préserve le contexte principal
et accélère. Demander « tu veux que j'utilise des subagents ? » est une friction inutile.

**How to apply:** recherches multi-fichiers → subagent qui retourne une synthèse. Tâches d'implé
indépendantes → subagents dédiés. Garder le contexte principal pour la coordination. Ne pas demander
le mode, l'appliquer.
