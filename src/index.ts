import { createSystem, Group, Mesh, MeshStandardMaterial, VisibilityState, World } from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import { GardenAudio } from './audio.js';
import { createLantern } from './scene-assets/garden.scene-asset.js';
import { SpatialDesk } from './spatial-desk.js';
import { FocusStore, type Duration, type Snapshot } from './state.js';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const store = new FocusStore();
const audio = new GardenAudio();
const lanternSlots = Array.from({ length: 12 }, () => document.createElement('span'));
$('lantern-register').append(...lanternSlots);
let spatial: SpatialDesk | undefined;
let toastTimer: ReturnType<typeof setTimeout>;
let lastPhase = store.snapshot.phase;
let lastTaskMarkup = '';
let previousPhase = store.snapshot.phase;
let pendingImport: string | null = null;
function toast(message: string) {
  $('toast').textContent = message; $('toast').classList.add('toast-visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('toast-visible'), 4500);
}
function toggleSound() {
  const enabled = !store.snapshot.soundEnabled;
  store.setSoundEnabled(enabled); void audio.setEnabled(enabled);
  toast(enabled ? 'A little ambient harmony is on.' : 'A little quiet. Sound is off.');
}
function performFocusAction() {
  const phase = store.snapshot.phase;
  const ok = phase === 'running' ? store.pause() : phase === 'paused' ? store.resume() : store.start();
  if (!ok) toast('Choose an unfinished intention to begin.');
  void audio.setEnabled(store.snapshot.soundEnabled);
}
function update(snapshot: Snapshot) {
  if (snapshot.phase === 'running' && previousPhase !== 'running') audio.resume();
  previousPhase = snapshot.phase;
  const storageWarning = $('storage-warning');
  storageWarning.hidden = !snapshot.storageWarning;
  storageWarning.textContent = snapshot.storageWarning ?? '';
  const selected = snapshot.tasks.find(task => task.id === snapshot.activeTaskId);
  const taskKey = JSON.stringify([snapshot.tasks, snapshot.activeTaskId]);
  if (taskKey !== lastTaskMarkup) {
    lastTaskMarkup = taskKey;
    $('task-list').replaceChildren();
    for (const task of snapshot.tasks) {
      const row = document.createElement('div'); row.className = `task-row ${task.id === snapshot.activeTaskId ? 'selected' : ''} ${task.done ? 'done' : ''}`;
      const button = document.createElement('button'); button.className = 'task-select';
      button.setAttribute('aria-pressed', String(task.id === snapshot.activeTaskId));
      const check = document.createElement('span'); check.className = 'task-check'; check.textContent = task.done ? '✓' : task.id === snapshot.activeTaskId ? '•' : '';
      const title = document.createElement('span'); title.className = 'task-title'; title.textContent = task.title;
      button.append(check, title);
      button.addEventListener('click', () => {
        if (task.done) { store.toggleTask(task.id); return; }
        if (!store.selectTask(task.id)) toast('Reset this moment before choosing a different intention.');
      });
      const remove = document.createElement('button'); remove.className = 'task-remove'; remove.textContent = '×'; remove.setAttribute('aria-label', `Remove ${task.title}`);
      remove.addEventListener('click', () => { if (!store.removeTask(task.id)) toast('Reset this moment before removing its intention.'); });
      row.append(button, remove); $('task-list').append(row);
    }
    if (!snapshot.tasks.length) { const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'An open space. Add your first intention below.'; $('task-list').append(p); }
  }
  $('task-count').textContent = String(snapshot.tasks.filter(task => !task.done).length);
  $('focus-task').textContent = selected?.title ?? 'Choose an intention to begin.';
  const seconds = Math.ceil(snapshot.remainingMs / 1000);
  $('timer').textContent = `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  $('timer-status').textContent = ({ idle: 'A FRESH START', running: 'LET IT GROW', paused: 'TAKE YOUR TIME', complete: 'A MOMENT WELL SPENT' })[snapshot.phase];
  $('focus-title').textContent = ({ idle: 'Find your focus', running: 'One thing at a time', paused: 'A little breathing room', complete: 'Something good grew' })[snapshot.phase];
  $('focus-action').replaceChildren();
  const actionLabel = document.createElement('span'); actionLabel.textContent = ({ idle: 'Begin a little moment', running: 'Pause this moment', paused: 'Resume this moment', complete: 'Begin another moment' })[snapshot.phase];
  const arrow = document.createElement('span'); arrow.textContent = snapshot.phase === 'running' ? 'Ⅱ' : '↗'; $('focus-action').append(actionLabel, arrow);
  ($('timer-progress') as unknown as SVGCircleElement).style.strokeDashoffset = String(552.92 * (1 - snapshot.remainingMs / (snapshot.durationMinutes * 60_000)));
  document.querySelectorAll<HTMLButtonElement>('[data-duration]').forEach(button => {
    button.classList.toggle('selected', Number(button.dataset.duration) === snapshot.durationMinutes);
    button.disabled = snapshot.phase === 'running' || snapshot.phase === 'paused';
    button.setAttribute('aria-pressed', String(Number(button.dataset.duration) === snapshot.durationMinutes));
  });
  $('today-count').textContent = String(snapshot.todaySessions);
  $('total-sessions').textContent = String(snapshot.totalSessions);
  $('total-minutes').textContent = String(snapshot.totalFocusMinutes);
  $('streak-days').textContent = String(snapshot.streakDays);
  $('sound-button').setAttribute('aria-label', snapshot.soundEnabled ? 'Turn off ambient sound' : 'Turn on ambient sound');
  $('sound-button').setAttribute('aria-pressed', String(snapshot.soundEnabled));
  $('sound-button').textContent = snapshot.soundEnabled ? 'Sound on' : 'Sound off';
  $('sound-button').style.opacity = snapshot.soundEnabled ? '1' : '.45';
  if (document.activeElement !== $('journal-note')) ($('journal-note') as HTMLTextAreaElement).value = snapshot.note;
  $('storage-status').textContent = snapshot.storageWarning ?? 'Saved locally. Backups replace the current garden when imported. History retains the most recent 500 sessions.';
  const visibleLanterns = Math.min(12, snapshot.totalSessions);
  lanternSlots.forEach((slot, i) => slot.toggleAttribute('data-lit', i < visibleLanterns));
  $('garden-title').textContent = 'The Night Grove';
  $('garden-subtitle').textContent = snapshot.totalSessions
    ? `${visibleLanterns} / 12 lanterns lit · ${snapshot.totalSessions} completed focus sessions`
    : 'The trail lights as you focus. Your first lantern is waiting.';
  $('session-history').replaceChildren();
  for (const session of snapshot.sessions.slice(-12).reverse()) {
    const row = document.createElement('div'); row.className = 'history-item';
    const title = document.createElement('strong'); title.textContent = session.taskTitle;
    const detail = document.createElement('span'); detail.textContent = `${session.durationMinutes} min · ${new Date(session.finishedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}`;
    row.append(title, detail); $('session-history').append(row);
  }
  if (!snapshot.sessions.length) $('session-history').textContent = 'Your first little moment is waiting. There’s no hurry.';
  spatial?.sync(snapshot);
  if (lastPhase !== 'complete' && snapshot.phase === 'complete') { audio.blossom(); toast('A lantern joins your grove. Focus session complete.'); }
  lastPhase = snapshot.phase;
}

store.subscribe(update);
const interval = setInterval(() => store.tick(), 250);
window.addEventListener('pagehide', () => { store.pause(); audio.suspend(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { store.pause(); audio.suspend(); }
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') store.pause(); });
$('task-form').addEventListener('submit', event => {
  event.preventDefault(); const input = $('task-input') as HTMLInputElement;
  if (store.addTask(input.value)) { input.value = ''; toast('A little intention, planted.'); }
  else toast('Use 1–72 characters and keep at most 8 intentions.');
});
$('focus-action').addEventListener('click', performFocusAction);
$('reset-timer').addEventListener('click', () => { store.reset(); toast('A fresh start.'); });
$('complete-task').addEventListener('click', () => {
  const task = store.snapshot.activeTaskId;
  if (!task) toast('Choose an intention first.');
  else if (!store.toggleTask(task)) toast('Finish or reset the timer before completing your intention.');
  else toast('One small thing, done.');
});
document.querySelectorAll<HTMLElement>('[data-duration]').forEach(button => button.addEventListener('click', () => store.setDuration(Number(button.dataset.duration) as Duration)));
document.querySelectorAll<HTMLElement>('[data-view]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll<HTMLElement>('.view').forEach(view => { const visible = view.id === `${button.dataset.view}-view`; view.classList.toggle('hidden', !visible); view.hidden = !visible; });
  document.querySelectorAll('[data-view]').forEach(item => {
    item.classList.toggle('active', item === button);
    if (item === button) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current');
  });
  window.dispatchEvent(new Event('resize'));
}));
$('journal-note').addEventListener('input', () => store.setNote(($('journal-note') as HTMLTextAreaElement).value));
for (const id of ['help-button', 'hands-help']) $(id).addEventListener('click', () => ($('help-dialog') as HTMLDialogElement).showModal());
$('settings-button').addEventListener('click', () => ($('settings-dialog') as HTMLDialogElement).showModal());
document.querySelectorAll<HTMLElement>('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog')?.close()));
$('sound-button').addEventListener('click', toggleSound);
$('export-data').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([store.exportData()], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'stillspace-garden.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Your garden backup is ready.');
});
$('import-data').addEventListener('change', async event => {
  const input = event.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return;
  if (file.size > 300_000) toast('This backup is too large. Choose a Stillspace export.');
  else {
    try {
      pendingImport = await file.text();
      $('import-filename').textContent = file.name;
      ($('import-dialog') as HTMLDialogElement).showModal();
    } catch { toast('The file could not be read. Your garden is unchanged.'); }
  }
  input.value = '';
});
$('confirm-import').addEventListener('click', () => {
  const source = pendingImport;
  ($('import-dialog') as HTMLDialogElement).close();
  if (source !== null) {
    const imported = store.importData(source);
    if (imported) void audio.setEnabled(store.snapshot.soundEnabled);
    toast(imported ? 'Your garden has come home. Timers are paused.' : 'That backup could not be read. Your garden is unchanged.');
  }
});
$('import-dialog').addEventListener('close', () => { pendingImport = null; });
$('clear-data').addEventListener('click', () => ($('erase-dialog') as HTMLDialogElement).showModal());
$('confirm-clear').addEventListener('click', () => {
  store.clearData(); audio.suspend(); ($('erase-dialog') as HTMLDialogElement).close(); toast('A fresh garden, ready for you.');
});

async function boot() {
  const world = await World.create($('scene-container'), projectOptions);
  spatial = new SpatialDesk(world, store, toggleSound);
  spatial.sync(store.snapshot);
  const garden = world.requireSceneObject('garden');
  const rewards = new Group(); rewards.name = 'EarnedLanterns';
  const rewardsEntity = world.createTransformEntity(rewards, world.requireSceneEntity('garden'));
  const lanterns: Group[] = [];
  for (let i = 0; i < 12; i++) {
    const lantern = createLantern();
    lantern.name = `Lantern${i + 1}`;
    lantern.scale.setScalar(.82);
    const angle = Math.PI / 2 + i * Math.PI * 2 / 12;
    lantern.position.set(Math.cos(angle) * .48, .155, Math.sin(angle) * .48);
    world.createTransformEntity(lantern, rewardsEntity);
    lanterns.push(lantern);
  }
  const trail = Array.from({ length: 12 }, (_, i) => {
    const stone = garden.getObjectByName(`PathStone${i + 1}`);
    if (!(stone instanceof Mesh) || !(stone.material instanceof MeshStandardMaterial)) {
      throw new Error('A focus trail stone is missing its material.');
    }
    const material = stone.material.clone();
    material.emissive.set('#ffae62');
    stone.material = material;
    return material;
  });
  store.subscribe(snapshot => {
    const progress = snapshot.phase === 'idle' ? 0 : 1 - snapshot.remainingMs / (snapshot.durationMinutes * 60_000);
    trail.forEach((material, i) => {
      material.emissiveIntensity = Math.max(0, Math.min(1, progress * trail.length - i)) * 1.1;
    });
    lanterns.forEach((lantern, i) => { lantern.visible = i < snapshot.totalSessions; });
  });
  const initialPosition = garden.position.clone(); const initialRotation = garden.rotation.clone();
  const cameraPosition = world.camera.position.clone(); const cameraRotation = world.camera.quaternion.clone();
  let recenterFrames = 0;
  const onStart = () => {
    store.pause(); document.body.classList.add('xr-active'); spatial!.setVisible(true); recenterFrames = 3;
    $('vr-label').textContent = 'You’re in your space'; void audio.setEnabled(store.snapshot.soundEnabled);
  };
  const onEnd = () => {
    store.pause(); audio.suspend(); spatial!.setVisible(false); document.body.classList.remove('xr-active');
    garden.position.copy(initialPosition); garden.rotation.copy(initialRotation);
    $('vr-label').textContent = 'Enter your space in VR';
  };
  world.renderer.xr.addEventListener('sessionstart', onStart);
  world.renderer.xr.addEventListener('sessionend', onEnd);
  world.visibilityState.subscribe(visibility => {
    if (visibility === VisibilityState.VisibleBlurred || visibility === VisibilityState.Hidden) { store.pause(); audio.suspend(); }
  });
  class ComfortSystem extends createSystem({}) {
    update() { if (recenterFrames > 0) { spatial!.recenter(); recenterFrames--; } }
  }
  world.registerSystem(ComfortSystem);
  $('scene-loading').hidden = true;
  const xrSupported = !!navigator.xr && await navigator.xr.isSessionSupported('immersive-vr').catch(() => false);
  const enter = $('enter-vr') as HTMLButtonElement; enter.disabled = false;
  $('vr-label').textContent = xrSupported ? 'Enter your space in VR' : 'Open on a VR headset';
  enter.addEventListener('click', () => {
    if (!xrSupported) { toast('Desktop preview · open this HTTPS address in your Quest Browser, then select Enter VR.'); return; }
    ($('help-dialog') as HTMLDialogElement).close(); ($('settings-dialog') as HTMLDialogElement).close();
    world.launchXR(); toast('Approve the immersive session in your headset.');
  });
  $('recenter').addEventListener('click', () => {
    if (world.renderer.xr.isPresenting) spatial!.recenter();
    else { world.camera.position.copy(cameraPosition); world.camera.quaternion.copy(cameraRotation); }
    toast('Your garden is centered.');
  });
  // Read-only development observations: no synthetic completion or hidden production cheats.
  if (import.meta.env.DEV) Object.defineProperty(window, '__stillspace', { value: { get snapshot() { return store.snapshot; }, world }, configurable: true });
  if (new URLSearchParams(location.search).has('diagnostics')) {
    const label = document.createElement('output'); label.id = 'diagnostics';
    Object.assign(label.style, { position: 'fixed', bottom: '8px', right: '8px', background: '#263923', color: '#fff', padding: '8px', font: '11px monospace', zIndex: '20' });
    document.body.append(label); let frames = 0, since = performance.now();
    world.onXRFrame(() => {
      frames++; const now = performance.now();
      if (now - since > 1000) { label.textContent = `${Math.round(frames * 1000 / (now - since))} fps · ${world.renderer.info.render.calls} draws · ${world.renderer.info.render.triangles} triangles (XR sample)`; frames = 0; since = now; }
    });
  }
}
if (import.meta.hot) import.meta.hot.dispose(() => clearInterval(interval));
boot().catch(error => {
  console.error('Stillspace renderer initialization failed', error);
  $('scene-loading').textContent = 'The 3D garden needs WebGL. Your intentions and timer still work.';
  const enter = $('enter-vr') as HTMLButtonElement; enter.disabled = true; $('vr-label').textContent = 'VR unavailable on this browser';
  toast('The 3D garden could not start. Try a current Quest Browser or a browser with WebGL enabled.');
});
