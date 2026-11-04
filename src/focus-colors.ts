import type { Snapshot } from './state.js';

/** Shared phase colors keep the desktop controls, spatial panels and trail in sync. */
export const focusColors = {
  idle: { accent: '#b9ceff', surface: '#26324e' },
  running: { accent: '#ffc58c', surface: '#3f2e3a' },
  paused: { accent: '#d3bdff', surface: '#372e50' },
  complete: { accent: '#a9f1d0', surface: '#223e42' },
} satisfies Record<Snapshot['phase'], { accent: string; surface: string }>;
