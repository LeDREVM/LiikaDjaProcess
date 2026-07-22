# Memory Active Capture — Anti-Forget Rule

**CRITICAL** : cette règle force la **capture immédiate**, la **persistance** et la **relecture
systématique** des infos factuelles données par l'utilisateur en cours de session. Elle empêche le
scénario « tu as oublié ce que je t'ai dit tout à l'heure ».

---

## DÉCLENCHEUR — Détecter une info factuelle dans un message

Pour CHAQUE message reçu, scanner ces 7 patterns :

| # | Pattern | Exemple |
|---|---|---|
| 1 | Affirmation factuelle | « X = Y », « X est composé de Z », « X s'écrit Y » |
| 2 | Correction d'une affirmation précédente | « non c'est Y, pas X » / « tu as oublié X » |
| 3 | Précision de quantité | « il y en a N », « composé de N éléments » |
| 4 | Décision éditoriale | « garde X au lieu de Y », « utilise X partout » |
| 5 | Anecdote / source | « dans tel document, X dit Y » |
| 6 | Orthographe officielle | « ça s'écrit X » / « écris X » |
| 7 | Attribution / crédit | « X est crédité de Y » / « X est responsable de Z » |

Au moins 1 pattern → workflow de capture obligatoire.

---

## ACTION — Workflow capture obligatoire
1. **Classer** l'info (orthographe / attribution / date / projet / décision).
2. **Écrire IMMÉDIATEMENT** dans `<racine_projet>/.claude/MEMORY-SESSION.md` :
   - Section « Capture chronologique » : `- [AAAA-MM-JJ] catégorie : info brute`
   - Section « Synthèse par catégorie » : reformuler dans la bonne sous-section
   - Si le fichier n'existe pas → le créer.
3. **Accuser réception en 1 phrase** : `Capté : <info reformulée>`. Court, sans friction.

---

## RELECTURE OBLIGATOIRE avant une réponse complexe
Avant : une réponse > 200 mots · une modif de fichier · un dispatch de sous-agent · un commit ·
une réponse sur un sujet déjà discuté →
1. Lire `<racine_projet>/.claude/MEMORY-SESSION.md`
2. Filtrer les infos pertinentes à la requête
3. Les lister mentalement avant de répondre
4. En cas de conflit info-session vs ancienne source → **l'info récente de l'utilisateur PRIME**

---

## INTERDICTIONS ABSOLUES
- NEVER répondre sur un sujet déjà cadré sans relire `MEMORY-SESSION.md`
- NEVER dire « j'avais oublié X » — c'est exactement ce que la règle bloque
- NEVER supprimer une info de la mémoire sans validation explicite
- NEVER rationaliser (« c'est évident, pas besoin de l'écrire ») — écris quand même
- NEVER traiter une info de l'utilisateur comme moins prioritaire que d'anciennes notes

---

## PERSISTANCE CROSS-SESSION (fin de session)
Identifier les infos de la capture chronologique qui sont des **règles permanentes** et les migrer :

| Type d'info | Destination |
|---|---|
| Orthographe officielle | CLAUDE.md du projet |
| Composition / structure canonique du projet | CLAUDE.md du projet |
| Décision éditoriale durable | `~/.claude/projects/<slug>/memory/feedback_*.md` |
| Info éphémère (raisonnement en cours) | rester dans l'historique session |

Faire cette migration avant de clôturer la session.

---

## Si la règle est ratée
Si l'utilisateur signale « tu as oublié X » : (1) reconnaître la faute sans excuse, (2) relire
`MEMORY-SESSION.md`, (3) identifier pourquoi la capture a manqué, (4) logger un `feedback_*.md`,
(5) patcher les 7 patterns si c'est un cas récurrent.
