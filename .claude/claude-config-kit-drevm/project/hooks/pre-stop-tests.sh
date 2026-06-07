#!/usr/bin/env bash
# Hook: pre-stop-tests  [DEV/JS — utile si projet JS/TS avec ESLint + Vitest]
# Stop — avant que l'agent termine sa réponse, si des fichiers de CODE
# (.js/.ts/.jsx/.tsx/.mjs/.cjs) ont changé, rejoue eslint + les tests vitest LIÉS à ces fichiers
# (vitest related). Rouge → exit 2 (le détail repart vers Claude). Aucun code touché → exit 0.
# Anti-boucle : ne bloque qu'une fois par tour (stop_hook_active).
# Adapte VITEST/ESLINT si tu utilises d'autres runners (jest, etc.). Sinon n'installe pas ce hook.

input=$(cat)

# 1) Anti-boucle infinie
active=$(echo "$input" | python3 -c "import json,sys
try: print(str(json.load(sys.stdin).get('stop_hook_active', False)).lower())
except Exception: print('false')" 2>/dev/null || echo "false")
[ "$active" = "true" ] && exit 0

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}" || exit 0

# 2) Fichiers de code modifiés (trackés non supprimés + non-trackés), hors node_modules/dist.
code_files=$(
  { git diff --relative --name-only --diff-filter=d HEAD 2>/dev/null
    git ls-files --others --exclude-standard 2>/dev/null; } \
  | grep -iE '\.(js|ts|jsx|tsx|mjs|cjs)$' \
  | grep -vE '^(node_modules|dist)/' \
  | sort -u
)
files=()
while IFS= read -r f; do
  [ -n "$f" ] && [ -f "$f" ] && files+=("$f")
done <<< "$code_files"

# 3) Aucun code touché → rien à valider.
[ ${#files[@]} -eq 0 ] && exit 0

ESLINT="./node_modules/.bin/eslint"; [ -x "$ESLINT" ] || ESLINT="npx --no-install eslint"
VITEST="./node_modules/.bin/vitest"; [ -x "$VITEST" ] || VITEST="npx --no-install vitest"

errors=""

# 4) ESLint (filet ; post-lint.sh agit déjà à chaque édition).
if ! lint_out=$($ESLINT --quiet "${files[@]}" 2>&1); then
  errors+="ESLint a trouvé des erreurs :\n${lint_out}\n\n"
fi

# 5) Tests vitest LIÉS aux fichiers changés (--passWithNoTests : pas de test lié = OK).
if ! test_out=$($VITEST related --run --passWithNoTests "${files[@]}" 2>&1); then
  errors+="Des tests liés à tes changements échouent :\n${test_out}\n"
fi

if [ -n "$errors" ]; then
  echo "[pre-stop-tests] Validation rouge avant de terminer :" >&2
  printf "%b" "$errors" >&2
  echo "→ Corrige ci-dessus puis termine. (Ce contrôle ne bloque qu'une fois par tour.)" >&2
  exit 2
fi

exit 0
