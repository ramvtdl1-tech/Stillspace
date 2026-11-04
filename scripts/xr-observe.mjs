export default async function ({ page, frame }) {
  return (frame ?? page).evaluate(() => {
    const { world, snapshot } = window.__stillspace;
    const controls = {};
    for (const name of ['XRWelcome','XRStart','XRReset','Nav_tasks','Nav_focus','Nav_notes','XRAddTask','Key_q','KeySave','XRExit','XRRecenter','Nav_grove','Duration2']) {
      const object = world.scene.getObjectByName(name);
      const e = object.matrixWorld.elements;
      controls[name] = { x: e[12], y: e[13], z: e[14] };
    }
    const garden = world.requireSceneObject('garden');
    const litStones = Array.from({ length: 12 }, (_, i) => garden.getObjectByName(`PathStone${i + 1}`).material.emissiveIntensity).filter(level => level > 0).length;
    const visibleLanterns = garden.getObjectByName('EarnedLanterns').children.filter(object => object.visible).length;
    return { litStones, visibleLanterns, remainingMs: snapshot.remainingMs, active: world.renderer.xr.isPresenting, phase: snapshot.phase, tasks: snapshot.tasks.map(t=>t.title), sessions: snapshot.totalSessions, pages: ['focus','tasks','notes','help','keyboard','grove'].filter(name => world.scene.getObjectByName(`Page_${name}`).visible), controls };
  });
}
