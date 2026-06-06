# Kit de duplication — « Ma manière de travailler avec Claude Code »

Ce kit reproduit **une façon de travailler avec Claude Code** : les règles, les garde-fous
automatiques, la mémoire, les agents de revue et les skills. Une fois installé, ton Claude Code
se comportera de la même manière rigoureuse — vérification systématique, refus de dire « c'est
fini » sans preuve, anti-hallucination, exécution autonome, etc.

> **Aucune information personnelle du créateur n'est incluse.** Tout ce qui était spécifique
> (nom, email, projets, domaines) a été remplacé par des **placeholders** `{{COMME_CECI}}` que
> tu remplis avec **tes** infos. Voir [`PLACEHOLDERS.md`](PLACEHOLDERS.md).

---

## 🚀 Démarrage en 30 secondes

1. Ouvre **[`00-START-HERE.md`](00-START-HERE.md)**.
2. Copie le **prompt d'installation** qui s'y trouve.
3. Colle-le dans **ton** Claude Code, à la racine de ton projet.
4. Réponds aux 5 questions que Claude te posera (ton prénom, ton domaine, ta stack…).
5. Claude installe et personnalise tout automatiquement.

C'est tout. Le reste de ce kit, c'est la matière première que Claude utilisera.

---

## 🧠 La philosophie en une page

Cette config force Claude à respecter **5 piliers** :

| Pilier | Ce que ça change concrètement |
|---|---|
| **1. Comprendre avant de coder** | Claude reformule ta demande, lève les ambiguïtés, montre un aperçu avant d'agir. |
| **2. Vérifier chaque changement** | Jamais « c'est fait » sans preuve réelle (test, capture d'écran, sortie console). |
| **3. Simplicité absolue** | La solution la plus simple qui marche. Zéro sur-ingénierie, zéro framework inutile. |
| **4. Mémoire active** | Claude note tes préférences et tes corrections dans une mémoire persistante, et la relit. |
| **5. Garde-fous automatiques** | Des « hooks » bloquent les commandes dangereuses et relancent les tests/lint tout seuls. |

---

## 📦 Ce que contient le kit

```
claude-config-kit/
├── README.md                  ← tu es ici
├── 00-START-HERE.md           ← LE prompt à coller dans ton Claude Code + checklist
├── PLACEHOLDERS.md            ← tous les {{PLACEHOLDERS}} à remplacer, avec exemples
├── skills-and-plugins.md      ← quels skills/plugins installer (marketplace) et comment
│
├── global/                    ← à copier dans  ~/.claude/
│   ├── CLAUDE.md              ← ton profil + tes principes (pédagogie, simplicité, communication)
│   └── rules/                 ← 12 « règles d'or » qui cadrent CHAQUE réponse de Claude
│
├── global-memory/             ← à copier dans  ~/.claude/projects/<slug>/memory/
│   ├── MEMORY.md             ← l'index de la mémoire (chargé à chaque session)
│   ├── *.md                  ← mémoires méthodologiques transversales (réutilisables partout)
│   └── EXAMPLES/             ← exemples de mémoires « métier » (à t'inspirer pour les tiennes)
│
└── project/                   ← à copier dans  <ton-projet>/.claude/
    ├── CLAUDE.md             ← template d'instructions spécifiques à un projet
    ├── settings.json         ← le « câblage » qui active les hooks
    ├── hooks/                ← scripts garde-fous (bloquent le dangereux, relancent lint/tests)
    ├── commands/             ← slash-commands custom (/review-diff, /review-plan)
    ├── agents/               ← sous-agents de revue (diff-reviewer, plan-reviewer)
    └── CONTEXT_PIN.md.EXAMPLE ← invariants ré-injectés après compaction du contexte
```

---

## 🏷️ Les étiquettes `[DEV]` et `.EXAMPLE`

Le créateur fait du **développement web**. Comme tu ne fais peut-être pas exactement la même chose,
certains fichiers sont étiquetés :

- **`[DEV]`** en haut d'un fichier = utile surtout si tu codes (sites, apps). Si tu ne codes pas,
  Claude te dira lesquels retirer pendant l'installation.
- **`.EXAMPLE`** dans le nom = ce n'est **pas** à utiliser tel quel. C'est un **exemple** de règle
  « métier » (ici : un blog musical) pour te montrer **comment** créer les tiennes. Claude s'en
  servira de modèle pour fabriquer **tes** règles, sur **ton** domaine.

---

## ❓ « Comment Claude saura quoi faire ? »

Le fichier [`00-START-HERE.md`](00-START-HERE.md) contient un prompt qui explique à ton Claude :
1. où sont ces fichiers,
2. quelles questions te poser pour te connaître,
3. comment remplir les placeholders avec tes réponses,
4. où copier chaque fichier sur ta machine,
5. comment vérifier que tout est bien activé.

Tu n'as rien à paramétrer à la main. Tu réponds à 5 questions, Claude fait le reste.

---

## ⚠️ Note de sécurité

Avant de partager ce kit, vérifie qu'aucun placeholder n'a déjà été rempli avec des infos privées.
Tous les fichiers livrés ici utilisent **uniquement** des `{{PLACEHOLDERS}}` neutres.
