/**
 * prebundle.mjs — Build-time: bundle the Remotion composition once into
 * app/remotion-bundle/ so the packaged app renders without running webpack on
 * the user's machine. render-core uses this folder as the serve URL when present.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";

const here = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(here, "..");

const out = await bundle({
  entryPoint: path.join(PROJECT_ROOT, "src", "index.ts"),
  outDir: path.join(here, "remotion-bundle"),
});

console.log("Remotion bundle prêt ->", out);
