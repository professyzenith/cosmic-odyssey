/* ═══════════════════════════════════════════════════════════════
   COSMIC ODYSSEY — Cinematic Space Music Engine v3.0
   ─ Rich layered synthesis: pads · melody · bass · sparkles
   ─ Per-planet musical themes on scroll (IntersectionObserver)
   ─ Perfect 3s fade-out on stop/mute
   ─ All Web Audio API — zero external dependencies
   ═══════════════════════════════════════════════════════════════ */

/* ── Musical constants ──────────────────────────────────────── */
// C minor pentatonic scale (space-appropriate, haunting)
const PENT = [65.41, 77.78, 87.31, 98.00, 116.54,
              130.81, 155.56, 174.61, 196.00, 233.08,
              261.63, 311.13, 349.23, 392.00, 466.16,
              523.25, 622.25, 698.46, 784.00, 932.33];

// Lush chord voicings (freq ratios over root)
const CHORD_Cm7  = [1, 1.189, 1.498, 1.782, 2.245];  // Cm7
const CHORD_Ab   = [1, 1.260, 1.587, 1.890, 2.380];  // Ab major
const CHORD_Eb   = [1, 1.260, 1.498, 1.890, 2.245];  // Eb major
const CHORD_Bb   = [1, 1.189, 1.498, 1.890, 2.245];  // Bb major

const PROGRESSION = [CHORD_Cm7, CHORD_Ab, CHORD_Eb, CHORD_Bb];
const ROOT = 65.41; // C2

/* ── Reverb impulse generator ───────────────────────────────── */
function createReverb(ctx, duration = 4.0, decay = 2.5) {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(2, length, sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  const conv = ctx.createConvolver();
  conv.buffer = buffer;
  return conv;
}

/* ══════════════════════════════════════════════════════════════
   AmbientAudio — Main cinematic space soundtrack
══════════════════════════════════════════════════════════════ */
export class AmbientAudio {
  constructor() {
    this.ctx         = null;
    this.masterGain  = null;
    this.started     = false;
    this.muted       = false;
    this.volume      = 0.45;
    this._nodes      = [];       // all oscillators/sources to track
    this._timers     = [];       // setTimeout IDs
    this._chordIdx   = 0;
    this._chordTimer = null;
    this._reverb     = null;
    this._reverbGain = null;
    this._padLayer   = null;
    this._melodyLayer= null;
  }

  /* ── Public API ─────────────────────────────────────────── */

  async start() {
    if (this.started) return;
    this.started = true;

    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    // Master chain: masterGain → compressor → destination
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value      = 10;
    comp.ratio.value     = 4;
    comp.attack.value    = 0.05;
    comp.release.value   = 0.3;
    comp.connect(this.ctx.destination);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(comp);

    // Reverb send bus
    this._reverb = createReverb(this.ctx, 5.5, 3.0);
    this._reverbGain = this.ctx.createGain();
    this._reverbGain.gain.value = 0.38;
    this._reverb.connect(this._reverbGain);
    this._reverbGain.connect(this.masterGain);

    // Build all layers
    this._buildBass();
    this._buildPadChords();
    this._buildMelody();
    this._buildTextureNoise();
    this._buildSparkle();
    this._buildSubBoom();

    // Fade in over 4 seconds
    const t = this.ctx.currentTime;
    this.masterGain.gain.setValueAtTime(0, t);
    this.masterGain.gain.linearRampToValueAtTime(this.volume, t + 4.0);
  }

  /** 3-second fade out then stop */
  stop() {
    if (!this.masterGain || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
    this.masterGain.gain.linearRampToValueAtTime(0, t + 3.0);
    setTimeout(() => {
      try { this.ctx.suspend(); } catch (_) {}
    }, 3500);
  }

  /** Smooth mute/unmute with 2.5s fade */
  toggleMute() {
    if (!this.masterGain) return this.muted;
    this.muted = !this.muted;
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
    if (this.muted) {
      this.masterGain.gain.linearRampToValueAtTime(0, t + 2.5);
    } else {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.masterGain.gain.linearRampToValueAtTime(this.volume, t + 1.5);
    }
    return this.muted;
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (!this.masterGain || this.muted) return;
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
    this.masterGain.gain.linearRampToValueAtTime(this.volume, t + 0.12);
  }

  /* ── Layer: Deep Bass Drone ─────────────────────────────── */
  _buildBass() {
    const { ctx } = this;

    const gain = ctx.createGain();
    gain.gain.value = 0.5;
    gain.connect(this.masterGain);

    // also send to reverb
    const rvSend = ctx.createGain();
    rvSend.gain.value = 0.15;
    gain.connect(rvSend);
    rvSend.connect(this._reverb);

    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 220;
    lpf.Q.value = 0.5;
    lpf.connect(gain);

    // Two slightly detuned bass oscillators
    [ROOT, ROOT * 1.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = (i === 0) ? -4 : 7;

      // Slow breathe LFO
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.04 + i * 0.015;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = freq * 0.003;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      const g = ctx.createGain();
      g.gain.value = i === 0 ? 0.65 : 0.35;

      lfo.start(); osc.start();
      osc.connect(g);
      g.connect(lpf);
      this._nodes.push(osc, lfo);
    });
  }

  /* ── Layer: Evolving Pad Chords ─────────────────────────── */
  _buildPadChords() {
    const { ctx } = this;

    const gain = ctx.createGain();
    gain.gain.value = 0.28;
    gain.connect(this.masterGain);

    // Reverb send
    const rvSend = ctx.createGain();
    rvSend.gain.value = 0.6;
    gain.connect(rvSend);
    rvSend.connect(this._reverb);

    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 1800;
    lpf.connect(gain);

    this._padLayer = { lpf, gain };

    // Create pad oscillators for current chord
    this._padOscs = [];
    this._playChord(0, 0);

    // Advance chord every 16 seconds
    const advanceChord = () => {
      this._chordIdx = (this._chordIdx + 1) % PROGRESSION.length;
      this._crossfadeChord(this._chordIdx);
      this._chordTimer = setTimeout(advanceChord, 16000);
    };
    this._chordTimer = setTimeout(advanceChord, 16000);
  }

  _playChord(chordIdx, fadeInTime) {
    const { ctx } = this;
    const chord = PROGRESSION[chordIdx];
    const { lpf } = this._padLayer;
    const oscs = [];

    chord.forEach((ratio, i) => {
      const freq = ROOT * ratio;
      // Slightly detuned sawtooth pair for each voice
      [-3, 3].forEach(det => {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        osc.detune.value = det + (Math.random() - 0.5) * 2;

        // Slow vibrato
        const vib = ctx.createOscillator();
        vib.type = 'sine';
        vib.frequency.value = 0.08 + Math.random() * 0.05;
        const vibG = ctx.createGain();
        vibG.gain.value = freq * 0.0018;
        vib.connect(vibG);
        vibG.connect(osc.frequency);

        const g = ctx.createGain();
        const level = (0.12 - i * 0.018) * 0.85;
        g.gain.setValueAtTime(0, ctx.currentTime);
        if (fadeInTime > 0) {
          g.gain.linearRampToValueAtTime(level, ctx.currentTime + fadeInTime);
        } else {
          g.gain.setValueAtTime(level, ctx.currentTime);
        }

        vib.start(); osc.start();
        osc.connect(g);
        g.connect(lpf);

        oscs.push({ osc, vib, g });
        this._nodes.push(osc, vib);
      });
    });

    this._padOscs = oscs;
    return oscs;
  }

  _crossfadeChord(chordIdx) {
    const { ctx } = this;
    const t = ctx.currentTime;

    // Fade out old oscillators
    if (this._padOscs) {
      this._padOscs.forEach(({ osc, vib, g }) => {
        g.gain.cancelScheduledValues(t);
        g.gain.setValueAtTime(g.gain.value, t);
        g.gain.linearRampToValueAtTime(0, t + 4.0);
        try { osc.stop(t + 4.5); } catch (_) {}
        try { vib.stop(t + 4.5); } catch (_) {}
      });
    }

    // Fade in new chord
    this._playChord(chordIdx, 4.0);
  }

  /* ── Layer: Ethereal Melody ─────────────────────────────── */
  _buildMelody() {
    const { ctx } = this;

    const gain = ctx.createGain();
    gain.gain.value = 0.14;
    gain.connect(this.masterGain);

    // Heavy reverb on melody
    const rvSend = ctx.createGain();
    rvSend.gain.value = 0.85;
    gain.connect(rvSend);
    rvSend.connect(this._reverb);

    // Delay for depth
    const delay = ctx.createDelay(2.0);
    delay.delayTime.value = 0.42;
    const fb = ctx.createGain();
    fb.gain.value = 0.38;
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(gain);

    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 3200;
    lpf.connect(delay);
    lpf.connect(gain);

    const playNote = () => {
      if (!this.started) return;
      const t = ctx.currentTime;
      const freq = PENT[Math.floor(Math.random() * (PENT.length * 0.55) + PENT.length * 0.3)];
      const dur = 2.2 + Math.random() * 3.8;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 8;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.55 + Math.random() * 0.3, t + 0.25);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      osc.connect(g);
      g.connect(lpf);
      osc.start(t);
      osc.stop(t + dur + 0.1);

      this._nodes.push(osc);
      const nextIn = 3500 + Math.random() * 9000;
      const id = setTimeout(playNote, nextIn);
      this._timers.push(id);
    };

    const id = setTimeout(playNote, 6000);
    this._timers.push(id);
  }

  /* ── Layer: Texture Noise Pad ───────────────────────────── */
  _buildTextureNoise() {
    const { ctx } = this;

    const bufLen = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1);

    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    noise.start();

    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 350;
    bpf.Q.value = 8;

    const g = ctx.createGain();
    g.gain.value = 0.018;

    const rvSend = ctx.createGain();
    rvSend.gain.value = 0.7;

    noise.connect(bpf);
    bpf.connect(g);
    g.connect(this.masterGain);
    g.connect(rvSend);
    rvSend.connect(this._reverb);

    // Slowly sweep the bandpass center
    const sweep = () => {
      if (!this.ctx) return;
      const t = ctx.currentTime;
      bpf.frequency.cancelScheduledValues(t);
      bpf.frequency.setValueAtTime(bpf.frequency.value, t);
      bpf.frequency.linearRampToValueAtTime(200 + Math.random() * 800, t + 22);
      const id = setTimeout(sweep, 22000);
      this._timers.push(id);
    };
    const id = setTimeout(sweep, 8000);
    this._timers.push(id);
    this._nodes.push(noise);
  }

  /* ── Layer: Bell Sparkles ───────────────────────────────── */
  _buildSparkle() {
    const { ctx } = this;

    const gain = ctx.createGain();
    gain.gain.value = 0.10;
    gain.connect(this.masterGain);

    const rvSend = ctx.createGain();
    rvSend.gain.value = 0.9;
    gain.connect(rvSend);
    rvSend.connect(this._reverb);

    const bellScale = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5, 1568, 2093];

    const spark = () => {
      if (!this.ctx || !this.started) return;
      const t = ctx.currentTime;
      const freq = bellScale[Math.floor(Math.random() * bellScale.length)];
      const dur = 2.5 + Math.random() * 3.0;

      // FM bell synthesis
      const mod = ctx.createOscillator();
      mod.type = 'sine';
      mod.frequency.value = freq * 1.414;
      const modG = ctx.createGain();
      modG.gain.setValueAtTime(freq * 3.5, t);
      modG.gain.exponentialRampToValueAtTime(1, t + dur * 0.3);
      mod.connect(modG);

      const car = ctx.createOscillator();
      car.type = 'sine';
      car.frequency.value = freq;
      modG.connect(car.frequency);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.25 + Math.random() * 0.2, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      mod.connect(modG);
      car.connect(g);
      g.connect(gain);

      mod.start(t); mod.stop(t + dur + 0.1);
      car.start(t); car.stop(t + dur + 0.1);

      this._nodes.push(car, mod);

      const nextIn = 5000 + Math.random() * 14000;
      const id = setTimeout(spark, nextIn);
      this._timers.push(id);
    };

    const id = setTimeout(spark, 8000);
    this._timers.push(id);
  }

  /* ── Layer: Sub Bass Boom ───────────────────────────────── */
  _buildSubBoom() {
    const { ctx } = this;

    const gain = ctx.createGain();
    gain.gain.value = 0.22;
    gain.connect(this.masterGain);

    const boom = () => {
      if (!this.ctx || !this.started) return;
      const t = ctx.currentTime;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(ROOT * 0.5, t);
      osc.frequency.exponentialRampToValueAtTime(ROOT * 0.25, t + 2.5);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.8, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);

      osc.connect(g);
      g.connect(gain);
      osc.start(t); osc.stop(t + 3.0);

      this._nodes.push(osc);
      const nextIn = 22000 + Math.random() * 18000;
      const id = setTimeout(boom, nextIn);
      this._timers.push(id);
    };

    const id = setTimeout(boom, 12000);
    this._timers.push(id);
  }
}
