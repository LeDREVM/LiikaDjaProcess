#!/usr/bin/env bash
# Hook: pre-edit-guard  [UNIVERSEL — copier tel quel]
# PreToolUse:Edit|Write|MultiEdit — refuse (exit 2) deux familles de fichiers :
#   1) les secrets (clés privées, .env, credentials) — anti-leak ;
#   2) les fichiers GÉNÉRÉS sous le dossier de build — on édite la source puis on rebuild.
# Les templates .example / .sample restent autorisés.
#
# >>> À ADAPTER : si ton dossier de build ne s'appelle pas "dist", change BUILD_DIR ci-dessous.
#     Si tu ne fais pas de build, tu peux laisser tel quel (le bloc dist/ ne matchera rien).

BUILD_DIR="dist"

input=$(cat)

file_path=$(echo "$input" | python3 -c "import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null || echo "")

[ -z "$file_path" ] && exit 0
base=$(basename "$file_path")

# --- Fichiers générés : <BUILD_DIR>/ (sortie du build) ---
# L'agent ne doit jamais éditer le build à la main : on édite la SOURCE puis on rebuild.
proj="${CLAUDE_PROJECT_DIR:-$(pwd)}"
rel="${file_path#"$proj"/}"
case "$rel" in
  "$BUILD_DIR"/*|"$BUILD_DIR")
    echo "[pre-edit-guard] BLOQUÉ : $file_path" >&2
    echo "  $BUILD_DIR/ = fichiers GÉNÉRÉS par le build — ne pas éditer à la main." >&2
    echo "  → Édite la source puis relance le build." >&2
    exit 2
    ;;
esac

# Templates explicitement autorisés (pas de secret réel dedans)
case "$base" in
  *.example|*.sample|*.example.*|*.sample.*|*.template|*.dist) exit 0 ;;
esac

block() {
  echo "[pre-edit-guard] BLOQUÉ : $file_path" >&2
  echo "  Ce fichier peut contenir des secrets — Claude Code ne doit pas l'éditer." >&2
  echo "  Si tu dois le modifier, fais-le toi-même dans ton éditeur." >&2
  exit 2
}

# Fichiers d'environnement / secrets locaux
case "$base" in
  .env|.env.*|.dev.vars|.dev.vars.*) block ;;
esac

# Clés privées / certificats / keystores par extension
echo "$base" | grep -qiE '\.(pem|key|p12|pfx|keystore|jks|asc|gpg)$' && block

# Noms évoquant des secrets / credentials
echo "$base" | grep -qiE '(^|[._-])(secret|secrets|credential|credentials|passwd)([._-]|\.|$)' && block

# Clés SSH connues
case "$base" in
  id_rsa|id_dsa|id_ecdsa|id_ed25519) block ;;
esac

exit 0
