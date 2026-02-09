/**
 * Canvas setup, resize, single RAF loop. Passes frequency/time data and options to active visualizer.
 */

import * as audio from './audio.js';
import * as state from './state.js';

let canvas = null;
let ctx = null;
let activeDraw = null;
let rafId = null;
let width = 0;
let height = 0;
let dpr = 1;

function getCanvas() {
  return canvas;
}

function init(canvasEl) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}

function resize() {
  if (!canvas) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  if (ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }
  if (activeDraw?.resize) activeDraw.resize(width, height);
}

let fadeFrames = 0;
const FADE_FRAME_COUNT = 2;

function setVisualizer(drawFn) {
  const w = width || window.innerWidth;
  const h = height || window.innerHeight;
  activeDraw = drawFn;
  fadeFrames = FADE_FRAME_COUNT;
  if (activeDraw?.resize && w > 0 && h > 0) {
    try {
      activeDraw.resize(w, h);
    } catch (_) {}
  }
}

function drawIdle(ctx, w, h) {
  const t = Date.now() * 0.001;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, `hsla(260, 30%, 8%, 1)`);
  g.addColorStop(0.5, `hsla(260, 25%, 12%, 1)`);
  g.addColorStop(1, `hsla(260, 30%, 8%, 1)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let i = 0; i < 3; i++) {
    const y = h / 2 + Math.sin(t + i * 2) * 20;
    ctx.fillRect(0, y, w, 2);
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '1rem system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Choose a file or turn on Mic', w / 2, h / 2);
}

function loop() {
  if (!ctx || !canvas) return;
  const w = width || canvas.width / dpr;
  const h = height || canvas.height / dpr;
  const options = state.getOptions();

  if (!audio.isActive()) {
    drawIdle(ctx, w, h);
    rafId = requestAnimationFrame(loop);
    return;
  }

  const freq = audio.getFrequencyData();
  const time = audio.getTimeDomainData();

  if (fadeFrames > 0) {
    ctx.fillStyle = 'rgba(10, 10, 15, 0.5)';
    ctx.fillRect(0, 0, w, h);
    fadeFrames--;
  }

  if (activeDraw?.draw) {
    try {
      activeDraw.draw(ctx, w, h, freq, time, options);
    } catch (err) {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, w, h);
    }
  } else {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, w, h);
  }

  rafId = requestAnimationFrame(loop);
}

function start() {
  if (rafId) return;
  rafId = requestAnimationFrame(loop);
}

function stop() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

export { init, getCanvas, resize, setVisualizer, start, stop };
