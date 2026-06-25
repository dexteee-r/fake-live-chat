/**
 * main.cjs — Electron main process: wraps the Fake Chat UI in a native window.
 *
 * The app server (Express + render API in ../server.mjs) runs IN THIS PROCESS —
 * no self-spawned child (which antivirus can block) and a free OS-assigned port.
 * If startup fails, the window shows the error and details are written to a log
 * file (so a problem on another machine is visible instead of a frozen screen).
 */

const { app, BrowserWindow, Menu } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { pathToFileURL } = require("node:url");

const SERVER = path.join(__dirname, "..", "server.mjs");

const LOADING_HTML =
  "data:text/html;charset=utf-8," +
  encodeURIComponent(
    `<body style="background:#0e0e10;color:#efeff1;margin:0;height:100vh;
      display:flex;align-items:center;justify-content:center;
      font-family:'Segoe UI',sans-serif;font-size:16px">
      <div>Démarrage de Fake Chat…</div></body>`,
  );

let win = null;

function logFile() {
  try {
    return path.join(app.getPath("userData"), "fake-chat.log");
  } catch {
    return path.join(os.tmpdir(), "fake-chat.log");
  }
}

function writeLog(msg) {
  try {
    fs.appendFileSync(logFile(), `[${new Date().toISOString()}] ${msg}\n`);
  } catch {
    /* ignore */
  }
}

function errorHtml(message) {
  return (
    "data:text/html;charset=utf-8," +
    encodeURIComponent(
      `<body style="background:#0e0e10;color:#efeff1;margin:0;height:100vh;
        font-family:'Segoe UI',sans-serif;padding:36px;line-height:1.5;box-sizing:border-box">
        <h2 style="color:#ff5252;margin-top:0">Fake Chat n'a pas pu démarrer</h2>
        <p>${message}</p>
        <p style="color:#adadb8;font-size:13px">Détails techniques enregistrés dans :<br>
        <code style="color:#efeff1">${logFile()}</code></p>
        <p style="color:#adadb8;font-size:13px">Réessayez de lancer l'application. Si le
        problème persiste, envoyez le fichier ci-dessus.</p>
      </body>`,
    )
  );
}

async function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 600,
    backgroundColor: "#0e0e10",
    title: "Fake Chat",
    icon: path.join(__dirname, "..", "..", "assets", "fake-chat.ico"),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      // Let the live preview play on its own (no user gesture needed).
      autoplayPolicy: "no-user-gesture-required",
    },
  });

  win.loadURL(LOADING_HTML);

  try {
    const server = await import(pathToFileURL(SERVER).href);
    const { port } = await server.startServer({ packaged: app.isPackaged });
    if (!win || win.isDestroyed()) return;
    win.loadURL(`http://localhost:${port}`);
  } catch (err) {
    const detail = String((err && err.stack) || err);
    writeLog("STARTUP ERROR: " + detail);
    if (win && !win.isDestroyed()) {
      win.loadURL(errorHtml((err && err.message) || "Erreur inconnue."));
    }
  }
}

process.on("uncaughtException", (e) =>
  writeLog("uncaughtException: " + String((e && e.stack) || e)),
);
process.on("unhandledRejection", (e) =>
  writeLog("unhandledRejection: " + String((e && e.stack) || e)),
);

// No application menu — this is a single-purpose app.
Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => app.quit());
