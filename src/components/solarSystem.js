export class SolarSystemRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.t = 0;
    this.raf = null;
    this.hovered = null;
    this.onHover = null;
    this.scale = 1;

    this.planets = [
      { id: 'mercury', name: 'Mercury', type: 'Terrestrial', r: 5, orb: 80,  speed: 0.042, color: '#B5B5B5', angle: 0.8 },
      { id: 'venus',   name: 'Venus',   type: 'Terrestrial', r: 9, orb: 122, speed: 0.016, color: '#E8C56B', angle: 1.9 },
      { id: 'earth',   name: 'Earth',   type: 'Terrestrial', r: 10,orb: 168, speed: 0.010, color: '#2E8FF5', angle: 3.1 },
      { id: 'mars',    name: 'Mars',    type: 'Terrestrial', r: 7, orb: 218, speed: 0.005, color: '#C1440E', angle: 4.5 },
      { id: 'jupiter', name: 'Jupiter', type: 'Gas Giant',   r: 28,orb: 318, speed: 0.0008,color: '#C8A87A', angle: 0.3 },
      { id: 'saturn',  name: 'Saturn',  type: 'Gas Giant',   r: 23,orb: 408, speed: 0.0003,color: '#E4D5A0', angle: 2.2 },
      { id: 'uranus',  name: 'Uranus',  type: 'Ice Giant',   r: 17,orb: 490, speed: 0.0001,color: '#7DE8E8', angle: 5.1 },
      { id: 'neptune', name: 'Neptune', type: 'Ice Giant',   r: 16,orb: 570, speed: 0.00005,color:'#4060D8', angle: 1.4 },
    ];
    // init angles
    this.planets.forEach(p => { p.currentAngle = p.angle; });

    this.asteroids = Array.from({ length: 200 }, () => ({
      angle: Math.random() * Math.PI * 2,
      r: 264 + (Math.random() - 0.5) * 30,
      size: Math.random() * 1.2 + 0.3,
      speed: (Math.random() * 0.001 + 0.0003) * (Math.random() < 0.5 ? 1 : -1),
    }));

    this.comets = [];
    this.nextComet = 300;

    this.resize();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.W = this.canvas.width = rect.width || window.innerWidth;
    this.H = this.canvas.height = rect.height || window.innerHeight;
    this.CX = this.W / 2;
    this.CY = this.H / 2;
    const minDim = Math.min(this.W, this.H);
    this.scale = minDim / 1200;
  }

  spawnComet() {
    const angle = Math.random() * Math.PI * 2;
    const r = 650 * this.scale;
    this.comets.push({
      x: this.CX + Math.cos(angle) * r,
      y: this.CY + Math.sin(angle) * r,
      vx: (-Math.cos(angle)) * 2.5,
      vy: (-Math.sin(angle)) * 2.5,
      life: 0, maxLife: 120,
      tailLen: 60 + Math.random() * 40,
    });
  }

  drawSun() {
    const { ctx, CX, CY, t, scale } = this;
    const r = 38 * scale;

    // Corona layers
    [3.5, 2.5, 1.8].forEach((mult, i) => {
      const pulse = 1 + 0.04 * Math.sin(t * 0.04 + i);
      const cr = r * mult * pulse;
      const alpha = [0.06, 0.10, 0.18][i];
      const grd = ctx.createRadialGradient(CX, CY, r * 0.8, CX, CY, cr);
      grd.addColorStop(0, `rgba(255,180,30,${alpha})`);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(CX, CY, cr, 0, Math.PI * 2);
      ctx.fill();
    });

    // Surface
    const sunGrd = ctx.createRadialGradient(CX - r * 0.25, CY - r * 0.25, 0, CX, CY, r);
    sunGrd.addColorStop(0, '#FFFDE0');
    sunGrd.addColorStop(0.35, '#FFE066');
    sunGrd.addColorStop(0.7, '#FFB820');
    sunGrd.addColorStop(1, '#FF6600');
    ctx.fillStyle = sunGrd;
    ctx.beginPath();
    ctx.arc(CX, CY, r, 0, Math.PI * 2);
    ctx.fill();

    // Solar flares
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + t * 0.008;
      const len = (8 + 4 * Math.sin(t * 0.03 + i * 1.3)) * scale;
      const fx = CX + Math.cos(a) * (r + len * 0.5);
      const fy = CY + Math.sin(a) * (r + len * 0.5);
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = '#FFB820';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.moveTo(CX + Math.cos(a) * r, CY + Math.sin(a) * r);
      ctx.lineTo(fx, fy);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  drawOrbitRing(cx, cy, r) {
    const { ctx } = this;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawAsteroids() {
    const { ctx, CX, CY, scale } = this;
    ctx.fillStyle = '#888888';
    this.asteroids.forEach(a => {
      a.angle += a.speed;
      const r = a.r * scale;
      const ax = CX + Math.cos(a.angle) * r;
      const ay = CY + Math.sin(a.angle) * r;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(ax, ay, a.size * scale, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  drawPlanet(p) {
    const { ctx, CX, CY, scale } = this;
    p.currentAngle += p.speed;
    const orb = p.orb * scale;
    const px = CX + Math.cos(p.currentAngle) * orb;
    const py = CY + Math.sin(p.currentAngle) * orb;
    const pr = p.r * scale;

    p._screenX = px;
    p._screenY = py;
    p._screenR = pr;

    const isHov = this.hovered === p.id;

    // Glow
    const glowR = pr * (isHov ? 4 : 3);
    const grd = ctx.createRadialGradient(px, py, 0, px, py, glowR);
    grd.addColorStop(0, p.color + '55');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.globalAlpha = isHov ? 0.7 : 0.35;
    ctx.beginPath();
    ctx.arc(px, py, glowR, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Saturn rings (back half)
    if (p.id === 'saturn') {
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(1, 0.32);
      [{ r: pr * 1.55, w: 3.5, a: 0.5 }, { r: pr * 1.9, w: 2.5, a: 0.35 }, { r: pr * 2.25, w: 2, a: 0.22 }].forEach(ring => {
        ctx.strokeStyle = `rgba(228,213,160,${ring.a})`;
        ctx.lineWidth = ring.w * scale;
        ctx.beginPath();
        ctx.arc(0, 0, ring.r, Math.PI, 2 * Math.PI);
        ctx.stroke();
      });
      ctx.restore();
    }

    // Planet body
    const bodyGrd = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.3, 0, px, py, pr);
    bodyGrd.addColorStop(0, this.lighten(p.color, 40));
    bodyGrd.addColorStop(0.6, p.color);
    bodyGrd.addColorStop(1, this.darken(p.color, 40));
    ctx.fillStyle = bodyGrd;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();

    // Saturn rings (front half)
    if (p.id === 'saturn') {
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(1, 0.32);
      [{ r: pr * 1.55, w: 3.5, a: 0.5 }, { r: pr * 1.9, w: 2.5, a: 0.35 }, { r: pr * 2.25, w: 2, a: 0.22 }].forEach(ring => {
        ctx.strokeStyle = `rgba(228,213,160,${ring.a})`;
        ctx.lineWidth = ring.w * scale;
        ctx.beginPath();
        ctx.arc(0, 0, ring.r, 0, Math.PI);
        ctx.stroke();
      });
      ctx.restore();
    }

    // Hover indicator ring
    if (isHov) {
      ctx.strokeStyle = 'rgba(0,229,255,0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(px, py, pr * 2.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Label
    const labelAlpha = isHov ? 1 : 0.45;
    ctx.globalAlpha = labelAlpha;
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.max(9, 10 * scale)}px 'Orbitron', monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(p.name, px, py + pr + 16 * scale);
    ctx.globalAlpha = 1;
  }

  drawComets() {
    const { ctx } = this;
    for (let i = this.comets.length - 1; i >= 0; i--) {
      const c = this.comets[i];
      c.x += c.vx;
      c.y += c.vy;
      c.life++;
      const progress = c.life / c.maxLife;
      const alpha = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
      const tx = c.x - (c.vx / Math.sqrt(c.vx ** 2 + c.vy ** 2)) * c.tailLen;
      const ty = c.y - (c.vy / Math.sqrt(c.vx ** 2 + c.vy ** 2)) * c.tailLen;
      const grd = ctx.createLinearGradient(tx, ty, c.x, c.y);
      grd.addColorStop(0, 'transparent');
      grd.addColorStop(0.6, `rgba(0,255,198,${alpha * 0.5})`);
      grd.addColorStop(1, `rgba(255,255,255,${alpha})`);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = grd;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(c.x, c.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
      if (c.life >= c.maxLife) this.comets.splice(i, 1);
    }
  }

  lighten(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, (n >> 16) + amt);
    const g = Math.min(255, ((n >> 8) & 0xff) + amt);
    const b = Math.min(255, (n & 0xff) + amt);
    return `rgb(${r},${g},${b})`;
  }

  darken(hex, amt) {
    return this.lighten(hex, -amt);
  }

  hitTest(mx, my) {
    for (const p of this.planets) {
      if (!p._screenX) continue;
      const dx = mx - p._screenX, dy = my - p._screenY;
      if (Math.sqrt(dx * dx + dy * dy) <= Math.max(p._screenR * 2.5, 14)) {
        return p;
      }
    }
    return null;
  }

  frame() {
    const { ctx, W, H } = this;
    ctx.clearRect(0, 0, W, H);
    this.drawSun();
    this.planets.forEach(p => this.drawOrbitRing(this.CX, this.CY, p.orb * this.scale));
    this.drawAsteroids();
    this.planets.forEach(p => this.drawPlanet(p));
    this.drawComets();
    this.t++;
    if (this.t >= this.nextComet) {
      this.spawnComet();
      this.nextComet = this.t + 400 + Math.random() * 600;
    }
    this.raf = requestAnimationFrame(() => this.frame());
  }

  start() { if (!this.raf) this.frame(); }
  stop() { if (this.raf) cancelAnimationFrame(this.raf); this.raf = null; }
}
