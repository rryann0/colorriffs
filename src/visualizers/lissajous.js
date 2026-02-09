/**
 * Lissajous curves: x = A*sin(a*t + p1), y = B*sin(b*t + p2), params driven by spectrum.
 */

let phase = 0;

function draw(ctx, width, height, frequencyData, timeData, options) {
  phase += 0.02;
  const opts = options || {};
  const gain = opts.gain !== undefined && opts.gain !== null ? opts.gain : 1;
  const len = frequencyData.length;
  const low = len > 8
    ? (frequencyData.slice(0, Math.floor(len / 8)).reduce((a, b) => a + b, 0) / Math.floor(len / 8) / 255) * gain
    : 0.3;
  const mid = len > 4
    ? (frequencyData.slice(Math.floor(len / 4), Math.floor(len / 2)).reduce((a, b) => a + b, 0) / (Math.floor(len / 2) - Math.floor(len / 4)) / 255) * gain
    : 0.3;
  const high = len > 2
    ? (frequencyData.slice(Math.floor(len / 2)).reduce((a, b) => a + b, 0) / Math.ceil(len / 2) / 255) * gain
    : 0.3;

  const theme = opts.theme || {};
  const sat = theme.sat !== undefined ? theme.sat : 75;
  const hueShift = theme.hueShift || 0;
  const cx = width / 2;
  const cy = height / 2;
  const scale = Math.min(width, height) * 0.35 * (0.8 + low * 0.4);
  const a = 3 + Math.floor(mid * 4);
  const b = 2 + Math.floor(high * 4);
  const points = 400;

  ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
  ctx.fillRect(0, 0, width, height);

  ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const t = (i / points) * Math.PI * 2 + phase;
    const x = cx + scale * Math.sin(a * t + phase * 0.5);
    const y = cy + scale * Math.sin(b * t);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  const hue = (200 + high * 100 + hueShift) % 360;
  ctx.strokeStyle = `hsla(${hue}, ${sat}%, 60%, 0.9)`;
  ctx.lineWidth = 2;
  ctx.stroke();
}

export default { draw };
