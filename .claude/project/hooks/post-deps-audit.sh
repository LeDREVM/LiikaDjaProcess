#!/usr/bin/env bash
# Hook: post-deps-audit  [DEV/JS — utile si projet avec npm/pnpm/yarn]
# PostToolUse:Bash — après une commande qui change les dépendances (install|add|ci),
# lance `npm audit --audit-level=high`. Vulnérabilité high/critical → exit 2 (résumé réinjecté).
# Toute autre commande Bash → exit 0 immédiat (coût nul).

input=$(cat)

cmd=$(echo "$input" | python3 -c "import json,sys
try: print(json.load(sys.stdin).get('tool_input', {}).get('command', ''))
except Exception: print('')" 2>/dev/null || echo "")

[ -z "$cmd" ] && exit 0

# Ne réagir qu'aux commandes d'installation de dépendances.
echo "$cmd" | grep -qiE '(^|[[:space:];&|])(npm[[:space:]]+(install|i|ci|add)|pnpm[[:space:]]+(install|i|add)|yarn[[:space:]]+(add|install))([[:space:]]|$)' || exit 0

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}" || exit 0
[ -f package.json ] || exit 0

audit_out=$(npm audit --audit-level=high 2>&1)
[ $? -eq 0 ] && exit 0

echo "[post-deps-audit] Vulnérabilités (high/critical) après changement de dépendances :" >&2
echo "$audit_out" | tail -n 25 >&2
echo "→ Traite-les (npm audit fix, bump de version, ou justification documentée) avant de continuer." >&2
exit 2
