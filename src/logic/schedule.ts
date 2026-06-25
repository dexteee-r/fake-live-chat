/**
 * schedule.ts — The deterministic heart of the app.
 *
 * The web overlay generated messages live (setTimeout). For a frame-perfect,
 * re-renderable video we instead pre-compute the WHOLE timeline up front: a
 * pure function (config) -> ScheduledMessage[], each message tagged with the
 * exact frame at which it appears. The composition then just reads, for any
 * frame, which messages exist yet — no time, no live randomness at render.
 */

import { createRng } from "./prng";
import { pickWeighted, type PoolMessage } from "./pool";
import type { FakeUser } from "../data/usernames";

export type ScheduledMessage = {
  /** Stable id, used as the React key and to break frame ties. */
  id: number;
  user: string;
  color: string;
  badges: string[];
  text: string;
  /** Frame at which this message enters the chat. */
  frame: number;
};

export type ScheduleOptions = {
  seed: number;
  fps: number;
  durationInFrames: number;
  rate: number;
  rateJitter: number;
  badgeChance: number;
  allowedBadges: string[];
  spamWaveChance: number;
  spamWaveSize: [number, number];
  spamWaveDelaySec: number;
  pool: PoolMessage[];
  users: FakeUser[];
};

const FALLBACK_USER: FakeUser = { name: "viewer", color: "#efeff1" };

/**
 * Build the full ordered list of messages for the run. Deterministic: identical
 * options (same seed included) always produce an identical array.
 */
export function buildSchedule(opts: ScheduleOptions): ScheduledMessage[] {
  const rng = createRng(opts.seed);
  const durationMs = (opts.durationInFrames / opts.fps) * 1000;
  const msToFrame = (ms: number) => Math.round((ms / 1000) * opts.fps);

  const events: ScheduledMessage[] = [];
  let id = 0;

  /** Emit one message (random user + maybe a badge) at a given time. */
  const emit = (timeMs: number, text: string) => {
    const u = opts.users.length ? rng.pick(opts.users) : FALLBACK_USER;
    const badges =
      opts.allowedBadges.length && rng.next() < opts.badgeChance
        ? [rng.pick(opts.allowedBadges)]
        : [];
    events.push({
      id: id++,
      user: u.name,
      color: u.color,
      badges,
      text,
      frame: msToFrame(timeMs),
    });
  };

  let t = 0;
  while (t < durationMs) {
    const text = pickWeighted(opts.pool, rng);
    emit(t, text);

    // Occasional copypasta wave: the same text reposted by several users.
    if (rng.next() < opts.spamWaveChance) {
      const [a, b] = opts.spamWaveSize;
      const n = rng.int(Math.min(a, b), Math.max(a, b));
      const stepMs = Math.max(0, opts.spamWaveDelaySec * 1000);
      for (let i = 1; i <= n; i++) {
        const wt = t + stepMs * i;
        if (wt >= durationMs) break;
        emit(wt, text);
      }
    }

    // Advance the clock by a jittered interval around the base cadence.
    const base = 1000 / Math.max(0.01, opts.rate);
    const jitter = Math.min(1, Math.max(0, opts.rateJitter));
    const factor = 1 + (rng.next() * 2 - 1) * jitter; // in [1-j, 1+j]
    t += Math.max(30, base * factor);
  }

  // Waves can interleave with later ticks, so order by appearance frame.
  events.sort((x, y) => x.frame - y.frame || x.id - y.id);
  return events;
}
