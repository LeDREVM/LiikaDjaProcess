---
name: feedback_measure_gap_dont_assume_synced
description: Avant d'annoncer « complet », mesurer l'écart chiffré entre source et cible — ne jamais supposer synchronisé
metadata:
  type: feedback
---

Pour toute migration / synchronisation / héritage, mesurer l'écart chiffré entre la source et la
cible avant de déclarer « complet ». Ne jamais supposer que c'est déjà synchronisé.

**Why:** « ça devrait être à jour » est faux la moitié du temps. Un diff chiffré (X éléments source,
Y cible, Z manquants) révèle la vérité.

**How to apply:** compter par catégorie des deux côtés, lister les manquants, traiter, recompter.
Gérer les pièges (liens symboliques, fichiers générés). Complément de
[[feedback_cascade_impact_audit_universal]].
