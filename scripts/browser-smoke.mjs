import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

export default async function ({ page, frame, workspaceRoot }) {
  const app = frame ?? page;
  page.setDefaultTimeout(4000);
  await page.setViewportSize({width:1440,height:1050});
  await page.addStyleTag({content:'#workspace-runtime-frame{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:99999!important}'});
  await app.waitForFunction(() => !!window.__stillspace, null, { timeout: 10000 });
  await app.locator('#reset-timer').click();
  const initial = await app.evaluate(() => window.__stillspace.snapshot);
  assert.equal(initial.phase, 'idle');
  await app.locator('#task-input').fill('Draft one thoughtful page');
  await app.locator('#task-form button').click();
  await app.locator('.task-select').last().click();
  await app.locator('[data-duration="2"]').click();
  await app.locator('#focus-action').click();
  assert.equal(await app.evaluate(() => window.__stillspace.snapshot.phase), 'running');
  await app.locator('#focus-action').click();
  const paused = await app.evaluate(() => window.__stillspace.snapshot.remainingMs);
  await page.waitForTimeout(1200);
  assert.equal(await app.evaluate(() => window.__stillspace.snapshot.remainingMs), paused);
  await app.locator('#reset-timer').click();
  await app.locator('#complete-task').click();
  assert.equal(await app.evaluate(() => window.__stillspace.snapshot.tasks.at(-1).done), true);
  await app.locator('[data-view="journal"]').click();
  await app.locator('#journal-note').fill('A little less noise. A little more presence.');
  assert.match(await app.evaluate(() => window.__stillspace.snapshot.note), /presence/);
  await app.locator('[data-view="sanctuary"]').click();
  // Reset through the actual in-app confirmation dialog.
  await app.locator('#settings-button').click();
  await app.locator('#clear-data').click();
  await app.locator('#confirm-clear').click();
  await app.locator('#settings-dialog [data-close]').first().click();
  assert.equal(await app.evaluate(() => window.__stillspace.snapshot.tasks.length), 3);
  assert.equal(await app.evaluate(() => window.__stillspace.snapshot.totalSessions), 0);
  await mkdir(path.join(workspaceRoot, 'artifacts'), { recursive: true });
  await app.locator('body').screenshot({ path: path.join(workspaceRoot, 'artifacts/desktop.png') });
  return { passed: ['task creation and selection', 'focus start and pause', 'pause freezes time', 'reset and task completion', 'note autosave', 'data reset'], snapshot: await app.evaluate(() => ({ phase: window.__stillspace.snapshot.phase, tasks: window.__stillspace.snapshot.tasks.length, sessions: window.__stillspace.snapshot.totalSessions })), screenshot: 'artifacts/desktop.png' };
}
