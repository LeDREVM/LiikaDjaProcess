# [DEV] Security Review — Pre-Deploy Rule

> Étiquette **[DEV]** : pertinent si tu déploies des sites/apps.

Audit sécurité (XSS, injection, secrets exposés, CORS, CSP, dépendances vulnérables, headers)
avant tout deploy en prod. Skill associé : `security-review`.

---

## Quand l'utiliser AUTOMATIQUEMENT
1. **Avant tout deploy prod** (docker compose up -d) → audit obligatoire.
2. **Sur toute PR touchant une surface sensible** : admin, base de données, migrations, config
   de sécurité, `.env*`, `package.json` / lockfile, tout fichier avec un formulaire, un appel
   réseau, de l'exécution de code dynamique, ou de l'injection HTML directe.
3. **Sur toute nouvelle intégration externe** (embed, paiement, mailing) → audit CSP + CORS + privacy.
4. **Avant d'ajouter une dépendance** → vérifier les vulnérabilités connues (`npm audit`).

---

## Checklist veto avant deploy
- [ ] Aucun secret en dur (API keys, passwords, tokens)
- [ ] Aucun log qui fuit des données sensibles
- [ ] CSP configuré (`default-src 'self'`)
- [ ] HTTPS forcé (HSTS)
- [ ] Forms POST avec protection CSRF
- [ ] Inputs utilisateur sanitizés avant insertion dans la page
- [ ] Requêtes base de données avec bindings paramétrés, jamais de concaténation de chaînes
- [ ] Dépendances à jour (`npm audit` clean ou justifié)
- [ ] Panneau d'admin derrière une authentification
- [ ] Pas d'iframe sans `sandbox` / `referrerpolicy`

---

## Workflow type pré-deploy
1. Tests + détecteurs design/a11y OK
2. `security-review` sur le diff de la branche → audit complet
3. Vulnérabilité critique → bloquer le deploy, fixer
4. Vulnérabilité mineure → décision (déployer + ticket de suivi)
5. Clean → deploy
6. Post-deploy : vérifier les headers de sécurité sur la prod réelle

## Interdictions absolues
- NEVER deploy sans `security-review` sur les changements
- NEVER commiter un fichier `.env` ou un fichier de config avec secrets
- NEVER désactiver CSP / HSTS pour faire passer un fix
- NEVER injecter une variable utilisateur en HTML brut (préférer une insertion texte / un sanitizer)
- NEVER ignorer une alerte `npm audit` HIGH/CRITICAL sans mitigation documentée

---

## 🎯 Adapté à ta stack DREVM
- **Secrets à ne jamais committer** : identifiants broker Fusion Markets / MT5, clé API Anthropic
  (vision Expert Mode), tokens Telegram, credentials PostgreSQL/Redis, fichiers `.env`.
- **Audit dépendances** : `pip-audit` (Python/FastAPI) en plus de `npm audit` (SvelteKit/Node).
- **Surface sensible** : routes d'exécution d'ordres (`fusion_broker.py`, API trading) → revue
  obligatoire ; jamais d'exécution déclenchée par une entrée non validée.
- **VPS Windows** : restreindre l'accès RDP, ne pas exposer les ports services (8000/3000/5173)
  publiquement sans reverse proxy + auth (Nginx).
