/**
 * render-core.mjs — Shared rendering logic used by both the app server
 * (the "Générer la vidéo" button) and the direct CLI (`npm run render`).
 *
 * Output goes to the user's Downloads folder as `<nom>.mov`. Like a browser
 * download, if that name already exists it becomes `<nom> (1).mov`, … so a
 * previous export is never overwritten.
 *
 * Rendering uses a Remotion "serve URL":
 *   - packaged / after `npm run prebundle` → the prebuilt `remotion-bundle/`
 *     (no webpack at runtime),
 *   - dev fallback → bundle from source on the fly.
 */

import path from "node:path";
import os from "node:os";
import { mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { selectComposition, renderMedia, ensureBrowser } from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const PREBUILT = path.join(__dirname, "remotion-bundle");

/** The current user's Downloads folder. */
export function downloadsDir() {
  return path.join(os.homedir(), "Downloads");
}

/** Turn user input into a safe Windows base filename (no extension). */
export function sanitizeBaseName(name) {
  let base = String(name ?? "").trim();
  base = base.replace(/\.mov$/i, ""); // drop a typed ".mov" so we don't double it
  base = base.replace(/[\\/:*?"<>|]/g, ""); // remove characters Windows forbids
  base = base.replace(/[.\s]+$/, "").trim(); // no trailing dot/space
  return base || "fake-chat";
}

/**
 * A free path in Downloads from the chosen name: "<name>.mov", then
 * "<name> (1).mov", … so a previous export is never overwritten.
 */
export function nextOutputPath(name) {
  const dir = downloadsDir();
  mkdirSync(dir, { recursive: true });
  const base = sanitizeBaseName(name);
  let target = path.join(dir, `${base}.mov`);
  let i = 1;
  while (existsSync(target)) target = path.join(dir, `${base} (${i++}).mov`);
  return target;
}

/** Resolve the Remotion serve URL once, then reuse it for every render. */
let serveUrlPromise = null;
export function getServeUrl() {
  if (!serveUrlPromise) {
    if (existsSync(path.join(PREBUILT, "index.html"))) {
      serveUrlPromise = Promise.resolve(PREBUILT);
    } else {
      // Dev fallback: bundle from source (webpack). @remotion/bundler is a
      // build-time dependency, so it is imported lazily.
      serveUrlPromise = import("@remotion/bundler").then(({ bundle }) =>
        bundle({ entryPoint: path.join(PROJECT_ROOT, "src", "index.ts") }),
      );
    }
  }
  return serveUrlPromise;
}

/** Ensure the headless rendering browser is present (downloads once if needed). */
let browserPromise = null;
function getBrowser() {
  if (!browserPromise) browserPromise = ensureBrowser();
  return browserPromise;
}

/** Pre-warm the heavy bits so the first render starts quickly. */
export async function warmup() {
  await Promise.all([getServeUrl(), getBrowser().catch(() => {})]);
}

/**
 * Render the transparent ProRes 4444 video to Downloads.
 * @param {{inputProps?: object, fileName?: string, onProgress?: (p: {progress: number}) => void}} opts
 * @returns {Promise<string>} the path of the written file.
 */
export async function renderVideo({ inputProps, fileName, onProgress } = {}) {
  await getBrowser();
  const serveUrl = await getServeUrl();
  const composition = await selectComposition({
    serveUrl,
    id: "ChatOverlay",
    inputProps,
  });
  const outputLocation = nextOutputPath(fileName);
  await renderMedia({
    composition,
    serveUrl,
    codec: "prores",
    proResProfile: "4444",
    pixelFormat: "yuva444p10le",
    imageFormat: "png",
    outputLocation,
    inputProps,
    onProgress,
  });
  return outputLocation;
}
