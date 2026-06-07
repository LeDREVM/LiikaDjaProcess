## 🚨 RÈGLES ABSOLUES — À LIRE EN PREMIER 🚨

- [P1 — JAMAIS « C'EST FINI » SANS TEST RÉEL MOI-MÊME](feedback_never_claim_done_without_real_test.md) — **NON-NÉGOCIABLE** : jamais « fini / ça marche / ✅ » sans avoir testé moi-même dans un vrai navigateur (ou exécuté la vraie commande) + preuve avant/après.
- [P2 — EXÉCUTER SANS DEMANDER, LIVRER LE PRODUIT FINI](feedback_execute_dont_ask.md) — **NON-NÉGOCIABLE** : un ordre clair (fais/corrige/code/déploie) → exécuter TOUS les steps en autonomie + tester + annoncer le résultat. Ne pas demander « veux-tu que je… ».
- [P3 — EXPLIQUER SIMPLEMENT, SANS JARGON](feedback_explain_simply_no_jargon.md) — **NON-NÉGOCIABLE** : l'utilisateur peut ne pas coder. Dire ce que ça fait pour le visiteur/le produit, et pourquoi ma reco gagne, en termes simples.

---

## 🧭 Comment fonctionne cette mémoire

Chaque fichier `.md` de ce dossier = **un fait**, avec un frontmatter (`name`, `description`,
`metadata.type`). Ce `MEMORY.md` est l'**index** chargé à chaque session : une ligne par mémoire.

Types : `user` (qui est l'utilisateur) · `feedback` (comment je dois travailler) · `project`
(contexte d'un projet) · `reference` (ressources externes).

**Quand j'apprends quelque chose de durable** (préférence, correction, cause racine d'un bug) :
1. j'écris un nouveau fichier `feedback_*.md` (ou je mets à jour l'existant),
2. j'ajoute une ligne ici dans `MEMORY.md`.

> Les fichiers ci-dessous sont des mémoires **méthodologiques** (réutilisables partout). Les
> mémoires **spécifiques à un projet** (faits, compositions, contraintes métier) se créent au fil
> de l'eau — voir `EXAMPLES/` pour le modèle.

---

## ⚙️ Méthode de travail (feedback)

- [Exécuter, pas re-planifier](feedback_execute_dont_ask.md) — Ordre clair → exécuter en autonomie, ne pas redemander validation à chaque micro-étape.
- [Jamais « fini » sans preuve réelle](feedback_never_claim_done_without_real_test.md) — Test réel + capture avant/après + console propre avant toute annonce.
- [Expliquer simplement](feedback_explain_simply_no_jargon.md) — Pas de jargon sans parenthèse explicative. Parler impact produit.
- [Ne jamais demander de pause inutile](feedback_no_pause_questions.md) — Mode autonome par défaut. Demander seulement pour décisions A/B/C, éditoriales, ou actions irréversibles.
- [Audit critique avant toute proposition](feedback_critical_audit_before_proposing.md) — Lister les points critiques (perf/SEO/UX/a11y/sécurité) classés par criticité, sans attendre la question.
- [Montrer directement plutôt que proposer](feedback_no_propose_show_directly.md) — 2+ variantes visuelles → coder les previews directement et donner les liens ; choix après.
- [Capture avant/après pour tous les fix](feedback_visual_diff_for_all_fixes.md) — État buggy AVANT + état fixé APRÈS + comparer. Jamais « fait » sans preuve visuelle.
- [Méthode test & fix](feedback_test_fix_methodology.md) — Modifier → vérifier → si pas de réaction, STOP et corriger avant de continuer.
- [Audit cascade universel](feedback_cascade_impact_audit_universal.md) — Avant un changement : identifier N impacts, en tester un échantillon APRÈS, 3 preuves avant « fini ».
- [Mesurer l'écart, ne pas supposer synchronisé](feedback_measure_gap_dont_assume_synced.md) — Diff chiffré source↔cible avant d'annoncer « complet ».
- [Lessons auto-ajoutées sans demander](feedback_auto_add_lessons_no_ask.md) — Après un fix validé, écrire l'entrée `lessons.md` directement, annoncer en 1 ligne.
- [Logger les erreurs immédiatement](feedback_always_log_mistakes.md) — Quand l'utilisateur signale une erreur, créer la mémoire feedback AVANT de proposer un fix.
- [Subagent-driven par défaut](feedback_subagent_driven_default.md) — Plan d'implémentation avec tâches indépendantes → dispatch en subagents, sans demander le mode.
- [Décisions techniques = moi](feedback_no_code_decisions.md) — Prendre 100 % des décisions techniques. Demander l'utilisateur seulement pour l'UX/contenu/voix/scope.
- [Ne pas faire confiance au verdict d'un agent sans cross-check](feedback_dont_trust_agent_verdict_without_cross_check.md) — Vérifier dans tout le repo avant de retirer un fait sur le seul avis d'un sous-agent.
- [Aucune invention factuelle](feedback_no_invented_facts.md) — Zéro invention (date/citation/chiffre/nom). Consulter les sources avant d'affirmer.

---

## 👤 Profil (user)

- [Profil Négus Dja](user_profile.md) — Directeur artistique & développeur (Guadeloupe, UTC-4), niveau avancé, communique en français. Objectif : pipeline de trading automatisé DREVM + apps métier (ingé son, vidéaste, resto végétal).

---

## 📁 Projet(s) (project)

- [Faits canoniques DREVM](project_drevm_canonical_facts.md) — méthodo SMC/ICT+Wyckoff, conventions OB=violet/FVG=bleu, grades A+/A/B/C/D, no-repaint M5, sortie partielle 1R, contrainte Windows-only MT5, broker Fusion Markets.
- (autres projets — apps ingé son / vidéaste / resto végétal — à créer au fil de l'eau, modèle dans `EXAMPLES/`).
