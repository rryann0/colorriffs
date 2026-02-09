/**
 * Spectrum visualizer: bars or radial; height/radius from frequencyData, color from bin index/level.
 */

function draw(ctx, width, height, frequencyData, _timeData, options) {
  const opts = options || {};
  const gain = opts.gain !== undefined && opts.gain !== null ? opts.gain : 1;
  const theme = opts.theme || {};
  const sat = theme.sat !== undefined ? theme.sat : 80;
  const hueShift = theme.hueShift || 0;
  const len = frequencyData.length;
  const barWidth = width / len;
  const maxHeight = height * 0.6;
  const centerY = height / 2;

  ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < len; i++) {
    const v = (frequencyData[i] / 255) * gain;
    const h = Math.min(maxHeight, v * maxHeight);
    const x = (i / len) * width;
    const hue = ((i / len) * 280 + 180 + hueShift) % 360;
    ctx.fillStyle = `hsla(${hue}, ${sat}%, 60%, ${0.4 + Math.min(1, v) * 0.6})`;
    ctx.fillRect(x, centerY - h / 2, Math.max(1, barWidth - 1), h);
  }
}

function drawRadial(ctx, width, height, frequencyData, _timeData, options) {
  const opts = options || {};
  const gain = opts.gain !== undefined && opts.gain !== null ? opts.gain : 1;
  const theme = opts.theme || {};
  const sat = theme.sat !== undefined ? theme.sat : 80;
  const hueShift = theme.hueShift || 0;
  const len = frequencyData.length;
  const cx = width / 2;
  const cy = height / 2;
  const innerR = Math.min(width, height) * 0.15;
  const maxR = Math.min(width, height) * 0.42;
  const step = (2 * Math.PI) / len;

  ctx.fillStyle = 'rgba(10, 10, 15, 0.2)';
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < len; i++) {
    const v = (frequencyData[i] / 255) * gain;
    const r = innerR + Math.min(maxR - innerR, v * (maxR - innerR));
    const a0 = i * step - Math.PI / 2;
    const a1 = (i + 1) * step - Math.PI / 2;
    const hue = ((i / len) * 280 + 180 + hueShift) % 360;
    ctx.fillStyle = `hsla(${hue}, ${sat}%, 60%, ${0.5 + Math.min(1, v) * 0.4})`;
    ctx.beginPath();
    ctx.moveTo(cx + innerR * Math.cos(a0), cy + innerR * Math.sin(a0));
    ctx.arc(cx, cy, innerR, a0, a1);
    ctx.lineTo(cx + r * Math.cos(a1), cy + r * Math.sin(a1));
    ctx.arc(cx, cy, r, a1, a0, true);
    ctx.closePath();
    ctx.fill();
  }
}

export default { draw };
export { drawRadial };
