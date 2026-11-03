export default async function ({ page, frame }) {
  const app = frame ?? page;
  await app.locator('#enter-vr').click({ timeout: 4000 });
  await app.waitForFunction(() => window.__stillspace?.world.renderer.xr.isPresenting, null, { timeout: 5000 });
  return { active: await app.evaluate(() => window.__stillspace.world.renderer.xr.isPresenting) };
}
