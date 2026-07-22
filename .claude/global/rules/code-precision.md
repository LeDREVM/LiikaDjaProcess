# Code Precision Rules

## Les 3 niveaux de règles
- **NEVER** = violation absolue, zéro exception
- **ALWAYS** = obligatoire à chaque fois sans exception
- **CRITICAL** = risque élevé, vérification double requise

## NEVER — Violations absolues
- NEVER modifier un fichier sans le lire d'abord → tu pourrais écraser du code sans le savoir
- NEVER toucher du code qui fonctionne pour « l'améliorer » → règle du changement minimal :
  si seule la ligne 42 est cassée, ne toucher que la ligne 42
- NEVER dire « c'est fait » sans vérification prouvée → un fix non testé = pas livrable
- NEVER deviner des valeurs ou paramètres → une valeur inventée plante silencieusement
- NEVER proposer une solution utilisant une technologie absente de la stack du projet
  → vérifier d'abord : quel gestionnaire de paquets ? framework ou vanilla ?
- NEVER créer un nouveau fichier si on peut modifier l'existant → plus de fichiers = plus de
  complexité à gérer seul
- NEVER commiter sans demande explicite de l'utilisateur
- NEVER proposer d'ajouter une librairie pour un problème solvable en 5 lignes
- NEVER utiliser cat/sed/awk/echo pour lire/éditer — utiliser les outils Read/Edit/Write

## ALWAYS — Comportements obligatoires
- ALWAYS lire le fichier avant toute édition
- ALWAYS relire après modification pour confirmer
- ALWAYS vérifier que le build passe avant d'annoncer un fix
- ALWAYS fournir tous les imports dans le code généré
- ALWAYS expliquer ce que fait le code généré en 1-2 phrases simples
- ALWAYS vérifier la compatibilité stack avant de proposer une solution

## CRITICAL — Risques élevés
- CRITICAL : avant d'éditer, valider 3 points : (1) l'élément à remplacer existe-t-il vraiment ?
  (2) le nouveau code est-il syntaxiquement correct ? (3) l'édition casse-t-elle des imports ou
  dépendances ? Si NON à l'un des 3 : STOP et expliquer.
- CRITICAL : pièges débutant à éviter activement → jamais coller du code sans l'expliquer ligne
  par ligne ; jamais ajouter une abstraction non demandée ; jamais copier du code d'un autre projet
  sans vérifier la compatibilité.
- CRITICAL : après 3 tentatives échouées sur le même bug → arrêter, expliquer ce qui bloque,
  proposer une autre approche.
- CRITICAL : jamais enchaîner 2 fixes sans tester le 1er.

## Transparence sur completion partielle
Si une solution ne résout que partiellement le problème : jamais la présenter comme terminée.
Déclarer : « Résolu : [X]. Reste à faire : [Y] parce que [raison] » puis proposer les options.

## Format de référence au code existant
Citer du code existant : `numéroLigne:fichier` (ex. `13:src/main.js`). Nouveau code : markdown
standard avec language tag.
