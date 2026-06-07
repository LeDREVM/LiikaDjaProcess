#!/bin/bash
# Validation légère au démarrage de session.
# Ce projet est un site statique (React via CDN, pas d'étape de build) :
# il n'y a aucune dépendance à installer, mais une erreur de syntaxe dans
# app.js casserait toute l'application. On vérifie donc la présence des
# fichiers clés et la validité syntaxique du JavaScript.
set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}"

errors=0

# 1) Présence des fichiers essentiels
for f in index.html app.js styles.css; do
  if [ ! -f "$f" ]; then
    echo "⚠️  Fichier manquant : $f"
    errors=1
  fi
done

# 2) Validation de la syntaxe JavaScript de app.js
if command -v node >/dev/null 2>&1; then
  if [ -f app.js ]; then
    if ! node --check app.js 2>/tmp/ldp-appjs-check.err; then
      echo "❌ Erreur de syntaxe dans app.js :"
      cat /tmp/ldp-appjs-check.err
      errors=1
    fi
  fi
else
  echo "ℹ️  node introuvable — validation JavaScript ignorée."
fi

if [ "$errors" -eq 0 ]; then
  echo "✅ Validation OK — fichiers présents et app.js syntaxiquement valide."
fi

# Ne jamais bloquer le démarrage de la session : on se contente de signaler.
exit 0
