/**
 * emotes.ts — Token table for emotes. A message word that exactly matches a key
 * (case-sensitive, like real Twitch) is replaced at render time.
 *
 * IMPORTANT: no official Twitch/BTTV/FFZ emotes (copyright). Unicode emoji are
 * ready-made fallbacks; custom art lives in public/emotes/.
 */

export type EmoteValue =
  | { kind: "emoji"; char: string }
  | { kind: "image"; path: string };

const TABLE: Record<string, EmoteValue> = {
  // Unicode fallbacks (work with no files).
  KEKW: { kind: "emoji", char: "😂" },
  LULW: { kind: "emoji", char: "😆" },
  LOL: { kind: "emoji", char: "😂" },
  POG: { kind: "emoji", char: "😮" },
  Pog: { kind: "emoji", char: "😮" },
  PogU: { kind: "emoji", char: "😮" },
  Sadge: { kind: "emoji", char: "😢" },
  Clap: { kind: "emoji", char: "👏" },
  GG: { kind: "emoji", char: "🏆" },

  // Custom image example (path is relative to public/).
  HEART: { kind: "image", path: "emotes/heart.svg" },
};

/** Resolve a token to its emote value, or null if it is plain text. */
export function resolveEmote(token: string): EmoteValue | null {
  return Object.prototype.hasOwnProperty.call(TABLE, token) ? TABLE[token] : null;
}
