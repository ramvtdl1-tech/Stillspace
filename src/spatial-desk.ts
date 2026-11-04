import {
  CanvasTexture, Entity, Group, Mesh, MeshBasicMaterial, PlaneGeometry,
  RayInteractable, SRGBColorSpace, Vector3, World,
} from '@iwsdk/core';
import { FocusStore, type Snapshot, type Duration } from './state.js';

type Page = 'focus' | 'tasks' | 'notes' | 'help' | 'keyboard' | 'grove';
type Tile = { mesh: Mesh; entity: Entity; draw: (label: string, active?: boolean) => void };

/** All essential controls live in the immersive scene, including text entry. */
export class SpatialDesk {
  readonly root = new Group();
  private anchor: Entity;
  private pages = new Map<Page, { root: Group; entity: Entity }>();
  private tiles = new Map<string, Tile>();
  private page: Page = 'help';
  private taskOffset = 0;
  private notePage = 0;
  private draft = '';
  private draftKind: 'task' | 'note' = 'task';
  private message = '';
  private symbolKeyboard = false;
  private uppercase = false;
  private keys: { id: string; letter: string; symbol: string }[] = [];
  private headPosition = new Vector3();
  private forward = new Vector3();
  private snapshot: Snapshot;
  constructor(private world: World, private store: FocusStore, private onSound: () => void) {
    this.snapshot = store.snapshot;
    this.root.name = 'SpatialDesk'; this.root.visible = false;
    this.anchor = world.createTransformEntity(this.root, { persistent: true });
    for (const name of ['focus', 'tasks', 'notes', 'help', 'keyboard', 'grove'] as Page[]) {
      const root = new Group(); root.name = `Page_${name}`;
      this.pages.set(name, { root, entity: world.createTransformEntity(root, this.anchor) });
    }
    this.tile('GroveDisplay', 'grove', 0, .29, .77, .15, 'THE NIGHT GROVE', undefined, true);
    this.tile('FocusDisplay', 'focus', 0, .20, .88, .31, '', undefined, true);
    [2, 5, 8].forEach((duration, i) => this.tile(`Duration${duration}`, 'focus', -.22 + i * .22, -.015, .20, .065, `${duration} min`, () => {
      if (!store.setDuration(duration as Duration)) this.say('Reset this moment before changing its length.');
    }));
    this.tile('XRStart', 'focus', 0, -.12, .56, .085, 'Begin a little moment', () => {
      const phase = store.snapshot.phase;
      const ok = phase === 'running' ? store.pause() : phase === 'paused' ? store.resume() : store.start();
      if (!ok) this.say('Choose an unfinished intention first.');
    });
    this.tile('XRReset', 'focus', -.225, -.23, .23, .065, 'Reset', () => store.reset());
    this.tile('XRCompleteTask', 'focus', .17, -.23, .50, .065, 'Mark intention done', () => {
      const id = store.snapshot.activeTaskId;
      if (!id) this.say('Choose an unfinished intention first.');
      else if (!store.toggleTask(id)) this.say('Finish or reset the timer before completing your task.');
    });
    this.tile('XRMessage', 'focus', 0, -.335, .88, .10, 'Rest your elbows. Point and pinch to select.', undefined, true);
    this.tile('TaskHeading', 'tasks', 0, .34, .88, .09, 'One small intention at a time', undefined, true);
    for (let i = 0; i < 4; i++) {
      this.tile(`Task${i}`, 'tasks', -.045, .22 - i * .11, .76, .09, '', () => {
        const task = this.store.snapshot.tasks[this.taskOffset + i];
        if (task?.done) { store.toggleTask(task.id); return; }
        if (task && store.selectTask(task.id)) this.show('focus');
        else if (task) this.say('Reset the current timer to choose another intention.');
      });
      this.tile(`DeleteTask${i}`, 'tasks', .40, .22 - i * .11, .075, .09, '×', () => {
        const task = store.snapshot.tasks[this.taskOffset + i];
        if (task && !store.removeTask(task.id)) this.say('Reset the timer before removing its intention.');
      });
    }
    this.tile('TaskPrevious', 'tasks', -.32, -.245, .18, .07, '← Back', () => { this.taskOffset = 0; this.sync(store.snapshot); });
    this.tile('XRAddTask', 'tasks', 0, -.245, .40, .07, '+ New intention', () => this.openKeyboard('task'));
    this.tile('TaskNext', 'tasks', .32, -.245, .18, .07, 'More →', () => { this.taskOffset = store.snapshot.tasks.length > 4 ? 4 : 0; this.sync(store.snapshot); });
    this.tile('TaskMessage', 'tasks', 0, -.34, .88, .065, '', undefined, true);
    this.tile('NotesDisplay', 'notes', 0, .13, .88, .42, '', undefined, true);
    this.tile('XREditNote', 'notes', 0, -.17, .40, .085, 'Write a field note', () => this.openKeyboard('note'));
    this.tile('NotePrevious', 'notes', -.34, -.17, .18, .085, '← Back', () => { this.notePage = Math.max(0, this.notePage - 1); this.sync(store.snapshot); });
    this.tile('NoteNext', 'notes', .34, -.17, .18, .085, 'More →', () => { this.notePage++; this.sync(store.snapshot); });
    this.tile('NotesStats', 'notes', 0, -.30, .88, .10, '', undefined, true);
    this.tile('HelpDisplay', 'help', 0, .12, .94, .50,
      'STILLSPACE AFTERLIGHT\nMake time glow.\n\n1. Sit comfortably. Rest your elbows.\n2. Point your hand at a button.\n3. Pinch thumb and index finger to select.\n\nChoose one intention and a 2, 5 or 8 minute moment.\nFinish to light a lantern. Use Grove to see the trail.', undefined, true);
    this.tile('XRWelcome', 'help', 0, -.22, .58, .09, 'Enter the grove →', () => this.show('focus'));
    this.tile('KeyboardDisplay', 'keyboard', 0, .32, .94, .13, '', undefined, true);
    const symbolRows = ['1234567890', '.,!?-/:;@', "'()&+_="];
    ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].forEach((row, r) => [...row].forEach((key, c) => {
      const item = { id: `Key_${key}`, letter: key, symbol: symbolRows[r][c] };
      this.keys.push(item);
      this.tile(item.id, 'keyboard', (c - (row.length - 1) / 2) * .088, .185 - r * .088, .079, .076, key, () => this.type(this.symbolKeyboard ? item.symbol : this.uppercase ? item.letter.toUpperCase() : item.letter));
    }));
    this.tile('KeyMode', 'keyboard', -.365, -.09, .18, .075, '123', () => { this.symbolKeyboard = !this.symbolKeyboard; this.drawKeys(); });
    this.tile('KeyShift', 'keyboard', -.17, -.09, .18, .075, 'Shift', () => { this.uppercase = !this.uppercase; this.drawKeys(); });
    this.tile('KeySpace', 'keyboard', .06, -.09, .26, .075, 'Space', () => this.type(' '));
    this.tile('KeyBackspace', 'keyboard', .33, -.09, .25, .075, '← Delete', () => { this.draft = this.draft.slice(0, -1); this.updateDraft(); });
    this.tile('KeyCancel', 'keyboard', -.24, -.20, .35, .08, 'Cancel', () => this.show(this.draftKind === 'task' ? 'tasks' : 'notes'));
    this.tile('KeySave', 'keyboard', .19, -.20, .47, .08, 'Save intention', () => {
      const ok = this.draftKind === 'task' ? store.addTask(this.draft) : store.setNote(this.draft);
      if (ok) this.show(this.draftKind === 'task' ? 'tasks' : 'notes');
      else { this.message = this.draftKind === 'task' ? 'Use 1–72 characters; keep at most 8 intentions.' : 'Notes can be at most 500 characters.'; this.updateDraft(); }
    });
    this.tile('KeyboardHint', 'keyboard', 0, -.31, .94, .065, 'Point and pinch a key. No controllers needed.', undefined, true);
    // Stationary, world-space dock: never attached directly to the viewer's head.
    const tabs = ['focus', 'tasks', 'grove', 'notes', 'help'] as const;
    tabs.forEach((page, i) => this.tile(`Nav_${page}`, null, -.40 + i * .20, -.46, .18, .075, ['Focus', 'Intentions', 'Grove', 'Field notes', 'Help'][i], () => this.show(page)));
    this.tile('XRRecenter', null, -.32, -.56, .30, .065, 'Recenter', () => this.recenter());
    this.tile('XRSound', null, 0, -.56, .29, .065, 'Sound', onSound);
    this.tile('XRExit', null, .32, -.56, .30, .065, 'Save & exit', () => { store.pause(); this.world.exitXR(); });
    this.sync(this.snapshot); this.show('help');
  }

  private tile(id: string, page: Page | null, x: number, y: number, width: number, height: number, label: string, action?: () => void, display = false) {
    const canvas = document.createElement('canvas'); canvas.width = 1280; canvas.height = Math.round(1280 * height / width);
    const context = canvas.getContext('2d')!;
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace;
    const material = new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false });
    const mesh = new Mesh(new PlaneGeometry(width, height), material);
    mesh.name = id; mesh.position.set(x, y, -1.25);
    const entity = this.world.createTransformEntity(mesh, page ? this.pages.get(page)!.entity : this.anchor);
    if (action) {
      entity.addComponent(RayInteractable);
      mesh.addEventListener('click', () => { action(); });
      mesh.addEventListener('pointerover', () => { material.color.set('#f9ccad'); });
      mesh.addEventListener('pointerout', () => { material.color.set('#ffffff'); });
    }
    let previousText = ''; let previousActive: boolean | undefined;
    const draw = (text: string, active = false) => {
      if (text === previousText && active === previousActive) return;
      previousText = text; previousActive = active;
      const w = canvas.width, h = canvas.height;
      context.clearRect(0, 0, w, h);
      context.fillStyle = active ? '#ffc38a' : display ? '#202437' : '#343a55';
      context.beginPath(); context.roundRect(0, 0, w, h, Math.min(30, h / 5)); context.fill();
      context.fillStyle = active ? '#251b2c' : '#f6e9e5';
      if (id === 'FocusDisplay') {
        const [title, time, status] = text.split('\n');
        context.textAlign = 'center'; context.textBaseline = 'middle';
        context.font = '44px sans-serif'; context.fillText(title, w / 2, h * .16, w - 100);
        context.font = '170px Georgia'; context.fillText(time, w / 2, h * .51, w - 100);
        context.font = '40px sans-serif'; context.fillText(status, w / 2, h * .84, w - 100);
        texture.needsUpdate = true; return;
      }
      // Keep button lettering a consistent physical size across wide and narrow
      // tiles, rather than shrinking key/nav labels with their canvas width.
      const size = display ? Math.min(46, h * .28) : Math.min(h * .36, 1280 * .022 / width);
      context.font = `${size}px ${display ? 'Georgia' : 'sans-serif'}`;
      context.textAlign = 'center'; context.textBaseline = 'middle';
      const lines: string[] = [];
      for (const paragraph of text.split('\n')) {
        let line = '';
        for (const word of paragraph.split(' ')) {
          if (context.measureText(`${line} ${word}`).width > w - 100 && line) { lines.push(line); line = word; }
          else line += (line ? ' ' : '') + word;
        }
        lines.push(line);
      }
      const lineHeight = size * 1.45;
      lines.slice(0, 12).forEach((line, i, all) => context.fillText(line, w / 2, h / 2 + (i - (all.length - 1) / 2) * lineHeight, w - 70));
      texture.needsUpdate = true;
    };
    this.tiles.set(id, { mesh, entity, draw }); draw(label);
  }
  private type(key: string) {
    const max = this.draftKind === 'task' ? 72 : 500;
    if (this.draft.length < max) this.draft += key;
    this.message = ''; this.updateDraft();
  }
  private openKeyboard(kind: 'task' | 'note') {
    this.draftKind = kind; this.draft = kind === 'note' ? this.store.snapshot.note : ''; this.message = '';
    this.symbolKeyboard = false; this.uppercase = false; this.drawKeys();
    this.tiles.get('KeySave')!.draw(kind === 'task' ? 'Save intention' : 'Save note'); this.updateDraft(); this.show('keyboard');
  }
  private drawKeys() {
    for (const key of this.keys) this.tiles.get(key.id)!.draw(this.symbolKeyboard ? key.symbol : this.uppercase ? key.letter.toUpperCase() : key.letter);
    this.tiles.get('KeyMode')!.draw(this.symbolKeyboard ? 'ABC' : '123', this.symbolKeyboard);
    this.tiles.get('KeyShift')!.draw('Shift', this.uppercase);
  }
  private updateDraft() {
    this.tiles.get('KeyboardDisplay')!.draw(`${this.draftKind === 'task' ? 'NEW INTENTION' : 'FIELD NOTE'}\n${this.draft.slice(-100) || 'Point and pinch to start typing…'} ▏`);
    this.tiles.get('KeyboardHint')!.draw(this.message || `${this.draft.length}/${this.draftKind === 'task' ? 72 : 500} characters · point and pinch`);
  }
  private say(message: string) {
    this.message = message; this.tiles.get('XRMessage')!.draw(message); this.tiles.get('TaskMessage')!.draw(message);
  }
  show(page: Page) {
    const changedGroveView = (this.page === 'grove') !== (page === 'grove');
    this.page = page;
    if (changedGroveView && this.root.visible) this.placeGarden();
    if (page !== 'keyboard') this.message = '';
    for (const [name, group] of this.pages) group.root.visible = name === page;
    for (const name of ['focus', 'tasks', 'grove', 'notes', 'help']) this.tiles.get(`Nav_${name}`)!.draw(name === 'tasks' ? 'Intentions' : name === 'notes' ? 'Field notes' : name[0].toUpperCase() + name.slice(1), page === name);
  }
  setVisible(visible: boolean) { this.root.visible = visible; if (visible) this.recenter(); }
  recenter() {
    this.world.camera.getWorldPosition(this.headPosition);
    this.world.camera.getWorldDirection(this.forward);
    this.forward.y = 0; this.forward.normalize();
    this.root.position.copy(this.headPosition); this.root.rotation.set(0, Math.atan2(-this.forward.x, -this.forward.z), 0);
    this.placeGarden();
  }

  private placeGarden() {
    const garden = this.world.getSceneObject('garden');
    if (garden) {
      garden.position.set(0, this.page === 'grove' ? -.52 : -.79, -1.85)
        .applyAxisAngle(new Vector3(0, 1, 0), this.root.rotation.y).add(this.root.position);
      garden.rotation.y = this.root.rotation.y;
    }
  }
  sync(snapshot: Snapshot) {
    this.snapshot = snapshot;
    const task = snapshot.tasks.find(t => t.id === snapshot.activeTaskId);
    const sec = Math.ceil(snapshot.remainingMs / 1000);
    const time = `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;
    this.tiles.get('FocusDisplay')!.draw(`${task?.title ?? 'Choose one small intention'}\n${time}\n${snapshot.phase === 'complete' ? 'A new lantern is lit.' : snapshot.phase === 'paused' ? 'Paused · take your time' : snapshot.phase === 'running' ? 'One thing. One quiet moment.' : 'A fresh start'}`, snapshot.phase === 'complete');
    const groveStatus = snapshot.phase === 'complete' ? 'Lantern lit' : snapshot.phase === 'paused' ? 'Focus paused' : snapshot.phase === 'running' ? `${time} remaining` : 'Ready for a focus session';
    this.tiles.get('GroveDisplay')!.draw(`THE NIGHT GROVE\n${groveStatus} · ${Math.min(12, snapshot.totalSessions)}/12 lanterns`);
    [2, 5, 8].forEach(d => this.tiles.get(`Duration${d}`)!.draw(`${d} min`, snapshot.durationMinutes === d));
    this.tiles.get('XRStart')!.draw(snapshot.phase === 'running' ? 'Pause this moment' : snapshot.phase === 'paused' ? 'Resume this moment' : snapshot.phase === 'complete' ? 'Begin another moment' : 'Begin a little moment', true);
    this.tiles.get('XRSound')!.draw(snapshot.soundEnabled ? 'Sound on' : 'Sound off');
    if (this.taskOffset >= snapshot.tasks.length) this.taskOffset = 0;
    for (let i = 0; i < 4; i++) {
      const item = snapshot.tasks[this.taskOffset + i];
      this.tiles.get(`Task${i}`)!.draw(item ? `${item.done ? '✓' : '○'}  ${item.title}` : '— an open space —', item?.id === snapshot.activeTaskId);
      this.tiles.get(`DeleteTask${i}`)!.mesh.visible = !!item;
    }
    this.tiles.get('TaskMessage')!.draw(this.message || `${snapshot.tasks.length}/8 intentions · pinch a finished intention to reopen it`);
    this.tiles.get('XRMessage')!.draw(this.message || (snapshot.phase === 'complete' ? 'Session complete. Open Grove to see your lantern.' : 'Rest your elbows. Point and pinch to select.'));
    const noteCharacters = Array.from(snapshot.note || 'What became a little clearer today?');
    const notePages = Math.max(1, Math.ceil(noteCharacters.length / 160));
    this.notePage = Math.min(this.notePage, notePages - 1);
    this.tiles.get('NotesDisplay')!.draw(`FIELD NOTES · ${this.notePage + 1}/${notePages}\n\n${noteCharacters.slice(this.notePage * 160, (this.notePage + 1) * 160).join('')}`);
    this.tiles.get('NotePrevious')!.mesh.visible = this.notePage > 0;
    this.tiles.get('NoteNext')!.mesh.visible = this.notePage < notePages - 1;
    this.tiles.get('NotesStats')!.draw(`${snapshot.totalSessions} moments  ·  ${snapshot.totalFocusMinutes} focus minutes  ·  ${snapshot.streakDays} day streak`);
    if (snapshot.storageWarning) this.say('Local saving needs attention. Open desktop Settings to recover or export a backup.');
  }
}
