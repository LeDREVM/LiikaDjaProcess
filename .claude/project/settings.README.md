# settings.json — notice d'adaptation

`settings.json` est le **câblage** : il dit à Claude Code quels hooks (scripts garde-fous) lancer et
quand. Le JSON ne supporte pas les commentaires, d'où ce fichier d'explication.

> ⚠️ Les hooks sont **capturés au démarrage de la session**. Toute modif de `settings.json` ne
> s'active qu'au **prochain lancement** de Claude Code.

---

## Ce que le settings.json par défaut active

| Événement | Hook | Profil | Rôle |
|---|---|---|---|
| Avant un Bash | `pre-bash-guard.sh` | **universel** | Bloque les commandes destructives |
| Avant Edit/Write | `pre-edit-guard.sh` | **universel** | Bloque l'édition de secrets / du build |
| Après Edit/Write | `post-lint.sh` | **[DEV/JS]** | Relance ESLint sur le fichier édité |
| Après un Bash | `post-deps-audit.sh` | **[DEV/JS]** | `npm audit` après une install |
| À la fin (Stop) | `pre-stop-tests.sh` | **[DEV/JS]** | Relance les tests liés au diff |
| Après compaction | `context-pin.sh` | **universel** | Ré-injecte `CONTEXT_PIN.md` |

---

## ⚠️ Règle importante : ne référence QUE des hooks qui existent

Si `settings.json` pointe vers un hook absent du disque, ça produit une erreur à chaque événement.
Donc :

- **Si tu ne fais pas de JS/TS** → retire de `settings.json` les blocs `post-lint.sh`,
  `post-deps-audit.sh` et `pre-stop-tests.sh` (et ne copie pas ces fichiers).
- **Garde toujours** `pre-bash-guard.sh`, `pre-edit-guard.sh`, `context-pin.sh` (universels).

Le prompt d'installation (`00-START-HERE.md`) fait ce tri automatiquement selon ton profil.

---

## Hooks optionnels à ajouter toi-même

Une fois les bases en place, tu peux ajouter (à partir des `.EXAMPLE` fournis) :

### 1. Garde-fou de deploy — `pre-deploy.sh.EXAMPLE`
Ajoute dans `PreToolUse` → matcher `Bash` :
```json
{ "type": "command", "command": "bash \"${CLAUDE_PROJECT_DIR}/.claude/hooks/pre-deploy.sh\"" }
```

### 2. Rappel contenu — `post-content-edit.sh.EXAMPLE`
Ajoute dans `PostToolUse` → matcher `Edit|Write|MultiEdit`.

### 3. Vérification métier au commit (hook `type: agent`, avancé)
Un hook peut être un **sous-agent** qui lit le diff stagé avant un `git commit` et **bloque** si tes
règles métier sont enfreintes. Exemple de structure (à mettre dans `PreToolUse` → matcher `Bash`) :
```json
{
  "type": "agent",
  "if": "Bash(git commit *)",
  "timeout": 120,
  "statusMessage": "Vérif des règles métier avant commit…",
  "prompt": "Un git commit va avoir lieu. Lance `git diff --cached --name-only`. Si aucun fichier de mon domaine de contenu n'est stagé, retourne {\"hookSpecificOutput\":{\"hookEventName\":\"PreToolUse\",\"permissionDecision\":\"allow\"}}. Sinon lis chaque fichier stagé et vérifie MES règles métier (liste-les ici : faits sourcés, orthographes officielles, parité multilingue, cibles de CTA…). Aucune violation → allow. Au moins une → deny avec, en permissionDecisionReason, la liste précise fichier + extrait fautif + règle enfreinte."
}
```
> ⚠️ `type: agent` est **expérimental** et coûte des tokens à chaque commit ciblé. À n'activer que
> si tu as de vraies règles métier à protéger.

---

## Ajouter un hook plus tard (récap)
1. Crée le script dans `.claude/hooks/<nom>.sh` (lit le JSON d'event via stdin).
2. `chmod +x .claude/hooks/<nom>.sh`
3. Ajoute une entrée dans `.claude/settings.json` sous le bon événement.
4. Relance Claude Code (capture au démarrage).

Mémo des codes de sortie d'un hook : `exit 0` = OK · `exit 2` = bloque l'action et renvoie stderr à
Claude · autres codes = erreur non bloquante.
