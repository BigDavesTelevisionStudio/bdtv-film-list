// Racial slur filter — applied to IMDB search results server-side.
// Titles containing any of these terms are excluded from results entirely.
// Word-boundary matching prevents false positives on legitimate substrings.

const SLURS: RegExp[] = [
  /\bn[i1!]+gg[ae3]+r/i,
  /\bn[i1!]+gg[ae3]+/i,
  /\bch[i1!]+nk/i,
  /\bsp[i1!]+c/i,
  /\bsp[i1!]+ck/i,
  /\bwetback/i,
  /\bk[i1!]+ke/i,
  /\bk[i1!]+kes/i,
  /\bgook/i,
  /\bzip[- ]?head/i,
  /\bslant[- ]?eye/i,
  /\brag[- ]?head/i,
  /\btowel[- ]?head/i,
  /\bcoon\b/i,
  /\bjig[- ]?aboo/i,
  /\bporch[- ]?monkey/i,
  /\bsambo\b/i,
  /\bwog\b/i,
  /\bpaki\b/i,
  /\bdarky/i,
  /\bkaffir/i,
  /\bcracke?r\b/i,
  /\bhonky/i,
  /\bwhite[- ]?trash/i,
  /\bred[- ]?skin/i,
  /\bpollack/i,
  /\bspook\b/i,
  /\bmacaca/i,
  /\bgrease?r\b/i,
  /\byell[o0]w\s*monke?y/i,
].map((r) => r); // keep as RegExp array

export function containsRacialSlur(text: string): boolean {
  return SLURS.some((pattern) => pattern.test(text));
}

/** Check multiple fields at once — returns true if ANY contain a slur. */
export function anyFieldFlagged(...fields: (string | undefined | null)[]): boolean {
  return fields.some((f) => f != null && containsRacialSlur(f));
}

/** Blocked response helper — call anywhere a slur is detected. */
export function blockedResponse(): { error: string } {
  return { error: BLOCKED_MESSAGE };
}

export function filterRacistContent<T extends { Title: string }>(items: T[]): T[] {
  return items.filter((item) => !containsRacialSlur(item.Title));
}

export const BLOCKED_MESSAGE =
  "🚨 BigDave Border Force Protection Agency — this content has been blocked.";
