/**
 * App.tsx — The friendly Fake Chat UI.
 *
 * Left: plain-French settings. Right: a live @remotion/player preview of the
 * exact same composition that will be exported. Bottom: the "Générer la vidéo"
 * button, which asks the server to render the transparent ProRes 4444 file.
 */

import React, { useMemo, useState } from "react";
import { Player } from "@remotion/player";
import { ChatOverlay } from "../../src/ChatOverlay";
import { DEFAULT_PROPS, type ChatProps } from "../../src/config";

/* ------------------------------------------------------------------ */
/* Small reusable controls                                             */
/* ------------------------------------------------------------------ */

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display?: string;
  help?: string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step, display, help, onChange }) => (
  <div className="field">
    <label>
      {label} <span className="value">{display ?? value}</span>
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
    {help && <div className="help">{help}</div>}
  </div>
);

const Toggle: React.FC<{
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <label className="toggle">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    {label}
  </label>
);

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

type Job = {
  status: "idle" | "rendering" | "done" | "error";
  progress: number;
  error: string | null;
  output: string | null;
};

export const App: React.FC = () => {
  const [props, setProps] = useState<ChatProps>(DEFAULT_PROPS);
  const [job, setJob] = useState<Job>({
    status: "idle",
    progress: 0,
    error: null,
    output: null,
  });
  const [fileName, setFileName] = useState("");

  const set = <K extends keyof ChatProps>(key: K, v: ChatProps[K]) =>
    setProps((p) => ({ ...p, [key]: v }));

  const durationInFrames = useMemo(
    () => Math.max(1, Math.round(props.durationInSeconds * props.fps)),
    [props.durationInSeconds, props.fps],
  );

  // The chat builds up from empty, so frame 0 shows nothing. Open the preview a
  // few seconds in, on an already-populated frame — even if autoplay is blocked,
  // there's something to see. (The exported video still starts from 0.)
  const previewInitialFrame = useMemo(
    () => Math.min(durationInFrames - 1, Math.round(props.fps * 3)),
    [durationInFrames, props.fps],
  );

  const rendering = job.status === "rendering";
  const canGenerate = !rendering && fileName.trim().length > 0;

  const generate = async () => {
    if (!canGenerate) return;
    const res = await fetch("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ props, fileName }),
    });
    const data = await res.json();
    if (data.busy) return;
    setJob({ status: "rendering", progress: 0, error: null, output: null });

    const tick = async () => {
      const r = await fetch("/api/status");
      const j: Job = await r.json();
      setJob(j);
      if (j.status === "rendering") setTimeout(tick, 500);
    };
    tick();
  };

  const openFolder = () =>
    fetch("/api/open-folder", { method: "POST" }).catch(() => {});

  const resolution = `${props.width}x${props.height}`;

  return (
    <div className="app">
      <div className="header">
        <h1>Fake Chat</h1>
        <span className="sub">
          générateur de faux chat Twitch → vidéo transparente pour Premiere
        </span>
      </div>

      <div className="main">
        {/* ---------------- Settings ---------------- */}
        <div className="settings">
          <div className="field">
            <label>
              Nom du fichier <span className="req">(obligatoire)</span>
            </label>
            <input
              type="text"
              placeholder="ex : mon-chat"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
            <div className="help">
              Enregistré dans Téléchargements sous ce nom (<code>.mov</code>).
            </div>
          </div>

          <div className="field">
            <label>Durée (secondes)</label>
            <input
              type="number"
              min={1}
              max={600}
              value={props.durationInSeconds}
              onChange={(e) =>
                set("durationInSeconds", Math.max(1, Number(e.target.value)))
              }
            />
          </div>

          <Slider
            label="Vitesse du chat"
            value={props.rate}
            min={0.3}
            max={12}
            step={0.1}
            display={`${props.rate.toFixed(1)} msg/s`}
            help="Nombre moyen de messages par seconde."
            onChange={(v) => set("rate", v)}
          />

          <Slider
            label="Taille du texte"
            value={props.fontScale}
            min={0.8}
            max={5}
            step={0.1}
            display={`${props.fontScale.toFixed(1)}×`}
            help="2.2× est lisible en plein écran 1080p."
            onChange={(v) => set("fontScale", v)}
          />

          <div className="field">
            <label>Tes messages</label>
            <textarea
              value={props.messagePool}
              onChange={(e) => set("messagePool", e.target.value)}
            />
            <div className="help">
              Un message par ligne. Ajoute «&nbsp;x3&nbsp;» à la fin pour qu'il
              revienne plus souvent (ex.&nbsp;: <code>GG x5</code>).
            </div>
          </div>

          <div className="field">
            <label>Variante</label>
            <div className="row">
              <input
                type="number"
                value={props.seed}
                onChange={(e) => set("seed", Math.round(Number(e.target.value)))}
              />
              <button
                className="btn btn-dice"
                type="button"
                onClick={() => set("seed", Math.floor(Math.random() * 100000))}
              >
                🎲 Nouveau
              </button>
            </div>
            <div className="help">
              Même variante = exactement le même chat (reproductible).
            </div>
          </div>

          <Toggle
            label="Contour du texte (lisible sur tout fond)"
            checked={props.textOutline}
            onChange={(v) => set("textOutline", v)}
          />
          <Toggle
            label="Animation d'apparition"
            checked={props.entranceAnimation}
            onChange={(v) => set("entranceAnimation", v)}
          />
          <Toggle
            label="Afficher l'heure"
            checked={props.showTimestamps}
            onChange={(v) => set("showTimestamps", v)}
          />

          <details className="advanced">
            <summary>Réglages avancés</summary>

            <div className="field">
              <label>Images par seconde (fps)</label>
              <select
                value={props.fps}
                onChange={(e) => set("fps", Number(e.target.value))}
              >
                <option value={30}>30 fps</option>
                <option value={60}>60 fps</option>
              </select>
            </div>

            <div className="field">
              <label>Résolution</label>
              <select
                value={resolution}
                onChange={(e) => {
                  const [w, h] = e.target.value.split("x").map(Number);
                  setProps((p) => ({ ...p, width: w, height: h }));
                }}
              >
                <option value="1920x1080">1920 × 1080 (Full HD)</option>
                <option value="1280x720">1280 × 720 (HD)</option>
                <option value="2560x1440">2560 × 1440 (2K)</option>
              </select>
            </div>

            <Slider
              label="Irrégularité du débit"
              value={props.rateJitter}
              min={0}
              max={1}
              step={0.05}
              display={`${Math.round(props.rateJitter * 100)}%`}
              onChange={(v) => set("rateJitter", v)}
            />
            <Slider
              label="Fréquence des badges"
              value={props.badgeChance}
              min={0}
              max={1}
              step={0.05}
              display={`${Math.round(props.badgeChance * 100)}%`}
              onChange={(v) => set("badgeChance", v)}
            />
            <Slider
              label="Fréquence des vagues de spam"
              value={props.spamWaveChance}
              min={0}
              max={1}
              step={0.02}
              display={`${Math.round(props.spamWaveChance * 100)}%`}
              onChange={(v) => set("spamWaveChance", v)}
            />
            <Slider
              label="Vitesse de défilement"
              value={props.scrollSpeedMs}
              min={0}
              max={600}
              step={10}
              display={`${props.scrollSpeedMs} ms`}
              onChange={(v) => set("scrollSpeedMs", v)}
            />
            <div className="field">
              <label>Lignes max à l'écran</label>
              <input
                type="number"
                min={1}
                max={200}
                value={props.maxVisibleMessages}
                onChange={(e) =>
                  set(
                    "maxVisibleMessages",
                    Math.max(1, Math.round(Number(e.target.value))),
                  )
                }
              />
            </div>
          </details>
        </div>

        {/* ---------------- Preview ---------------- */}
        <div className="preview">
          <div className="preview-stage">
            <Player
              component={ChatOverlay}
              inputProps={props}
              durationInFrames={durationInFrames}
              fps={props.fps}
              compositionWidth={props.width}
              compositionHeight={props.height}
              initialFrame={previewInitialFrame}
              style={{ width: "100%", height: "100%" }}
              controls
              loop
              autoPlay
              acknowledgeRemotionLicense
            />
          </div>
          <div className="preview-note">
            Le damier représente la transparence — il n'apparaîtra pas dans la
            vidéo exportée.
          </div>
        </div>
      </div>

      {/* ---------------- Action bar ---------------- */}
      <div className="actions">
        <button
          className="btn-generate"
          onClick={generate}
          disabled={!canGenerate}
        >
          {rendering ? "Génération…" : "Générer la vidéo"}
        </button>

        <div
          className={
            "status" +
            (job.status === "done" ? " ok" : job.status === "error" ? " err" : "")
          }
        >
          {job.status === "idle" && (
            <span>
              {fileName.trim()
                ? "Règle ton chat, puis clique « Générer la vidéo »."
                : "Donne un nom au fichier pour pouvoir générer."}
            </span>
          )}
          {job.status === "rendering" && (
            <>
              <span>Rendu en cours… {Math.round(job.progress * 100)}%</span>
              <div className="progress">
                <div style={{ width: `${Math.round(job.progress * 100)}%` }} />
              </div>
            </>
          )}
          {job.status === "done" && (
            <span>
              ✅ Vidéo prête dans Téléchargements :{" "}
              <code>
                {job.output ? job.output.split(/[\\/]/).pop() : "fake-chat.mov"}
              </code>{" "}
              <button className="link-btn" onClick={openFolder}>
                Ouvrir le dossier
              </button>
            </span>
          )}
          {job.status === "error" && (
            <span>❌ Erreur pendant le rendu : {job.error}</span>
          )}
        </div>
      </div>
    </div>
  );
};
