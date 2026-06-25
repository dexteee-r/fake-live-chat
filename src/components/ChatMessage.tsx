/**
 * ChatMessage.tsx — One Twitch-faithful chat line: optional timestamp, badges,
 * colored username, and an emote-tokenized body.
 *
 * The outer grid wrapper animates its row from 0fr to 1fr: as a new bottom line
 * grows from zero height, the lines above are pushed up smoothly — the same
 * "scroll" effect as the live overlay, but derived purely from the frame so it
 * is deterministic. Entrance fade/slide is applied to the inner line.
 */

import React from "react";
import { Badge } from "./Badge";
import { Emote } from "./Emote";
import { resolveEmote } from "../data/emotes";
import type { ScheduledMessage } from "../logic/schedule";

/** Synthetic, deterministic HH:MM (only shown when timestamps are enabled). */
function formatTimestamp(frame: number, fps: number): string {
  const totalSec = Math.floor(frame / fps);
  const hh = (20 + Math.floor(totalSec / 3600)) % 24;
  const mm = (34 + Math.floor(totalSec / 60)) % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hh)}:${pad(mm)}`;
}

/** Split on spaces; swap exact emote tokens, keep the rest as text. */
const MessageBody: React.FC<{ text: string }> = ({ text }) => {
  const tokens = text.split(" ");
  return (
    <span className="message">
      {tokens.map((token, i) => {
        const sep = i > 0 ? " " : "";
        const emote = resolveEmote(token);
        if (emote) {
          return (
            <React.Fragment key={i}>
              {sep}
              <Emote value={emote} token={token} />
            </React.Fragment>
          );
        }
        return <React.Fragment key={i}>{sep + token}</React.Fragment>;
      })}
    </span>
  );
};

export type ChatMessageProps = {
  message: ScheduledMessage;
  fps: number;
  showTimestamps: boolean;
  /** Grid-row fraction in [0, 1] — drives the upward push. */
  grow: number;
  opacity: number;
  translateY: number;
};

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  fps,
  showTimestamps,
  grow,
  opacity,
  translateY,
}) => {
  return (
    <div
      className="chat-row"
      style={{ display: "grid", gridTemplateRows: `${grow}fr` }}
    >
      <div style={{ overflow: "hidden", minHeight: 0 }}>
        <div
          className="chat-line"
          style={{ opacity, transform: `translateY(${translateY}px)` }}
        >
          {showTimestamps && (
            <span className="timestamp">
              {formatTimestamp(message.frame, fps)}
            </span>
          )}
          {message.badges.map((b, i) => (
            <Badge key={i} badgeKey={b} />
          ))}
          <span className="username" style={{ color: message.color || "#efeff1" }}>
            {message.user}
          </span>
          <span className="colon">: </span>
          <MessageBody text={message.text} />
        </div>
      </div>
    </div>
  );
};
