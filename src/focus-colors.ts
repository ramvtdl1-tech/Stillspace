import type { Snapshot } from './state.js';

/** Shared phase colors keep the desktop controls, spatial panels and trail in sync. */
export const focusColors = {
  idle: { accent: '#d0dbef', surface: '#392d43' },
  running: { accent: '#ffcb87', surface: '#4c3339' },
  paused: { accent: '#e6bcf1', surface: '#4a3050' },
  complete: { accent: '#b4e4c8', surface: '#2f4039' },
} satisfies Record<Snapshot['phase'], { accent: string; surface: string }>;
