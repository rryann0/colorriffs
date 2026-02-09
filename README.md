# Color Riffs

Audio spectrum visualizer using the **Canvas API** and **Web Audio API**. Analyzes real-time or file-based audio and renders dynamic visualizations: spectrum bars, particle systems, and fractal-style reactive patterns.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown (e.g. `http://localhost:5173`). Use **Choose file** to pick an audio file and **Play**, or **Mic** to use your microphone. Switch modes with **Spectrum**, **Particles**, and **Fractal**.

## Build

```bash
npm run build
```

Output is in `dist/`. Serve that folder with any static server (e.g. `npm run preview`).

## Project layout

- `src/audio.js` – AudioContext, AnalyserNode, file + mic source wiring
- `src/canvas.js` – Canvas setup, resize, single `requestAnimationFrame` loop
- `src/visualizers/` – One module per mode; each exports `draw(ctx, width, height, frequencyData, timeData)` and optionally `resize(width, height)`
- `src/main.js` – Wires audio, canvas, and UI

## Adding a new visualizer

1. Create `src/visualizers/yourmode.js` that exports an object with at least:
   - `draw(ctx, width, height, frequencyData, timeData)`
   - Optionally `resize(width, height)`
2. In `src/visualizers/index.js`, import it and add it to `registry`.
3. In `index.html`, add a mode button with `data-mode="yourmode"`.

The canvas loop will call your `draw` every frame with the latest frequency (and time-domain) data from the analyser.
