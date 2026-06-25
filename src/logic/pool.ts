/**
 * pool.ts — The weighted message pool: parsing the textarea format and drawing
 * a message proportionally to its weight.
 *
 * Textarea format: one message per line, an optional trailing " xN" sets the
 * relative weight (default 1).
 *   GG x5        -> 5x more likely than a weight-1 message
 *   Bien joué x2
 *   incroyable   -> weight 1
 */

import type { Rng } from "./prng";

export type PoolMessage = { text: string; weight: number };

const WEIGHT_RE = /^(.*?)\s+x(\d+)\s*$/i;

/** Parse the textarea into a weighted pool (never empty). */
export function parsePool(raw: string): PoolMessage[] {
  const out: PoolMessage[] = [];
  for (const line of String(raw).split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = WEIGHT_RE.exec(trimmed);
    if (m && m[1].trim()) {
      out.push({ text: m[1].trim(), weight: Math.max(1, parseInt(m[2], 10)) });
    } else {
      out.push({ text: trimmed, weight: 1 });
    }
  }
  return out.length ? out : [{ text: "GG", weight: 1 }];
}

/** Draw one message text, proportional to weight. */
export function pickWeighted(pool: PoolMessage[], rng: Rng): string {
  let total = 0;
  for (const m of pool) total += Math.max(0, m.weight) || 0;
  if (total <= 0) return pool.length ? pool[0].text : "";

  let r = rng.next() * total;
  for (const m of pool) {
    r -= Math.max(0, m.weight) || 0;
    if (r < 0) return m.text;
  }
  return pool[pool.length - 1].text;
}
