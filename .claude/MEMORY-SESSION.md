# MEMORY-SESSION — Lanmou Douvan

> Capture immédiate des infos factuelles données par l'utilisateur en cours de session.

## Capture chronologique

- [2026-09-20] projet : Dja veut que Lanmou Douvan devienne le dashboard de son Raspberry Pi.
- [2026-09-20] projet : objectif double — (1) **héberger l'app depuis le Pi** (serveur local),
  (2) **intégrer domotique / capteurs** au dashboard.
- [2026-09-20] matériel : **le Raspberry Pi et l'écran ne sont pas encore choisis/achetés**.
  → phase de cadrage, pas d'implémentation matérielle possible pour l'instant.
- [2026-09-20] écarté explicitement : mode kiosque plein écran au boot, et onglet « stats système
  du Pi » (CPU/RAM/température) — non retenus dans les réponses.

## Synthèse par catégorie

### Décisions projet
- Cible : Lanmou Douvan servi par le Raspberry Pi sur le réseau local + extension domotique.
- Non retenu pour l'instant : kiosque au boot, monitoring système du Pi.

### Contraintes techniques découvertes
- `91:app.js` — `const sb = supabase.createClient(SB_URL, SB_KEY)` s'exécute au chargement,
  **sans garde**. Si le CDN `@supabase/supabase-js` n'est pas joignable, `supabase` est
  `undefined` → l'app entière meurt (écran blanc). Idem React / ReactDOM / Chart.js / chess.js,
  tous chargés depuis cdnjs / jsdelivr dans `16:index.html` → `21:index.html`.
- Conséquence : **héberger l'app sur le Pi ne la rend pas autonome**. Sans vendorisation des
  libs en local, une coupure internet casse le dashboard même servi depuis le Pi.
- Vendoriser les libs = toucher l'invariant « Librairies via CDN » de `CONTEXT_PIN.md`
  → nécessite l'accord explicite de Dja.

### À clarifier
- Quels capteurs / quelle domotique exactement (température ambiante, présence, caméra,
  Home Assistant existant, prises connectées… ?).
