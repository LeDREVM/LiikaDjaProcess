# [EXEMPLE — règle métier] Content Quality — le trading algorithmique SMC/ICT (méthodologie DREVM, session New York)

> ⚠️ Ceci est un **EXEMPLE** de « règle métier ». Le créateur du kit l'utilise pour un blog
> éditorial. Elle te montre **comment** écrire une règle propre à TON domaine. Adapte-la (ou
> supprime-la si tu n'as pas de domaine éditorial). Remplace les `{{PLACEHOLDERS}}` par tes
> réalités, ou demande à Claude de la régénérer pour ton sujet.

Skill associé (optionnel) : `content-quality-auditor` — score qualité du contenu + vérifications
veto avant publication.

---

## Pourquoi une règle métier ?
Quand tu produis du contenu dans un domaine précis, tu as des **faits à ne jamais déformer** et des
**interdits éditoriaux**. Cette règle force Claude à les respecter automatiquement avant toute
publication. (Dans l'exemple d'origine : un blog musical avec des faits historiques à ne pas inventer.)

## Quand l'utiliser AUTOMATIQUEMENT
1. Avant chaque commit touchant un fichier de contenu de ton domaine.
2. Avant chaque publication / mise en ligne d'un nouveau contenu.
3. Après modification d'un fait (date, citation, chiffre, attribution, nom propre) → re-vérifier
   les sources.

## Critères veto (= bloquent la publication) — À PERSONNALISER
| Veto | Description (exemple à remplacer par les tiens) |
|---|---|
| **Fait sans source** | Une date / un chiffre / une citation sans référence vérifiable |
| **Citation sans attribution** | Une phrase entre guillemets sans auteur + source |
| **Donnée canonique fausse** | Une valeur hors des références officielles → grades A+=#10b981 / A=#22c55e / B=#eab308 / C=#f97316 / D=#ef4444 ; OB=violet, FVG=bleu ; évaluation uniquement sur bougie M5 clôturée (no-repaint) ; MetaTrader5 Python = Windows uniquement |
| **Attribution erronée** | Quelque chose attribué à la mauvaise personne/source |
| **Orthographe officielle non respectée** | Un nom propre mal orthographié |
| **Appel à l'action hors-cible** | Un CTA qui pointe ailleurs que la cible de conversion voulue |
| **Parité multilingue cassée** | Une modif dans une langue sans son équivalent dans l'autre |

## Sources canoniques à consulter AVANT toute affirmation
Liste ici TES sources de référence (documents, bases, archives) que Claude doit consulter avant
d'affirmer un fait sur le trading algorithmique SMC/ICT (méthodologie DREVM, session New York) pour traders utilisateurs du SaaS DREVM (et toi-même en exécution NY).

## Workflow type
1. Écrire / modifier un contenu
2. Vérifier chaque fait → source canonique consultée
3. Audit qualité (score + veto check)
4. Veto déclenché → bloquer le commit, fixer, re-auditer
5. Score OK → vérifier la parité multilingue si applicable
6. Commit + publication

## Interdictions absolues (exemple)
- NEVER publier sans audit qualité
- NEVER inventer une date / citation / chiffre / attribution
- NEVER dévier des faits canoniques de ton domaine
- NEVER ajouter un appel à l'action hors de ta cible de conversion
- NEVER publier dans une langue sans publier l'équivalent dans l'autre (si site multilingue)
