export default async function ({ page, frame }) {
  const app = frame ?? page;
  return { page: page.url(), frames: page.frames().map(f => f.url()), state: await app.evaluate(() => ({ title: document.title, ready: !!window.__stillspace, loading: document.getElementById('scene-loading')?.textContent, timer: document.getElementById('timer')?.textContent, canvas: document.querySelectorAll('canvas').length, label: document.getElementById('vr-label')?.textContent, error: document.querySelector('vite-error-overlay')?.textContent, ids: document.querySelectorAll('[id]').length })) };
}
