# 00 — START HERE

## Étape 1 — Place ce dossier où tu veux

Mets le dossier `claude-config-kit/` quelque part de simple, par exemple sur ton Bureau ou à la
racine de ton projet. Retiens son chemin.

## Étape 2 — Ouvre Claude Code et colle ce prompt

Ouvre **ton** Claude Code (dans le terminal, à la racine de ton projet principal), puis copie-colle
**tout le bloc ci-dessous** d'un seul coup :

---

```
Tu vas installer et personnaliser une configuration Claude Code pour moi, à partir d'un kit
de fichiers. Suis cette procédure À LA LETTRE, dans l'ordre.

ÉTAPE A — LIS LE KIT
Le kit se trouve dans le dossier : <COLLE_ICI_LE_CHEMIN_DU_DOSSIER_claude-config-kit>
1. Lis dans ce dossier : README.md, PLACEHOLDERS.md, skills-and-plugins.md.
2. Liste tous les fichiers du kit (global/, global-memory/, project/) pour savoir ce qu'il contient.

ÉTAPE B — APPRENDS À ME CONNAÎTRE
Pose-moi ces questions UNE PAR UNE (attends ma réponse à chaque fois). Si je laisse vide, mets une
valeur neutre par défaut et continue, ne me bloque pas :
  1. Ton prénom (ou le nom que je dois utiliser pour te parler) ?
  2. Ton email (sert juste à la config git/projet ; laisse vide si tu préfères) ?
  3. Dans quelle langue je communique avec toi ? (ex : français, anglais)
  4. Tu travailles sur quoi en ce moment ? (1-2 phrases : ton domaine, tes projets)
  5. Tu écris du code ? Si oui : quelle stack (langages, frameworks, hébergement) et quel
     est ton niveau (débutant / intermédiaire / avancé) ? Si non : dis simplement "pas de code".

ÉTAPE C — REMPLIS LES PLACEHOLDERS
PLACEHOLDERS.md liste tous les jetons {{COMME_CECI}} et ce qu'ils signifient. Avec mes réponses,
détermine la valeur de chaque placeholder. Pour ceux que tu ne peux pas déduire, choisis une valeur
neutre raisonnable (et note-la dans le rapport final). Ne me redemande pas 15 fois.

ÉTAPE D — ADAPTE LE CONTENU À MON PROFIL
- Si je NE code PAS : retire (ou n'installe pas) les fichiers étiquetés [DEV] en haut de leur
  contenu (preview-fidelity, impeccable-design-quality, accessibility-wcag, security-deploy,
  error-killing, et les hooks post-lint / pre-stop-tests / post-deps-audit / pre-deploy). Garde
  tout le reste (le cœur méthodologique est universel).
- Si je code mais autre stack : garde les règles [DEV] mais reformule les exemples techniques
  (remplace les outils web cités en exemple par les équivalents de MA stack).
- Les fichiers en .EXAMPLE : ne les copie PAS tels quels. Sers-t'en comme MODÈLE pour créer
  1 à 2 règles "métier" adaptées à MON domaine (voir mes réponses 4 et 5), puis place ces
  nouvelles règles à la bonne destination. Si mon domaine est flou, laisse les .EXAMPLE de côté
  et explique-moi comment en créer plus tard.

ÉTAPE E — INSTALLE AUX BONS ENDROITS
Copie les fichiers (placeholders déjà remplis) vers :
  - global/CLAUDE.md            ->  ~/.claude/CLAUDE.md
  - global/rules/*.md           ->  ~/.claude/rules/
  - global-memory/*.md          ->  ~/.claude/projects/<SLUG>/memory/
       (où <SLUG> = le chemin de mon projet avec les "/" remplacés par des "-",
        ex: /Users/moi/Sites/monprojet  ->  -Users-moi-Sites-monprojet.
        Si tu n'es pas sûr du slug exact que Claude Code utilise, crée le dossier
        d'après le cwd courant et dis-le moi pour que je vérifie.)
  - project/CLAUDE.md           ->  <racine_du_projet>/CLAUDE.md   (fusionne si un existe déjà)
  - project/settings.json       ->  <racine_du_projet>/.claude/settings.json  (fusionne, n'écrase pas)
  - project/hooks/*.sh          ->  <racine_du_projet>/.claude/hooks/   puis  chmod +x sur chacun
  - project/commands/*.md       ->  <racine_du_projet>/.claude/commands/
  - project/agents/*.md         ->  <racine_du_projet>/.claude/agents/
  - project/CONTEXT_PIN.md.EXAMPLE -> adapte -> <racine_du_projet>/CONTEXT_PIN.md
Avant d'écraser un fichier existant, montre-moi un diff et demande. Pour les fichiers neufs, vas-y.

ÉTAPE F — SKILLS & PLUGINS
Lis skills-and-plugins.md et liste-moi les commandes exactes à lancer pour installer les
marketplaces/plugins (superpowers, etc.). Propose de les lancer ; ne les lance qu'après mon OK.

ÉTAPE G — VÉRIFIE
- Confirme que ~/.claude/CLAUDE.md et ~/.claude/rules/ existent et contiennent mes valeurs (pas de
  {{PLACEHOLDER}} restant : fais une recherche de "{{" dans tous les fichiers installés).
- Confirme que .claude/settings.json référence des hooks qui existent bien sur le disque.
- Rappelle-moi que les hooks ne s'activent qu'au PROCHAIN lancement de Claude Code.

ÉTAPE H — RAPPORT FINAL
Donne-moi : (1) la liste des fichiers installés et où, (2) les placeholders que tu as devinés et
leur valeur, (3) ce que tu as retiré/adapté pour mon profil, (4) les commandes skills/plugins
restantes, (5) la seule action manuelle qu'il me reste à faire (relancer Claude Code).

IMPORTANT pendant toute la procédure :
- Ne réécris jamais le SENS des règles : tu remplaces seulement les placeholders et adaptes les
  exemples. Le contenu méthodologique reste intact.
- N'invente aucune info personnelle me concernant. En cas de doute, valeur neutre + signale-le.
- Travaille en autonomie : enchaîne les étapes sans me demander de valider chaque micro-action.
  Demande-moi seulement (1) avant d'écraser un fichier existant, (2) avant de lancer une
  installation de plugin.
```

---

## Étape 3 — Relance Claude Code

Quand Claude a fini, **ferme et rouvre Claude Code**. Les hooks (garde-fous) ne s'activent qu'au
démarrage d'une session. C'est normal.

## Étape 4 — Teste

Demande à Claude une petite tâche et observe : il devrait reformuler ta demande avant d'agir,
refuser de dire « c'est fait » sans preuve, et garder ses réponses dans ta langue. Si oui :
l'installation a réussi.

---

### Si tu préfères installer à la main

Tout est faisable manuellement : ouvre [`PLACEHOLDERS.md`](PLACEHOLDERS.md), remplace les jetons
dans chaque fichier, puis copie les dossiers aux destinations listées dans l'**Étape E** ci-dessus.
Le prompt automatique fait juste tout ça pour toi.
