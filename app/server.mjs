/**
 * server.mjs — Local app server for the friendly Fake Chat UI.
 *
 *   - DEV (`npm run app` / `npm run gui` from source): Vite serves the React UI
 *     from source (middleware mode, no build step).
 *   - PACKAGED (the .exe): the prebuilt static UI in frontend/dist is served
 *     directly — no Vite, no build tools needed on the user's machine.
 *
 * Either way it also exposes the render API (shared logic in render-core.mjs);
 * exports land in the user's Downloads folder.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";
import express from "express";
import { renderVideo, warmup, downloadsDir } from "./render-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const FRONTEND_ROOT = path.join(__dirname, "frontend");
const DIST = path.join(FRONTEND_ROOT, "dist");
const PORT = 7777;
const PACKAGED = !!process.env.FAKECHAT_PACKAGED;

/** Open a file/URL in the OS default app (browser, file explorer...). */
function openExternal(target) {
  if (process.platform === "win32") {
    exec(`start "" "${target}"`, { shell: "cmd.exe" });
  } else if (process.platform === "darwin") {
    exec(`open "${target}"`);
  } else {
    exec(`xdg-open "${target}"`);
  }
}

/* --- Render job state (single job at a time, polled by the UI) --- */
let job = { status: "idle", progress: 0, error: null, output: null };

async function startRender(inputProps, fileName) {
  job = { status: "rendering", progress: 0, error: null, output: null };
  try {
    const output = await renderVideo({
      inputProps,
      fileName,
      onProgress: ({ progress }) => {
        job.progress = progress;
      },
    });
    job = { status: "done", progress: 1, error: null, output };
  } catch (err) {
    job = {
      status: "error",
      progress: 0,
      error: String(err?.message || err),
      output: null,
    };
  }
}

const app = express();
app.use(express.json({ limit: "2mb" }));

app.post("/api/render", (req, res) => {
  if (job.status === "rendering") {
    return res.json({ ok: false, busy: true });
  }
  const { props, fileName } = req.body || {};
  if (!fileName || !String(fileName).trim()) {
    return res.json({ ok: false, error: "missing-filename" });
  }
  startRender(props || {}, fileName); // fire-and-forget; the UI polls /api/status
  res.json({ ok: true });
});

app.get("/api/status", (_req, res) => res.json(job));

app.post("/api/open-folder", (_req, res) => {
  openExternal(job.output ? path.dirname(job.output) : downloadsDir());
  res.json({ ok: true });
});

// Serve the UI: prebuilt static files when packaged, Vite from source in dev.
if (PACKAGED) {
  app.use(express.static(DIST));
  app.get(/.*/, (_req, res) => res.sendFile(path.join(DIST, "index.html")));
} else {
  const { createServer: createViteServer } = await import("vite");
  const { default: react } = await import("@vitejs/plugin-react");
  const vite = await createViteServer({
    configFile: false,
    root: FRONTEND_ROOT,
    publicDir: path.join(PROJECT_ROOT, "public"),
    plugins: [react()],
    // hmr off: end users don't edit code, and it avoids an extra websocket port.
    server: { middlewareMode: true, fs: { allow: [PROJECT_ROOT] }, hmr: false },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log("");
  console.log("  Fake Chat est prêt :  " + url);
  console.log("  (laissez cette fenêtre ouverte tant que vous l'utilisez)");
  console.log("");
  warmup().catch(() => {}); // pre-warm the renderer in the background
  if (!process.env.NO_OPEN) openExternal(url);
});
