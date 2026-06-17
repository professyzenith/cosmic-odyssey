export class PlanetRenderer {
  constructor(canvas, planet) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.planet = planet;
    this.t = 0;
    this.raf = null;
    this.W = canvas.width;
    this.H = canvas.height;
    this.CX = this.W / 2;
    this.CY = this.H / 2;
    this.R = Math.min(this.W, this.H) * 0.42;
  }

  lighten(hex, amt) {
    const clamp = v => Math.min(255, Math.max(0, v));
    const n = parseInt(hex.replace('#',''), 16);
    return `rgb(${clamp((n>>16)+amt)},${clamp(((n>>8)&0xff)+amt)},${clamp((n&0xff)+amt)})`;
  }

  darken(hex, amt) { return this.lighten(hex, -amt); }

  hexToRgb(hex) {
    const n = parseInt(hex.replace('#',''), 16);
    return { r: n>>16, g: (n>>8)&0xff, b: n&0xff };
  }

  drawBase() {
    const { ctx, CX, CY, R, planet: p, t } = this;
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.clip();

    // Base gradient
    const grd = ctx.createRadialGradient(CX - R * 0.3, CY - R * 0.3, 0, CX, CY, R);
    grd.addColorStop(0, this.lighten(p.color, 35));
    grd.addColorStop(0.5, p.color);
    grd.addColorStop(1, this.darken(p.color, 55));
    ctx.fillStyle = grd;
    ctx.fillRect(CX - R, CY - R, R * 2, R * 2);

    // Surface bands (shifted by rotation)
    const shift = (t * 0.25) % (R * 2);
    this.drawSurfaceBands(shift);
    this.drawSurfaceFeatures(shift);

    // Atmospheric scatter on edge
    const atmosGrd = ctx.createRadialGradient(CX, CY, R * 0.78, CX, CY, R);
    const rgb = this.hexToRgb(p.color);
    atmosGrd.addColorStop(0, 'transparent');
    atmosGrd.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`);
    ctx.fillStyle = atmosGrd;
    ctx.fillRect(CX - R, CY - R, R * 2, R * 2);

    // Lighting — sunlight from upper-left
    const litGrd = ctx.createRadialGradient(CX - R * 0.35, CY - R * 0.35, 0, CX, CY, R * 1.2);
    litGrd.addColorStop(0, 'rgba(255,255,255,0.18)');
    litGrd.addColorStop(0.45, 'transparent');
    litGrd.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = litGrd;
    ctx.fillRect(CX - R, CY - R, R * 2, R * 2);

    ctx.restore();
  }

  drawSurfaceBands(shift) {
    const { ctx, CX, CY, R, planet: p } = this;
    const id = p.id;
    const bandCount = { jupiter: 12, saturn: 10, uranus: 5, neptune: 6 }[id] || 4;
    const opacity = { jupiter: 0.14, saturn: 0.1, uranus: 0.07, neptune: 0.09 }[id] || 0.06;
    for (let i = 0; i < bandCount; i++) {
      const yFrac = i / bandCount;
      const y = CY - R + yFrac * R * 2;
      const grd = ctx.createLinearGradient(0, y - R * 0.08, 0, y + R * 0.08);
      grd.addColorStop(0, 'transparent');
      grd.addColorStop(0.5, `rgba(0,0,0,${opacity})`);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(CX - R, y - R * 0.1, R * 2, R * 0.2);
    }
  }

  drawSurfaceFeatures(shift) {
    const { ctx, CX, CY, R, planet: p, t } = this;
    switch (p.id) {
      case 'jupiter': this.drawJupiter(shift); break;
      case 'earth':   this.drawEarth(shift); break;
      case 'mars':    this.drawMars(shift); break;
      case 'venus':   this.drawVenus(shift); break;
      case 'saturn':  this.drawSaturnSurface(shift); break;
      case 'uranus':  this.drawUranus(shift); break;
      case 'neptune': this.drawNeptune(shift); break;
      case 'mercury': this.drawMercury(shift); break;
    }
  }

  drawJupiter(shift) {
    const { ctx, CX, CY, R, t } = this;
    // Colored bands
    const bands = [
      { y: 0.15, h: 0.12, c: 'rgba(160,80,30,0.25)' },
      { y: 0.35, h: 0.08, c: 'rgba(200,140,80,0.2)' },
      { y: 0.52, h: 0.14, c: 'rgba(140,70,20,0.22)' },
      { y: 0.72, h: 0.1,  c: 'rgba(180,110,50,0.18)' },
    ];
    bands.forEach(b => {
      const y = CY - R + b.y * R * 2;
      const grd = ctx.createLinearGradient(0, y, 0, y + b.h * R * 2);
      grd.addColorStop(0, 'transparent');
      grd.addColorStop(0.5, b.c);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(CX - R, y, R * 2, b.h * R * 2);
    });
    // Great Red Spot
    const grsX = CX + R * 0.2 + Math.sin(shift * 0.01) * R * 0.05;
    const grsY = CY + R * 0.1;
    const pulse = 1 + 0.04 * Math.sin(t * 0.04);
    ctx.globalAlpha = 0.8;
    const spotGrd = ctx.createRadialGradient(grsX, grsY, 0, grsX, grsY, R * 0.19 * pulse);
    spotGrd.addColorStop(0, 'rgba(200,80,30,0.9)');
    spotGrd.addColorStop(0.5, 'rgba(180,60,20,0.7)');
    spotGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = spotGrd;
    ctx.save();
    ctx.scale(1.7, 1);
    ctx.beginPath();
    ctx.arc(grsX / 1.7, grsY, R * 0.14 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawEarth(shift) {
    const { ctx, CX, CY, R, t } = this;
    // Oceans already blue; draw continents
    const continents = [
      { x: CX - R * 0.35, y: CY - R * 0.1,  rx: R * 0.22, ry: R * 0.28, rot: -0.3 },
      { x: CX + R * 0.25, y: CY - R * 0.05, rx: R * 0.2,  ry: R * 0.22, rot: 0.2 },
      { x: CX - R * 0.1,  y: CY + R * 0.3,  rx: R * 0.18, ry: R * 0.15, rot: 0.1 },
      { x: CX + R * 0.1,  y: CY - R * 0.35, rx: R * 0.22, ry: R * 0.12, rot: -0.1 },
      { x: CX - R * 0.55, y: CY + R * 0.15, rx: R * 0.09, ry: R * 0.1,  rot: 0.2 },
    ];
    ctx.globalAlpha = 0.7;
    continents.forEach(c => {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot + shift * 0.002);
      const landGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(c.rx, c.ry));
      landGrd.addColorStop(0, '#2a8a30');
      landGrd.addColorStop(0.6, '#1e6e24');
      landGrd.addColorStop(1, 'transparent');
      ctx.fillStyle = landGrd;
      ctx.beginPath();
      ctx.ellipse(0, 0, c.rx, c.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Polar ice
    ['top', 'bot'].forEach(pole => {
      const py = pole === 'top' ? CY - R * 0.88 : CY + R * 0.78;
      const iceGrd = ctx.createRadialGradient(CX, py, 0, CX, py, R * 0.22);
      iceGrd.addColorStop(0, 'rgba(220,240,255,0.9)');
      iceGrd.addColorStop(1, 'transparent');
      ctx.fillStyle = iceGrd;
      ctx.fillRect(CX - R, py - R * 0.18, R * 2, R * 0.36);
    });
    // Clouds
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 8; i++) {
      const cx2 = CX - R + ((i * 137 + shift * 0.8) % (R * 2));
      const cy2 = CY - R * 0.7 + (i * 71 % (R * 1.4));
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.ellipse(cx2, cy2, R * 0.18, R * 0.06, 0.2 * i, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawMars(shift) {
    const { ctx, CX, CY, R, t } = this;
    // Dark regions
    const regions = [
      { x: CX - R * 0.2, y: CY - R * 0.15, rx: R * 0.3, ry: R * 0.2 },
      { x: CX + R * 0.3, y: CY + R * 0.2,  rx: R * 0.25, ry: R * 0.15 },
    ];
    ctx.globalAlpha = 0.3;
    regions.forEach(reg => {
      ctx.save();
      ctx.translate(reg.x, reg.y);
      ctx.rotate(shift * 0.002);
      ctx.fillStyle = '#7a1a04';
      ctx.beginPath();
      ctx.ellipse(0, 0, reg.rx, reg.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Polar ice
    ctx.globalAlpha = 0.65;
    const iceGrd = ctx.createRadialGradient(CX, CY - R * 0.85, 0, CX, CY - R * 0.85, R * 0.25);
    iceGrd.addColorStop(0, 'rgba(220,220,240,0.9)');
    iceGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = iceGrd;
    ctx.fillRect(CX - R, CY - R, R * 2, R * 0.28);
    // Dust storm swirls
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 5; i++) {
      const dx = CX - R * 0.8 + ((shift * 0.4 + i * 120) % (R * 1.6));
      const dy = CY - R * 0.3 + (i * 55 % (R * 0.6));
      ctx.strokeStyle = '#D06030';
      ctx.lineWidth = R * 0.05;
      ctx.beginPath();
      ctx.ellipse(dx, dy, R * 0.25, R * 0.07, 0.3 * i, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  drawVenus(shift) {
    const { ctx, CX, CY, R, t } = this;
    // Toxic cloud swirls
    ctx.globalAlpha = 0.22;
    for (let i = 0; i < 10; i++) {
      const cx = CX - R + ((i * 89 + shift * 0.3) % (R * 2));
      const cy = CY - R * 0.8 + (i * 53 % (R * 1.6));
      const swirl = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.3);
      swirl.addColorStop(0, 'rgba(255,200,80,0.6)');
      swirl.addColorStop(1, 'transparent');
      ctx.fillStyle = swirl;
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 0.35, R * 0.1, i * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawSaturnSurface(shift) {
    const { ctx, CX, CY, R } = this;
    const bands = [
      { y: 0.2, c: 'rgba(180,150,70,0.15)' },
      { y: 0.45, c: 'rgba(200,170,90,0.12)' },
      { y: 0.7, c: 'rgba(160,130,60,0.15)' },
    ];
    bands.forEach(b => {
      const y = CY - R + b.y * R * 2;
      const grd = ctx.createLinearGradient(0, y - R * 0.06, 0, y + R * 0.06);
      grd.addColorStop(0, 'transparent');
      grd.addColorStop(0.5, b.c);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(CX - R, y - R * 0.07, R * 2, R * 0.14);
    });
  }

  drawUranus(shift) {
    const { ctx, CX, CY, R, t } = this;
    // Ice particles
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + shift * 0.005;
      const rr = R * (0.3 + 0.6 * (Math.sin(i * 1.5) * 0.5 + 0.5));
      const ix = CX + Math.cos(angle) * rr;
      const iy = CY + Math.sin(angle) * rr;
      ctx.fillStyle = 'rgba(180,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(ix, iy, R * 0.025, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawNeptune(shift) {
    const { ctx, CX, CY, R, t } = this;
    // Great Dark Spot
    const spotX = CX + R * 0.1 + Math.sin(t * 0.02) * R * 0.08;
    const spotY = CY - R * 0.15;
    ctx.globalAlpha = 0.55;
    const spot = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, R * 0.22);
    spot.addColorStop(0, 'rgba(10,20,100,0.9)');
    spot.addColorStop(1, 'transparent');
    ctx.fillStyle = spot;
    ctx.beginPath();
    ctx.ellipse(spotX, spotY, R * 0.22, R * 0.14, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Wind streaks
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 6; i++) {
      const wy = CY - R * 0.6 + i * R * 0.22;
      ctx.strokeStyle = 'rgba(130,160,255,0.8)';
      ctx.lineWidth = R * 0.02;
      ctx.beginPath();
      ctx.moveTo(CX - R * 0.8, wy + Math.sin(shift * 0.01 + i) * R * 0.04);
      ctx.bezierCurveTo(CX - R * 0.3, wy + Math.sin(shift * 0.012 + i + 1) * R * 0.06, CX + R * 0.3, wy, CX + R * 0.8, wy + Math.sin(shift * 0.009 + i) * R * 0.05);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  drawMercury(shift) {
    const { ctx, CX, CY, R } = this;
    // Craters
    ctx.globalAlpha = 0.25;
    const craters = [
      { x: CX - R * 0.3, y: CY + R * 0.1, r: R * 0.13 },
      { x: CX + R * 0.25, y: CY - R * 0.3, r: R * 0.09 },
      { x: CX - R * 0.1, y: CY + R * 0.38, r: R * 0.08 },
      { x: CX + R * 0.4, y: CY + R * 0.22, r: R * 0.11 },
      { x: CX - R * 0.44, y: CY - R * 0.22, r: R * 0.07 },
    ];
    craters.forEach(cr => {
      ctx.strokeStyle = 'rgba(80,80,80,0.6)';
      ctx.lineWidth = R * 0.025;
      ctx.beginPath();
      ctx.arc(cr.x, cr.y, cr.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  drawAtmosphericGlow() {
    const { ctx, CX, CY, R, planet: p } = this;
    const rgb = this.hexToRgb(p.color);
    const aGrd = ctx.createRadialGradient(CX, CY, R * 0.92, CX, CY, R * 1.12);
    aGrd.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.25)`);
    aGrd.addColorStop(0.5, `rgba(${rgb.r},${rgb.g},${rgb.b},0.1)`);
    aGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = aGrd;
    ctx.beginPath();
    ctx.arc(CX, CY, R * 1.12, 0, Math.PI * 2);
    ctx.fill();
  }

  drawSaturnRings(half = 'all') {
    if (this.planet.id !== 'saturn') return;
    const { ctx, CX, CY, R } = this;
    ctx.save();
    ctx.translate(CX, CY);
    ctx.scale(1, 0.28);
    const rings = [
      { r: R * 1.35, w: 8, a: 0.45 },
      { r: R * 1.6,  w: 5, a: 0.3 },
      { r: R * 1.82, w: 4, a: 0.22 },
      { r: R * 2.0,  w: 3, a: 0.14 },
      { r: R * 2.15, w: 2, a: 0.1 },
    ];
    rings.forEach(ring => {
      const rGrd = ctx.createRadialGradient(0, 0, ring.r - ring.w, 0, 0, ring.r + ring.w);
      rGrd.addColorStop(0, 'transparent');
      rGrd.addColorStop(0.5, `rgba(228,213,160,${ring.a})`);
      rGrd.addColorStop(1, 'transparent');
      ctx.strokeStyle = rGrd;
      ctx.lineWidth = ring.w * 2;
      ctx.beginPath();
      
      let startAngle = 0;
      let endAngle = Math.PI * 2;
      if (half === 'back') {
        startAngle = Math.PI;
        endAngle = 2 * Math.PI;
      } else if (half === 'front') {
        startAngle = 0;
        endAngle = Math.PI;
      }
      ctx.arc(0, 0, ring.r, startAngle, endAngle);
      ctx.stroke();
    });
    ctx.restore();
  }

  frame() {
    const { ctx, W, H } = this;
    ctx.clearRect(0, 0, W, H);
    this.drawSaturnRings('back');
    this.drawBase();
    this.drawSaturnRings('front');
    this.drawAtmosphericGlow();
    this.t++;
    this.raf = requestAnimationFrame(() => this.frame());
  }

  start() { if (!this.raf) this.frame(); }
  stop() { if (this.raf) cancelAnimationFrame(this.raf); this.raf = null; }
}
