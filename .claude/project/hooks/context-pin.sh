#!/usr/bin/env bash
# Hook: context-pin  [UNIVERSEL — copier tel quel]
# SessionStart matcher "compact" — après une compaction du contexte, ré-injecte les invariants
# critiques du projet (CONTEXT_PIN.md à la racine) pour qu'ils ne soient jamais perdus.
# stdout en exit 0 = ajouté au contexte de Claude.
# Crée un CONTEXT_PIN.md à la racine de ton projet (voir CONTEXT_PIN.md.EXAMPLE).

cat >/dev/null  # vider le JSON d'event sur stdin

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
pin="$project_dir/CONTEXT_PIN.md"

[ -f "$pin" ] || exit 0

echo "=== INVARIANTS CRITIQUES PROJET (ré-injectés après compaction) ==="
cat "$pin"
exit 0
