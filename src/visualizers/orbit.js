/**
 * Orbit / ring particles: particles on a ring, angle/radius driven by frequency bands.
 */

const COUNT = 120;
let particles = [];
let w = 0;
let h = 0;

function resize(width, height) {
  w = width;
  h = height;
  if (particles.length === 0) {
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        angle: (i / COUNT) * Math.PI * 2,
        radius: 0.3 + Math.random() * 0.2,
        hue: (i / COUNT) * 360,
        speed: (Math.random() - 0.5) * 0.02,
      });
    }
  }
}

function draw(ctx, width, height, frequencyData, _timeData, options) {
  const opts = options || {};
  const gain = opts.gain !== undefined && opts.gain !== null ? opts.gain : 1;
  const theme = opts.theme || {};
  const sat = theme.sat !== undefined ? theme.sat : 75;
  const hueShift = theme.hueShift || 0;
  const len = frequencyData.length;
  const low = len > 8
    ? (frequencyData.slice(0, Math.floor(len / 8)).reduce((a, b) => a + b, 0) / Math.floor(len / 8) / 255) * gain
    : 0.2;
  const mid = len > 4
    ? (frequencyData.slice(Math.floor(len / 4), Math.floor(len / 2)).reduce((a, b) => a + b, 0) / (Math.floor(len / 2) - Math.floor(len / 4)) / 255) * gain
    : 0.2;
  const high = len > 2
    ? (frequencyData.slice(Math.floor(len / 2)).reduce((a, b) => a + b, 0) / Math.ceil(len / 2) / 255) * gain
    : 0.2;

  const cx = width / 2;
  const cy = height / 2;
  const baseR = Math.min(width, height) * 0.32 * (0.85 + low * 0.3);
  const twist = (mid - 0.5) * 2 + high * 0.5;

  ctx.fillStyle = 'rgba(10, 10, 15, 0.12)';
  ctx.fillRect(0, 0, width, height);

  for (const p of particles) {
    p.angle += p.speed + twist * 0.02;
    const r = baseR * p.radius * (1 + mid * 0.2);
    const x = cx + r * Math.cos(p.angle);
    const y = cy + r * Math.sin(p.angle);
    const size = 1.5 + high * 3;
    const alpha = 0.5 + (low + high) * 0.4;
    const hue = (p.hue + mid * 60 + hueShift) % 360;
    ctx.fillStyle = `hsla(${hue}, ${sat}%, 65%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default { draw, resize };
