/**
 * main.cjs — Electron main process: wraps the Fake Chat UI in a native
 * desktop window (no browser).
 *
 * It reuses everything as-is: it launches the existing app server (Express +
 * Vite + the Remotion render API in ../server.mjs) as a child process, then
 * opens a BrowserWindow pointing at it. The window shows a small loading screen
 * until the server answers.
 */

const { app, BrowserWindow, Menu } = require("electron");
const { spawn } = require("node:child_process");
const net = require("node:net");
const path = require("node:path");

const PORT = 7777;
const APP_URL = `http://localhost:${PORT}`;
const SERVER = path.join(__dirname, "..", "server.mjs");

const LOADING_HTML =
  "data:text/html;charset=utf-8," +
  encodeURIComponent(
    `<body style="background:#0e0e10;color:#efeff1;margin:0;height:100vh;
      display:flex;align-items:center;justify-content:center;
      font-family:'Segoe UI',sans-serif;font-size:16px">
      <div>Démarrage de Fake Chat…</div></body>`,
  );

let serverProc = null;
let win = null;

/** Launch ../server.mjs using Electron's bundled Node (no system Node needed). */
function startServer() {
  serverProc = spawn(process.execPath, [SERVER], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NO_OPEN: "1",
      FAKECHAT_PACKAGED: app.isPackaged ? "1" : "",
    },
    stdio: "inherit",
  });
  serverProc.on("error", (e) => console.error("[server] spawn error:", e));
}

/** Resolve once the server is accepting connections on PORT. */
function waitForServer(done, tries = 0) {
  const socket = net.connect(PORT, "127.0.0.1");
  socket.once("connect", () => {
    socket.destroy();
    done();
  });
  socket.once("error", () => {
    socket.destroy();
    if (tries < 200) setTimeout(() => waitForServer(done, tries + 1), 150);
    else done(new Error("server did not start in time"));
  });
}

function createWindow() {
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
  waitForServer((err) => {
    if (!win || win.isDestroyed()) return;
    if (err) {
      console.error(err);
      return;
    }
    win.loadURL(APP_URL);
  });
}

// No application menu — this is a single-purpose app.
Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  startServer();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => app.quit());
app.on("quit", () => {
  if (serverProc) serverProc.kill();
});
