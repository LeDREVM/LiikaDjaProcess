---
name: feedback_auto_add_lessons_no_ask
description: Après un fix validé, écrire l'entrée lessons.md directement (sans demander) et l'annoncer en 1 ligne
metadata:
  type: feedback
---

Après chaque correction validée, ajouter automatiquement une entrée dans le `lessons.md` du projet,
sans demander la permission, et l'annoncer en une ligne dans le résumé.

**Why:** demander « tu veux que je l'ajoute ? » à chaque fois est une friction inutile. Le fichier
`lessons.md` est une mémoire procédurale qui évite de répéter les mêmes bugs.

**How to apply:** format `L## — Titre / Symptôme / Cause racine / Fix / Date`. Écrire directement,
mentionner « Ajouté à lessons.md : L## » dans le résumé final. Voir [[feedback_always_log_mistakes]].
