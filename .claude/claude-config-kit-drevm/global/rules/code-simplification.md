# Code Simplification — Global Rule

Aligné avec la règle absolue : **« JAMAIS d'over-engineering — toujours la solution la plus simple
qui fonctionne »**. Plus l'utilisateur est débutant, plus chaque ligne en trop = charge mentale en
plus pour lui.

## Quand simplifier AUTOMATIQUEMENT
1. Après chaque batch d'implémentation, dès que c'est fonctionnel → simplifier AVANT de commiter.
2. Avant chaque PR / merge → audit final pour livrer du code minimal et lisible.
3. Quand tu viens de générer 100+ lignes → plus le volume est gros, plus le risque de bloat l'est.
4. Sur refactor d'un fichier déjà long → vérifier que tu n'as pas ajouté de complexité.

## Anti-patterns à éliminer en priorité

| Pattern | Pourquoi mauvais | Solution |
|---|---|---|
| Helper utilisé 1 seule fois | Indirection inutile | Inline le code |
| Abstraction prématurée | Complexité sans bénéfice | Rester concret jusqu'à 3+ usages |
| Conditions imbriquées 3+ niveaux | Illisible | Early return / extraire une fonction |
| Code mort (commenté, inutilisé) | Pollution | Supprimer (l'historique git le garde) |
| Variables intermédiaires inutiles | Verbeux | Inline si lisible |
| Try/catch qui mange l'erreur | Cache des bugs | Laisser remonter ou logger |
| Fonction > 30 lignes | Trop de responsabilités | Découper |
| Paramètres > 4 | Mauvaise interface | Objet de config |

## Workflow type
1. Implémenter (faire fonctionner d'abord).
2. Tests passent → simplifier.
3. Re-tester (la simplification ne doit rien casser).
4. Commit avec code minimal.

## Règle d'or
**Si tu viens d'écrire du code et que tu es tenté de le commiter sans relecture → c'est exactement
le moment de simplifier.** 3 lignes simples > 1 abstraction « élégante ».

## Interdictions
- NEVER introduire un framework/lib pour un problème solvable en 5 lignes
- NEVER créer une abstraction « au cas où on en aurait besoin plus tard »
- NEVER garder du code commenté « pour référence » — git existe pour ça
- NEVER annoncer « fini » sur un fichier de 200+ lignes neuf sans passe de simplification
