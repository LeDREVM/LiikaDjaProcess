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

## L02 — Des données en dur dans le code sont des données qu'on ne peut pas corriger

- **Symptôme** : « La gestion du planning n'est pas assez interactive. »
- **Cause racine** : trois choses cumulées. (1) Les 36 créneaux de `INITIAL_PLANNING`
  vivaient dans le code : impossible d'en modifier un, d'en supprimer un, d'en déplacer
  un. L'emploi du temps affiché n'était donc celui de personne. (2) Aucune édition, même
  pour ses propres créneaux : une faute de frappe obligeait à supprimer puis retaper.
  (3) `dayItems = [...initItems, ...customItems]` — aucun tri : un créneau ajouté à 07:00
  s'affichait après celui de 21:00, ce qui donnait l'impression que l'app ne réagissait pas.
- **Fix** : modèle « copie à l'écriture ». Tant qu'une journée n'est pas touchée, elle est
  rendue depuis `INITIAL_PLANNING` ; à la première modification, ses créneaux sont recopiés
  dans `planning[jour].items` qui devient seul maître à bord. Tout devient alors modifiable,
  duplicable, supprimable, déplaçable d'un jour à l'autre — avec un retour au modèle d'un
  bouton. Tri par heure systématique dans `planDayItems()`, partagé par la vue ET l'export .ics.
- **Règle à retenir** : un jeu de données livré en dur est un point de départ, jamais une
  fin. Si l'utilisateur ne peut pas le corriger, il finira par le subir. Et toute liste
  affichée dans un ordre naturel (heure, date) doit être triée à la lecture, pas à l'écriture.
- **Date** : 2026-09-23
