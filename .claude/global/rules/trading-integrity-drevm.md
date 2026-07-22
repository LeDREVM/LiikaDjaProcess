# [DEV] Trading Integrity — DREVM

> Règle « métier » dérivée du modèle `content-quality-EXAMPLE.md`, adaptée à l'écosystème DREVM
> (trading SMC/ICT). Garde-fous d'intégrité avant tout déploiement de logique de signal,
> d'exécution ou de risk management. Voir aussi la mémoire `project_drevm_canonical_facts`.

## Pourquoi une règle métier ?
En trading algorithmique, une « petite » erreur (mauvais seuil, signal qui repaint, contrainte
plateforme oubliée) ne fait pas juste un bug visuel : elle peut prendre de mauvais trades avec du
capital réel. Cette règle force Claude à vérifier les invariants DREVM avant de livrer.

## Quand l'utiliser AUTOMATIQUEMENT
1. Avant tout commit touchant la logique de signal, le scoring de confluence ou le risk engine.
2. Avant tout déploiement du bot (`ny_session_bot.py`) ou d'un EA MQL5.
3. Après toute modif d'un seuil (Fibo, ATR, R-multiple, grade) → re-vérifier la cohérence
   MQL5 ↔ PineScript ↔ Python ↔ Svelte.

## Critères veto (= bloquent le déploiement)
| Veto | Description |
|---|---|
| **Repaint introduit** | Une évaluation de signal sur bougie NON clôturée (doit rester M5 close) |
| **Contrainte Windows violée** | Code MT5 Python supposé tourner sous Linux/Docker/systemd |
| **Couleur/grade incohérent** | OB≠violet, FVG≠bleu, ou grade hors barème #10b981/#22c55e/#eab308/#f97316/#ef4444 |
| **Seuil Fibo hors barème** | Zone sniper ≠ {61.8, 71, 81, 88.6, 95} sans justification explicite |
| **Sortie partielle cassée** | Logique TP1 1R → 50 % → breakeven → trailing ATR altérée silencieusement |
| **Secret en dur** | Identifiants broker / clé API Anthropic / token MT5 dans le code ou un commit |
| **Risk non borné** | Position sans SL, sans cap de risque, ou sans halt drawdown journalier |
| **Vocabulaire de grade rompu** | Un module qui n'utilise plus A+/A/B/C/D comme langue commune |

## Sources canoniques à consulter AVANT toute affirmation
- Mémoire `project_drevm_canonical_facts.md` (faits système figés).
- `trading_ny_session.py` / `classify_setup` pour le barème de confluence de référence.
- Doc Fusion Markets / `MetaTrader5` Python pour les contraintes broker/plateforme.

## Interdictions absolues
- NEVER déployer une logique de signal sans avoir confirmé le no-repaint (M5 close).
- NEVER supposer que du code MT5 Python tournera ailleurs que sous Windows.
- NEVER dévier des conventions de couleur/grade sans demande explicite.
- NEVER committer un secret broker / clé API.
- NEVER livrer une position sans stop-loss ni borne de risque.
