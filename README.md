# Therapist Diagnosis 01

Deterministic one-line diagnosis writer for the make.fun competition
"Your AI Therapist's Diagnosis".

`main.ts` holds a hand-written list of original diagnosis lines, scores
each against the judge's brief (diagnosis in a therapist's clinical voice,
a turn that lands at the end, tightness, freshness), and writes the
winning line to `$MAKEFUN_OUTPUT_DIR/entry.txt` (default `output/`).

Run: `node main.ts` (Node 22, zero dependencies).
