/* ═══════════════════════════════════════════════════════════════
   COSMIC ODYSSEY — Cherishing Violin Music Engine
   ─ A composed melodic violin piece (D minor pentatonic)
   ─ Two violin voices: melody + soft harmony
   ─ Real bow synthesis: sawtooth + vibrato + bandpass filter
   ─ Hall reverb + delay for space depth
   ─ Auto-plays on first user interaction
   ─ Smooth 3s fade out on stop
   ═══════════════════════════════════════════════════════════════ */

/* ── Hall reverb generator ───────────────────────────────────── */
function _mkReverb(ctx, secs = 5.0, decay = 3.5) {
  const sr = ctx.sampleRate, len = sr * secs;
  const buf = ctx.createBuffer(2, len, sr);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  const conv = ctx.createConvolver();
  conv.buffer = buf;
  return conv;
}

/* ── Composed melody — D minor pentatonic ───────────────────── */
// D4=293.66  F4=349.23  G4=392.00  A4=440.00
// C5=523.25  D5=587.33  F5=698.46  G5=784.00
const D4=293.66, F4=349.23, G4=392.00, A4=440.00,
      C5=523.25, D5=587.33, F5=698.46, G5=784.00,
      REST=0;

// [freq, duration_seconds]  — one 64-second phrase, then loops
const MELODY = [
  [D5, 2.8], [C5, 1.4], [A4, 3.2],
  [G4, 1.8], [A4, 1.4], [C5, 2.6],
  [D5, 4.0],
  [C5, 2.2], [A4, 1.8], [G4, 2.4],
  [F4, 1.6], [G4, 1.4], [A4, 3.0],
  [G4, 4.5],
  [A4, 2.0], [C5, 1.8], [D5, 2.4],
  [F5, 1.6], [D5, 1.8], [C5, 2.0],
  [A4, 4.8],
  [G4, 2.2], [F4, 1.6], [G4, 2.2],
  [A4, 1.8], [C5, 1.4], [D5, 1.4], [C5, 1.2],
  [A4, 5.5],
];

// Harmony — a perfect fourth/fifth below melody
const HARMONY = [
  [A4, 2.8], [G4, 1.4], [D4, 3.2],
  [D4, 1.8], [D4, 1.4], [G4, 2.6],
  [A4, 4.0],
  [G4, 2.2], [D4, 1.8], [D4, 2.4],
  [D4, 1.6], [D4, 1.4], [F4, 3.0],
  [D4, 4.5],
  [F4, 2.0], [G4, 1.8], [A4, 2.4],
  [D5, 1.6], [A4, 1.8], [G4, 2.0],
  [F4, 4.8],
  [D4, 2.2], [D4, 1.6], [D4, 2.2],
  [F4, 1.8], [G4, 1.4], [A4, 1.4], [G4, 1.2],
  [F4, 5.5],
];

/* ── Violin voice synthesizer ────────────────────────────────── */
/**
 * Play a single bowed violin note
 * @param {AudioContext} ctx
 * @param {number} freq   — frequency in Hz
 * @param {number} dur    — note duration in seconds
 * @param {number} t      — AudioContext time to start
 * @param {number} gain   — loudness 0..1
 * @param {AudioNode} out — destination node
 * @param {number} vibDelay — seconds before vibrato swells in
 */
function _bowNote(ctx, freq, dur, t, gain, out, vibDelay = 0.55) {
  if (freq === REST || dur <= 0) return;

  const attack  = 0.28;
  const release = 0.55;

  /* ── Fundamental sawtooth ── */
  const saw = ctx.createOscillator();
  saw.type = 'sawtooth';
  saw.frequency.value = freq;

  /* ── Vibrato (5.5 Hz, swells in after vibDelay) ── */
  const vib = ctx.createOscillator();
  vib.type = 'sine';
  vib.frequency.value = 5.5 + Math.random() * 0.5;
  const vibG = ctx.createGain();
  vibG.gain.setValueAtTime(0, t);
  vibG.gain.linearRampToValueAtTime(freq * 0.006, t + vibDelay);
  vib.connect(vibG);
  vibG.connect(saw.frequency);

  /* ── Bow pressure bandpass (body resonance) ── */
  const bpf = ctx.createBiquadFilter();
  bpf.type = 'bandpass';
  bpf.frequency.value = freq * 2.5;
  bpf.Q.value = 1.8;

  /* ── Octave harmonic (string overtone) ── */
  const saw2 = ctx.createOscillator();
  saw2.type = 'sawtooth';
  saw2.frequency.value = freq * 2.0;
  saw2.detune.value = -8;

  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.value = freq * 1.9;
  hpf.Q.value = 0.5;

  /* ── Amplitude envelope ── */
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(gain, t + attack);
  env.gain.setValueAtTime(gain, t + Math.max(attack, dur - release));
  env.gain.linearRampToValueAtTime(0, t + dur);

  const env2 = ctx.createGain();
  env2.gain.setValueAtTime(0, t);
  env2.gain.linearRampToValueAtTime(gain * 0.22, t + attack + 0.1);
  env2.gain.linearRampToValueAtTime(0, t + Math.max(attack, dur * 0.75));

  saw.connect(bpf);  bpf.connect(env);
  saw2.connect(hpf); hpf.connect(env2);
  env.connect(out);  env2.connect(out);

  vib.start(t); saw.start(t); saw2.start(t);
  vib.stop(t + dur + 0.2);
  saw.stop(t + dur + 0.2);
  saw2.stop(t + dur + 0.2);
}

/* ══════════════════════════════════════════════════════════════
   AmbientAudio — cherishing violin piece, auto-looping
══════════════════════════════════════════════════════════════ */
export class AmbientAudio {
  constructor() {
    this.ctx        = null;
    this.master     = null;
    this.started    = false;
    this.muted      = false;
    this.volume     = 0.52;
    this._reverb    = null;
    this._delay     = null;
    this._loopTimer = null;
    this._phraseStart = 0; // AudioContext time phrase began
  }

  /* ── Start ────────────────────────────────────────────────── */
  async start() {
    if (this.started) return;
    this.started = true;

    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    /* Master → compressor → destination */
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value      =  8;
    comp.ratio.value     =  5;
    comp.attack.value    = 0.04;
    comp.release.value   = 0.25;
    comp.connect(this.ctx.destination);

    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(comp);

    /* Hall reverb */
    this._reverb = _mkReverb(this.ctx, 5.5, 3.8);
    const rvGain = this.ctx.createGain();
    rvGain.gain.value = 0.55;
    this._reverb.connect(rvGain);
    rvGain.connect(this.master);

    /* Warm delay for depth */
    this._delay = this.ctx.createDelay(2.0);
    this._delay.delayTime.value = 0.38;
    const fbGain = this.ctx.createGain();
    fbGain.gain.value = 0.28;
    this._delay.connect(fbGain);
    fbGain.connect(this._delay);
    this._delay.connect(rvGain);

    /* Subtle drone pad (root D) — very soft warmth underneath */
    this._buildDronePad();

    /* Schedule first phrase immediately */
    this._schedulePhrase();

    /* Fade in over 3.5s */
    const t = this.ctx.currentTime;
    this.master.gain.setValueAtTime(0, t);
    this.master.gain.linearRampToValueAtTime(this.volume, t + 3.5);
  }

  /* ── Drone pad (root warmth) ──────────────────────────────── */
  _buildDronePad() {
    const ctx = this.ctx;
    [D4 * 0.5, D4, A4 * 0.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = (i - 1) * 3;

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.05 + i * 0.02;
      const lfoG = ctx.createGain();
      lfoG.gain.value = freq * 0.003;
      lfo.connect(lfoG);
      lfoG.connect(osc.frequency);

      const g = ctx.createGain();
      g.gain.value = [0.08, 0.06, 0.04][i];
      osc.connect(g);
      g.connect(this.master);

      const rvS = ctx.createGain();
      rvS.gain.value = 0.5;
      g.connect(rvS);
      rvS.connect(this._reverb);

      lfo.start(); osc.start();
    });
  }

  /* ── Schedule one full phrase ─────────────────────────────── */
  _schedulePhrase() {
    if (!this.ctx || !this.started) return;

    const ctx  = this.ctx;
    const now  = ctx.currentTime;
    let   t    = now + 0.1;

    /* ── Melody voice ── */
    const melNode = ctx.createGain();
    melNode.gain.value = 1.0;
    melNode.connect(this.master);

    // Reverb send for melody
    const melRv = ctx.createGain();
    melRv.gain.value = 0.75;
    melNode.connect(melRv);
    melRv.connect(this._reverb);

    // Delay send for melody
    const melDly = ctx.createGain();
    melDly.gain.value = 0.22;
    melNode.connect(melDly);
    melDly.connect(this._delay);

    let phraseDur = 0;
    MELODY.forEach(([freq, dur]) => {
      _bowNote(ctx, freq, dur, t, 0.28, melNode);
      t += dur + 0.05; // tiny gap between notes
      phraseDur += dur + 0.05;
    });

    /* ── Harmony voice (soft, enters 0.5s after melody) ── */
    const harmNode = ctx.createGain();
    harmNode.gain.value = 1.0;
    harmNode.connect(this.master);

    const harmRv = ctx.createGain();
    harmRv.gain.value = 0.65;
    harmNode.connect(harmRv);
    harmRv.connect(this._reverb);

    let th = now + 0.6;
    HARMONY.forEach(([freq, dur]) => {
      _bowNote(ctx, freq, dur, th, 0.14, harmNode, 0.7);
      th += dur + 0.05;
    });

    /* Loop — reschedule 1.5s before this phrase ends */
    const loopIn = (phraseDur - 1.5) * 1000;
    this._loopTimer = setTimeout(() => this._schedulePhrase(), loopIn);
  }

  /* ── Controls ─────────────────────────────────────────────── */

  /** Smooth 2.8s fade out → stop */
  stop() {
    if (!this.master || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + 2.8);
    clearTimeout(this._loopTimer);
    setTimeout(() => { try { this.ctx.suspend(); } catch(_) {} }, 3200);
  }

  /** Resume after stop */
  async resume() {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(0, t);
    this.master.gain.linearRampToValueAtTime(this.volume, t + 2.0);
    this._schedulePhrase();
  }

  /** Toggle mute with smooth fade */
  toggleMute() {
    if (!this.master) return this.muted;
    this.muted = !this.muted;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    if (this.muted) {
      this.master.gain.linearRampToValueAtTime(0, t + 2.8);
    } else {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.master.gain.linearRampToValueAtTime(this.volume, t + 1.8);
    }
    return this.muted;
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (!this.master || this.muted) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(this.volume, t + 0.12);
  }
}
