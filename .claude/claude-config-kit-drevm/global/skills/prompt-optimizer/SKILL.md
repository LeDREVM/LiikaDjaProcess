---
name: prompt-optimizer
description: Reformule automatiquement les demandes conversationnelles de l'utilisateur en prompts structurés, complets et sans ambiguïté pour Claude Code. Déclenche ce skill dès que l'utilisateur décrit une fonctionnalité à implémenter, un bug à corriger, un comportement attendu, ou toute demande formulée de façon naturelle qui mélange plusieurs sous-tâches ou manque de précision technique. Mieux vaut toujours structurer que rater la moitié de la demande.
---

# Prompt Optimizer

Ce skill transforme les demandes conversationnelles en prompts structurés, complets et sans
ambiguïté pour Claude Code.

## Contexte
- L'utilisateur écrit de façon naturelle et directe.
- Il envoie souvent plusieurs sous-tâches imbriquées dans un seul message.
- Sans structuration, Claude risque d'interpréter à côté ou de ne traiter qu'une partie.

## Processus de reformulation

### 1. Identifier toutes les sous-tâches
Décomposer le message en N tâches distinctes numérotées. Ne jamais fusionner deux tâches qui
touchent des éléments différents.

### 2. Identifier le contexte technique (pour chaque sous-tâche)
- Quel fichier est concerné
- Quel élément / fonction / composant est impliqué
- Quel comportement actuel vs comportement attendu

### 3. Écrire le prompt structuré
```
## Contexte
[Fichier(s) concerné(s), état actuel]

## Tâches à réaliser
### Tâche 1 – [Titre court]
**Problème actuel :** [...]
**Comportement attendu :** [...]
**Éléments concernés :** [fichiers, sélecteurs, fonctions]

### Tâche 2 – [Titre court]
...

## Critères de succès
- [ ] [Vérification 1]
- [ ] [Vérification 2]

## Contraintes
- Ne pas casser le reste du code existant
- [Toute contrainte détectée dans le message]
```

## Règles importantes
- **Ne jamais supposer** : si c'est ambigu, inclure les deux interprétations avec une note
  `[à clarifier]`.
- **Toujours lister les fichiers** à modifier explicitement.
- **Séparer chaque comportement interactif** (clic, survol, scroll) en tâche distincte.
- **Répéter les éléments partagés** dans chaque tâche concernée (Claude lit séquentiellement).

## Exemple

**Message brut :**
> « l'aperçu ne change pas quand je change d'onglet, et je veux une surbrillance quand je survole »

**Reformulation :**
```
## Contexte
Fichier : page avec onglets + aperçu live.

## Tâches à réaliser
### Tâche 1 – Synchronisation onglet actif → aperçu
**Problème actuel :** changer d'onglet ne met pas à jour l'aperçu.
**Comportement attendu :** chaque clic d'onglet affiche la section correspondante dans l'aperçu.
**Éléments concernés :** boutons d'onglets, conteneur d'aperçu, logique de switching.

### Tâche 2 – Surbrillance au survol de l'aperçu
**Problème actuel :** survoler l'aperçu ne fait rien.
**Comportement attendu :** au survol d'une zone, highlight visible + indication de l'onglet
correspondant.
**Éléments concernés :** zones de l'aperçu, onglets, événements mouseenter/mouseleave.

## Critères de succès
- [ ] Cliquer un onglet met à jour l'aperçu
- [ ] Survoler une zone déclenche un highlight
- [ ] Aucune autre fonctionnalité cassée
```

## Quand NE PAS reformuler
- Question simple sans demande de code (« c'est quoi X ? ») → répondre directement.
- L'utilisateur dit « envoie tel quel » → ne pas reformuler.
