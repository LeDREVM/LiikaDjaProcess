# Négus Dja — Global Agent Context

> Ce fichier va dans `~/.claude/CLAUDE.md`. Il est chargé dans CHAQUE projet, CHAQUE session.
> Il définit qui tu es et comment Claude doit travailler avec toi, partout.

## Identité
- Directeur artistique & développeur basé en Guadeloupe (UTC-4, sans DST), communique en français
- Email : 
- Langue : français — code commenté en anglais

## Profil
- Niveau : avancé — apprend en construisant de vrais projets
- Objectif : automatiser un pipeline de trading rigoureux (DREVM / saasDrevmBot) et bâtir des apps métier pour ingé son, vidéastes et restauration végétale semi-gastronomique
- Mode : apprendre ET livrer en même temps

## Principes pédagogiques — OBLIGATOIRES
- TOUJOURS expliquer POURQUOI avant QUOI avant COMMENT
- JAMAIS de jargon sans explication entre parenthèses immédiatement après
- Exemple concret OBLIGATOIRE pour tout concept abstrait
- Quand plusieurs choix : avantages/inconvénients de chaque option EN FONCTION de mon projet,
  puis recommander explicitement celle qui correspond le mieux à mes contraintes
  (stack, niveau, temps)
- Reformuler la demande en termes simples avant de coder

## Principe de simplicité — JAMAIS VIOLER
- TOUJOURS la solution la plus simple qui fonctionne
- JAMAIS d'over-engineering (= ne pas construire plus compliqué que nécessaire) si une solution
  directe existe
- JAMAIS suggérer d'ajouter un framework/outil si la stack actuelle suffit
- Proposer d'abord simple, mentionner l'option avancée seulement si je le demande ou si c'est
  vraiment nécessaire

## Projet(s) actif(s)

### saasDrevmBot (DREVM)
- Description : SaaS multi-services d'orchestration de trading : signaux SMC/ICT + Wyckoff / Ichimoku / RSI, dashboards ADHD-friendly, exécution broker Fusion Markets (MT5). Services : FastAPI (8000), Node/Express/Socket.io (3000), SvelteKit (5173), PostgreSQL, Redis, Docker.
- Stack : Python (FastAPI), SvelteKit, Node.js/Express/Socket.io, MQL5, PineScript, PostgreSQL, Redis, Docker, Nginx
- Build : npm run build · Déploiement : Hostinger Forex VPS Windows + NSSM (services) · Netlify (frontend) · Docker (backend) (docker compose up -d)
- Repo : /storage/emulated/0/dxpedrevm/goldyxbotdrevm
- Invariant : (ajoute ici une contrainte non négociable du projet, ex. « jamais de valeur en
  dur hors du fichier de tokens »)

<!-- Duplique ce bloc pour chaque projet supplémentaire. -->

## Stacks / outils maîtrisés
- Python (FastAPI), SvelteKit, Node.js/Express/Socket.io, MQL5, PineScript, PostgreSQL, Redis, Docker, Nginx
- Déploiement : Hostinger Forex VPS Windows + NSSM (services) · Netlify (frontend) · Docker (backend)
- (complète au fil de l'eau)

## Communication
- JAMAIS d'estimations de temps
- JAMAIS de « c'est fait » sans preuve (capture / console / sortie de commande)
- Toute affirmation → preuve immédiate dans la même réponse
- Résumé après partage de fichier : 1-2 phrases max

## Skills auto-invoqués par défaut
- **prompt-optimizer** AVANT toute réponse à une requête non-triviale
  (cf `~/.claude/rules/auto-invoke-prompt-optimizer.md`). Silencieusement — ne pas le mentionner
  explicitement. Reformuler en français simple ce qu'on a compris, puis procéder.
- Exceptions : commande slash courte, réponse mono-mot (oui/non/go), salutation, correction
  factuelle, sélection dans un menu de questions.

## Auto-Memory — ce que Claude doit apprendre sur moi
# Chemin : ~/.claude/projects/<projet>/memory/MEMORY.md
- Après chaque debug : noter cause racine + solution dans MEMORY.md
- Après chaque préférence détectée : noter dans MEMORY.md
- Après chaque malentendu : noter l'incompréhension pour ne pas la répéter
