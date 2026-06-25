/**
 * config.ts — The composition's input schema (drives the Studio settings panel)
 * and its default values. This is the single source of truth for every knob the
 * user can tweak before rendering.
 *
 * The schema is plain Zod so Remotion Studio renders an editable control for
 * each field (number sliders, checkboxes, a textarea for the message pool).
 */

import { z } from "zod";
import { zTextarea } from "@remotion/zod-types";

export const chatSchema = z.object({
  // --- Vidéo (taille / durée / cadence) ---
  durationInSeconds: z.number().min(1).max(600),
  fps: z.number().min(1).max(120),
  width: z.number().int().min(16).max(7680),
  height: z.number().int().min(16).max(4320),

  // --- Génération (déterministe via la graine) ---
  seed: z.number().int(),
  rate: z.number().min(0.1).max(20), // messages par seconde (moyenne)
  rateJitter: z.number().min(0).max(1), // irrégularité du débit
  badgeChance: z.number().min(0).max(1), // proba qu'un message porte un badge
  spamWaveChance: z.number().min(0).max(1), // proba de déclencher une copypasta
  spamWaveDelaySec: z.number().min(0).max(2), // délai entre répétitions d'une vague
  messagePool: zTextarea(), // une ligne par message, suffixe " xN" = poids

  // --- Apparence ---
  fontScale: z.number().min(0.5).max(6),
  showTimestamps: z.boolean(),
  textOutline: z.boolean(),
  entranceAnimation: z.boolean(),
  scrollSpeedMs: z.number().min(0).max(1000), // durée de la poussée vers le haut
  maxVisibleMessages: z.number().int().min(1).max(200),
});

export type ChatProps = z.infer<typeof chatSchema>;

/** Pool par défaut au format textarea (suffixe " xN" = poids relatif). */
export const DEFAULT_MESSAGE_POOL_TEXT = `GG x5
Bien joué x2
Trop fort x2
LOL x3
incroyable
Pog x3
KEKW x3
+2 x2
W x2`;

/** Valeurs de départ — pensées pour un chat lisible plein cadre en 1080p. */
export const DEFAULT_PROPS: ChatProps = {
  durationInSeconds: 15,
  fps: 60,
  width: 1920,
  height: 1080,
  seed: 1234,
  rate: 3,
  rateJitter: 0.5,
  badgeChance: 0.3,
  spamWaveChance: 0.1,
  spamWaveDelaySec: 0.25,
  messagePool: DEFAULT_MESSAGE_POOL_TEXT,
  fontScale: 2.2,
  showTimestamps: false,
  textOutline: true,
  entranceAnimation: true,
  scrollSpeedMs: 200,
  maxVisibleMessages: 30,
};

/** Badges (clés canoniques) pouvant être attribués au hasard. */
export const ALLOWED_BADGES = ["moderator", "vip", "subscriber", "prime"];

/** [min, max] d'utilisateurs répétant le même message dans une vague de spam. */
export const SPAM_WAVE_SIZE: [number, number] = [3, 8];
