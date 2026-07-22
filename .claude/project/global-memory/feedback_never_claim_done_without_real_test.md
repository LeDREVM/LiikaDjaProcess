---
name: feedback_never_claim_done_without_real_test
description: P1 absolue — jamais annoncer « fini / ça marche » sans avoir testé soi-même le scénario réel + preuve
metadata:
  type: feedback
---

Jamais dire « fini / ça marche / c'est live / ✅ » sur la base d'une simple lecture de code ou d'un
build qui passe. Toujours tester soi-même le scénario exact, avec preuve.

**Why:** un build qui compile ≠ ça fonctionne. Un screenshot ≠ ça marche. Annoncer un fix non testé
qui s'avère cassé détruit la confiance.

**How to apply:** pour chaque bug ou feature : (1) reproduire/observer l'état AVANT, (2) appliquer
le changement, (3) déclencher l'action EXACTE (cliquer le bouton, soumettre le form, jouer la vidéo)
dans un vrai navigateur ou via la vraie commande, (4) vérifier l'état observable attendu, (5)
capture/console propre comme preuve, (6) SEULEMENT alors annoncer « fixé ». Tester aussi en mobile,
pas seulement desktop. Voir [[feedback_visual_diff_for_all_fixes]].
