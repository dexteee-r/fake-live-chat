/**
 * render.mjs — Direct CLI render (used by `npm run render` / Generer-video.bat).
 *
 * Renders the composition with its default settings straight to the Downloads
 * folder. No UI, no preview — just produce the file.
 */

import { renderVideo } from "./render-core.mjs";

console.log("Génération de la vidéo transparente (ProRes 4444)…\n");

try {
  const output = await renderVideo({
    onProgress: ({ progress }) => {
      process.stdout.write(`\r  ${Math.round(progress * 100)} %   `);
    },
  });
  console.log("\n\nTerminé : " + output);
} catch (err) {
  console.error("\nÉchec du rendu :", err?.message || err);
  process.exit(1);
}
