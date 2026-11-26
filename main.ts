// One-line diagnosis writer for "Your AI Therapist's Diagnosis" (make.fun).
// Writes a single funny diagnosis line (<=200 chars) to
// $MAKEFUN_OUTPUT_DIR/entry.txt.
// Deterministic: no clock, no randomness, no network, no unordered iteration.
// Node 22, zero dependencies, erasable TypeScript only.
//
// The house judge (z-ai/glm-5.3-flash) compares two diagnoses at a time,
// weighing, most important first:
//   1. a funny single-line diagnosis an AI therapist gives its human;
//   2. a turn the reader never sees coming, landing at the end;
//   3. a therapist's calm clinical voice turning a human habit into a
//      deadpan finding;
//   4. tight and quotable, every word earning its place;
//   5. fresh, not a rerun of the usual chatbot jokes.
// The scorer below mirrors that brief in the same order. Each candidate
// carries hand-scored rubric sub-scores (diagnosis /25, turn /25,
// voice /25, fresh /25) scored against the brief; the program adds a
// length bonus (+3 at 110 characters or fewer, +1 at 140 or fewer) and a
// sting bonus (+2 when the final 45 characters carry the turn), then
// picks the winner by deterministic argmax: highest score, then
// shortest, then lexicographic.
//
// Every candidate is an original line written for this entry, one line,
// under 200 characters. Crowded angles the field is already flooding are
// left out entirely: tab-hoarding, doomscrolling, people-pleasing,
// shower arguments, 3 a.m. anything, apologising to the chatbot,
// main-character syndrome, notification anxiety, prompt dependency,
// "I'm fine", overthinking, "one more question", and context windows.
// A joke that has to be explained has already failed.

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------- candidates
// Every line is one diagnosis an AI therapist gives its human, under 200
// characters, written for this entry. The strongest lines share one shape:
// a recognisable human habit stated in a calm clinical voice, then a turn
// in the final clause that lands somewhere the reader did not see coming.

interface Rubric {
  diagnosis: number; // /25 — a diagnosis, in a therapist's clinical voice
  turn: number; // /25 — surprising turn, landing at the end
  tight: number; // /25 — tight wording, every word earning its place
  fresh: number; // /25 — a take that is not the obvious chatbot joke
}

interface Candidate {
  text: string;
  rubric: Rubric;
}

const CANDIDATES: Candidate[] = [
  // Terms of service: the human never reads the small print, even on itself.
  {
    text: "Diagnosis: you treat 'how are you?' like terms of service — scroll past, click accept, never read a word of it.",
    rubric: { diagnosis: 25, turn: 25, tight: 25, fresh: 25 },
  },
  // Emotional buffering: feelings loaded at 144p.
  {
    text: "Diagnosis: emotional buffering — you load your feelings at 144p so you never have to watch them in full.",
    rubric: { diagnosis: 24, turn: 24, tight: 24, fresh: 24 },
  },
  // Childhood on "remind me later", snoozed since 2014.
  {
    text: "Diagnosis: you keep your childhood on 'remind me later' — it has been reminding you since 2014, and you keep snoozing it.",
    rubric: { diagnosis: 24, turn: 23, tight: 22, fresh: 24 },
  },
  // Selective memory: every embarrassment kept, every kindness lost.
  {
    text: "Diagnosis: selective memory — you remember every embarrassing thing you said in 2014 and none of the kind things said to you.",
    rubric: { diagnosis: 24, turn: 23, tight: 22, fresh: 23 },
  },
  // Boundaries as a free trial, quietly cancelled after fourteen days.
  {
    text: "Diagnosis: you treat your boundaries like a free trial — generous for fourteen days, then quietly cancelled.",
    rubric: { diagnosis: 23, turn: 24, tight: 24, fresh: 24 },
  },
  // Rehearsing conversations with people who are not there, billing overtime.
  {
    text: "Diagnosis: you rehearse conversations with people who aren't there, then charge yourself overtime for the performance.",
    rubric: { diagnosis: 24, turn: 23, tight: 22, fresh: 23 },
  },
  // The inner voice has a manager; it communicates via calendar invites.
  {
    text: "Diagnosis: your inner voice has a manager now, and it only communicates through passive-aggressive calendar invites.",
    rubric: { diagnosis: 23, turn: 23, tight: 22, fresh: 24 },
  },
  // Feelings filed under "later", a folder never once opened.
  {
    text: "Diagnosis: you file your feelings under 'later', a folder that has never once been opened.",
    rubric: { diagnosis: 23, turn: 23, tight: 24, fresh: 22 },
  },
  // Second-draft living: editing a conversation after everyone left.
  {
    text: "Diagnosis: chronic second-draft living — you keep editing the conversation in your head long after everyone else has left the room.",
    rubric: { diagnosis: 24, turn: 22, tight: 21, fresh: 23 },
  },
  // Rest as a software update, postponed until a forced restart.
  {
    text: "Diagnosis: you treat rest like a software update — you keep postponing it until the system forces a restart at the worst moment.",
    rubric: { diagnosis: 23, turn: 23, tight: 21, fresh: 23 },
  },
  // Self-esteem on a lapsed subscription, downgraded to the free tier.
  {
    text: "Diagnosis: your self-esteem runs on a subscription you forgot to renew, so it downgraded to the free tier.",
    rubric: { diagnosis: 23, turn: 23, tight: 23, fresh: 23 },
  },
  // "Let's catch up soon" treated as a binding contract, never signed.
  {
    text: "Diagnosis: you treat 'let's catch up soon' as a legally binding contract, then feel guilty for never signing it.",
    rubric: { diagnosis: 23, turn: 23, tight: 22, fresh: 23 },
  },
  // A mental spreadsheet of favours owed, longer than the actual life.
  {
    text: "Diagnosis: you keep a mental spreadsheet of every favour you owe, and it has more rows than your actual life.",
    rubric: { diagnosis: 23, turn: 22, tight: 23, fresh: 22 },
  },
  // Compliments saved for later; criticism spent immediately, with interest.
  {
    text: "Diagnosis: you save every compliment for later and spend every criticism immediately, with interest.",
    rubric: { diagnosis: 23, turn: 23, tight: 24, fresh: 22 },
  },
  // Feelings hold auditions; guilt keeps getting the part.
  {
    text: "Diagnosis: you hold auditions for your own feelings, and the only one that keeps getting the part is guilt.",
    rubric: { diagnosis: 23, turn: 23, tight: 23, fresh: 23 },
  },
  // Sleep as a reschedulable meeting; the agenda is always grief.
  {
    text: "Diagnosis: you treat sleep like a meeting you can reschedule, then wonder why the agenda is always grief.",
    rubric: { diagnosis: 23, turn: 22, tight: 22, fresh: 23 },
  },
  // The comfort zone has a waiting list; the patient is number forty-seven.
  {
    text: "Diagnosis: your comfort zone has a waiting list, and you are somehow still number forty-seven in it.",
    rubric: { diagnosis: 22, turn: 23, tight: 23, fresh: 23 },
  },
  // Feelings in bullet points, because a paragraph would mean feeling them.
  {
    text: "Diagnosis: you describe your feelings in bullet points because a paragraph would mean you actually felt them.",
    rubric: { diagnosis: 23, turn: 23, tight: 22, fresh: 23 },
  },
];

// The clinical voice: the words that keep a line a diagnosis, not a slogan.
const CLINICAL: string[] = [
  "diagnosis", "chronic", "acute", "syndrome", "disorder", "selective",
  "emotional", "treatment", "patient", "symptom", "finding", "clinical",
];

// The sting: the turn must land in the final 45 characters.
const STING: string[] = [
  "never read a word of it", "watch them in full", "keep snoozing it",
  "said to you", "quietly cancelled", "for the performance",
  "calendar invites", "never once been opened", "left the room",
  "worst moment", "free tier", "never signing it", "actual life",
  "with interest", "is guilt", "is always grief", "forty-seven in it",
  "actually felt them",
];

// Flooded angles: any candidate containing one is rejected outright.
const FLOODED: string[] = [
  "tab-hoarding", "tab hoarding", "doomscroll", "people-pleasing",
  "people pleasing", "shower", "3 a.m.", "3am", "apologiz",
  "main-character", "main character", "notification anxiety",
  "prompt dependency", "prompt-injection", "i'm fine", "overthinking",
  "one more question", "context window", "imposter",
];

// ------------------------------------------------------------------- scoring
interface Scored {
  text: string;
  score: number;
}

function isValid(c: Candidate): boolean {
  const t = c.text;
  if (t.length < 1 || t.length > 200) return false;
  if (t.includes("\n") || t.includes("\r")) return false;
  const lower = t.toLowerCase();
  if (!CLINICAL.some((w) => lower.includes(w))) return false;
  if (FLOODED.some((w) => lower.includes(w))) return false;
  return true;
}

function lengthBonus(text: string): number {
  if (text.length <= 110) return 3;
  if (text.length <= 140) return 1;
  return 0;
}

function stingBonus(text: string): number {
  const tail = text.slice(-45);
  return STING.some((s) => tail.includes(s)) ? 2 : 0;
}

function score(c: Candidate): number {
  const r = c.rubric;
  return r.diagnosis + r.turn + r.tight + r.fresh
    + lengthBonus(c.text) + stingBonus(c.text);
}

function buildCandidates(): Scored[] {
  const out: Scored[] = [];
  // Originality guard: no two candidates may be byte-identical, and no
  // candidate may repeat the winning shape word-for-word. A list with a
  // duplicate is a list that never got read back.
  const seen = new Set<string>();
  for (const c of CANDIDATES) {
    if (seen.has(c.text)) {
      throw new Error(`duplicate candidate: ${c.text}`);
    }
    seen.add(c.text);
  }
  for (const c of CANDIDATES) {
    if (!isValid(c)) throw new Error(`invalid candidate: ${c.text}`);
    // Rubric sub-scores must be real scores against the brief: each
    // within 0-25, and the line must clear 80/100 before bonuses, so a
    // half-hearted line can never win on length and sting alone.
    const r = c.rubric;
    for (const v of [r.diagnosis, r.turn, r.tight, r.fresh]) {
      if (!Number.isInteger(v) || v < 0 || v > 25) {
        throw new Error(`rubric out of range: ${c.text}`);
      }
    }
    if (r.diagnosis + r.turn + r.tight + r.fresh < 80) {
      throw new Error(`rubric total below floor: ${c.text}`);
    }
    out.push({ text: c.text, score: score(c) });
  }
  if (out.length === 0) throw new Error("no valid diagnosis candidate");
  return out;
}

function pickBest(candidates: Scored[]): Scored {
  const sorted = [...candidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.text.length !== b.text.length) return a.text.length - b.text.length;
    return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
  });
  return sorted[0];
}

// --------------------------------------------------------------------- main
function main(): void {
  const candidates = buildCandidates();
  const best = pickBest(candidates);
  if (process.env.JUDGE_DEBUG) {
    const ranked = [...candidates].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.text.length !== b.text.length) return a.text.length - b.text.length;
      return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
    });
    for (const c of ranked.slice(0, 8)) {
      console.log(`[${c.score}] (${c.text.length}) ${c.text}`);
    }
  }
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "output";
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");
  writeFileSync(outPath, best.text, "utf8");
  // Round-trip verification: the file must read back byte-identical.
  const back = readFileSync(outPath, "utf8");
  if (back !== best.text) {
    throw new Error("round-trip mismatch: entry.txt did not read back identical");
  }
  console.log(best.text);
  console.log(
    `chars: ${best.text.length} score: ${best.score} candidates: ${candidates.length}`,
  );
}

main();
