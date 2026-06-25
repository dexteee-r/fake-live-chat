/**
 * prng.ts — Seedable pseudo-random generator (mulberry32).
 *
 * Returned as an isolated instance (no global singleton) so a render is a pure
 * function of its seed: the same seed always replays the exact same stream.
 */

export type Rng = {
  /** Float in [0, 1). */
  next: () => number;
  /** Integer in [min, max] inclusive. */
  int: (min: number, max: number) => number;
  /** Random element of a non-empty array. */
  pick: <T>(arr: T[]) => T;
};

/**
 * Create a deterministic RNG from a 32-bit seed.
 * @param seed any integer; coerced to uint32.
 */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;

  const next = (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
  };
}
