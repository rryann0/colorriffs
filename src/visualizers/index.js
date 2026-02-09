/**
 * Visualizer registry and mode switching.
 */

import spectrum, { drawRadial } from './spectrum.js';
import particles from './particles.js';
import fractal from './fractal.js';
import waveform from './waveform.js';
import lissajous from './lissajous.js';
import orbit from './orbit.js';
import plasma from './plasma.js';

const registry = {
  spectrum,
  radial: { draw: drawRadial },
  particles,
  fractal,
  kaleidoscope: fractal.kaleidoscope,
  waveform,
  lissajous,
  orbit,
  plasma,
};

export function getVisualizer(mode) {
  return registry[mode] ?? registry.spectrum;
}

export function getModeList() {
  return Object.keys(registry);
}

export default registry;
