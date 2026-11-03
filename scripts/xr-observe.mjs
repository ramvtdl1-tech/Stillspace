export default async function ({ page, frame }) {
  return (frame ?? page).evaluate(() => {
    const { world, snapshot } = window.__stillspace;
    const controls = {};
    for (const name of ['XRWelcome','XRStart','XRReset','Nav_tasks','Nav_focus','Nav_notes','XRAddTask','Key_q','KeySave','XRExit','XRRecenter']) {
      const object = world.scene.getObjectByName(name);
      const e = object.matrixWorld.elements;
      controls[name] = { x: e[12], y: e[13], z: e[14] };
    }
    return { active: world.renderer.xr.isPresenting, phase: snapshot.phase, tasks: snapshot.tasks.map(t=>t.title), sessions: snapshot.totalSessions, pages: ['focus','tasks','notes','help','keyboard'].filter(name => world.scene.getObjectByName(`Page_${name}`).visible), controls };
  });
}
