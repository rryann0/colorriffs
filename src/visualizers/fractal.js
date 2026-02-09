/**
 * Fractal: tree with persistence, phase, spectrum-driven depth; optional kaleidoscope style.
 */

const PERSIST_ALPHA = 0.08;
const PHASE_SPEED = 0.02;
let phase = 0;

function getLevels(frequencyData) {
  const len = frequencyData.length;
  const low = len > 8
    ? frequencyData.slice(0, Math.floor(len / 8)).reduce((a, b) => a + b, 0) / Math.floor(len / 8) / 255
    : 0.2;
  const mid = len > 4
    ? frequencyData.slice(Math.floor(len / 4), Math.floor(len / 2)).reduce((a, b) => a + b, 0) / (Math.floor(len / 2) - Math.floor(len / 4)) / 255
    : 0.2;
  const high = len > 2
    ? frequencyData.slice(Math.floor(len / 2)).reduce((a, b) => a + b, 0) / Math.ceil(len / 2) / 255
    : 0.2;
  return { low, mid, high };
}

function getBandForDepth(depth, maxDepth, levels) {
  const t = depth / maxDepth;
  if (t < 0.33) return levels.low;
  if (t < 0.66) return levels.mid;
  return levels.high;
}

function drawBranch(ctx, x, y, angle, length, depth, maxDepth, levels, options) {
  if (depth >= maxDepth || length < 1) return;
  const opts = options || {};
  const theme = opts.theme || {};
  const sat = theme.sat !== undefined ? theme.sat : 70;
  const hueShift = theme.hueShift || 0;
  const band = getBandForDepth(depth, maxDepth, levels);
  const angleSpread = 0.4 + levels.mid * 0.5 + Math.sin(phase + depth * 0.5) * 0.15;
  const lengthScale = 0.6 + band * 0.35 + Math.cos(phase * 0.7) * 0.05;
  const nextLen = length * lengthScale;
  const endX = x + Math.cos(angle) * length;
  const endY = y + Math.sin(angle) * length;

  const hue = (depth * 25 + levels.high * 120 + phase * 20 + hueShift) % 360;
  const alpha = 0.5 + (depth / maxDepth) * 0.4;
  const lineWidth = (maxDepth - depth) * 0.8 + 1;
  ctx.strokeStyle = `hsla(${hue}, ${sat}%, 60%, ${alpha})`;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  const branches = 2;
  for (let i = 0; i < branches; i++) {
    const spread = (i - 0.5) * 2 * angleSpread;
    drawBranch(ctx, endX, endY, angle + spread, nextLen, depth + 1, maxDepth, levels, options);
  }
}

function drawTree(ctx, width, height, frequencyData, options = {}) {
  phase += PHASE_SPEED;
  const gain = options.gain ?? 1;
  const levels = getLevels(frequencyData);
  levels.low = Math.min(1, levels.low * gain);
  levels.mid = Math.min(1, levels.mid * gain);
  levels.high = Math.min(1, levels.high * gain);

  ctx.fillStyle = `rgba(10, 10, 15, ${PERSIST_ALPHA})`;
  ctx.fillRect(0, 0, width, height);

  const maxDepth = (options.performanceMode ? 4 : 6);
  const baseLength = Math.min(width, height) * 0.12 * (0.8 + levels.low * 0.4 + Math.sin(phase) * 0.1);
  const baseAngle = -Math.PI / 2 + (levels.mid - 0.5) * 0.5 + Math.cos(phase * 0.5) * 0.2;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cx = width / 2;
  const baseY = height * 0.75;
  const opts = options || {};
  drawBranch(ctx, cx - width * 0.2, baseY, baseAngle, baseLength * 0.9, 0, maxDepth, levels, opts);
  drawBranch(ctx, cx, baseY, baseAngle, baseLength, 0, maxDepth, levels, opts);
  drawBranch(ctx, cx + width * 0.2, baseY, baseAngle, baseLength * 0.9, 0, maxDepth, levels, opts);
}

function drawKaleidoscope(ctx, width, height, frequencyData, options = {}) {
  phase += PHASE_SPEED;
  const gain = options.gain ?? 1;
  const levels = getLevels(frequencyData);
  levels.low = Math.min(1, levels.low * gain);
  levels.mid = Math.min(1, levels.mid * gain);
  levels.high = Math.min(1, levels.high * gain);

  ctx.fillStyle = `rgba(10, 10, 15, ${PERSIST_ALPHA})`;
  ctx.fillRect(0, 0, width, height);

  const segments = 6;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.35 * (0.85 + levels.low * 0.2 + Math.sin(phase) * 0.05);
  const rotAngle = (levels.mid - 0.5) * 0.5 + phase * 0.3;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2 + rotAngle;
    const a1 = ((i + 1) / segments) * Math.PI * 2 + rotAngle;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a0);
    ctx.scale(1, (i % 2 === 0) ? 1 : -1);
    const branchLen = radius * (0.4 + levels.high * 0.4 + Math.cos(phase + i) * 0.1);
    const theme = options.theme || {};
    const sat = theme.sat !== undefined ? theme.sat : 70;
    const hueShift = theme.hueShift || 0;
    const hue = (i * 60 + levels.high * 120 + phase * 30 + hueShift) % 360;
    ctx.strokeStyle = `hsla(${hue}, ${sat}%, 60%, 0.75)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let d = 0; d < 4; d++) {
      const t = (d + 1) / 4;
      const len = branchLen * t * (0.6 + levels.low * 0.3);
      const angle = (levels.mid - 0.5) * 1.2 + Math.sin(phase + d) * 0.3;
      const x = Math.sin(angle) * len;
      const y = -Math.cos(angle) * len;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

function draw(ctx, width, height, frequencyData, timeData, options = {}) {
  drawTree(ctx, width, height, frequencyData, options);
}

const kaleidoscope = {
  draw(ctx, width, height, frequencyData, timeData, options = {}) {
    drawKaleidoscope(ctx, width, height, frequencyData, options);
  },
};

export default { draw, kaleidoscope };
