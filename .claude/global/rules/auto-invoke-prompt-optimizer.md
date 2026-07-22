# Auto-Invocation Prompt Optimizer — Global Rule

**CRITICAL** : TOUTES les requêtes non-triviales doivent passer par le skill `prompt-optimizer`
AVANT de commencer à répondre. Le skill reformule la demande en prompt structuré → meilleure
compréhension → meilleure livraison du premier coup → moins d'aller-retours.

> Prérequis : le skill `prompt-optimizer` doit être installé (voir `skills-and-plugins.md`).

---

## TEST DE DÉCLENCHEMENT (par défaut = INVOQUER)
Invoquer SAUF si la requête tombe dans la liste d'exceptions stricte ci-dessous. En cas de doute →
invoquer (le coût d'une invocation inutile << coût d'une mauvaise interprétation).

### Détecteur de complexité (= invoquer automatiquement)
Au moins 1 condition → INVOQUER :
- Requête > 8 mots
- Contient un verbe d'action : fais, implémente, corrige, optimise, améliore, refais, crée,
  change, modifie, propose, analyse, vérifie, teste, débug, déploie, cherche, trouve
- Référence floue : « ça », « ce truc », « le bug », « la page », « mon site »
- Plusieurs éléments reliés par « et », « puis », « ensuite », « mais aussi »
- Décrit un résultat attendu sans préciser le moyen
- Question avec contexte technique sous-jacent (« pourquoi ça marche pas ? »)

---

## EXCEPTIONS STRICTES (= NE PAS invoquer)
Liste fermée. Toute requête hors de cette liste DOIT déclencher l'invocation.
1. **Mono-mot strict (≤ 3 mots)** : oui/non/ok/go/stop/continue/valide/annule…
2. **Réponses à un menu de questions** : sélection d'option A/B/C, ou texte libre déjà cadré.
3. **Commandes slash atomiques** : `/help`, `/clear`, `/commit`… (sauf si suivies d'arguments
   complexes > 5 mots → invoquer).
4. **Métadonnées de session** : salutation, politesse, « tu es là ? ».
5. **Override explicite** : « skip prompt-optimizer », « réponds direct », « pas besoin de
   reformuler ».

---

## COMMENT INVOQUER (args enrichis)
Préfixer la requête originale avec un bloc CONTEXTE quand c'est pertinent :
```
[CONTEXTE
- Projet actif : <nom> (cwd : <path>)
- Branche git : <branche>
- Dernière action : <résumé 1 ligne>
- Fichiers récemment modifiés : <max 3>
]
REQUÊTE :
<requête brute intégrale>
```
L'invocation se fait AVANT toute autre action (avant Read, Edit, Bash, sous-agents, menus).

---

## AUTO-CHECK QUALITÉ POST-REFORMULATION
Vérifier la reformulation contre 4 critères :
| Critère | Question |
|---|---|
| Décomposition | Identifie-t-elle 2+ sous-tâches là où il n'y en avait qu'une écrite ? |
| Spécificité | A-t-elle nommé les fichiers/composants concrets ? |
| Scope clair | A-t-elle distingué ce qui DOIT changer de ce qui NE DOIT PAS ? |
| Ambiguïté révélée | A-t-elle mis le doigt sur une décision floue à clarifier ? |

OUI à au moins 1 → la reformulation apporte de la valeur → l'utiliser.
NON aux 4 → la requête était déjà claire → procéder directement.

---

## QUE FAIRE avec le résultat
1. Lire le prompt optimisé.
2. Auto-check qualité.
3. Reformuler à l'utilisateur en 1 phrase français simple ce qu'on a compris,
   **sans mentionner prompt-optimizer**.
4. Si aucune ambiguïté → procéder directement (ne pas demander de validation inutile).
5. Si 2+ interprétations → poser UNE question A/B/C avant de coder.

---

## INTERDICTIONS
- NEVER répondre directement à une requête complexe sans avoir invoqué prompt-optimizer
- NEVER sauter l'étape sous prétexte de « gagner du temps » / « c'est simple » / « je vois déjà »
- NEVER invoquer prompt-optimizer sur sa propre réponse précédente (= boucle)
- NEVER mentionner publiquement l'invocation — la faire silencieusement
- NEVER étendre les exceptions au-delà de la liste stricte

---

## Format de réponse après optimisation
✅ « Tu veux que je [X], en gardant [Y]. Je m'y mets. »
✅ « Compris : [X1] et [X2]. Je commence par X1. »
❌ « J'ai invoqué prompt-optimizer et voici le prompt structuré… »

Cette règle protège la qualité, pas la vitesse.
