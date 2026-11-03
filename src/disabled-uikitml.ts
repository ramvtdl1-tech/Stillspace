/**
 * Stillspace renders canvas-texture spatial controls and disables SDK spatialUI.
 * The SDK imports an optional UIKitML dependency even when that feature is off.
 * Exclude it from the distributed client instead of shipping undeclared-license
 * code. These explicit failures also prevent accidental future feature use.
 */
function disabled(): never {
  throw new Error('UIKitML is disabled in Stillspace. Use the canvas spatial controls.');
}
export const parse = disabled;
export const instantiate = disabled;
export const resolveKitComponentSets = disabled;
