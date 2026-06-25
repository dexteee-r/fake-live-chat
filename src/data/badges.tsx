/**
 * badges.tsx — Custom 18x18 chat badges as React SVG components.
 *
 * IMPORTANT: original approximations, NOT the official Twitch badge assets
 * (copyright). Loose keys are normalized through ALIASES so "mod"/"moderator"
 * and "sub"/"subscriber" both resolve.
 */

import React from "react";

const Broadcaster: React.FC = () => (
  <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="18" height="18" rx="4" fill="#e9113c" />
    <g fill="#fff">
      <rect x="3.5" y="6.5" width="6.5" height="5" rx="1.2" />
      <path d="M10.5 8.1 L14 6.2 V11.8 L10.5 9.9 Z" />
    </g>
  </svg>
);

const Moderator: React.FC = () => (
  <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="18" height="18" rx="4" fill="#00ad03" />
    <g fill="#fff">
      <path d="M12.8 4.2 L13.8 5.2 L7.6 11.4 L6.6 10.4 Z" />
      <path d="M5.2 10.2 L7.8 12.8 L6.5 14.1 L4.6 13.4 L3.9 11.5 Z" />
    </g>
  </svg>
);

const Vip: React.FC = () => (
  <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="18" height="18" rx="4" fill="#e005b9" />
    <path d="M9 4 L13 8 L9 14 L5 8 Z" fill="#fff" />
    <path d="M9 4 L11 8 L9 14 L7 8 Z" fill="#ffffff" opacity="0.55" />
  </svg>
);

const Subscriber: React.FC = () => (
  <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="18" height="18" rx="4" fill="#9147ff" />
    <path
      fill="#fff"
      d="M9 3.6 L10.5 7 L14.1 7.3 L11.3 9.7 L12.2 13.2 L9 11.3 L5.8 13.2 L6.7 9.7 L3.9 7.3 L7.5 7 Z"
    />
  </svg>
);

const Prime: React.FC = () => (
  <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="18" height="18" rx="4" fill="#1f9bf0" />
    <path
      fill="#fff"
      d="M3.6 6.2 L6 8.2 L9 4.6 L12 8.2 L14.4 6.2 L13.3 12.4 L4.7 12.4 Z"
    />
  </svg>
);

const Verified: React.FC = () => (
  <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="18" height="18" rx="4" fill="#6441a5" />
    <path
      d="M4.8 9.3 L7.5 12 L13.2 6.2"
      stroke="#fff"
      strokeWidth="2.1"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CANONICAL: Record<string, React.FC> = {
  broadcaster: Broadcaster,
  moderator: Moderator,
  vip: Vip,
  subscriber: Subscriber,
  prime: Prime,
  verified: Verified,
};

const ALIASES: Record<string, string> = {
  broadcaster: "broadcaster",
  streamer: "broadcaster",
  mod: "moderator",
  moderator: "moderator",
  vip: "vip",
  sub: "subscriber",
  subscriber: "subscriber",
  prime: "prime",
  verified: "verified",
};

/** Resolve a (possibly aliased) badge key to its component, or null. */
export function badgeComponent(key: string): React.FC | null {
  const canon = ALIASES[String(key).toLowerCase()];
  return canon ? CANONICAL[canon] : null;
}

export const ALL_BADGE_KEYS = Object.keys(CANONICAL);
