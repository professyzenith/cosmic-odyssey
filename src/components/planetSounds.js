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
    // High, glassy, cracked — no atmosphere, metallic
    fn(ctx, master) {
      const rev = createPlanetReverb(ctx, 3.0, 2.8);
      rev.connect(master);
      const t = ctx.currentTime;

      // Metallic FM bell tones
      [880, 1108, 1320, 1760].forEach((freq, i) => {
        const delay = i * 0.18;
        _fmBell(ctx, freq, 2.2 + i * 0.4, 0, t + delay, 0.14 - i * 0.025, master, rev);
      });

      // High shimmer noise sweep
      const noise = _coloredNoise(ctx, 'highpass', 3500, 12, 0.06, 3.5, t);
      noise.connect(master);
    }
  },

  venus: {
    label: 'Venus — Toxic Warmth',
    // Smothering heat, thick atmosphere, slow and oppressive
    fn(ctx, master) {
      const rev = createPlanetReverb(ctx, 5.0, 3.5);
      rev.connect(master);
      const t = ctx.currentTime;

      // Slow, warm, detuned pads (sulfuric yellow warmth)
      [87.31, 130.81, 174.61].forEach((freq, i) => {
        _warmPad(ctx, freq, 5.5, t + i * 0.3, 0.18 - i * 0.04, master, rev);
      });

      // Haunting high tone — like wind across hot rock
      _fmBell(ctx, 523.25, 4.0, 0, t + 1.2, 0.09, master, rev);
    }
  },

  earth: {
    label: 'Earth — Home',
    // Rich, full, alive — lush orchestral warmth
    fn(ctx, master) {
      const rev = createPlanetReverb(ctx, 4.0, 2.2);
      rev.connect(master);
      const t = ctx.currentTime;

      // Full major chord — C major (bright, alive)
      [130.81, 164.81, 196.00, 261.63, 329.63].forEach((freq, i) => {
        _warmPad(ctx, freq, 5.0, t + i * 0.12, 0.16 - i * 0.022, master, rev);
      });

      // Bright bell overtones
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        _fmBell(ctx, freq, 3.0, 0, t + 0.6 + i * 0.35, 0.10, master, rev);
      });

      // Water-like high shimmer
      const noise = _coloredNoise(ctx, 'highpass', 4000, 15, 0.025, 4.5, t + 1.5);
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
    // Ethereal, vast, mysterious — crystalline ring tones
    fn(ctx, master) {
      const rev = createPlanetReverb(ctx, 8.0, 5.0);
      rev.connect(master);
      const t = ctx.currentTime;

      // Deep resonant bass
      [43.65, 65.41].forEach((freq, i) => {
        _deepDrone(ctx, freq, 6.5, t + i * 0.5, 0.20 - i * 0.07, master, rev);
      });

      // Ring tones — delicate ascending FM bells (like crystal bowls)
      [440, 554.37, 659.25, 783.99, 987.77].forEach((freq, i) => {
        _fmBell(ctx, freq, 4.5, 0, t + i * 0.45, 0.10, master, rev);
      });

      // Slow pad warmth
      _warmPad(ctx, 87.31, 5.5, t + 1.5, 0.12, master, rev);
    }
  },

  uranus: {
    label: 'Uranus — Tilted Ice',
    // Cold, alien, sideways — eerie ice giant
    fn(ctx, master) {
      const rev = createPlanetReverb(ctx, 5.5, 3.8);
      rev.connect(master);
      const t = ctx.currentTime;

      // Cold, high-pitched eerie tones
      [207.65, 277.18, 369.99].forEach((freq, i) => {
        _fmBell(ctx, freq, 5.0, i * 200, t + i * 0.5, 0.11, master, rev);
      });

      // Ice noise — cold bandpass
      const noise = _coloredNoise(ctx, 'highpass', 2000, 8, 0.04, 5.0, t);
      noise.connect(master);
      const rvS = ctx.createGain(); rvS.gain.value = 0.8;
      noise.connect(rvS); rvS.connect(rev);

      // Low alien drone — dissonant
      _deepDrone(ctx, 55.00, 4.5, t + 0.5, 0.12, master, rev);
    }
  },

  neptune: {
    label: 'Neptune — Edge of Everything',
    // Vast, cold, windswept — the loneliest world
    fn(ctx, master) {
      const rev = createPlanetReverb(ctx, 9.0, 6.0);
      rev.connect(master);
      const t = ctx.currentTime;

      // The deepest, most distant bass
      [18.35, 27.50, 36.71].forEach((freq, i) => {
        _deepDrone(ctx, freq, 7.0, t + i * 0.6, 0.24 - i * 0.06, master, rev);
      });

      // Howling wind noise — extreme winds (2100 km/h)
      const noise = _coloredNoise(ctx, 'bandpass', 180, 3, 0.08, 6.5, t + 0.8);
      noise.connect(master);
      const rvS = ctx.createGain(); rvS.gain.value = 0.9;
      noise.connect(rvS); rvS.connect(rev);

      // Distant, faint crystalline tone (like starlight from here)
      _fmBell(ctx, 493.88, 6.0, 0, t + 2.0, 0.07, master, rev);
    }
  }
};

/* ── Synthesis helpers ─────────────────────────────────────── */

/** FM Bell — carrier modulated for metallic bell quality */
function _fmBell(ctx, freq, dur, detuneAmount, startTime, gain, dryBus, wetBus) {
  const t = startTime;

  const modOsc = ctx.createOscillator();
  modOsc.type = 'sine';
  modOsc.frequency.value = freq * 2.756; // FM ratio for bell tone

  const modGain = ctx.createGain();
  modGain.gain.setValueAtTime(freq * 4.5, t);
  modGain.gain.exponentialRampToValueAtTime(freq * 0.1, t + dur * 0.25);
  modOsc.connect(modGain);

  const car = ctx.createOscillator();
  car.type = 'sine';
  car.frequency.value = freq;
  if (detuneAmount) car.detune.value = detuneAmount;
  modGain.connect(car.frequency);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(gain, t + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  car.connect(env);
  env.connect(dryBus);

  if (wetBus) {
    const s = ctx.createGain(); s.gain.value = 0.7;
    env.connect(s); s.connect(wetBus);
  }

  modOsc.start(t); modOsc.stop(t + dur + 0.1);
  car.start(t); car.stop(t + dur + 0.1);
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
