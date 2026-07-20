export interface University {
  name: string;
  country: string;
}

// Dropped when building an acronym so "University of Michigan" reduces to
// "UM", not "UOM" — matches how people actually write initialisms.
const ACRONYM_STOPWORDS = new Set([
  "of", "the", "and", "at", "in", "for", "de", "la", "le", "du", "der", "van", "di", "on", "a", "an", "&",
]);

// Colloquial nicknames that don't reduce to their school's initials at all
// (a plain acronym pass gets "UCLA"/"MIT"/"NYU" for free, but "UMich" and
// "UPenn" are irregular contractions with no algorithmic derivation).
const NICKNAME_ALIASES: Record<string, string> = {
  umich: "University of Michigan",
  umass: "University of Massachusetts",
  upenn: "University of Pennsylvania",
  pitt: "University of Pittsburgh",
  olemiss: "University of Mississippi",
  bama: "University of Alabama",
  gatech: "Georgia Institute of Technology",
  vatech: "Virginia Polytechnic Institute",
  udub: "University of Washington",
};

function acronymOf(name: string): string {
  return name
    .split(/[\s,-]+/)
    .filter((w) => w && !ACRONYM_STOPWORDS.has(w.toLowerCase()))
    .map((w) => w[0])
    .join("")
    .toLowerCase();
}

// A single query word matched somewhere in the target name — a literal
// substring, scored better when it lands on a word boundary.
function matchWord(word: string, target: string): number | null {
  const idx = target.indexOf(word);
  if (idx === -1) return null;
  const isWordStart = idx === 0 || " -,".includes(target[idx - 1]);
  return idx * 0.1 + (isWordStart ? 0 : 3);
}

// All words of the query must appear somewhere in the target, in any order —
// this is what lets "Stony Brook University" match "State University of New
// York at Stony Brook" even though the word order differs.
function wordMatchScore(query: string, target: string): number | null {
  const words = query.split(/\s+/).filter(Boolean);
  let total = 0;
  for (const word of words) {
    const score = matchWord(word, target);
    if (score === null) return null;
    total += score;
  }
  return total / words.length;
}

function fuzzyMatch(query: string, name: string): number | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;
  const target = name.toLowerCase();

  let best = wordMatchScore(q, target);

  // Acronym pass — only for short, letters-only queries (how real
  // initialisms like "MIT" or "UCLA" actually look).
  if (q.length >= 2 && q.length <= 6 && /^[a-z]+$/.test(q)) {
    const acronym = acronymOf(name);
    if (acronym === q) {
      best = best === null ? 0 : Math.min(best, 0);
    } else if (acronym.startsWith(q)) {
      const score = 1 + (acronym.length - q.length) * 0.3;
      best = best === null ? score : Math.min(best, score);
    }
  }

  // Nickname pass — expand a known irregular nickname to its canonical
  // phrase and run that through the same word matcher, so the real school
  // still has to win the ranking rather than being force-selected.
  const alias = NICKNAME_ALIASES[q.replace(/\s+/g, "")];
  if (alias) {
    const score = wordMatchScore(alias.toLowerCase(), target);
    if (score !== null) best = best === null ? score : Math.min(best, score);
  }

  return best;
}

export function searchUniversities(query: string, universities: University[], limit: number): University[] {
  const scored: { u: University; score: number }[] = [];
  for (const u of universities) {
    const score = fuzzyMatch(query, u.name);
    if (score !== null) scored.push({ u, score });
  }
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((s) => s.u);
}
