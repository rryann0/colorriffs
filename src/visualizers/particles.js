/**
 * Particle system: trails, beat reaction, mesh connections, richer audio mapping.
 * Uses spatial grid for neighbor lookups.
 */

const PARTICLE_COUNT = 280;
const MAX_SPEED = 2.5;
const TRAIL_ALPHA = 0.12;
const CONNECTION_RADIUS = 90;
const CONNECTION_MIN_LEVEL = 0.15;
const CELL_SIZE = 50;
const BEAT_THRESHOLD = 0.12;
const BEAT_DECAY = 0.92;
const SMOOTHING = 0.85;

let particles = [];
let w = 0;
let h = 0;
let prevEnergy = 0;
let smoothedEnergy = 0;
let beatImpulse = 0;
let grid = new Map();

function getCellKey(cx, cy) {
  return `${cx}|${cy}`;
}

function updateGrid(width, height) {
  grid.clear();
  for (const p of particles) {
    const cx = Math.floor(p.x / CELL_SIZE);
    const cy = Math.floor(p.y / CELL_SIZE);
    const key = getCellKey(cx, cy);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(p);
  }
}

function getNeighbors(p, width, height) {
  const cx = Math.floor(p.x / CELL_SIZE);
  const cy = Math.floor(p.y / CELL_SIZE);
  const out = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const list = grid.get(getCellKey(cx + dx, cy + dy));
      if (list) {
        for (const other of list) {
          if (other === p) continue;
          const dist = Math.hypot(p.x - other.x, p.y - other.y);
          if (dist < CONNECTION_RADIUS) out.push({ p: other, dist });
        }
      }
    }
  }
  return out;
}

function resize(width, height) {
  w = width;
  h = height;
  if (particles.length === 0) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        baseSize: 0.5 + Math.random() * 1.5,
        hue: Math.random() * 360,
      });
    }
  } else {
    for (const p of particles) {
      p.x = Math.min(p.x, width - 1);
      p.y = Math.min(p.y, height - 1);
    }
  }
}

function draw(ctx, width, height, frequencyData, timeData, options) {
  const opts = options || {};
  const gain = opts.gain !== undefined && opts.gain !== null ? opts.gain : 1;
  const theme = opts.theme || {};
  const sat = theme.sat !== undefined ? theme.sat : 75;
  const hueShift = theme.hueShift || 0;
  const len = frequencyData.length;
  const tLen = (timeData && timeData.length) ? timeData.length : 0;

  const sum = len > 0 ? frequencyData.reduce((a, b) => a + b, 0) : 0;
  const energy = (sum / (len * 255)) * gain;
  smoothedEnergy = SMOOTHING * smoothedEnergy + (1 - SMOOTHING) * energy;
  const delta = smoothedEnergy - prevEnergy;
  prevEnergy = smoothedEnergy;
  if (delta > BEAT_THRESHOLD) {
    beatImpulse = Math.min(1, delta * 3);
  }
  beatImpulse *= BEAT_DECAY;

  const low = len > 8
    ? (frequencyData.slice(0, Math.floor(len / 8)).reduce((a, b) => a + b, 0) / Math.floor(len / 8) / 255 * gain)
    : 0;
  const mid = len > 4
    ? (frequencyData.slice(Math.floor(len / 4), Math.floor(len / 2)).reduce((a, b) => a + b, 0) / (Math.floor(len / 2) - Math.floor(len / 4)) / 255 * gain)
    : 0;
  const high = len > 2
    ? (frequencyData.slice(Math.floor(len / 2)).reduce((a, b) => a + b, 0) / Math.ceil(len / 2) / 255 * gain)
    : 0;

  const wavePulse = tLen > 0
    ? Math.abs((timeData.reduce((a, b) => a + (b - 128), 0) / tLen) / 128)
    : 0;

  const centerX = width / 2;
  const centerY = height / 2;

  ctx.fillStyle = `rgba(10, 10, 15, ${TRAIL_ALPHA})`;
  ctx.fillRect(0, 0, width, height);

  const force = 0.5 + smoothedEnergy * 1.5;
  const spread = 0.3 + mid * 0.4;
  const orbitStrength = low * 0.015;
  const horizontalSway = mid * 0.8;
  const jitter = high * 2.5;
  const burst = beatImpulse * 12;

  for (const p of particles) {
    const bin = Math.min(Math.floor((p.x / width) * len), len - 1);
    const pull = (frequencyData[bin] / 255) * gain * force;

    const dx = p.x - centerX;
    const dy = p.y - centerY;
    const dist = Math.hypot(dx, dy) || 0.001;
    const tangentX = -dy / dist;
    const tangentY = dx / dist;
    p.vx += tangentX * orbitStrength * (1 + low);
    p.vy += tangentY * orbitStrength * (1 + low);

    p.vx += (width / 2 - p.x) * 0.0002 * pull;
    p.vy += (height / 2 - p.y) * 0.0002 * pull;

    p.vx += (Math.random() - 0.5) * spread + (Math.random() - 0.5) * jitter;
    p.vy += (Math.random() - 0.5) * spread + (Math.random() - 0.5) * jitter;

    p.vx += horizontalSway * Math.sin(p.y * 0.02) * 0.05;
    p.vy += horizontalSway * Math.cos(p.x * 0.02) * 0.05;

    if (burst > 0.1) {
      const bx = dx / dist;
      const by = dy / dist;
      p.vx += bx * burst;
      p.vy += by * burst;
    }

    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (speed > MAX_SPEED) {
      p.vx = (p.vx / speed) * MAX_SPEED;
      p.vy = (p.vy / speed) * MAX_SPEED;
    }
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > width) p.vx *= -0.8;
    if (p.y < 0 || p.y > height) p.vy *= -0.8;
    p.x = Math.max(0, Math.min(width, p.x));
    p.y = Math.max(0, Math.min(height, p.y));
  }

  updateGrid(width, height);

  const avg = smoothedEnergy;
  for (const p of particles) {
    const bin = Math.min(Math.floor((p.x / width) * len), len - 1);
    const level = (frequencyData[bin] / 255) * gain;
    const size = p.baseSize * (0.8 + (level + wavePulse) * 0.6);
    const alpha = 0.4 + level * 0.5 + wavePulse * 0.2;
    const hue = (p.hue + avg * 60 + hueShift) % 360;
    ctx.fillStyle = `hsla(${hue}, ${sat}%, 65%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  if (!opts.performanceMode && avg > CONNECTION_MIN_LEVEL) {
    const connHue = (200 + hueShift) % 360;
    ctx.strokeStyle = `hsla(${connHue}, ${sat}%, 65%, ${0.15 + avg * 0.25})`;
    ctx.lineWidth = 0.8;
    const drawn = new Set();
    for (const p of particles) {
      const neighbors = getNeighbors(p, width, height);
      for (let i = 0; i < neighbors.length; i++) {
        const neighbor = neighbors[i].p;
        const dist = neighbors[i].dist;
        const id1 = particles.indexOf(p);
        const id2 = particles.indexOf(neighbor);
        const edgeKey = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
        if (drawn.has(edgeKey)) continue;
        drawn.add(edgeKey);
        const alpha = (1 - dist / CONNECTION_RADIUS) * avg * 0.5;
        ctx.strokeStyle = `hsla(${connHue}, ${sat}%, 65%, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(neighbor.x, neighbor.y);
        ctx.stroke();
      }
    }
  }
}

export default { draw, resize };
