/** App-owned, offline focus loop. No SDK, network, or DOM dependency. */
export const STORAGE_KEY = 'stillspace.v1';
export const DURATIONS = [2, 5, 8] as const;
export type Duration = (typeof DURATIONS)[number];
export type Phase = 'idle' | 'running' | 'paused' | 'complete';

export interface Task { id: string; title: string; done: boolean; createdAt: number }
export interface FocusSession {
  id: string;
  taskId: string;
  taskTitle: string;
  durationMinutes: Duration;
  finishedAt: number;
}
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export interface Snapshot {
  tasks: Task[];
  activeTaskId: string | null;
  durationMinutes: Duration;
  phase: Phase;
  remainingMs: number;
  sessions: FocusSession[];
  note: string;
  soundEnabled: boolean;
  storageWarning: string | null;
  totalSessions: number;
  totalFocusMinutes: number;
  todaySessions: number;
  streakDays: number;
}

interface Data {
  version: 1;
  tasks: Task[];
  activeTaskId: string | null;
  durationMinutes: Duration;
  phase: Phase;
  remainingMs: number;
  sessions: FocusSession[];
  note: string;
  soundEnabled: boolean;
  sessionTask: { id: string; title: string } | null;
}

const MAX_TASKS = 8;
const MAX_SESSIONS = 500;
const MAX_TITLE = 72;
const MAX_NOTE = 500;
let sequence = 0;
function id(): string {
  return globalThis.crypto?.randomUUID?.() ?? `s-${Date.now().toString(36)}-${(++sequence).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function validTime(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 8.64e15; }
function validDuration(value: unknown): value is Duration { return DURATIONS.includes(value as Duration); }
function record(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function text(value: unknown, max: number): value is string { return typeof value === 'string' && value.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value); }
function taskTitle(value: unknown): value is string { return text(value, MAX_TITLE) && !!value.trim() && !/[\r\n]/.test(value); }
function dayKey(time: number): string {
  const d = new Date(time);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Strict validation before replacing any local data; unknown keys are discarded. */
function parseData(source: string): Data {
  if (source.length > 300_000) throw new Error('Backup is too large.');
  const value: unknown = JSON.parse(source);
  if (!record(value) || value.version !== 1 || !Array.isArray(value.tasks) || value.tasks.length > MAX_TASKS || !Array.isArray(value.sessions) || value.sessions.length > MAX_SESSIONS) throw new Error('Unsupported backup.');
  const taskIds = new Set<string>();
  const tasks = value.tasks.map((task): Task => {
    if (!record(task) || !text(task.id, 100) || !task.id || taskIds.has(task.id) || !taskTitle(task.title) || typeof task.done !== 'boolean' || !validTime(task.createdAt)) throw new Error('Invalid task.');
    taskIds.add(task.id);
    return { id: task.id, title: task.title.trim(), done: task.done, createdAt: task.createdAt };
  });
  const sessionIds = new Set<string>();
  const sessions = value.sessions.map((session): FocusSession => {
    if (!record(session) || !text(session.id, 100) || !session.id || sessionIds.has(session.id) || !text(session.taskId, 100) || !session.taskId || !taskTitle(session.taskTitle) || !validDuration(session.durationMinutes) || !validTime(session.finishedAt)) throw new Error('Invalid session.');
    sessionIds.add(session.id);
    return { id: session.id, taskId: session.taskId, taskTitle: session.taskTitle.trim(), durationMinutes: session.durationMinutes, finishedAt: session.finishedAt };
  });
  if (!(value.activeTaskId === null || (typeof value.activeTaskId === 'string' && taskIds.has(value.activeTaskId))) || !validDuration(value.durationMinutes) || !['idle', 'running', 'paused', 'complete'].includes(value.phase as string) || typeof value.remainingMs !== 'number' || !Number.isFinite(value.remainingMs) || value.remainingMs < 0 || value.remainingMs > value.durationMinutes * 60_000 || !text(value.note, MAX_NOTE) || typeof value.soundEnabled !== 'boolean') throw new Error('Invalid focus settings.');
  let sessionTask: Data['sessionTask'] = null;
  if (value.sessionTask !== null) {
    if (!record(value.sessionTask) || !text(value.sessionTask.id, 100) || !value.sessionTask.id || !taskTitle(value.sessionTask.title)) throw new Error('Invalid session task.');
    sessionTask = { id: value.sessionTask.id, title: value.sessionTask.title.trim() };
  }
  const activeTask = tasks.find((task) => task.id === value.activeTaskId);
  if (activeTask?.done) throw new Error('Completed task cannot be selected.');
  if ((value.phase === 'running' || value.phase === 'paused') && (!sessionTask || value.remainingMs === 0 || !activeTask || activeTask.id !== sessionTask.id || activeTask.title !== sessionTask.title)) throw new Error('Invalid active session.');
  if (value.phase === 'idle' && (sessionTask !== null || value.remainingMs !== value.durationMinutes * 60_000)) throw new Error('Invalid idle session.');
  if (value.phase === 'complete' && value.remainingMs !== 0) throw new Error('Invalid completed session.');
  return { version: 1, tasks, sessions, activeTaskId: value.activeTaskId as string | null, durationMinutes: value.durationMinutes, phase: value.phase as Phase, remainingMs: value.remainingMs, note: value.note, soundEnabled: value.soundEnabled, sessionTask };
}

export class FocusStore {
  private data: Data;
  private storage: StorageLike | null;
  private now: () => number;
  private elapsedNow: () => number;
  private deadline: number | null = null;
  private lastTick = 0;
  private warning: string | null = null;
  private preserveUnreadableStorage = false;
  private listeners = new Set<(snapshot: Snapshot) => void>();

  constructor(options: { now?: () => number; elapsedNow?: () => number; storage?: StorageLike | null } = {}) {
    this.now = options.now ?? Date.now;
    // Use a monotonic clock for a running timer. Wall-clock corrections should
    // affect calendar labels, never award a focus session early or delay it.
    this.elapsedNow = options.elapsedNow ?? options.now ?? (() => globalThis.performance?.now() ?? Date.now());
    if ('storage' in options) this.storage = options.storage ?? null;
    else {
      try { this.storage = globalThis.localStorage ?? null; } catch { this.storage = null; }
    }
    this.data = this.defaults();
    if (!this.storage) this.warning = 'Local storage is unavailable. Export a backup to keep your progress.';
    else {
      try {
        const saved = this.storage.getItem(STORAGE_KEY);
        if (saved !== null) {
          this.data = parseData(saved);
          // Time never advances while the app is closed, reloaded, or imported.
          if (this.data.phase === 'running') this.data.phase = 'paused';
        }
      } catch {
        this.preserveUnreadableStorage = true;
        this.warning = 'Saved data could not be read. New changes are in memory only; export a backup or reset/import to replace the saved data.';
      }
    }
  }

  private defaults(): Data {
    const at = this.now();
    const tasks = ['Make space for one good idea', 'Read a few pages', 'Plan tomorrow’s first step'].map((title) => ({ id: id(), title, done: false, createdAt: at }));
    return { version: 1, tasks, activeTaskId: tasks[0].id, durationMinutes: 5, phase: 'idle', remainingMs: 300_000, sessions: [], note: '', soundEnabled: true, sessionTask: null };
  }

  get snapshot(): Snapshot {
    const today = dayKey(this.now());
    const days = new Set(this.data.sessions.map((session) => dayKey(session.finishedAt)));
    const cursor = new Date(this.now());
    if (!days.has(dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
    let streakDays = 0;
    while (days.has(dayKey(cursor.getTime()))) { streakDays++; cursor.setDate(cursor.getDate() - 1); }
    return {
      tasks: this.data.tasks.map((task) => ({ ...task })),
      activeTaskId: this.data.activeTaskId,
      durationMinutes: this.data.durationMinutes,
      phase: this.data.phase,
      remainingMs: this.data.remainingMs,
      sessions: this.data.sessions.map((session) => ({ ...session })),
      note: this.data.note,
      soundEnabled: this.data.soundEnabled,
      storageWarning: this.warning,
      totalSessions: this.data.sessions.length,
      totalFocusMinutes: this.data.sessions.reduce((sum, session) => sum + session.durationMinutes, 0),
      todaySessions: this.data.sessions.filter((session) => dayKey(session.finishedAt) === today).length,
      streakDays,
    };
  }

  subscribe(listener: (snapshot: Snapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => { this.listeners.delete(listener); };
  }

  private changed(persist = true): void {
    if (persist && this.storage && !this.preserveUnreadableStorage) {
      try { this.storage.setItem(STORAGE_KEY, JSON.stringify(this.data)); this.warning = null; }
      catch { this.warning = 'Your changes are in memory only. Export a backup; local storage is full or blocked.'; }
    }
    for (const listener of this.listeners) listener(this.snapshot);
  }

  addTask(title: string): boolean {
    const clean = typeof title === 'string' ? title.trim() : '';
    if (!taskTitle(clean) || this.data.tasks.length >= MAX_TASKS) return false;
    const task: Task = { id: id(), title: clean, done: false, createdAt: this.now() };
    this.data.tasks.push(task);
    if (!this.data.activeTaskId) this.data.activeTaskId = task.id;
    this.changed();
    return true;
  }

  selectTask(taskId: string): boolean {
    if (this.data.phase === 'running' || this.data.phase === 'paused' || !this.data.tasks.some((task) => task.id === taskId && !task.done)) return false;
    this.data.activeTaskId = taskId;
    this.changed();
    return true;
  }

  toggleTask(taskId: string): boolean {
    const task = this.data.tasks.find((item) => item.id === taskId);
    if (!task || ((this.data.phase === 'running' || this.data.phase === 'paused') && taskId === this.data.activeTaskId)) return false;
    task.done = !task.done;
    if (task.done && this.data.activeTaskId === taskId) this.data.activeTaskId = this.data.tasks.find((item) => !item.done)?.id ?? null;
    else if (!task.done && !this.data.activeTaskId) this.data.activeTaskId = taskId;
    this.changed();
    return true;
  }

  removeTask(taskId: string): boolean {
    if ((this.data.phase === 'running' || this.data.phase === 'paused') && this.data.activeTaskId === taskId) return false;
    const index = this.data.tasks.findIndex((task) => task.id === taskId);
    if (index < 0) return false;
    this.data.tasks.splice(index, 1);
    if (this.data.activeTaskId === taskId) this.data.activeTaskId = this.data.tasks.find((task) => !task.done)?.id ?? null;
    this.changed();
    return true;
  }

  setDuration(duration: Duration): boolean {
    if (!validDuration(duration) || this.data.phase === 'running' || this.data.phase === 'paused') return false;
    this.data.durationMinutes = duration;
    this.data.remainingMs = duration * 60_000;
    this.data.phase = 'idle';
    this.data.sessionTask = null;
    this.changed();
    return true;
  }

  start(): boolean {
    if (this.data.phase === 'running' || this.data.phase === 'paused') return false;
    const task = this.data.tasks.find((item) => item.id === this.data.activeTaskId && !item.done);
    if (!task) return false;
    this.data.remainingMs = this.data.durationMinutes * 60_000;
    this.data.sessionTask = { id: task.id, title: task.title };
    this.deadline = this.elapsedNow() + this.data.remainingMs;
    this.lastTick = this.elapsedNow();
    this.data.phase = 'running';
    this.changed();
    return true;
  }

  pause(): boolean {
    if (this.data.phase !== 'running') return false;
    this.updateRemaining();
    if (this.data.remainingMs === 0) { this.finish(); return true; }
    this.data.phase = 'paused';
    this.deadline = null;
    this.changed();
    return true;
  }

  resume(): boolean {
    if (this.data.phase !== 'paused') return false;
    this.deadline = this.elapsedNow() + this.data.remainingMs;
    this.lastTick = this.elapsedNow();
    this.data.phase = 'running';
    this.changed();
    return true;
  }

  reset(): void {
    this.data.phase = 'idle';
    this.data.remainingMs = this.data.durationMinutes * 60_000;
    this.data.sessionTask = null;
    this.deadline = null;
    this.changed();
  }

  private updateRemaining(): void {
    if (this.data.phase !== 'running' || this.deadline === null) return;
    const at = this.elapsedNow();
    // Clock rollback cannot increase the remaining focus time.
    this.data.remainingMs = Math.min(this.data.remainingMs, Math.max(0, this.deadline - at));
  }

  /** Call from the render loop or a short interval; subscribers update at most once/second. */
  tick(): void {
    if (this.data.phase !== 'running') return;
    const beforeSecond = Math.ceil(this.data.remainingMs / 1000);
    this.updateRemaining();
    if (this.data.remainingMs === 0) { this.finish(); return; }
    if (Math.ceil(this.data.remainingMs / 1000) !== beforeSecond) {
      const persist = this.elapsedNow() - this.lastTick >= 5000;
      if (persist) this.lastTick = this.elapsedNow();
      this.changed(persist);
    }
  }

  /** A finished timer awards one seed. Calling this early or twice never awards one. */
  finish(): boolean {
    if (this.data.phase !== 'running') return false;
    this.updateRemaining();
    if (this.data.remainingMs > 0 || !this.data.sessionTask) return false;
    this.data.sessions.push({ id: id(), taskId: this.data.sessionTask.id, taskTitle: this.data.sessionTask.title, durationMinutes: this.data.durationMinutes, finishedAt: this.now() });
    if (this.data.sessions.length > MAX_SESSIONS) this.data.sessions.shift();
    this.data.phase = 'complete';
    this.data.remainingMs = 0;
    this.deadline = null;
    this.changed();
    return true;
  }

  setNote(note: string): boolean {
    if (!text(note, MAX_NOTE)) return false;
    this.data.note = note;
    this.changed();
    return true;
  }

  setSoundEnabled(enabled: boolean): void { this.data.soundEnabled = !!enabled; this.changed(); }

  exportData(): string {
    this.tick();
    return JSON.stringify(this.data, null, 2);
  }

  importData(source: string): boolean {
    try {
      const incoming = parseData(source);
      if (incoming.phase === 'running') incoming.phase = 'paused';
      this.data = incoming;
      this.deadline = null;
      this.preserveUnreadableStorage = false;
      this.changed();
      return true;
    } catch { return false; }
  }

  /** User-initiated local reset. No remote records exist. */
  clearData(): void {
    this.data = this.defaults();
    this.deadline = null;
    this.preserveUnreadableStorage = false;
    this.changed();
  }
}
