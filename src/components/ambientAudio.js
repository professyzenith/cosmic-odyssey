/* ═══════════════════════════════════════════════════════════════
   COSMIC ODYSSEY — Real Violin Audio Player
   ─ Uses the actual violin MP3 file from your playlist
   ─ HTML5 Audio element → Web Audio API for smooth fades
   ─ Loops seamlessly
   ─ 3.5s fade-in on start, 2.8s fade-out on stop
   ═══════════════════════════════════════════════════════════════ */

export class AmbientAudio {
  constructor() {
    this.ctx        = null;
    this.master     = null;
    this.source     = null;
    this.audio      = null;
    this.started    = false;
    this.muted      = false;
    this.volume     = 0.60;
    this._fadeTimer = null;
  }

  /* ── Start ────────────────────────────────────────────────── */
  async start() {
    if (this.started) return;
    this.started = true;

    /* Create AudioContext */
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    /* Master gain (controls volume & fades) */
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);

    /* HTML5 Audio element — loops the MP3 */
    this.audio = new Audio('/violin.mp3');
    this.audio.loop   = true;
    this.audio.crossOrigin = 'anonymous';

    /* Connect audio element → Web Audio API */
    this.source = this.ctx.createMediaElementSource(this.audio);
    this.source.connect(this.master);

    /* Play */
    try {
      await this.audio.play();
    } catch (err) {
      console.warn('Cosmic Odyssey — audio play failed:', err);
    }

    /* Fade in over 3.5s */
    const t = this.ctx.currentTime;
    this.master.gain.setValueAtTime(0, t);
    this.master.gain.linearRampToValueAtTime(this.volume, t + 3.5);
  }

  /* ── Smooth stop (2.8s fade out) ─────────────────────────── */
  stop() {
    if (!this.master || !this.ctx) return;
    clearTimeout(this._fadeTimer);
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + 2.8);
    this._fadeTimer = setTimeout(() => {
      try { this.audio.pause(); } catch (_) {}
    }, 3000);
  }

  /* ── Resume ───────────────────────────────────────────────── */
  async resume() {
    if (!this.ctx || !this.audio) return;
    clearTimeout(this._fadeTimer);
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    try { await this.audio.play(); } catch (_) {}
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(0, t);
    this.master.gain.linearRampToValueAtTime(this.volume, t + 2.0);
  }

  /* ── Toggle mute (2.5s fade) ─────────────────────────────── */
  toggleMute() {
    if (!this.master) return this.muted;
    this.muted = !this.muted;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    if (this.muted) {
      this.master.gain.linearRampToValueAtTime(0, t + 2.5);
    } else {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.master.gain.linearRampToValueAtTime(this.volume, t + 1.8);
    }
    return this.muted;
  }

  /* ── Volume ───────────────────────────────────────────────── */
  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (!this.master || this.muted) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(this.volume, t + 0.12);
  }
}
