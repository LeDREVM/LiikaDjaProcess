# Skills & Plugins à installer

Les **règles** et la **mémoire** définissent le comportement. Les **skills/plugins** ajoutent des
capacités (brainstorming structuré, TDD, design, etc.). Voici quoi installer et comment.

> Dans Claude Code, les plugins s'installent via la commande `/plugin` (ouvre le gestionnaire) ou
> `/plugin marketplace add <repo>` puis `/plugin install <nom>`. Si tu n'es pas sûr, demande à ton
> Claude : « aide-moi à installer le plugin X », il connaît la procédure de ta version.

---

## 1. Essentiel — `superpowers` (méthodologie)

C'est le socle qui donne à Claude les workflows disciplinés : **brainstorming** avant toute création,
**TDD** (test-driven development), **systematic-debugging**, **verification-before-completion**,
**writing-plans**, **using-git-worktrees**, etc. Ces skills correspondent exactement à la philosophie
des règles de ce kit.

```
/plugin
# puis installe : superpowers   (marketplace officiel : claude-plugins-official)
```

> C'est le plugin le plus important à installer après avoir copié les règles. Beaucoup de règles
> (« brainstorm first », « verify before done ») trouvent leur exécution concrète dans ces skills.

---

## 2. Recommandé si tu fais du visuel — `frontend-design`

Aide à produire des interfaces distinctives (anti « design AI générique »). Pertinent uniquement si
tu construis des UI/sites.

```
/plugin
# puis installe : frontend-design
```

---

## 3. Recommandé — `security-guidance`

Garde-fou de sécurité (rappels sur les patterns risqués). Léger, universel pour qui code.

```
/plugin
# puis installe : security-guidance
```

---

## 4. Custom — `prompt-optimizer` (FOURNI dans ce kit)

La règle `auto-invoke-prompt-optimizer` **dépend** de ce skill. Il est fourni dans le kit, dossier
`global/skills/prompt-optimizer/`. Copie-le dans `~/.claude/skills/prompt-optimizer/`.

Sans lui, retire la règle `auto-invoke-prompt-optimizer.md` (ou installe le skill équivalent du
marketplace s'il en existe un : `anthropic-skills:prompt-optimizer`).

---

## 5. Optionnels selon ton métier

| Besoin | Marketplaces/skills à chercher |
|---|---|
| SEO / contenu web | skills SEO (audit, keyword research, schema markup, content strategy) |
| Design / UX | skills design (accessibility-review, design-system, ux-copy) |
| Documents (Word/Excel/PDF/PPT) | anthropic-skills (docx, xlsx, pdf, pptx) |

Installe-les **seulement** si ton domaine les justifie. Inutile d'encombrer ta config avec des
skills que tu n'utiliseras jamais.

---

## Vérifier ce qui est installé
```
/plugin            # liste les plugins installés et disponibles
```
Les skills disponibles apparaissent aussi automatiquement dans tes sessions (Claude les voit).

---

## Règle anti-bloat
N'ajoute un skill que si tu en as un usage récurrent (≈ 3 fois le même besoin). Sous ce seuil, un
simple prompt suffit. Au-dessus, le skill devient un workflow qui mérite d'être installé.
