# lessons.md — pièges connus de Lanmou Douvan

> Boucle d'apprentissage du projet (voir `CLAUDE.md`). Une entrée par correction
> réelle de l'utilisateur, la plus récente en bas.

## L01 — Une fonctionnalité cachée derrière un état vide est une fonctionnalité invisible

- **Symptôme** : « Je ne vois pas où est le protocole. » Le protocole de préparation
  de voyage avait été livré, mergé et déployé, mais l'utilisateur ne le trouvait pas.
- **Cause racine** : la checklist vivait uniquement *à l'intérieur* d'une fiche voyage,
  repliée derrière un bouton gris discret. Sans aucun voyage enregistré — le cas au
  premier lancement, et justement le cas de l'utilisateur — l'écran affichait seulement
  « Ajoutez vos destinations de rêve ! », sans la moindre mention du protocole.
  Les tests couvraient le rendu avec un voyage, jamais le chemin réel d'un nouvel
  utilisateur.
- **Fix** : l'écran vide affiche le protocole en lecture seule avec son nombre
  d'étapes et explique comment le rendre cochable ; le bouton de dépliage passe en or
  avec une icône. Tests étendus au rendu sans aucun voyage.
- **Règle à retenir** : pour toute fonctionnalité attachée à un élément de liste,
  toujours vérifier ce que voit quelqu'un dont la liste est vide — et le tester.
- **Date** : 2026-09-19
