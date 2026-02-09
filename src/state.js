/**
 * Small shared state for visualizer options.
 */

let gain = 1;
let theme = 'default';
let performanceMode = false;

const THEMES = { default: {}, neon: { hueShift: 200, sat: 95 }, monochrome: { hueShift: 0, sat: 0 } };

export function getGain() {
  return gain;
}

export function setGain(value) {
  gain = Math.max(0.1, Math.min(3, value));
}

export function getTheme() {
  return theme;
}

export function setTheme(name) {
  theme = THEMES[name] ? name : 'default';
}

export function getThemeConfig() {
  return THEMES[theme] || THEMES.default;
}

export function getPerformanceMode() {
  return performanceMode;
}

export function setPerformanceMode(value) {
  performanceMode = !!value;
}

export function getOptions() {
  return {
    gain,
    theme: getThemeConfig(),
    themeName: theme,
    performanceMode,
  };
}
