/**
 * Time-domain waveform: draw waveform as mirrored filled shape.
 */

function draw(ctx, width, height, _frequencyData, timeData, options) {
  const opts = options || {};
  const gain = opts.gain !== undefined && opts.gain !== null ? opts.gain : 1;
  const theme = opts.theme || {};
  const sat = theme.sat !== undefined ? theme.sat : 75;
  const hueShift = theme.hueShift || 0;
  const hue = (240 + hueShift) % 360;
  const len = (timeData && timeData.length) ? timeData.length : 256;
  const centerY = height / 2;
  const halfH = height * 0.4;

  ctx.fillStyle = 'rgba(10, 10, 15, 0.2)';
  ctx.fillRect(0, 0, width, height);

  ctx.beginPath();
  for (let i = 0; i <= len; i++) {
    const x = (i / len) * width;
    const v = timeData[i % len] !== undefined ? (timeData[i % len] - 128) / 128 : 0;
    const y = centerY + v * halfH * gain;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let i = len; i >= 0; i--) {
    const x = (i / len) * width;
    const v = timeData[i % len] !== undefined ? (timeData[i % len] - 128) / 128 : 0;
    const y = centerY - v * halfH * gain;
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = `hsla(${hue}, ${sat}%, 60%, 0.5)`;
  ctx.fill();
  ctx.strokeStyle = `hsla(${hue}, ${sat}%, 70%, 0.8)`;
  ctx.lineWidth = 1;
  ctx.stroke();
}

export default { draw };
