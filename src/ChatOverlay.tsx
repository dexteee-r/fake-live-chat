/**
 * ChatOverlay.tsx — The composition body.
 *
 * For the current frame it (1) builds the deterministic message schedule from
 * the props, (2) keeps the messages that have appeared, capped to a visible
 * window, and (3) renders each with a frame-derived entrance + upward-push
 * animation. The background is intentionally transparent (ProRes 4444 alpha).
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import "./styles/chat.css";
import {
  ALLOWED_BADGES,
  SPAM_WAVE_SIZE,
  type ChatProps,
} from "./config";
import { buildSchedule } from "./logic/schedule";
import { parsePool } from "./logic/pool";
import { USERS } from "./data/usernames";
import { ChatMessage } from "./components/ChatMessage";

// Deterministic font loading (Remotion waits for it before rendering frames).
const { fontFamily } = loadFont("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

const ENTRANCE_MS = 150;

export const ChatOverlay: React.FC<ChatProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Pre-compute the whole timeline; recomputed only when an input changes.
  const schedule = useMemo(
    () =>
      buildSchedule({
        seed: props.seed,
        fps,
        durationInFrames,
        rate: props.rate,
        rateJitter: props.rateJitter,
        badgeChance: props.badgeChance,
        allowedBadges: ALLOWED_BADGES,
        spamWaveChance: props.spamWaveChance,
        spamWaveSize: SPAM_WAVE_SIZE,
        spamWaveDelaySec: props.spamWaveDelaySec,
        pool: parsePool(props.messagePool),
        users: USERS,
      }),
    [
      fps,
      durationInFrames,
      props.seed,
      props.rate,
      props.rateJitter,
      props.badgeChance,
      props.spamWaveChance,
      props.spamWaveDelaySec,
      props.messagePool,
    ],
  );

  // Messages on screen now, capped to the visible window.
  const appeared = schedule.filter((m) => m.frame <= frame);
  const visible = appeared.slice(
    Math.max(0, appeared.length - props.maxVisibleMessages),
  );

  const pushFrames = (props.scrollSpeedMs / 1000) * fps;
  const entranceFrames = (ENTRANCE_MS / 1000) * fps;

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <div
        className={`chat${props.textOutline ? " with-outline" : ""}`}
        style={{ "--font-scale": String(props.fontScale) } as React.CSSProperties}
      >
        {visible.map((m) => {
          const age = frame - m.frame;
          const grow =
            pushFrames <= 0
              ? 1
              : interpolate(age, [0, pushFrames], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
          const opacity = props.entranceAnimation
            ? interpolate(age, [0, entranceFrames], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : 1;
          const translateY = props.entranceAnimation
            ? interpolate(age, [0, entranceFrames], [6, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : 0;
          return (
            <ChatMessage
              key={m.id}
              message={m}
              fps={fps}
              showTimestamps={props.showTimestamps}
              grow={grow}
              opacity={opacity}
              translateY={translateY}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
