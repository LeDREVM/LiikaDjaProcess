#!/bin/bash
# Hook SessionStart — démarrage de chaque session (startup / resume / clear).
# 1) Validation légère : ce projet est un site statique (React via CDN, pas de build) ;
#    une erreur de syntaxe dans app.js casserait toute l'application.
# 2) Protocole : ré-injecte le protocole de travail + les invariants (CONTEXT_PIN.md)
#    pour qu'ils soient présents dans le contexte à CHAQUE session.
set -euo pipefail

# Drainer le JSON d'événement reçu sur stdin (on n'en a pas besoin).
cat >/dev/null 2>/dev/null || true

cd "${CLAUDE_PROJECT_DIR:-.}"

# ── 1) Validation ──────────────────────────────────────────────────────────
errors=0
for f in index.html app.js styles.css; do
  [ -f "$f" ] || { echo "⚠️  Fichier manquant : $f"; errors=1; }
done
if command -v node >/dev/null 2>&1 && [ -f app.js ]; then
  if ! node --check app.js 2>/tmp/ldp-appjs-check.err; then
    echo "❌ Erreur de syntaxe dans app.js :"
    cat /tmp/ldp-appjs-check.err
    errors=1
  fi
fi
[ "$errors" -eq 0 ] && echo "✅ Validation OK — fichiers présents et app.js syntaxiquement valide."

# ── 2) Protocole de travail (ré-injecté chaque session) ────────────────────
echo
echo "=== PROTOCOLE DE TRAVAIL — Lanmou Douvan / LiikaDjaProcess ==="
echo "1. Reformuler la demande en français simple avant d'agir."
echo "2. Plan-first pour tout changement non-trivial (>1 fichier) ; option /review-plan."
echo "3. Simplicité d'abord — pas d'over-engineering, garder la stack actuelle."
echo "4. Subagents pour la recherche multi-fichiers ; lecture directe si 1-2 fichiers connus."
echo "5. Jamais « c'est fait » sans preuve réelle ; au minimum 'node --check app.js' doit passer."
echo "6. Garder le style existant : React.createElement (pas de JSX), variables CSS du thème, UI en français."
echo "7. Git : branche de travail, jamais de push direct sur la branche par défaut."
echo "8. Avant de clôturer un diff conséquent : option /review-diff."

# ── 3) Invariants critiques (CONTEXT_PIN.md) ───────────────────────────────
if [ -f CONTEXT_PIN.md ]; then
  echo
  echo "=== INVARIANTS CRITIQUES PROJET (CONTEXT_PIN.md) ==="
  cat CONTEXT_PIN.md
fi

exit 0
