import type { Snapshot } from './state.js';

/** Dark ink reads on pale panels, while a lighter glow lights the 3D path. */
export const focusColors = {
  idle: { accent: '#4b5d3d', surface: '#eff3e7', glow: '#a3ba83' },
  running: { accent: '#80501f', surface: '#fff2dd', glow: '#ffae62' },
  paused: { accent: '#65487e', surface: '#f2eafa', glow: '#c6a0f0' },
  complete: { accent: '#346047', surface: '#e7f4ec', glow: '#80cbaa' },
} satisfies Record<Snapshot['phase'], { accent: string; surface: string; glow: string }>;
