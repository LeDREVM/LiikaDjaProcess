---
name: project_drevm_canonical_facts
description: Faits canoniques de l'écosystème DREVM (trading) que Claude ne doit jamais déformer
metadata:
  type: project
---

> Mémoire `project` — la vérité de l'écosystème DREVM. À consulter AVANT toute affirmation
> technique sur le trading, le bot, l'EA ou le SaaS. En cas de doute : ne pas inventer → demander.

## Méthodologie (non négociable)
- Approche : **Smart Money Concepts (SMC) / ICT** + **Wyckoff** + **Ichimoku** (focus Kijun) +
  **RSI divergence** + **Fair Value Gaps** + **Order Blocks** + **Fibonacci** + liquidity sweeps +
  **BOS** (Break of Structure) en confirmation. **CCI** en confirmation de momentum.
- Zones sniper Fibonacci : 61.8, 71, 81, 88.6, 95.
- Instruments : US30, XAUUSD, USDJPY, CADJPY, USDCAD. Session : **New York** (overlap Londres).

## Conventions visuelles (à ne JAMAIS changer)
- **OB = violet**, **FVG = bleu**.
- Grades de confluence : **A+ = #10b981 · A = #22c55e · B = #eab308 · C = #f97316 · D = #ef4444**.
- Le vocabulaire de grade **A+/A/B/C/D** est la langue commune entre MQL5, PineScript, Python et
  Svelte. À préserver dans tout nouveau module.

## Règles système (non négociables)
- **No-repaint** : évaluation des signaux UNIQUEMENT sur bougie **M5 clôturée**.
- **Sortie partielle** : TP1 à 1R → close 50 % → SL au breakeven → trailing ATR sur le runner.
- **Windows-only** : le package Python `MetaTrader5` ne tourne QUE sous Windows. Docker / Linux /
  systemd échouent. Déploiement bot = **NSSM sur VPS Windows** (Hostinger Forex VPS).
- Broker : **Fusion Markets (MT5)**, ~4,50 $ round-turn.

## Architecture
- `classify_setup` / « Trading Bible NY Session » (`trading_ny_session.py`) : note les setups
  A+/A/B/C/D selon un score de confluence multi-facteurs.
- Bot full-auto : `ny_session_bot.py` v2 (US30, USDJPY). État persistant `bot_state.json`,
  kill-switch `STOP.flag`, halt drawdown journalier.
- SaaS : repo `LeDREVM/saasdrevmbot_v1.01`. **Confirmation manuelle** préférée pour l'exécution
  d'ordres côté dashboard (le bot standalone, lui, est full-auto — distinction importante).
- Expert Mode scanner : pipeline standalone (H4→H1→M15→M5), risk engine FTMO-aware, vision
  Claude Opus (JSON strict), export journal Markdown (Obsidian/Nextcloud).

**Why:** ces faits sont la colonne vertébrale du système. Les déformer (mauvaise couleur, mauvais
seuil Fibo, oubli du no-repaint ou de la contrainte Windows) propage des erreurs dans MQL5,
PineScript, Python et Svelte à la fois.

**How to apply:** consulter ces faits avant de coder ou d'affirmer quoi que ce soit dessus.
Voir [[feedback_no_invented_facts]].
