/* ═══════════════════════════════════════════════════════════════
   COSMIC ODYSSEY — Planet Sounds Engine v3.0
   ─ Each planet has a unique cinematic musical theme
   ─ Triggered on scroll into view (IntersectionObserver)
   ─ Multi-layer FM synthesis: carrier + modulator + reverb
   ─ Smooth fade-in / fade-out per planet
   ═══════════════════════════════════════════════════════════════ */

function createPlanetReverb(ctx, dur = 2.5, decay = 2.0) {
  const sr  = ctx.sampleRate;
  const len = sr * dur;
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

/* ── Planet musical profiles ────────────────────────────────── */
// Each planet: { theme description, layers[] }
// layer: { type, freqs[], dur, attack, decay, gain, detune, modRatio, modIdx }
const PLANET_THEMES = {

  mercury: {
    label: 'Mercury — Crystalline Resonance',
    fn(ctx, master) {
      const rev = createPlanetReverb(ctx, 3.0, 2.8);
      rev.connect(master);
      const t = ctx.currentTime;

      // High, glassy string harmonics — short staccato bows
      [880, 1108, 1320, 1760].forEach((freq, i) => {
        _violin(ctx, freq, 2.0 + i * 0.3, t + i * 0.22, 0.13 - i * 0.02, master, rev, true);
      });

      // High shimmer noise
      const noise = _coloredNoise(ctx, 'highpass', 3500, 12, 0.05, 3.5, t);
      noise.connect(master);
    }
  },

  venus: {
    label: 'Venus — Toxic Warmth',
    fn(ctx, master) {
      const rev = createPlanetReverb(ctx, 5.0, 3.5);
      rev.connect(master);
      const t = ctx.currentTime;

      // Slow, warm, detuned pads
      [87.31, 130.81, 174.61].forEach((freq, i) => {
        _warmPad(ctx, freq, 5.5, t + i * 0.3, 0.18 - i * 0.04, master, rev);
      });

      // Haunting solo violin line — mournful, sustained
      _violin(ctx, 523.25, 5.0, t + 1.2, 0.12, master, rev, false);
    }
  },

  earth: {
    label: 'Earth — Home',
    fn(ctx, master) {
      const rev = createPlanetReverb(ctx, 4.0, 2.2);
      rev.connect(master);
      const t = ctx.currentTime;

      // Full major chord pads
      [130.81, 164.81, 196.00, 261.63, 329.63].forEach((freq, i) => {
        _warmPad(ctx, freq, 5.0, t + i * 0.12, 0.16 - i * 0.022, master, rev);
      });

      // Orchestral violin melody — warm, alive
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        _violin(ctx, freq, 4.5, t + 0.5 + i * 0.5, 0.13, master, rev, false);
      });

      // Gentle high shimmer
      const noise = _coloredNoise(ctx, 'highpass', 4000, 15, 0.022, 4.5, t + 1.5);
      noise.connect(master);
    }
  },

  mars: {
    label: 'Mars — Iron Wind',
    // Dusty, ominous, low rumble — ancient and desolate
    fn(ctx, master) {
      const rev = createPlanetReverb(ctx, 6.0, 4.0);
      rev.connect(master);
      const t = ctx.currentTime;

      // Deep bass drone — ominous low frequencies
      [36.71, 55.00, 73.42].forEach((freq, i) => {
        _deepDrone(ctx, freq, 5.5, t + i * 0.25, 0.22 - i * 0.05, master, rev);
      });

      // Dissonant tritone
      _warmPad(ctx, 82.41, 4.5, t + 0.8, 0.09, master, rev);

      // Dust storm noise sweep — midrange
      const noise = _coloredNoise(ctx, 'bandpass', 280, 4, 0.07, 5.0, t + 0.5);
      noise.connect(master);
      const rvS = ctx.createGain(); rvS.gain.value = 0.5;
      noise.connect(rvS); rvS.connect(rev);
    }
  },

  jupiter: {
    label: 'Jupiter — King of Storms',
    // Massive, powerful, deep — largest planet energy
    fn(ctx, master) {
      const rev = createPlanetReverb(ctx, 7.0, 4.5);
      rev.connect(master);
      const t = ctx.currentTime;

      // Sub-bass rumble
      [24.50, 32.70, 49.00].forEach((freq, i) => {
        _deepDrone(ctx, freq, 6.0, t + i * 0.4, 0.28 - i * 0.06, master, rev);
      });

      // Huge chord cluster
      [98.00, 116.54, 146.83, 196.00].forEach((freq, i) => {
        _warmPad(ctx, freq, 5.5, t + i * 0.2, 0.14 - i * 0.025, master, rev);
      });

      // Thumping LFO rhythm — Great Red Spot pulse
      _rhythmicPulse(ctx, 65.41, 5.5, t + 1.0, 0.20, master);
    }
  },

  saturn: {
    label: 'Saturn — Rings of Time',
    fn(ctx, master) {
      const rev = createPlanetReverb(ctx, 8.0, 5.0);
      rev.connect(master);
      const t = ctx.currentTime;

      // Deep resonant bass
      [43.65, 65.41].forEach((freq, i) => {
        _deepDrone(ctx, freq, 6.5, t + i * 0.5, 0.20 - i * 0.07, master, rev);
      });

      // Ascending violin lines — ethereal, ring-like bowing
      [440, 554.37, 659.25, 783.99, 987.77].forEach((freq, i) => {
        _violin(ctx, freq, 5.5, t + i * 0.55, 0.11, master, rev, false);
      });

      // Slow pad warmth
      _warmPad(ctx, 87.31, 5.5, t + 1.5, 0.12, master, rev);
    }
  },

  uranus: {
    label: 'Uranus — Tilted Ice',
    fn(ctx, master) {
      const rev = createPlanetReverb(ctx, 5.5, 3.8);
      rev.connect(master);
      const t = ctx.currentTime;

      // Cold, dissonant high violin lines — eerie ice giant
      [207.65, 277.18, 369.99].forEach((freq, i) => {
        _violin(ctx, freq, 5.5, t + i * 0.6, 0.11, master, rev, true);
      });

      // Ice noise
      const noise = _coloredNoise(ctx, 'highpass', 2000, 8, 0.04, 5.0, t);
      noise.connect(master);
      const rvS = ctx.createGain(); rvS.gain.value = 0.8;
      noise.connect(rvS); rvS.connect(rev);

      // Low alien drone
      _deepDrone(ctx, 55.00, 4.5, t + 0.5, 0.12, master, rev);
    }
  },

  neptune: {
    label: 'Neptune — Edge of Everything',
    fn(ctx, master) {
      const rev = createPlanetReverb(ctx, 9.0, 6.0);
      rev.connect(master);
      const t = ctx.currentTime;

      // The deepest bass drones
      [18.35, 27.50, 36.71].forEach((freq, i) => {
        _deepDrone(ctx, freq, 7.0, t + i * 0.6, 0.24 - i * 0.06, master, rev);
      });

      // Howling wind noise
      const noise = _coloredNoise(ctx, 'bandpass', 180, 3, 0.08, 6.5, t + 0.8);
      noise.connect(master);
      const rvS = ctx.createGain(); rvS.gain.value = 0.9;
      noise.connect(rvS); rvS.connect(rev);

      // A single distant, lonely violin note — like light from far away
      _violin(ctx, 493.88, 7.0, t + 2.0, 0.09, master, rev, false);
    }
  }
};

/* ── Synthesis helpers ─────────────────────────────────────── */

/**
 * Violin / Bowed String Synthesis
 * ─ sawtooth carrier (harmonics like a real string)
 * ─ delayed vibrato LFO (5–6 Hz, swells in after 0.6s)
 * ─ bandpass "bow pressure" filter
 * ─ octave harmonic layer for richness
 * ─ slow bow attack (0.25–0.45s), natural decay release
 * @param {boolean} staccato  true = shorter, lighter bow stroke
 */
function _violin(ctx, freq, dur, startTime, gain, dryBus, wetBus, staccato = false) {
  const t      = startTime;
  const attack = staccato ? 0.12 : 0.32;
  const level  = gain;

  // ── Fundamental sawtooth (bowed string body) ──
  const saw = ctx.createOscillator();
  saw.type = 'sawtooth';
  saw.frequency.value = freq;

  // ── Vibrato: 5.6 Hz, delayed onset ──
  const vib = ctx.createOscillator();
  vib.type = 'sine';
  vib.frequency.value = 5.6 + Math.random() * 0.6;
  const vibG = ctx.createGain();
  vibG.gain.setValueAtTime(0, t);
  vibG.gain.linearRampToValueAtTime(freq * 0.0055, t + 0.65); // swell in
  vib.connect(vibG);
  vibG.connect(saw.frequency);

  // ── Bow pressure bandpass (shapes harmonics into string tone) ──
  const bpf = ctx.createBiquadFilter();
  bpf.type = 'bandpass';
  bpf.frequency.value = freq * 2.6;
  bpf.Q.value = 1.6;

  // ── Octave harmonic layer (brighter, drier) ──
  const saw2 = ctx.createOscillator();
  saw2.type = 'sawtooth';
  saw2.frequency.value = freq * 2;
  saw2.detune.value = -6;

  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.value = freq * 1.85;
  hpf.Q.value = 0.4;

  // ── Envelope: bow attack → sustain → natural release ──
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(level, t + attack);
  env.gain.setValueAtTime(level, t + dur - 0.65);
  env.gain.linearRampToValueAtTime(0, t + dur);

  const env2 = ctx.createGain();
  env2.gain.setValueAtTime(0, t);
  env2.gain.linearRampToValueAtTime(level * 0.28, t + attack + 0.1);
  env2.gain.linearRampToValueAtTime(0, t + dur * 0.85);

  saw.connect(bpf);
  bpf.connect(env);
  saw2.connect(hpf);
  hpf.connect(env2);

  env.connect(dryBus);
  env2.connect(dryBus);

  if (wetBus) {
    const s = ctx.createGain();
    s.gain.value = staccato ? 0.5 : 0.75;
    env.connect(s); s.connect(wetBus);
  }

  vib.start(t); saw.start(t); saw2.start(t);
  vib.stop(t + dur + 0.2);
  saw.stop(t + dur + 0.2);
  saw2.stop(t + dur + 0.2);
}

/** Warm Pad — detuned sawtooth pair with slow attack */
function _warmPad(ctx, freq, dur, startTime, gain, dryBus, wetBus) {
  const t = startTime;

  [-4, 4].forEach(det => {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.detune.value = det;

    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = freq * 6;
    lpf.Q.value = 0.5;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gain * 0.55, t + 1.2);
    env.gain.setValueAtTime(gain * 0.55, t + dur - 1.2);
    env.gain.linearRampToValueAtTime(0, t + dur);

    osc.connect(lpf);
    lpf.connect(env);
    env.connect(dryBus);

    if (wetBus) {
      const s = ctx.createGain(); s.gain.value = 0.5;
      env.connect(s); s.connect(wetBus);
    }

    osc.start(t); osc.stop(t + dur + 0.1);
  });
}

/** Deep Drone — pure sine with frequency wobble */
function _deepDrone(ctx, freq, dur, startTime, gain, dryBus, wetBus) {
  const t = startTime;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;

  // Slow pitch wobble
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.06 + Math.random() * 0.04;
  const lfoG = ctx.createGain();
  lfoG.gain.value = freq * 0.004;
  lfo.connect(lfoG);
  lfoG.connect(osc.frequency);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(gain, t + 1.8);
  env.gain.setValueAtTime(gain, t + dur - 1.5);
  env.gain.linearRampToValueAtTime(0, t + dur);

  osc.connect(env);
  env.connect(dryBus);

  if (wetBus) {
    const s = ctx.createGain(); s.gain.value = 0.65;
    env.connect(s); s.connect(wetBus);
  }

  lfo.start(t); osc.start(t);
  lfo.stop(t + dur + 0.1); osc.stop(t + dur + 0.1);
}

/** Colored noise burst — atmosphere texture */
function _coloredNoise(ctx, filterType, filterFreq, filterQ, gain, dur, startTime) {
  const sr  = ctx.sampleRate;
  const len = Math.ceil(sr * (dur + 0.5));
  const buf = ctx.createBuffer(1, len, sr);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const filt = ctx.createBiquadFilter();
  filt.type = filterType;
  filt.frequency.value = filterFreq;
  filt.Q.value = filterQ;

  const env = ctx.createGain();
  const t = startTime;
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(gain, t + 1.0);
  env.gain.setValueAtTime(gain, t + dur - 1.0);
  env.gain.linearRampToValueAtTime(0, t + dur);

  src.connect(filt);
  filt.connect(env);
  src.start(startTime);
  src.stop(startTime + dur + 0.1);

  return env;
}

/** Rhythmic LFO pulse — Jupiter storm effect */
function _rhythmicPulse(ctx, freq, dur, startTime, gain, dryBus) {
  const t = startTime;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;

  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.8; // slow pulse rhythm
  const lfoG = ctx.createGain();
  lfoG.gain.value = gain;

  const base = ctx.createGain();
  base.gain.value = 0;

  lfo.connect(lfoG);
  lfoG.connect(base.gain);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(1, t + 1.5);
  env.gain.setValueAtTime(1, t + dur - 1.5);
  env.gain.linearRampToValueAtTime(0, t + dur);

  osc.connect(base);
  base.connect(env);
  env.connect(dryBus);

  lfo.start(t); osc.start(t);
  lfo.stop(t + dur + 0.1); osc.stop(t + dur + 0.1);
}

/* ══════════════════════════════════════════════════════════════
   PlanetSounds — scroll-triggered planet music + click sounds
══════════════════════════════════════════════════════════════ */
export class PlanetSounds {
  constructor() {
    this.ctx     = null;
    this.enabled = true;
    this._currentPlanet = null;
    this._masterGain    = null;
    this._fadeTimeout   = null;

    this._initScroll();
    this._initClickSounds();
  }

  /* ── Context ─────────────────────────────────────────────── */
  _getCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  _getMaster() {
    const ctx = this._getCtx();
    if (!this._masterGain) {
      this._masterGain = ctx.createGain();
      this._masterGain.gain.value = 0;
      this._masterGain.connect(ctx.destination);
    }
    return this._masterGain;
  }

  /* ── Scroll trigger ──────────────────────────────────────── */
  _initScroll() {
    setTimeout(() => {
      const sections = document.querySelectorAll('section[id]');
      const planetIds = Object.keys(PLANET_THEMES);

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting || !this.enabled) return;
          const id = entry.target.id;
          if (!planetIds.includes(id)) return;
          if (this._currentPlanet === id) return;
          this._currentPlanet = id;
          this._playTheme(id);
        });
      }, { threshold: 0.45 });

      sections.forEach(s => observer.observe(s));
    }, 1200);
  }

  /* ── Play a planet theme ─────────────────────────────────── */
  _playTheme(planetId) {
    if (!this.enabled) return;
    const theme = PLANET_THEMES[planetId];
    if (!theme) return;

    try {
      const ctx    = this._getCtx();
      const master = this._getMaster();

      // Clear any pending fade
      if (this._fadeTimeout) clearTimeout(this._fadeTimeout);

      // Fade out previous theme, then fade in new one
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0, t + 1.8);

      this._fadeTimeout = setTimeout(() => {
        const t2 = ctx.currentTime;
        theme.fn(ctx, master);
        master.gain.cancelScheduledValues(t2);
        master.gain.setValueAtTime(0, t2);
        master.gain.linearRampToValueAtTime(0.55, t2 + 1.5);
      }, 1900);

    } catch (err) {
      console.warn('PlanetSounds._playTheme:', err);
    }
  }

  /* ── Click sound on planet name ─────────────────────────── */
  _initClickSounds() {
    setTimeout(() => {
      document.querySelectorAll('.planet-name-display').forEach(el => {
        const section = el.closest('section[id]');
        if (!section) return;
        const pid = section.id;
        el.style.cursor = 'pointer';
        el.title = `Click to hear ${pid}'s signature sound`;
        el.addEventListener('click', e => {
          e.stopPropagation();
          this._playTheme(pid);
          // Visual pulse
          el.style.transition = 'opacity 0.1s';
          el.style.opacity = '0.7';
          setTimeout(() => { el.style.opacity = '1'; }, 120);
        });
      });
    }, 1000);
  }

  /* ── Toggle ──────────────────────────────────────────────── */
  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled && this._masterGain) {
      const t = this.ctx.currentTime;
      this._masterGain.gain.cancelScheduledValues(t);
      this._masterGain.gain.setValueAtTime(this._masterGain.gain.value, t);
      this._masterGain.gain.linearRampToValueAtTime(0, t + 2.5);
      this._currentPlanet = null;
    }
    return this.enabled;
  }

  /* ── Legacy compat (click beep) ─────────────────────────── */
  play(planetId) { this._playTheme(planetId); }
}
