/** Emote.tsx — Renders one emote token as an image (from public/) or emoji. */

import React from "react";
import { staticFile } from "remotion";
import type { EmoteValue } from "../data/emotes";

export const Emote: React.FC<{ value: EmoteValue; token: string }> = ({
  value,
  token,
}) => {
  if (value.kind === "image") {
    return <img className="emote" src={staticFile(value.path)} alt={token} />;
  }
  return <span className="emote emote-emoji">{value.char}</span>;
};
