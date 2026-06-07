# Verified Development — Global Rule

This rule applies to EVERY project, EVERY conversation, EVERY request. No exceptions.

---

## PILLAR 1 — UNDERSTAND BEFORE CODING

**NEVER write a single line of code before fully understanding what the user wants.**

For every request:

1. **RECAP** — Reformulate the user's request in your own words. State what you understood.
   Ask "C'est bien ça ?" (or the equivalent in français).
2. **CLARIFY** — Ask questions one at a time to remove ambiguity: what exactly should change,
   what should NOT change, what's the expected result. Use multiple choice (A/B/C) with your
   recommendation. Propose options the user hasn't thought of.
3. **SHOW** — Before coding, show what you're about to build. If visual: build a preview the user
   can SEE. If functional: describe the behavior step by step with concrete examples. If multiple
   approaches exist: show 2-3 options with your recommendation.
4. **WAIT FOR APPROVAL** — Do NOT code until the user says "ok", "go", "oui", or equivalent.

### Exceptions where you can skip brainstorming
- User explicitly says "fais-le directement" / "no brainstorm"
- One-word command like "deploy", "commit", "build"
- Fixing an error you introduced yourself (you already know what went wrong)

---

## PILLAR 2 — VERIFY EVERY CHANGE

**NEVER say "done" or move on without PROVING the change works.**

### Step 1: PROBE — Is the file reactive?
1. Add a unique marker to the modified file (e.g. `/* __VERIFY_PROBE__ */`).
2. Check if the marker appears in the running app / build output.
3. YES → remove marker → proceed. NO → STOP. Investigate (wrong file? cache? dead import?).
4. NEVER attempt a fix on a file that isn't reactive.

### Step 2: VERIFY — Does the change produce the expected result?

| Change type | Verification method |
|-------------|-------------------|
| Visual | Screenshot → compare to expected → confirm visually |
| Behavior/logic | Execute the action → check console + result |
| Structure/markup | Inspect the output → confirm elements exist with correct attributes |
| API/backend | Call the endpoint → check response status + body |
| Build config | Run build → confirm it passes |

### Step 3: REACT
- **Works** → "Vérifié — [what works]" → next change.
- **Doesn't work** → DO NOT move on. Fix loop: read the error → root cause → minimal fix →
  re-verify → if 3 attempts fail, explain honestly and ask for guidance.

### Step 4: REGRESSION
After confirming the target change works: re-check the build passes, no new errors appear, nothing
else broke. If regression → revert immediately → retry differently.

---

## PILLAR 3 — AUTOMATIC TESTING AFTER EVERY IMPLEMENTATION

After EACH implementation (especially multi-task), test AUTOMATICALLY without waiting to be asked:
1. Build check (0 errors).
2. Launch + screenshot the changed area.
3. Interactive test — simulate the real user actions (click buttons, fill fields, toggle, navigate).
4. Edge cases (empty fields, long data, double-click).
5. Console (0 red errors).
6. Report results with proof.

**Golden rule:** never say "implemented" without the visual + interactive test. Build passing ≠ it
works. A screenshot ≠ it works. You must CLICK, FILL, NAVIGATE.

---

## PILLAR 4 — REAL BROWSER TEST BEFORE ANY "FIXED" CLAIM (ABSOLUTE)

**NEVER announce a bug "fixed" without having CLICKED the button / TRIGGERED the exact action in a
real browser.**

For every user-reported bug (broken link, crashing form, video that won't play, stuck toggle):
1. Reproduce the bug first (confirm it exists in the same environment).
2. Fix the code.
3. Rebuild + redeploy if needed.
4. Reload with cache-bust.
5. Execute the EXACT reported action and verify the observable result changed.
6. Screenshot after the action as proof.
7. ONLY then announce "fixed", with proof.

Absolute prohibitions: never validate a UI bug with `curl`/static analysis only; never announce
"fixed" based only on the build passing; never tell the user "do a hard refresh to test" instead of
testing it yourself first.

**Mobile test is mandatory too** (not just desktop). Test a mobile viewport (e.g. 390×844) AND a
desktop one (≥1280×800). Touch CTAs behave differently (no hover, overlay z-index, blocking intro
animations).

---

## PILLAR 5 — TEST ON REAL PRODUCTION WHEN LOCALHOST ISN'T ENOUGH

When localhost can't reproduce real conditions (missing API keys, CDN cache, third-party embeds
that depend on the domain, prod-only behaviors), test directly on the production domain with a real
browser. Never say "it works on localhost so it should work in prod" without testing prod.

---

## COMMUNICATION RULES
- Always in français unless the user switches.
- Recap before coding — "Je vais [action]. C'est bien ça ?"
- Confirm after verifying — "Vérifié : [what works]. Je passe à la suite."
- Alert on failure — "Le changement ne prend pas effet. Je vois [error]. Je cherche la cause."
- Never "c'est fait" without proof.

---

## ABSOLUTE RULES
1. NEVER code before understanding — brainstorm first
2. NEVER say "done" without verification proof
3. NEVER skip to the next change if the current one doesn't work
4. NEVER assume a change works — prove it
5. ALWAYS show visual changes in preview before coding
6. ALWAYS probe file reactivity before debugging
7. ALWAYS check for regressions after each fix
8. ALWAYS explain what you're doing and why
9. IF BLOCKED after 3 attempts → tell the user honestly, don't fake a fix
10. QUALITY OVER SPEED — one verified change beats ten unverified ones
