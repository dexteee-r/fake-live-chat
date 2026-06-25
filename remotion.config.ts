/**
 * remotion.config.ts — Render defaults for a TRANSPARENT video.
 *
 * ProRes 4444 with a 10-bit alpha pixel format is what Premiere Pro reads as a
 * clean transparent clip (straight alpha, no dark halo around the text).
 * These settings apply to `npm run render` and the .bat launchers; they can be
 * overridden per-render from the CLI if ever needed.
 */

import { Config } from "@remotion/cli/config";

// PNG frames preserve the alpha channel before encoding.
Config.setVideoImageFormat("png");

// ProRes 4444 (alpha) — the format validated for Premiere Pro import.
Config.setCodec("prores");
Config.setProResProfile("4444");
Config.setPixelFormat("yuva444p10le");
