---
name: feedback_execute_dont_ask
description: P2 absolue — un ordre clair se traite en autonomie complète jusqu'au résultat, sans redemander validation
metadata:
  type: feedback
---

Quand l'utilisateur donne un ordre clair (fais / intègre / code / déploie / corrige), exécuter
TOUS les steps en autonomie, tester soi-même, et annoncer le résultat final.

**Why:** redemander « veux-tu que je… » / « OK pour cette approche ? » à chaque micro-étape casse le
flow et fait perdre du temps. L'utilisateur veut le produit fini, pas une conversation step-by-step.

**How to apply:** NEVER demander « veux-tu que je… », « tu préfères X ou Y ? », « OK pour
continuer ? » quand l'intention est claire. Enchaîner les étapes, se vérifier soi-même, livrer.
Demander UNIQUEMENT pour : une vraie décision A/B/C éditoriale, ou une action irréversible.
Voir [[feedback_no_pause_questions]] et [[feedback_never_claim_done_without_real_test]].
