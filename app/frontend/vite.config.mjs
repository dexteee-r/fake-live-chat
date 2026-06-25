import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

// Build config for the packaged app: compiles the React UI to static files in
// frontend/dist, served as-is by the server (no Vite at runtime).
export default defineConfig({
  root: here,
  plugins: [react()],
  publicDir: path.resolve(here, "..", "..", "public"),
  build: { outDir: "dist", emptyOutDir: true },
});
