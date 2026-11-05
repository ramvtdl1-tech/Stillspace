const requested = new URLSearchParams(window.location.search).get('emulate') === '1';

if (requested) {
  const notice = document.getElementById('emulation-notice')!;
  const status = document.getElementById('emulation-status')!;
  notice.hidden = false;
  status.textContent = 'Loading laptop VR preview…';
  const exit = new URL(window.location.href);
  exit.searchParams.delete('emulate');
  (document.getElementById('leave-laptop-preview') as HTMLAnchorElement).href = exit.href;
  const nativeVR = !!navigator.xr && await navigator.xr.isSessionSupported('immersive-vr').catch(() => false);
  if (!nativeVR) {
    try {
      const [{ XRDevice, metaQuest3 }, { DevUI }] = await Promise.all([
        import('iwer'),
        import('@iwer/devui'),
      ]);
      const device = new XRDevice(metaQuest3);
      device.primaryInputMode = 'hand';
      device.installRuntime({ forceInstall: true });
      if (!await navigator.xr?.isSessionSupported('immersive-vr')) throw new Error('The emulated VR session is unavailable.');
      device.installDevUI(DevUI);
      document.body.dataset.emulation = 'ready';
      status.textContent = 'Laptop VR preview · simulated hands';
    } catch (error) {
      console.error('Stillspace laptop emulator could not load', error);
      document.body.dataset.emulation = 'failed';
      status.textContent = 'The laptop preview could not load. Reload this page to retry.';
    }
  } else notice.hidden = true;
}

await import('./index.js');

export {};
