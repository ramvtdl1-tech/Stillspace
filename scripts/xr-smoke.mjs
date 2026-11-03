import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const cli = fileURLToPath(new URL('../node_modules/.bin/iwsdk', import.meta.url));
function run(args) {
  const result = spawnSync(cli, args, { encoding: 'utf8', timeout: 15000 });
  const value = JSON.parse(result.stdout || result.stderr);
  if (!value.ok) throw new Error(value.error.message);
  return value.data.result;
}
function observe() { return run(['browser','run','scripts/xr-observe.mjs','--timeout','10000']); }
function click(name) {
  const target = observe().controls[name];
  run(['xr','look-at','--input-json',JSON.stringify({device:'hand-right',target})]);
  run(['xr','select','--input-json',JSON.stringify({device:'hand-right',duration:.2})]);
}
if (!observe().active) run(['browser','run','scripts/enter-vr.mjs','--timeout','10000']);
assert.equal(observe().active,true);
run(['xr','set-input-mode','--input-json','{"mode":"hand"}']);
if (observe().pages.includes('help')) click('XRWelcome');
assert.deepEqual(observe().pages,['focus']);
click('XRStart'); assert.equal(observe().phase,'running');
click('XRStart'); assert.equal(observe().phase,'paused');
click('XRReset'); assert.equal(observe().phase,'idle');
click('Nav_tasks'); assert.deepEqual(observe().pages,['tasks']);
click('XRAddTask'); assert.deepEqual(observe().pages,['keyboard']);
click('Key_q'); click('KeySave');
assert.equal(observe().tasks.at(-1),'q');
click('Nav_focus'); click('XRStart');
assert.equal(observe().phase,'running');
run(['browser','screenshot','--output-file','artifacts/immersive.png']);
try { click('XRExit'); } catch (error) { if (!error.message.includes('XR session ended')) throw error; }
const final = observe(); assert.equal(final.active,false); assert.equal(final.phase,'paused');
console.log(JSON.stringify({passed:['hand-pinch onboarding','start/pause/reset in VR','hand-only task keyboard and save','in-world exit auto-pauses'],final:{active:final.active,phase:final.phase,tasks:final.tasks.length}},null,2));
