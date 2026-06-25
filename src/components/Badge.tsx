/** Badge.tsx — Renders one chat badge by key (no-op for unknown keys). */

import React from "react";
import { badgeComponent } from "../data/badges";

export const Badge: React.FC<{ badgeKey: string }> = ({ badgeKey }) => {
  const Svg = badgeComponent(badgeKey);
  if (!Svg) return null;
  return (
    <span className="badge">
      <Svg />
    </span>
  );
};
