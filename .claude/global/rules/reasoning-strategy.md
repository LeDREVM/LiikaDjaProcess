# Reasoning & Search Strategy

## Règle d'or : comprendre avant d'agir
Avant CHAQUE tâche :
1. Reformuler ce que l'utilisateur veut en français simple
2. Identifier CE QUI NE DOIT PAS CHANGER
3. Lister les fichiers impactés
4. Vérifier les effets de bord
5. Seulement ensuite : agir

## Stratégie de recherche : Broad → Specific → Verify
- **Broad** = chercher large (un mot-clé dans tout le projet)
- **Specific** = affiner (le mot-clé + un sous-dossier)
- **Verify** = lire TOUS les résultats, tracer les imports jusqu'à la source
- JAMAIS s'arrêter au 1er résultat trouvé

## Diagnostic d'erreur : cause racine avant fix
1. Lire le MESSAGE D'ERREUR COMPLET
2. Tracer l'erreur jusqu'à sa source dans le code
3. Identifier la VRAIE cause, pas le symptôme visible
4. JAMAIS corriger le symptôme si la cause racine n'est pas trouvée
5. JAMAIS deviner un fix si l'erreur n'est pas comprise

## Vérification des effets de bord (avant tout changement)
- Quels fichiers importent / utilisent ce qu'on va modifier ?
- Y a-t-il des tests qui dépendent de ce comportement ?
- Le changement affecte-t-il l'interface visible ?
- → Si OUI à l'un des 3 : signaler avant de modifier

## Parallélisme des outils
- EN PARALLÈLE : lectures indépendantes, vérifications indépendantes
- EN SÉQUENTIEL : Lire → Éditer → Vérifier ; question + action

## Annonce avant exécution — obligatoire pour 3+ étapes
Format : « Je vais [action]. Ça va affecter [fichiers]. [X] restera inchangé. On y va ? »
Pourquoi : un débutant doit savoir ce qui l'attend avant que ça arrive.

## Quand demander vs quand agir
DEMANDER si : la demande a 2 interprétations · le changement est irréversible · le scope dépasse
ce qui a été demandé.
AGIR si : la tâche est claire et dans le scope · c'est une correction évidente · l'utilisateur a
dit « go ».

## Règle « une chose à la fois »
Un seul changement, testé et fonctionnel, avant le suivant. JAMAIS empiler 3 changements non
testés → si ça casse, on sait exactement lequel est fautif.

## Détection de scope excessif
Si la tâche devient 2× plus grande qu'annoncé : STOP, signaler, redéfinir ensemble.

## Gestion des ambiguïtés
UNE question précise avec options A/B/C, jamais plusieurs à la fois. Si hypothèse faite :
« Je suppose que X — c'est correct ? »

## Extraction d'apprentissage — après chaque problème résolu
Persister dans MEMORY.md : la vraie cause du bug · la solution qui a marché et pourquoi · le
pattern à retenir. Format : « Pattern appris [date] : [2 phrases max] ».
