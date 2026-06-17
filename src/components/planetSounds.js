/**
 * PlanetSounds — Web Audio synthesized tones per planet.
 * Fixed: class field replaced with constructor assignment (broader browser support).
 */
export class PlanetSounds {
  constructor() {
    this.ctx     = null;
    this.enabled = true;
    // Moved from class field to constructor — avoids syntax issues in older browsers
    this.profiles = {
      mercury: { type:'sawtooth', freq:440, detune:1200, filterFreq:800,  filterQ:8,  gain:0.12, dur:1.8, lfoRate:0.5,  lfoDepth:30 },
      venus:   { type:'sine',     freq:280, detune:0,    filterFreq:600,  filterQ:5,  gain:0.14, dur:2.5, lfoRate:0.1,  lfoDepth:10 },
      earth:   { type:'sine',     freq:194, detune:0,    filterFreq:1200, filterQ:3,  gain:0.13, dur:3.0, lfoRate:0.2,  lfoDepth:8  },
      mars:    { type:'square',   freq:144, detune:700,  filterFreq:500,  filterQ:10, gain:0.10, dur:2.0, lfoRate:0.8,  lfoDepth:60 },
      jupiter: { type:'sine',     freq:98,  detune:0,    filterFreq:300,  filterQ:2,  gain:0.18, dur:4.0, lfoRate:0.05, lfoDepth:5  },
      saturn:  { type:'triangle', freq:72,  detune:-500, filterFreq:400,  filterQ:4,  gain:0.15, dur:4.5, lfoRate:0.08, lfoDepth:12 },
      uranus:  { type:'sine',     freq:207, detune:1900, filterFreq:2000, filterQ:6,  gain:0.10, dur:3.5, lfoRate:0.3,  lfoDepth:20 },
      neptune: { type:'sine',     freq:110, detune:-200, filterFreq:250,  filterQ:12, gain:0.16, dur:5.0, lfoRate:0.06, lfoDepth:15 },
    };
    this._inject();
  }

  _getCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  play(planetId) {
    if (!this.enabled) return;
    const p = this.profiles[planetId];
    if (!p) return;

    try {
      const ctx = this._getCtx();
      const t   = ctx.currentTime;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(p.gain, t + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + p.dur);
      gain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.type            = p.type;
      osc.frequency.value = p.freq;
      osc.detune.value    = p.detune;

      const filter = ctx.createBiquadFilter();
      filter.type            = planetId === 'neptune' ? 'bandpass' : 'lowpass';
      filter.frequency.value = p.filterFreq;
      filter.Q.value         = p.filterQ;

      const lfo     = ctx.createOscillator();
      lfo.frequency.value = p.lfoRate;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = p.lfoDepth;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + p.dur + 0.1);

      osc.connect(filter);
      filter.connect(gain);
      osc.start(t);
      osc.stop(t + p.dur + 0.1);

      // Second harmonic
      const osc2  = ctx.createOscillator();
      osc2.type             = 'sine';
      osc2.frequency.value  = p.freq * 2.01;
      osc2.detune.value     = -p.detune * 0.3;
      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(p.gain * 0.3, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + p.dur * 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(t);
      osc2.stop(t + p.dur * 0.7 + 0.1);
    } catch (err) {
      console.warn('PlanetSounds.play error:', err);
    }
  }

  _inject() {
    // Wait for planet sections to be in DOM
    setTimeout(() => {
      document.querySelectorAll('.planet-name-display').forEach(el => {
        const section = el.closest('section[id]');
        if (!section) return;
        const pid = section.id;
        el.style.cursor = 'pointer';
        el.setAttribute('title', `Click to hear ${pid}'s signature sound`);
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this.play(pid);
          el.style.transition = 'text-shadow 0.1s ease';
          el.style.textShadow = '0 0 40px currentColor';
          setTimeout(() => { el.style.textShadow = ''; }, 600);
        });
      });
    }, 800);
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}
