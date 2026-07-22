#!/usr/bin/env bash
# Hook: post-lint  [DEV/JS — utile si projet JavaScript/TypeScript avec ESLint]
# PostToolUse:Edit|Write|MultiEdit — après édition d'un fichier JS/TS, rejoue ESLint
# (--quiet = erreurs seulement) sur CE fichier. Erreurs → exit 2 : le détail repart vers Claude.
# Fichier non-JS/TS → ignoré. ESLint absent → ignoré (exit 0, jamais bloquant à tort).
# Si tu ne fais pas de JS/TS, n'installe pas ce hook.

input=$(cat)

file_path=$(echo "$input" | python3 -c "import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null || echo "")

[ -z "$file_path" ] && exit 0

# Ne traiter que les fichiers JS/TS
case "$file_path" in
  *.js|*.ts|*.jsx|*.tsx|*.mjs|*.cjs) ;;
  *) exit 0 ;;
esac

# Les workflows Claude Code tournent dans un runtime spécial qu'ESLint ne sait pas parser.
case "$file_path" in
  */.claude/workflows/*) exit 0 ;;
esac

[ -f "$file_path" ] || exit 0

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"

output=$(cd "$project_dir" && npx --no-install eslint --quiet "$file_path" 2>&1)
code=$?

if [ "$code" -eq 1 ]; then
  echo "[post-lint] ESLint a trouvé des erreurs dans $(basename "$file_path") :" >&2
  echo "$output" >&2
  echo "  → Corrige ces erreurs avant de continuer." >&2
  exit 2
fi

exit 0
