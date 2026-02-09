/**
 * Audio module: AudioContext, AnalyserNode, file + mic source wiring.
 * Exposes getFrequencyData(), getTimeDomainData(), FFT/smoothing setters, demo source.
 */

let FFT_SIZE = 512;
const SMOOTHING_DEFAULT = 0.7;
let SMOOTHING = 0.7;

let context = null;
let analyser = null;
let currentSource = null;
let currentSourceNode = null;
let mediaElementSource = null;
let mediaStream = null;
let frequencyData = null;
let timeData = null;
let demoOscillator = null;
let demoGain = null;

function getContext() {
  if (!context) {
    context = new (window.AudioContext || window.webkitAudioContext)();
    analyser = context.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = SMOOTHING;
    analyser.connect(context.destination);
    const binCount = analyser.frequencyBinCount;
    frequencyData = new Uint8Array(binCount);
    timeData = new Uint8Array(analyser.fftSize);
  }
  return context;
}

function rebuildAnalyserBuffers() {
  if (!analyser) return;
  analyser.fftSize = FFT_SIZE;
  analyser.smoothingTimeConstant = SMOOTHING;
  frequencyData = new Uint8Array(analyser.frequencyBinCount);
  timeData = new Uint8Array(analyser.fftSize);
}

function setFftSize(size) {
  const n = parseInt(size, 10);
  if (n === 256 || n === 512 || n === 1024) {
    FFT_SIZE = n;
    if (analyser) rebuildAnalyserBuffers();
  }
}

function setSmoothing(value) {
  SMOOTHING = Math.max(0, Math.min(1, value));
  if (analyser) analyser.smoothingTimeConstant = SMOOTHING;
}

function ensureResumed() {
  const ctx = getContext();
  if (ctx.state === 'suspended') {
    return ctx.resume();
  }
  return Promise.resolve();
}

function disconnectCurrentSource() {
  if (currentSource?.type === 'demo') {
    stopDemo();
    return;
  }
  if (currentSourceNode) {
    try {
      currentSourceNode.disconnect();
    } catch (_) {}
    currentSourceNode = null;
  }
  if (currentSource?.type === 'stream' && mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }
  currentSource = null;
}

/**
 * @param {HTMLAudioElement} audioEl
 */
function setFileSource(audioEl) {
  disconnectCurrentSource();
  const ctx = getContext();
  if (!mediaElementSource) {
    mediaElementSource = ctx.createMediaElementSource(audioEl);
  }
  mediaElementSource.connect(analyser);
  currentSourceNode = mediaElementSource;
  currentSource = { type: 'element', element: audioEl };
  return ensureResumed();
}

/**
 * Start microphone input.
 * @returns {Promise<void>}
 */
async function setMicSource() {
  disconnectCurrentSource();
  const ctx = getContext();
  await ensureResumed();
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = ctx.createMediaStreamSource(mediaStream);
  source.connect(analyser);
  currentSourceNode = source;
  currentSource = { type: 'stream' };
}

function stop() {
  stopDemo();
  disconnectCurrentSource();
}

function isDemoActive() {
  return currentSource != null && currentSource.type === 'demo';
}

function startDemo() {
  stop();
  const ctx = getContext();
  ensureResumed();
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  osc.frequency.setValueAtTime(440, ctx.currentTime + 0.5);
  osc.frequency.setValueAtTime(330, ctx.currentTime + 1);
  osc.frequency.setValueAtTime(220, ctx.currentTime + 1.5);
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
  osc.connect(gainNode);
  gainNode.connect(analyser);
  osc.start(ctx.currentTime);
  demoOscillator = osc;
  demoGain = gainNode;
  currentSourceNode = gainNode;
  currentSource = { type: 'demo' };
}

function stopDemo() {
  if (demoOscillator) {
    try {
      demoOscillator.stop();
      demoOscillator.disconnect();
    } catch (_) {}
    demoOscillator = null;
  }
  if (demoGain) {
    try { demoGain.disconnect(); } catch (_) {}
    demoGain = null;
  }
  if (currentSource?.type === 'demo') {
    currentSource = null;
    currentSourceNode = null;
  }
}

/**
 * Fill shared frequency array. Returns the same Uint8Array each time.
 * @returns {Uint8Array}
 */
function getFrequencyData() {
  if (!analyser) {
    if (!frequencyData) frequencyData = new Uint8Array(128);
    return frequencyData;
  }
  analyser.getByteFrequencyData(frequencyData);
  return frequencyData;
}

/**
 * Fill shared time-domain array. Returns the same Uint8Array each time.
 * @returns {Uint8Array}
 */
function getTimeDomainData() {
  if (!analyser) {
    if (!timeData) timeData = new Uint8Array(256);
    return timeData;
  }
  analyser.getByteTimeDomainData(timeData);
  return timeData;
}

/**
 * Whether we have an active source (file or mic).
 */
function isActive() {
  return currentSource != null;
}

export {
  getContext,
  ensureResumed,
  setFileSource,
  setMicSource,
  stop,
  getFrequencyData,
  getTimeDomainData,
  isActive,
  isDemoActive,
  setFftSize,
  setSmoothing,
  startDemo,
  stopDemo,
  FFT_SIZE,
};
