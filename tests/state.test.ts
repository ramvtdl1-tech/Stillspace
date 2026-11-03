import test from 'node:test';
import assert from 'node:assert/strict';
import { FocusStore, STORAGE_KEY } from '../src/state.ts';
import type { StorageLike } from '../src/state.ts';

function setup() {
  let now = 1_800_000_000_000;
  const map = new Map<string, string>();
  const storage: StorageLike = { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => { map.set(key, value); }, removeItem: (key) => { map.delete(key); } };
  const store = new FocusStore({ now: () => now, storage });
  return { store, storage, map, advance(ms: number) { now += ms; }, now: () => now };
}

test('a timed focus records one session without marking the task done', () => {
  const { store, advance } = setup();
  const active = store.snapshot.activeTaskId;
  store.setDuration(2);
  assert.equal(store.start(), true);
  assert.equal(store.finish(), false);
  advance(119_500);
  store.tick();
  assert.equal(store.snapshot.remainingMs, 500);
  assert.equal(store.snapshot.totalSessions, 0);
  advance(501);
  store.tick();
  assert.equal(store.snapshot.phase, 'complete');
  assert.equal(store.snapshot.totalSessions, 1);
  assert.equal(store.snapshot.totalFocusMinutes, 2);
  assert.equal(store.snapshot.sessions[0].taskId, active);
  assert.equal(store.snapshot.tasks[0].done, false);
  assert.equal(store.finish(), false);
  store.tick();
  assert.equal(store.snapshot.totalSessions, 1);
});

test('pause freezes time, resume counts only remaining focus, reset never rewards', () => {
  const { store, advance } = setup();
  store.setDuration(2);
  store.start();
  advance(30_000);
  store.pause();
  assert.equal(store.snapshot.remainingMs, 90_000);
  advance(9_000_000);
  store.tick();
  assert.equal(store.snapshot.remainingMs, 90_000);
  store.resume();
  advance(89_999);
  store.tick();
  assert.equal(store.snapshot.totalSessions, 0);
  advance(2);
  store.tick();
  assert.equal(store.snapshot.totalSessions, 1);
  store.start();
  advance(10_000);
  store.reset();
  assert.equal(store.snapshot.remainingMs, 120_000);
  assert.equal(store.snapshot.phase, 'idle');
  assert.equal(store.snapshot.totalSessions, 1);
});

test('pause at a completed deadline awards the completed session once', () => {
  const { store, advance } = setup();
  store.setDuration(2);
  store.start();
  advance(150_000);
  store.pause();
  assert.equal(store.snapshot.phase, 'complete');
  assert.equal(store.snapshot.totalSessions, 1);
  assert.equal(store.pause(), false);
  assert.equal(store.snapshot.totalSessions, 1);
});

test('active task is protected during focus and completed tasks select the next task', () => {
  const { store } = setup();
  const [first, second] = store.snapshot.tasks;
  store.start();
  assert.equal(store.selectTask(second.id), false);
  assert.equal(store.removeTask(first.id), false);
  assert.equal(store.toggleTask(first.id), false);
  assert.equal(store.setDuration(8), false);
  store.pause();
  assert.equal(store.selectTask(second.id), false);
  store.reset();
  assert.equal(store.toggleTask(first.id), true);
  assert.equal(store.snapshot.activeTaskId, second.id);
  assert.equal(store.selectTask(first.id), false);
  store.snapshot.tasks.filter((task) => !task.done).forEach((task) => store.toggleTask(task.id));
  assert.equal(store.snapshot.activeTaskId, null);
  assert.equal(store.start(), false);
  store.addTask('A fresh intention');
  assert.ok(store.snapshot.activeTaskId);
});

test('tasks have bounded titles and queue size; snapshots cannot mutate internal state', () => {
  const { store } = setup();
  assert.equal(store.addTask(' '), false);
  assert.equal(store.addTask('x'.repeat(73)), false);
  assert.equal(store.addTask('\u0000bad'), false);
  for (let index = 0; index < 5; index++) assert.equal(store.addTask(`Task ${index}`), true);
  assert.equal(store.addTask('Ninth'), false);
  const snapshot = store.snapshot;
  snapshot.tasks[0].title = 'Mutated';
  snapshot.tasks.splice(1);
  assert.equal(store.snapshot.tasks.length, 8);
  assert.notEqual(store.snapshot.tasks[0].title, 'Mutated');
});

test('reloading and importing running data restores paused without granting elapsed time', () => {
  const { store, storage, advance, now } = setup();
  store.setDuration(2);
  store.start();
  advance(10_000);
  store.tick();
  const backup = store.exportData();
  advance(900_000);
  const restored = new FocusStore({ now, storage });
  assert.equal(restored.snapshot.phase, 'paused');
  assert.equal(restored.snapshot.remainingMs, 110_000);
  assert.equal(restored.snapshot.totalSessions, 0);
  assert.equal(restored.importData(backup), true);
  assert.equal(restored.snapshot.phase, 'paused');
  assert.equal(restored.snapshot.remainingMs, 110_000);
});

test('invalid imports fail atomically including duplicate IDs and invalid ranges', () => {
  const { store } = setup();
  const original = store.exportData();
  const base = JSON.parse(original);
  const badBackups = [
    '{broken',
    JSON.stringify({ ...base, version: 2 }),
    JSON.stringify({ ...base, tasks: [...base.tasks, base.tasks[0]] }),
    JSON.stringify({ ...base, durationMinutes: 25 }),
    JSON.stringify({ ...base, remainingMs: -1 }),
    JSON.stringify({ ...base, remainingMs: 900_000 }),
    JSON.stringify({ ...base, phase: 'running', sessionTask: null }),
    JSON.stringify({ ...base, activeTaskId: 'missing' }),
    JSON.stringify({ ...base, note: 'x'.repeat(501) }),
    JSON.stringify({ ...base, sessions: [{ id: 'a', taskId: 'b', taskTitle: 'Task', durationMinutes: 2, finishedAt: -1 }] }),
    JSON.stringify({ ...base, sessions: Array(2).fill({ id: 'a', taskId: 'b', taskTitle: 'Task', durationMinutes: 2, finishedAt: 1 }) }),
  ];
  for (const source of badBackups) {
    assert.equal(store.importData(source), false);
    assert.equal(store.exportData(), original);
  }
});

test('blocked and corrupt storage preserve a functioning in-memory app', () => {
  const blocked: StorageLike = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); }, removeItem() { throw new Error('blocked'); } };
  const store = new FocusStore({ storage: blocked });
  assert.ok(store.snapshot.storageWarning);
  assert.equal(store.addTask('Still usable'), true);
  assert.match(store.snapshot.storageWarning!, /memory/);
  assert.match(store.exportData(), /Still usable/);
  const { storage, map } = setup();
  map.set(STORAGE_KEY, 'broken backup');
  const recovered = new FocusStore({ storage });
  assert.ok(recovered.snapshot.storageWarning);
  assert.equal(map.get(STORAGE_KEY), 'broken backup');
  assert.equal(recovered.snapshot.tasks.length, 3);
});

test('completed history and reflection survive a round trip, reset clears progress', () => {
  const { store, advance, now } = setup();
  store.setDuration(2);
  store.start();
  advance(120_000);
  store.tick();
  store.setNote('One small step is enough.');
  store.setSoundEnabled(false);
  const other = new FocusStore({ storage: null, now });
  assert.equal(other.importData(store.exportData()), true);
  assert.equal(other.snapshot.note, 'One small step is enough.');
  assert.equal(other.snapshot.soundEnabled, false);
  assert.equal(other.snapshot.totalSessions, 1);
  assert.equal(other.snapshot.todaySessions, 1);
  assert.equal(other.snapshot.streakDays, 1);
  other.clearData();
  assert.equal(other.snapshot.totalSessions, 0);
  assert.equal(other.snapshot.note, '');
  assert.equal(other.snapshot.phase, 'idle');
});

test('unreadable saved data survives new work until an explicit reset or import', () => {
  const { storage, map, now } = setup();
  const corrupt = '{"version":1,"tasks":unfinished';
  map.set(STORAGE_KEY, corrupt);
  const recovered = new FocusStore({ storage, now });
  recovered.addTask('Keep this new work too');
  recovered.setNote('A recoverable note');
  assert.equal(map.get(STORAGE_KEY), corrupt);
  assert.match(recovered.snapshot.storageWarning!, /memory only/);
  assert.match(recovered.exportData(), /recoverable note/);
  assert.equal(recovered.importData('invalid'), false);
  assert.equal(map.get(STORAGE_KEY), corrupt);
  const valid = setup().store.exportData();
  assert.equal(recovered.importData(valid), true);
  assert.equal(recovered.snapshot.storageWarning, null);
  assert.equal(JSON.parse(map.get(STORAGE_KEY)!).version, 1);
  map.set(STORAGE_KEY, corrupt);
  const reset = new FocusStore({ storage, now });
  reset.clearData();
  assert.equal(reset.snapshot.storageWarning, null);
  assert.equal(JSON.parse(map.get(STORAGE_KEY)!).tasks.length, 3);
});

test('imports reject inconsistent active tasks and invalid idle timer state atomically', () => {
  const { store } = setup();
  store.start(); store.pause();
  const original = store.exportData();
  const active = JSON.parse(original);
  const other = active.tasks[1];
  const invalid = [
    { ...active, activeTaskId: null },
    { ...active, activeTaskId: other.id },
    { ...active, sessionTask: { id: other.id, title: other.title } },
    { ...active, sessionTask: { ...active.sessionTask, title: 'A different captured intention' } },
    { ...active, tasks: active.tasks.map((task: { id: string }) => task.id === active.activeTaskId ? { ...task, done: true } : task) },
    { ...active, phase: 'idle', sessionTask: null, remainingMs: 0 },
    { ...active, phase: 'idle' },
  ];
  for (const backup of invalid) {
    assert.equal(store.importData(JSON.stringify(backup)), false);
    assert.equal(store.exportData(), original);
  }
});

test('task titles stay on one line while field notes retain intentional line breaks', () => {
  const { store } = setup();
  assert.equal(store.addTask('A title\nthat corrupts the spatial timer layout'), false);
  assert.equal(store.setNote('First thought\nA second thought'), true);
  const original = store.exportData();
  const invalid = JSON.parse(original);
  invalid.tasks[0].title = 'A title\nwith a second line';
  assert.equal(store.importData(JSON.stringify(invalid)), false);
  assert.equal(store.exportData(), original);
  assert.equal(store.snapshot.note, 'First thought\nA second thought');
});

test('wall-clock changes cannot shorten or extend a running focus interval', () => {
  let wall = 1_800_000_000_000, elapsed = 0;
  const store = new FocusStore({ now: () => wall, elapsedNow: () => elapsed, storage: null });
  store.setDuration(2); store.start();
  wall += 86_400_000; elapsed += 30_000; store.tick();
  assert.equal(store.snapshot.remainingMs, 90_000);
  assert.equal(store.snapshot.totalSessions, 0);
  wall -= 172_800_000; elapsed += 30_000; store.pause();
  assert.equal(store.snapshot.remainingMs, 60_000);
  elapsed += 900_000; store.tick();
  assert.equal(store.snapshot.remainingMs, 60_000);
  store.resume(); elapsed += 59_999; store.tick();
  assert.equal(store.snapshot.totalSessions, 0);
  elapsed += 1; store.tick();
  assert.equal(store.snapshot.totalSessions, 1);
  assert.equal(store.snapshot.sessions[0].finishedAt, wall);
});

test('repeat focus sessions retain exactly the most recent 500 records', () => {
  const { store, advance } = setup();
  store.setDuration(2);
  let first = '';
  for (let index = 0; index < 501; index++) {
    assert.equal(store.start(), true);
    advance(120_000); store.tick();
    if (index === 0) first = store.snapshot.sessions[0].id;
  }
  assert.equal(store.snapshot.totalSessions, 500);
  assert.equal(store.snapshot.totalFocusMinutes, 1000);
  assert.equal(store.snapshot.sessions.some(session => session.id === first), false);
  assert.equal(store.finish(), false);
  assert.equal(store.snapshot.totalSessions, 500);
});
