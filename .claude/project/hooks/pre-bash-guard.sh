#!/usr/bin/env bash
# Hook: pre-bash-guard  [UNIVERSEL — copier tel quel]
# PreToolUse:Bash — refuse (exit 2) les commandes destructives AVANT exécution.
# Philosophie : bloquer UNIQUEMENT le vraiment dangereux, laisser passer tout
# le quotidien (npm, build, git normal, rm -rf dist/node_modules...).
# Quand Claude Code tente une commande bloquée, il reçoit le message sur stderr
# et doit reprendre. exit 1 ne bloquerait PAS — il faut exit 2.

input=$(cat)

# Extraire la commande Bash du JSON
command=$(echo "$input" | python3 -c "import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('command', ''))
except Exception:
    print('')
" 2>/dev/null || echo "")

[ -z "$command" ] && exit 0

block() {
  echo "[pre-bash-guard] BLOQUÉ : $1" >&2
  echo "  Commande refusée : $command" >&2
  echo "  Si c'est vraiment voulu, lance-la toi-même dans ton terminal (hors Claude Code)." >&2
  exit 2
}

# 1) rm récursif visant la racine, le home, un wildcard global ou un chemin système
if echo "$command" | grep -qE '(^|[[:space:]])(sudo[[:space:]]+)?rm[[:space:]]' \
   && echo "$command" | grep -qE '[[:space:]]-[a-zA-Z]*[rR]|--recursive'; then
  if echo "$command" | grep -qE '[[:space:]](/|~|\$HOME)([[:space:]]|$)' \
     || echo "$command" | grep -qE '[[:space:]]/\*' \
     || echo "$command" | grep -qE '[[:space:]]\*([[:space:]]|$)' \
     || echo "$command" | grep -qE '[[:space:]]/(bin|boot|dev|etc|lib|proc|root|sbin|sys|usr|var|System|Library)([[:space:]]|/|$)'; then
    block "rm récursif sur la racine, le home ou un chemin système"
  fi
fi

# 2) git push vers main/master interdit (force OU normal) — forcer le flux branche → merge/PR
if echo "$command" | grep -qE '(^|[[:space:]])git[[:space:]]+push([[:space:]]|$)'; then
  # 2a) cible main/master explicite (git push origin main, HEAD:main, -u origin master…)
  if echo "$command" | grep -qE '([[:space:]]|:|/)(main|master)([[:space:]]|:|$)'; then
    if echo "$command" | grep -qE '(--force([[:space:]]|=|$)|[[:space:]]-f([[:space:]]|$))'; then
      block "git push --force sur main/master — jamais. Passe par une branche de travail."
    fi
    block "git push direct sur main/master — passe par une branche puis un merge/PR"
  fi
  # 2b) git push depuis la branche main/master courante (push nu)
  cur=$(cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null && git rev-parse --abbrev-ref HEAD 2>/dev/null)
  if [ "$cur" = "main" ] || [ "$cur" = "master" ]; then
    block "push depuis la branche « $cur » interdit — bascule sur une branche de travail d'abord"
  fi
fi

# 3) Redirection en écriture vers un répertoire système
#    NB : /dev volontairement EXCLU ici — >/dev/null, 2>/dev/null… sont inoffensifs.
if echo "$command" | grep -qE '>>?[[:space:]]*/(bin|boot|etc|lib|proc|root|sbin|sys|usr|var|System|Library)(/|[[:space:]]|$)'; then
  block "écriture redirigée vers un répertoire système"
fi

# 3b) Redirection en écriture directe vers un device disque physique
if echo "$command" | grep -qE '>>?[[:space:]]*/dev/(disk|sd|rdisk|nvme|mmcblk)'; then
  block "écriture redirigée vers un device disque"
fi

# 4) chmod / chown récursif sur la racine ou un chemin système
if echo "$command" | grep -qE '(chmod|chown)[[:space:]]+(-[a-zA-Z]*[Rr][a-zA-Z]*[[:space:]]+)' \
   && echo "$command" | grep -qE '[[:space:]]/(bin|etc|usr|var|sbin|System|Library)?([[:space:]]|$|/)'; then
  block "chmod/chown récursif sur la racine ou un chemin système"
fi

# 5) dd écrivant directement sur un device disque
if echo "$command" | grep -qE 'dd[[:space:]]+.*of=/dev/(disk|sd|rdisk|nvme|mmcblk)'; then
  block "dd écrivant directement sur un disque"
fi

# 6) mkfs (formatage de partition)
if echo "$command" | grep -qE '(^|[[:space:]])mkfs(\.[a-z0-9]+)?[[:space:]]'; then
  block "mkfs — formatage de partition"
fi

# 7) fork bomb
if echo "$command" | grep -qE ':[[:space:]]*\(\)[[:space:]]*\{[[:space:]]*:[[:space:]]*\|[[:space:]]*:'; then
  block "fork bomb"
fi

# 8) pipe direct d'un script distant vers un shell
if echo "$command" | grep -qE '(curl|wget)[[:space:]].*\|[[:space:]]*(sudo[[:space:]]+)?(ba|z)?sh([[:space:]]|$)'; then
  block "exécution directe d'un script distant (télécharge et inspecte d'abord)"
fi

exit 0
