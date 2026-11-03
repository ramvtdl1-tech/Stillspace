/** Original synthesized audio. Audio starts only after an explicit user gesture. */
export class GardenAudio {
  private context?: AudioContext;
  private active = false;
  private initialized = false;
  async setEnabled(enabled: boolean) {
    this.active = enabled;
    if (!enabled) { this.suspend(); return; }
    try {
      this.context ??= new AudioContext();
      await this.context.resume();
      if (!this.initialized) {
        const gain = this.context.createGain(); gain.gain.value = 0.008;
        gain.connect(this.context.destination);
        for (const frequency of [130.81, 196, 261.63]) {
          const oscillator = this.context.createOscillator();
          oscillator.frequency.value = frequency; oscillator.connect(gain); oscillator.start();
        }
        this.initialized = true;
      }
    } catch { /* Sound is optional and never blocks the focus loop. */ }
  }
  suspend() { void this.context?.suspend().catch(() => {}); }
  resume() { if (this.active) void this.context?.resume().catch(() => {}); }
  blossom() {
    if (!this.context || !this.active || this.context.state !== 'running') return;
    const start = this.context.currentTime;
    [523.25, 659.25, 783.99].forEach((frequency, i) => {
      const oscillator = this.context!.createOscillator(); const gain = this.context!.createGain();
      oscillator.frequency.value = frequency; gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(0.03, start + i * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + i * 0.15 + 1.2);
      oscillator.connect(gain); gain.connect(this.context!.destination);
      oscillator.start(start + i * 0.15); oscillator.stop(start + i * 0.15 + 1.3);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  }
}
