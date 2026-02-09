/**
 * Entry: init audio, canvas, UI (file/mic, mode buttons), and wire everything together.
 */

import * as audio from './audio.js';
import * as canvas from './canvas.js';
import * as state from './state.js';
import { getVisualizer, getModeList } from './visualizers/index.js';

const canvasEl = document.getElementById('canvas');
const fileInput = document.getElementById('file-input');
const micBtn = document.getElementById('mic-btn');
const playPauseBtn = document.getElementById('play-pause');
const audioEl = document.getElementById('audio-el');
const playbarWrap = document.getElementById('playbar-wrap');
const playbar = document.getElementById('playbar');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');
const sensitivityEl = document.getElementById('sensitivity');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const captureBtn = document.getElementById('capture-btn');
const themeSelect = document.getElementById('theme-select-main');

function setMode(mode) {
  const list = getModeList();
  if (!list.includes(mode)) return;
  canvas.setVisualizer(getVisualizer(mode));
  document.querySelectorAll('.btn-mode').forEach((b) => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  if (typeof history !== 'undefined' && history.replaceState) {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', mode);
    history.replaceState(null, '', url.toString());
  }
}

function updateUrlSensitivity(value) {
  if (typeof history !== 'undefined' && history.replaceState) {
    const url = new URL(window.location.href);
    url.searchParams.set('sensitivity', String(value));
    history.replaceState(null, '', url.toString());
  }
}

canvas.init(canvasEl);

const params = new URLSearchParams(window.location.search);
const initialMode = params.get('mode');
const initialSensitivity = params.get('sensitivity');
if (initialMode && getModeList().includes(initialMode)) {
  canvas.setVisualizer(getVisualizer(initialMode));
  document.querySelectorAll('.btn-mode').forEach((b) => {
    b.classList.toggle('active', b.dataset.mode === initialMode);
  });
} else {
  canvas.setVisualizer(getVisualizer('spectrum'));
}
if (initialSensitivity !== null) {
  const v = parseFloat(initialSensitivity);
  if (!isNaN(v) && v >= 0.1 && v <= 3) {
    state.setGain(v);
    if (sensitivityEl) sensitivityEl.value = v;
  }
}
const initialTheme = params.get('theme');
if (initialTheme === 'neon' || initialTheme === 'monochrome' || initialTheme === 'default') {
  state.setTheme(initialTheme);
  if (themeSelect) themeSelect.value = initialTheme;
}

if (sensitivityEl) {
  sensitivityEl.addEventListener('input', () => {
    const v = parseFloat(sensitivityEl.value);
    state.setGain(v);
    updateUrlSensitivity(v);
  });
}

canvas.start();

document.querySelectorAll('.btn-mode').forEach((btn) => {
  btn.addEventListener('click', () => {
    setMode(btn.dataset.mode);
  });
});

if (fullscreenBtn) {
  fullscreenBtn.addEventListener('click', () => {
    const el = canvas.getCanvas();
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  });
  document.addEventListener('fullscreenchange', () => {
    fullscreenBtn.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
  });
}

if (captureBtn) {
  captureBtn.addEventListener('click', () => {
    canvas.getCanvas().toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `colorriffs-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, 'image/png');
  });
}

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === ' ') {
    if (audioEl.src && playPauseBtn && !playPauseBtn.disabled) {
      e.preventDefault();
      playPauseBtn.click();
    }
    return;
  }
  if (e.key === 'f' || e.key === 'F') {
    if (document.fullscreenElement) document.exitFullscreen();
    else canvas.getCanvas().requestFullscreen().catch(() => {});
    return;
  }
  if (e.key === 'm' || e.key === 'M') {
    e.preventDefault();
    if (micBtn) micBtn.click();
    return;
  }
  const modeIndex = e.key === '1' ? 0 : e.key === '2' ? 1 : e.key === '3' ? 2 : e.key === '4' ? 3 : e.key === '5' ? 4 : -1;
  if (modeIndex >= 0) {
    const modes = getModeList();
    if (modeIndex < modes.length) {
      e.preventDefault();
      setMode(modes[modeIndex]);
    }
  }
});

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function updatePlaybar() {
  const duration = audioEl.duration;
  const current = audioEl.currentTime;
  if (!Number.isFinite(duration) || duration <= 0) {
    playbar.max = 100;
    playbar.value = 0;
    timeCurrent.textContent = '0:00';
    timeTotal.textContent = '0:00';
    return;
  }
  timeTotal.textContent = formatTime(duration);
  timeCurrent.textContent = formatTime(current);
  playbar.max = duration;
  playbar.value = current;
}

let isSeeking = false;
playbar.addEventListener('input', () => {
  isSeeking = true;
  const t = parseFloat(playbar.value);
  audioEl.currentTime = t;
  timeCurrent.textContent = formatTime(t);
  audio.ensureResumed(); // keep context alive when seeking
});
playbar.addEventListener('change', () => {
  isSeeking = false;
});
audioEl.addEventListener('timeupdate', () => {
  if (isSeeking) return;
  const duration = audioEl.duration;
  if (!Number.isFinite(duration)) return;
  playbar.value = audioEl.currentTime;
  timeCurrent.textContent = formatTime(audioEl.currentTime);
});
audioEl.addEventListener('loadedmetadata', () => {
  updatePlaybar();
});
audioEl.addEventListener('durationchange', () => {
  updatePlaybar();
});

// File input
let currentObjectUrl = null;
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
  currentObjectUrl = URL.createObjectURL(file);
  audioEl.src = currentObjectUrl;
  await audio.ensureResumed();
  audio.setFileSource(audioEl);
  playPauseBtn.disabled = false;
  playPauseBtn.textContent = 'Play';
  playbarWrap.hidden = false;
  playbar.max = 100;
  playbar.value = 0;
  timeCurrent.textContent = '0:00';
  timeTotal.textContent = '0:00';
});

// Play / Pause (for file source) — keep context resumed to avoid cut-off
playPauseBtn.addEventListener('click', async () => {
  await audio.ensureResumed();
  if (audioEl.paused) {
    audioEl.play();
    playPauseBtn.textContent = 'Pause';
  } else {
    audioEl.pause();
    playPauseBtn.textContent = 'Play';
  }
});

// Mic toggle — hide playbar when using mic
let micActive = false;
micBtn.addEventListener('click', async () => {
  if (micActive) {
    audio.stop();
    micActive = false;
    micBtn.classList.remove('active');
    micBtn.textContent = 'Mic';
    if (audioEl.src) playbarWrap.hidden = false;
    return;
  }
  try {
    await audio.setMicSource();
    micActive = true;
    micBtn.classList.add('active');
    micBtn.textContent = 'Mic off';
    playbarWrap.hidden = true;
  } catch (err) {
    console.error('Mic access failed:', err);
  }
});

audioEl.addEventListener('ended', () => {
  playPauseBtn.textContent = 'Play';
  updatePlaybar();
});

const advancedToggle = document.getElementById('advanced-toggle');
const advancedDropdown = document.getElementById('advanced-wrap');
const advancedPanel = document.getElementById('advanced-panel');
if (advancedToggle && advancedDropdown && advancedPanel) {
  advancedToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = advancedDropdown.classList.toggle('is-open');
    advancedToggle.setAttribute('aria-expanded', isOpen);
  });
  advancedPanel.addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('click', () => {
    if (advancedDropdown.classList.contains('is-open')) {
      advancedDropdown.classList.remove('is-open');
      advancedToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

const fftSelect = document.getElementById('fft-size');
if (fftSelect) {
  fftSelect.addEventListener('change', () => {
    audio.setFftSize(fftSelect.value);
  });
}

const smoothingEl = document.getElementById('smoothing');
if (smoothingEl) {
  smoothingEl.addEventListener('input', () => {
    audio.setSmoothing(parseFloat(smoothingEl.value));
  });
}

if (themeSelect) {
  themeSelect.addEventListener('change', () => {
    state.setTheme(themeSelect.value);
    if (typeof history !== 'undefined' && history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.set('theme', themeSelect.value);
      history.replaceState(null, '', url.toString());
    }
  });
}

const perfToggle = document.getElementById('perf-toggle');
if (perfToggle) {
  perfToggle.addEventListener('change', () => {
    state.setPerformanceMode(perfToggle.checked);
  });
}

const demoBtn = document.getElementById('demo-btn');
if (demoBtn) {
  demoBtn.addEventListener('click', () => {
    if (audio.isDemoActive()) {
      audio.stopDemo();
      demoBtn.textContent = 'Demo';
    } else {
      audio.startDemo();
      demoBtn.textContent = 'Stop demo';
    }
  });
}
