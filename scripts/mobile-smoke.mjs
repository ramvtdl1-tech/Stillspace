import assert from 'node:assert/strict';
import path from 'node:path';
export default async function ({ page, frame, workspaceRoot }) {
  const app = frame ?? page;
  page.setDefaultTimeout(4000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addStyleTag({ content: '#workspace-runtime-frame{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:99999!important}' });
  await app.locator('[data-view="sanctuary"]').click();
  await app.locator('#reset-timer').click();
  const layout = await app.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth }));
  assert.ok(layout.content <= layout.width, 'Mobile content must not overflow horizontally');
  await app.locator('#task-input').fill('A small mobile intention');
  await app.locator('#task-form button').click();
  assert.equal(await app.evaluate(() => window.__stillspace.snapshot.tasks.at(-1).title), 'A small mobile intention');
  await app.locator('.task-remove').last().click();
  await app.locator('[data-view="journal"]').click();
  assert.equal(await app.locator('#journal-note').isVisible(), true);
  await app.locator('[data-view="sanctuary"]').click();
  await app.locator('body').screenshot({ path: path.join(workspaceRoot,'artifacts/mobile.png') });
  await page.setViewportSize({ width: 1440, height: 1050 });
  return { passed: ['390px layout without horizontal overflow', 'mobile task form and removal', 'mobile navigation'], layout };
}
