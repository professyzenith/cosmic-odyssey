/**
 * AmbientAudio — Web Audio API synthesized space soundtrack.
 * Fixed: ConstantSourceNode replaced with BufferSource DC offset (Safari compat).
 * Fixed: async/await on ctx.resume(), proper gain ramp sequencing.
 */
export class AmbientAudio {
  constructor() {
    this.ctx        = null;
    this.masterGain = null;
    this.started    = false;
    this.muted      = false;
    this.volume     = 0.40;
    this.oscillators = [];
    this._sweepTimer = null;
  }

  // ── Safari-safe DC offset node (replaces ConstantSourceNode) ──────────────
  _createDC(value) {
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const data   = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = value;
    const source  = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop   = true;
    source.start();
    this.oscillators.push(source);
    return source;
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  async start() {
    if (this.started) return;
    this.started = true;

    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.ctx.destination);

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this._buildDrones();
    this._buildPulse();
    this._buildHarmonics();
    this._buildSparkle();

    // Fade in over 3 seconds
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(0, t);
    this.masterGain.gain.linearRampToValueAtTime(this.volume, t + 3);
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (!this.masterGain || this.muted) return;
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
    this.masterGain.gain.linearRampToValueAtTime(this.volume, t + 0.08);
  }

  toggleMute() {
    if (!this.masterGain) return this.muted;
    this.muted = !this.muted;
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
    if (this.muted) {
      this.masterGain.gain.linearRampToValueAtTime(0, t + 1.0);   // 1s fade out
    } else {
      this.masterGain.gain.linearRampToValueAtTime(this.volume, t + 0.5); // 0.5s fade in
    }
    return this.muted;
  }

  // ── Drone layer ────────────────────────────────────────────────────────────
  _buildDrones() {
    const { ctx } = this;

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.55;
    droneGain.connect(this.masterGain);

    const delay = ctx.createDelay(2.0);
    delay.delayTime.value = 1.6;
    const fbGain = ctx.createGain();
    fbGain.gain.value = 0.30;
    delay.connect(fbGain);
    fbGain.connect(delay);
    delay.connect(droneGain);

    const lpf = ctx.createBiquadFilter();
    lpf.type            = 'lowpass';
    lpf.frequency.value = 700;
    lpf.Q.value         = 0.6;
    lpf.connect(delay);

    const drones = [
      { f: 110.00, d:   0, g: 0.55 },
      { f: 110.00, d: -10, g: 0.35 },
      { f: 164.81, d:   6, g: 0.40 },
      { f: 220.00, d:  -5, g: 0.32 },
      { f: 277.18, d:   7, g: 0.22 },
    ];

    drones.forEach(d => {
      const osc = ctx.createOscillator();
      osc.type            = 'sine';
      osc.frequency.value = d.f;
      osc.detune.value    = d.d;

      const g = ctx.createGain();
      g.gain.value = d.g;

      const lfo     = ctx.createOscillator();
      lfo.type      = 'sine';
      lfo.frequency.value = 0.07 + Math.random() * 0.06;
      const lfoAmt  = ctx.createGain();
      lfoAmt.gain.value = d.f * 0.0025;
      lfo.connect(lfoAmt);
      lfoAmt.connect(osc.frequency);
      lfo.start();

      osc.connect(g);
      g.connect(lpf);
      osc.start();
      this.oscillators.push(osc, lfo);
    });
  }

  // ── Pulse layer — uses BufferSource DC offset instead of ConstantSourceNode ─
  _buildPulse() {
    const { ctx } = this;

    const layerGain = ctx.createGain();
    layerGain.gain.value = 0.18;
    layerGain.connect(this.masterGain);

    const bpf = ctx.createBiquadFilter();
    bpf.type            = 'bandpass';
    bpf.frequency.value = 440;
    bpf.Q.value         = 1.8;
    bpf.connect(layerGain);

    const osc = ctx.createOscillator();
    osc.type            = 'triangle';
    osc.frequency.value = 220;

    const ampGain = ctx.createGain();
    ampGain.gain.value = 0;
    osc.connect(ampGain);
    ampGain.connect(bpf);
    osc.start();

    // DC offset +0.5 via BufferSource (Safari-safe replacement for ConstantSourceNode)
    const dc = this._createDC(0.5);
    dc.connect(ampGain.gain);

    // LFO scaled to ±0.5, plus DC 0.5 → result 0..1
    const lfo = ctx.createOscillator();
    lfo.type            = 'sine';
    lfo.frequency.value = 0.16;
    const lfoScale      = ctx.createGain();
    lfoScale.gain.value = 0.5;
    lfo.connect(lfoScale);
    lfoScale.connect(ampGain.gain);
    lfo.start();
    this.oscillators.push(osc, lfo);

    this._scheduleBpfSweep(bpf);
  }

  _scheduleBpfSweep(bpf) {
    const sweep = () => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      bpf.frequency.cancelScheduledValues(t);
      bpf.frequency.setValueAtTime(bpf.frequency.value, t);
      bpf.frequency.linearRampToValueAtTime(700, t + 28);
      bpf.frequency.linearRampToValueAtTime(320, t + 56);
      this._sweepTimer = setTimeout(sweep, 55000);
    };
    setTimeout(sweep, 38000);
  }

  // ── Harmonic shimmer — also uses BufferSource DC offset ────────────────────
  _buildHarmonics() {
    const { ctx } = this;

    const layerGain = ctx.createGain();
    layerGain.gain.value = 0.09;
    layerGain.connect(this.masterGain);

    const hpf = ctx.createBiquadFilter();
    hpf.type            = 'highpass';
    hpf.frequency.value = 1100;
    hpf.connect(layerGain);

    [880, 1320, 1760, 2200].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type            = 'sine';
      osc.frequency.value = freq;

      const g = ctx.createGain();
      g.gain.value = 0.28 / (i + 1);

      // DC offset via BufferSource
      const dc = this._createDC(0.5);
      dc.connect(g.gain);

      const lfo = ctx.createOscillator();
      lfo.type            = 'sine';
      lfo.frequency.value = 0.025 + i * 0.009;
      const lfoScale      = ctx.createGain();
      lfoScale.gain.value = 0.5;
      lfo.connect(lfoScale);
      lfoScale.connect(g.gain);
      lfo.start();

      osc.connect(g);
      g.connect(hpf);
      osc.start();
      this.oscillators.push(osc, lfo);
    });
  }

  // ── Sparkle layer ──────────────────────────────────────────────────────────
  _buildSparkle() {
    const { ctx } = this;
    const layerGain = ctx.createGain();
    layerGain.gain.value = 0.10;
    layerGain.connect(this.masterGain);

    const scale = [523.25, 659.25, 783.99, 1046.5, 1318.5, 2093, 2637];

    const spark = () => {
      if (!this.ctx || !this.started) return;
      const t    = this.ctx.currentTime;
      const freq = scale[Math.floor(Math.random() * scale.length)];
      const dur  = 1.8 + Math.random() * 2.2;

      const osc = this.ctx.createOscillator();
      osc.type            = 'sine';
      osc.frequency.value = freq;
      osc.frequency.exponentialRampToValueAtTime(
        freq * (0.985 + Math.random() * 0.03), t + dur
      );

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.35 + Math.random() * 0.25, t + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      osc.connect(g);
      g.connect(layerGain);
      osc.start(t);
      osc.stop(t + dur + 0.1);

      setTimeout(spark, 3500 + Math.random() * 8500);
    };
    setTimeout(spark, 5000);
  }
}
