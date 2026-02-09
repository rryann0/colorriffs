/**
 * Plasma / feedback: 2D field with color from position, time, and spectrum-driven params.
 */

let time = 0;

function draw(ctx, width, height, frequencyData, _timeData, options) {
  time += 0.02;
  const opts = options || {};
  const gain = opts.gain !== undefined && opts.gain !== null ? opts.gain : 1;
  const theme = opts.theme || {};
  const themeSat = theme.sat !== undefined ? theme.sat : 70;
  const hueShift = theme.hueShift || 0;
  const grid = opts.performanceMode ? 24 : 48;
  const len = frequencyData.length;
  const energy = len > 0
    ? (frequencyData.reduce((a, b) => a + b, 0) / (len * 255)) * gain
    : 0.2;
  const scale = 0.02 + energy * 0.03;
  const speed = 1 + energy * 2;

  const cellW = width / grid;
  const cellH = height / grid;

  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      const x = (gx + 0.5) * cellW;
      const y = (gy + 0.5) * cellH;
      const v =
        Math.sin(x * scale + time * speed) +
        Math.sin(y * scale + time * speed * 0.7) +
        Math.sin((x + y) * scale * 0.5 + time * speed * 0.5);
      const hue = (v * 30 + time * 20 + 200 + hueShift) % 360;
      const sat = themeSat + energy * 25;
      const light = 45 + v * 10 + energy * 15;
      ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
      ctx.fillRect(gx * cellW, gy * cellH, cellW + 2, cellH + 2);
    }
  }
}

export default { draw };
