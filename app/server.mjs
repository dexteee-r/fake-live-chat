/**
 * server.mjs — The Fake Chat app server (UI + render API).
 *
 * Exposes `startServer({ packaged })` which builds the Express app, listens on a
 * free port, and returns that port. It runs IN-PROCESS:
 *   - inside the Electron main process (packaged GUI), or
 *   - standalone via `node app/server.mjs` (dev, opens the browser).
 *
 * Running in-process (rather than spawning a child) avoids antivirus blocking a
 * self-spawned process, and a free OS-assigned port avoids "port already in use".
 *
 *   - DEV: Vite serves the React UI from source (middleware, no build step).
 *   - PACKAGED: the prebuilt static UI in frontend/dist is served directly.
 */

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { exec } from "node:child_process";
import express from "express";
import { renderVideo, warmup, downloadsDir } from "./render-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const FRONTEND_ROOT = path.join(__dirname, "frontend");
const DIST = path.join(FRONTEND_ROOT, "dist");

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

/**
 * Build and start the server. Returns the chosen port.
 * @param {{packaged?: boolean}} opts
 * @returns {Promise<{port: number}>}
 */
export async function startServer({ packaged = false } = {}) {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  app.post("/api/render", (req, res) => {
    if (job.status === "rendering") return res.json({ ok: false, busy: true });
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

  if (packaged) {
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
      server: { middlewareMode: true, fs: { allow: [PROJECT_ROOT] }, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  // Port 0 → the OS hands us a free port (no "address in use" failures).
  const port = await new Promise((resolve, reject) => {
    const srv = app.listen(0, "127.0.0.1", () => resolve(srv.address().port));
    srv.on("error", reject);
  });

  warmup().catch(() => {}); // pre-warm the renderer in the background
  return { port };
}

/* --- Standalone run: `node app/server.mjs` (dev) opens the browser. --- */
const invokedDirectly =
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (invokedDirectly) {
  startServer({ packaged: !!process.env.FAKECHAT_PACKAGED })
    .then(({ port }) => {
      const url = `http://localhost:${port}`;
      console.log("\n  Fake Chat est prêt :  " + url);
      console.log("  (laissez cette fenêtre ouverte tant que vous l'utilisez)\n");
      if (!process.env.NO_OPEN) openExternal(url);
    })
    .catch((err) => {
      console.error("Échec du démarrage du serveur :", err);
      process.exit(1);
    });
}
