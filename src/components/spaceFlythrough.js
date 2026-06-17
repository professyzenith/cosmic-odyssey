/* ═══════════════════════════════════════════════════════════════
   SpaceFlythrough — Cinematic scroll-driven warp tunnel
   Inspired by NASA Eyes on the Solar System
   ─ Canvas-based starfield warp with depth simulation
   ─ Scroll drives camera speed (faster scroll = faster warp)
   ─ Smooth deceleration, then fades into main site
   ─ Planets glide past during the flythrough
   ═══════════════════════════════════════════════════════════════ */

export class SpaceFlythrough {
  constructor(canvas, onComplete) {
    this.canvas     = canvas;
    this.ctx        = canvas.getContext('2d');
    this.onComplete = onComplete;
    this.running    = false;
    this.frame      = null;
    this.progress   = 0;      // 0 → 1 (0 = start, 1 = done)
    this.speed      = 0;      // current warp speed
    this.targetSpeed= 0;
    this.scrollAcc  = 0;      // scroll accumulator
    this.stars      = [];
    this.glows      = [];
    this.done       = false;
    this._scrollHandler = this._onScroll.bind(this);
    this._wheelHandler  = this._onWheel.bind(this);
  }

  /* ── Start ─────────────────────────────────────────────────── */
  start() {
    if (this.running) return;
    this.running = true;
    this.done    = false;
    this.progress = 0;
    this.speed    = 0.8; // always moving, scroll makes it faster

    this._resize();
    this._initStars();
    this._initGlows();

    window.addEventListener('resize', () => this._resize());
    window.addEventListener('wheel', this._wheelHandler, { passive: true });
    window.addEventListener('touchmove', this._scrollHandler, { passive: true });

    this._loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frame);
    window.removeEventListener('wheel', this._wheelHandler);
    window.removeEventListener('touchmove', this._scrollHandler);
  }

  /* ── Input ─────────────────────────────────────────────────── */
  _onWheel(e) {
    if (this.done) return;
    this.scrollAcc += Math.abs(e.deltaY) * 0.012;
  }

  _onScroll(e) {
    if (this.done) return;
    this.scrollAcc += 2;
  }

  /* ── Resize ────────────────────────────────────────────────── */
  _resize() {
    this.W = this.canvas.width  = window.innerWidth;
    this.H = this.canvas.height = window.innerHeight;
    this.cx = this.W / 2;
    this.cy = this.H / 2;
  }

  /* ── Init stars ────────────────────────────────────────────── */
  _initStars() {
    this.stars = [];
    const N = 900;
    for (let i = 0; i < N; i++) {
      this.stars.push(this._makeStar());
    }
  }

  _makeStar(reset = false) {
    const angle = Math.random() * Math.PI * 2;
    const r     = reset ? 2 + Math.random() * 12 : Math.random() * Math.max(this.W, this.H) * 0.7;
    return {
      x:     Math.cos(angle) * r,
      y:     Math.sin(angle) * r,
      z:     reset ? 1200 : 100 + Math.random() * 1400,
      size:  0.5 + Math.random() * 1.5,
      color: this._starColor(),
      trail: [],
    };
  }

  _starColor() {
    const palette = [
      'rgba(255,255,255,',
      'rgba(180,210,255,',
      'rgba(255,220,180,',
      'rgba(120,180,255,',
      'rgba(200,160,255,',
    ];
    return palette[Math.floor(Math.random() * palette.length)];
  }

  /* ── Glow orbs (represent distant planets) ─────────────────── */
  _initGlows() {
    const configs = [
      { color: '#4D9FFF', r: 28, x: 0.3,  y: 0.42, zStart: 3000, speed: 0.45 }, // blue planet
      { color: '#F59E0B', r: 20, x: 0.7,  y: 0.35, zStart: 5000, speed: 0.3  }, // amber planet
      { color: '#EF4444', r: 18, x: 0.25, y: 0.6,  zStart: 7000, speed: 0.22 }, // red planet
      { color: '#10B981', r: 14, x: 0.75, y: 0.58, zStart: 9000, speed: 0.18 }, // teal
      { color: '#C084FC', r: 24, x: 0.5,  y: 0.28, zStart: 12000,speed: 0.14 }, // violet
    ];
    this.glows = configs.map(c => ({ ...c, z: c.zStart }));
  }

  /* ── Main loop ─────────────────────────────────────────────── */
  _loop() {
    if (!this.running) return;
    this.frame = requestAnimationFrame(() => this._loop());
    this._update();
    this._draw();
  }

  _update() {
    const dt = 0.016; // ~60fps

    /* Auto-advance + scroll boost */
    const boost = this.scrollAcc * 3.5;
    this.targetSpeed = 1.2 + boost;
    this.scrollAcc  *= 0.88; // decay

    /* Smooth speed interpolation */
    this.speed += (this.targetSpeed - this.speed) * 0.08;

    /* Advance progress */
    this.progress += this.speed * dt * 0.018;
    if (this.progress >= 1 && !this.done) {
      this.done = true;
      this._complete();
      return;
    }

    const warpZ = this.speed * 22;

    /* Update stars */
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      s.z -= warpZ;

      /* Save trail point */
      const sx = this.cx + s.x / s.z * 400;
      const sy = this.cy + s.y / s.z * 400;
      s.trail.unshift({ x: sx, y: sy, z: s.z });
      if (s.trail.length > 8) s.trail.pop();

      if (s.z <= 0) {
        Object.assign(s, this._makeStar(true));
      }
    }

    /* Update glows */
    for (let g of this.glows) {
      g.z -= this.speed * 8 * g.speed;
      if (g.z <= 0) g.z = g.zStart;
    }
  }

  _draw() {
    const { ctx, W, H, cx, cy } = this;

    /* Background */
    ctx.fillStyle = 'rgba(0,0,8,0.82)';
    ctx.fillRect(0, 0, W, H);

    /* Subtle center radial glow */
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.5);
    grd.addColorStop(0, `rgba(20,40,80,${0.12 + this.speed * 0.025})`);
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    /* Stars */
    for (const s of this.stars) {
      if (s.z <= 0) continue;
      const scale = 400 / s.z;
      const sx    = cx + s.x * scale;
      const sy    = cy + s.y * scale;

      if (sx < -10 || sx > W + 10 || sy < -10 || sy > H + 10) continue;

      const alpha = Math.min(1, (1200 - s.z) / 500);
      const size  = s.size * scale * 1.5;

      /* Trail (warp streak) */
      if (s.trail.length > 1 && this.speed > 1.8) {
        const trailLen = Math.min(s.trail.length, Math.ceil(this.speed * 1.2));
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        for (let t = 1; t < trailLen; t++) {
          const tp = s.trail[t];
          if (tp) ctx.lineTo(tp.x, tp.y);
        }
        const trailAlpha = Math.min(0.7, (this.speed - 1.8) * 0.18) * alpha;
        ctx.strokeStyle = `${s.color}${trailAlpha.toFixed(2)})`;
        ctx.lineWidth = Math.max(0.3, size * 0.35);
        ctx.stroke();
      }

      /* Star dot */
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(0.3, size), 0, Math.PI * 2);
      ctx.fillStyle = `${s.color}${alpha.toFixed(2)})`;
      ctx.fill();
    }

    /* Planet glows */
    for (const g of this.glows) {
      if (g.z <= 50) continue;
      const scale  = 400 / g.z;
      const px     = g.x * W;
      const py     = g.y * H;
      const radius = g.r * scale * 6;
      if (radius < 0.5) continue;

      const alpha = Math.min(0.9, (g.zStart - g.z) / g.zStart * 3) * Math.min(1, radius / 8);

      /* Glow halo */
      const halo = ctx.createRadialGradient(px, py, 0, px, py, radius * 2.5);
      halo.addColorStop(0, g.color + Math.round(alpha * 200).toString(16).padStart(2,'0'));
      halo.addColorStop(1, 'transparent');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(px, py, radius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      /* Planet body */
      const body = ctx.createRadialGradient(px - radius * 0.2, py - radius * 0.2, 0, px, py, radius);
      body.addColorStop(0, '#ffffff');
      body.addColorStop(0.3, g.color);
      body.addColorStop(1, '#000008');
      ctx.fillStyle = body;
      ctx.globalAlpha = Math.min(1, alpha * 1.4);
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    /* Progress indicator — thin line at bottom */
    ctx.fillStyle = `rgba(77,159,255,${0.12 + this.progress * 0.3})`;
    ctx.fillRect(0, H - 1, W * this.progress, 1);

    /* Speed overlay text */
    if (this.speed > 2.5) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.35, (this.speed - 2.5) * 0.08)})`;
      ctx.font = `${Math.min(11, 8 + this.speed * 0.4)}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('WARP ' + this.speed.toFixed(1) + 'x', cx, H - 24);
    }

    /* Scroll hint (early phase) */
    if (this.progress < 0.15 && this.speed < 2) {
      const hint = 1 - this.progress * 6;
      ctx.fillStyle = `rgba(255,255,255,${(hint * 0.45).toFixed(2)})`;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.letterSpacing = '0.4em';
      ctx.textAlign = 'center';
      ctx.fillText('SCROLL TO ACCELERATE', cx, H - 36);
      ctx.letterSpacing = '0';
    }
  }

  /* ── Complete ──────────────────────────────────────────────── */
  _complete() {
    /* Fade out the flythrough canvas */
    let op = 1;
    const fade = () => {
      op -= 0.035;
      this.canvas.style.opacity = Math.max(0, op);
      if (op > 0) requestAnimationFrame(fade);
      else {
        this.stop();
        this.canvas.style.display = 'none';
        if (this.onComplete) this.onComplete();
      }
    };
    requestAnimationFrame(fade);
  }
}
