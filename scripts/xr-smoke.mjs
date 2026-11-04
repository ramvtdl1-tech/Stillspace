import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
const cli = fileURLToPath(new URL('../node_modules/.bin/iwsdk', import.meta.url));
function run(args, env = process.env) {
  const result = spawnSync(cli, args, { encoding: 'utf8', timeout: 15000, env });
  const value = JSON.parse(result.stdout || result.stderr);
  if (!value.ok) throw new Error(value.error.message);
  return value.data.result;
}
const record = action => run(['browser','run','scripts/record-demo.mjs','--timeout','14000'], { ...process.env, STILLSPACE_DEMO_ACTION: action, STILLSPACE_DEMO_NAME: 'stillspace-afterlight-demo' });
const full = process.argv.includes('--full');
function observe() { return run(['browser','run','scripts/xr-observe.mjs','--timeout','10000']); }
function click(name) {
  const target = observe().controls[name];
  run(['xr','look-at','--input-json',JSON.stringify({device:'hand-right',target})]);
  run(['xr','select','--input-json',JSON.stringify({device:'hand-right',duration:.2})]);
}
if (!observe().active) run(['browser','run','scripts/enter-vr.mjs','--timeout','10000']);
assert.equal(observe().active,true);
run(['xr','set-input-mode','--input-json','{"mode":"hand"}']);
if (full) record('start');
if (observe().pages.includes('help')) click('XRWelcome');
assert.deepEqual(observe().pages,['focus']);
click('XRStart'); assert.equal(observe().phase,'running');
assert.equal(observe().trailColor, 'ffc58c');
click('XRStart'); assert.equal(observe().phase,'paused');
assert.equal(observe().trailColor, 'd3bdff');
click('XRReset'); assert.equal(observe().phase,'idle');
assert.equal(observe().trailColor, 'b9ceff');
click('Nav_tasks'); assert.deepEqual(observe().pages,['tasks']);
click('XRAddTask'); assert.deepEqual(observe().pages,['keyboard']);
click('Key_q'); click('KeySave');
assert.equal(observe().tasks.at(-1),'q');
click('Nav_focus');
if (full) click('Duration2');
click('XRStart');
assert.equal(observe().phase,'running');
run(['browser','screenshot','--output-file','artifacts/immersive.png']);
click('Nav_grove');
assert.deepEqual(observe().pages, ['grove']);
assert.equal(observe().phase, 'running');
if (full) {
  const initial = observe();
  console.log('Recording a real two-minute focus session in Grove view.');
  await delay(20_000);
  const inProgress = observe();
  assert.ok(inProgress.remainingMs < initial.remainingMs);
  assert.ok(inProgress.litStones > 0 && inProgress.litStones < 12);
  while (observe().phase === 'running') {
    const remaining = observe().remainingMs;
    await delay(Math.min(22_000, Math.max(500, remaining + 400)));
  }
  const completed = observe();
  assert.equal(completed.phase, 'complete');
  assert.equal(completed.trailColor, 'a9f1d0');
  assert.equal(completed.sessions, initial.sessions + 1);
  assert.equal(completed.visibleLanterns, Math.min(12, completed.sessions));
  assert.equal(completed.litStones, 12);
  run(['browser','screenshot','--output-file','artifacts/afterlight-grove.png']);
  await delay(4000);
  console.log(JSON.stringify(record('stop')));
  click('Nav_focus');
  click('XRStart');
}
try { click('XRExit'); } catch (error) { if (!error.message.includes('XR session ended')) throw error; }
const final = observe(); assert.equal(final.active,false); assert.equal(final.phase,'paused');
console.log(JSON.stringify({passed:['hand-pinch onboarding','start/pause/reset in VR','hand-only task keyboard and save','in-world exit auto-pauses'],final:{active:final.active,phase:final.phase,tasks:final.tasks.length}},null,2));
