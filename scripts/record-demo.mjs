/**
 * Capture actual IWSDK/IWER WebGL frames with the browser's MediaRecorder.
 * This is not a renderer or gameplay simulator. It records the app's own canvas
 * continuously while normal CLI/browser input operates the live experience.
 *
 * Run sequentially against an existing --allow-browser-automation session:
 *   STILLSPACE_DEMO_ACTION=start iwsdk browser run scripts/record-demo.mjs
 *   # Drive the live app with official IWSDK hand input commands.
 *   STILLSPACE_DEMO_ACTION=status iwsdk browser run scripts/record-demo.mjs
 *   STILLSPACE_DEMO_ACTION=stop iwsdk browser run scripts/record-demo.mjs
 *
 * Enter immersive VR before starting. The recording is silent, marked as an
 * emulator capture in its metadata, and capped at 165 seconds (< 3 minutes).
 * No generated imagery, time manipulation, or fake completion is introduced.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export default async function ({ page, frame, workspaceRoot }) {
  const app = frame ?? page;
  const action = process.env.STILLSPACE_DEMO_ACTION ?? 'status';
  if (!['start', 'status', 'stop'].includes(action)) throw new Error('STILLSPACE_DEMO_ACTION must be start, status, or stop.');

  if (action === 'start') {
    return app.evaluate(() => {
      if (window.__stillspaceDemoRecording) throw new Error('A recording already exists. Stop/save it before starting another.');
      const world = window.__stillspace?.world;
      if (!world?.renderer.xr.isPresenting) throw new Error('Enter the app’s immersive VR session before recording.');
      if (typeof MediaRecorder === 'undefined') throw new Error('MediaRecorder is not available in this browser.');
      const canvas = world.renderer.domElement;
      if (typeof canvas.captureStream !== 'function') throw new Error('Canvas video capture is not supported.');
      const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type));
      if (!mimeType) throw new Error('This browser cannot encode WebM.');
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 1_500_000 });
      const state = {
        recorder, stream, chunks: [], blob: null, startedAt: Date.now(), stoppedAt: null,
        mimeType, width: canvas.width, height: canvas.height, timer: null,
        source: 'Actual Stillspace WebGL canvas in an active IWER immersive VR session',
        stopReason: null,
      };
      recorder.addEventListener('dataavailable', event => { if (event.data.size) state.chunks.push(event.data); });
      recorder.addEventListener('stop', () => {
        state.stoppedAt = Date.now();
        state.blob = new Blob(state.chunks, { type: state.mimeType });
        state.stream.getTracks().forEach(track => track.stop());
      });
      recorder.addEventListener('error', event => { state.error = event.error?.message ?? 'MediaRecorder failed.'; });
      state.timer = setTimeout(() => {
        state.stopReason = '165-second duration cap';
        if (recorder.state !== 'inactive') recorder.stop();
      }, 165_000);
      window.__stillspaceDemoRecording = state;
      recorder.start(1000);
      return { recording: true, mimeType, width: canvas.width, height: canvas.height, maxSeconds: 165, audio: false, source: state.source };
    });
  }

  if (action === 'status') {
    return app.evaluate(() => {
      const state = window.__stillspaceDemoRecording;
      if (!state) return { recording: false, exists: false };
      return {
        recording: state.recorder.state === 'recording', exists: true,
        elapsedSeconds: ((state.stoppedAt ?? Date.now()) - state.startedAt) / 1000,
        chunks: state.chunks.length, bytes: state.blob?.size ?? state.chunks.reduce((sum, chunk) => sum + chunk.size, 0),
        stopReason: state.stopReason, error: state.error ?? null,
      };
    });
  }

  const captured = await app.evaluate(async () => {
    const state = window.__stillspaceDemoRecording;
    if (!state) throw new Error('No recording exists in this app page.');
    clearTimeout(state.timer);
    if (state.recorder.state !== 'inactive') {
      state.stopReason = 'Explicit stop';
      await new Promise(resolve => {
        state.recorder.addEventListener('stop', resolve, { once: true });
        state.recorder.stop();
      });
    }
    if (state.error) throw new Error(state.error);
    if (!state.blob?.size) throw new Error('The canvas capture produced no video data.');
    if (state.blob.size > 50_000_000) throw new Error('Unexpectedly large capture; recording was retained in the page.');
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(state.blob);
    });
    let poster = null;
    try {
      const video = document.createElement('video');
      video.muted = true; video.preload = 'auto';
      const objectUrl = URL.createObjectURL(state.blob);
      video.src = objectUrl;
      await Promise.race([
        new Promise((resolve, reject) => { video.onloadeddata = resolve; video.onerror = reject; video.load(); }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Poster decode timed out.')), 3000)),
      ]);
      const image = document.createElement('canvas');
      image.width = Math.min(video.videoWidth, 1280); image.height = Math.round(video.videoHeight * image.width / video.videoWidth);
      image.getContext('2d').drawImage(video, 0, 0, image.width, image.height);
      poster = image.toDataURL('image/jpeg', .9);
      URL.revokeObjectURL(objectUrl);
    } catch { /* Preserve the video even if this browser cannot decode a poster. */ }
    return {
      video: dataUrl.split(',')[1], poster: poster?.split(',')[1] ?? null,
      metadata: {
        source: state.source, emulator: 'IWER / Meta Quest profile', mimeType: state.mimeType,
        width: state.width, height: state.height, audio: false,
        startedAt: new Date(state.startedAt).toISOString(), stoppedAt: new Date(state.stoppedAt).toISOString(),
        durationSeconds: (state.stoppedAt - state.startedAt) / 1000, bytes: state.blob.size,
        stopReason: state.stopReason,
        note: 'Continuous actual application canvas footage. No AI-generated video, scene replacement, timer manipulation, or hardware-performance claim.',
      },
    };
  });
  const output = path.join(workspaceRoot, 'artifacts');
  await mkdir(output, { recursive: true });
  const name = process.env.STILLSPACE_DEMO_NAME ?? 'stillspace-emulator-demo';
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error('Invalid recording file name.');
  const videoPath = path.join(output, `${name}.webm`);
  await writeFile(videoPath, Buffer.from(captured.video, 'base64'));
  await writeFile(path.join(output, `${name}.json`), `${JSON.stringify(captured.metadata, null, 2)}\n`);
  let posterPath = null;
  if (captured.poster) {
    posterPath = path.join(output, `${name}-poster.jpg`);
    await writeFile(posterPath, Buffer.from(captured.poster, 'base64'));
  }
  await app.evaluate(() => { delete window.__stillspaceDemoRecording; });
  return { videoPath, posterPath, ...captured.metadata };
}
