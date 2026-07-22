# INVARIANTS CRITIQUES — saasDrevmBot (DREVM)

> Ré-injecté automatiquement par le hook `context-pin.sh` après chaque compaction du contexte.
> UNIQUEMENT les invariants à ne JAMAIS perdre, même après une longue session.

- **No-repaint** : signaux évalués UNIQUEMENT sur bougie M5 clôturée. Jamais sur bougie en cours.
- **Windows-only** : `MetaTrader5` Python ne tourne que sous Windows → déploiement bot via NSSM
  sur le VPS Hostinger Windows. Pas de Docker/Linux/systemd pour le bot MT5.
- **Sortie partielle** : TP1 à 1R → close 50 % → SL breakeven → trailing ATR sur le runner.
- **Conventions visuelles** : OB=violet, FVG=bleu ; grades A+=#10b981 / A=#22c55e / B=#eab308 /
  C=#f97316 / D=#ef4444. Vocabulaire A+/A/B/C/D = langue commune MQL5/PineScript/Python/Svelte.
- **Exécution** : dashboard SaaS = confirmation MANUELLE ; bot standalone = full-auto. Ne pas confondre.
- **Risque** : jamais de position sans SL ni halt drawdown journalier. Kill-switch = `STOP.flag`.
- Ne jamais déclarer « fini » sans test réel exécuté moi-même (pas seulement un build qui passe).
- ADHD-friendly : friction minimale, code couleur, flux en un clic, vues « Today » — contrainte de design.
