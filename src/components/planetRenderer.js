/* ═══════════════════════════════════════════════════════
   COSMIC ODYSSEY — Planet Renderer v2.0
   Local NASA textures served from /public/textures/
   with procedural fallback + atmospheric glow + rotation animation
   ═══════════════════════════════════════════════════════ */

// Local textures served from /public/textures/ — always loads, no hotlink blocking
const TEXTURES = {
  mercury: '/textures/mercury.jpg',
  venus:   '/textures/venus.jpg',
  earth:   '/textures/earth.jpg',
  mars:    '/textures/mars.jpg',
  jupiter: '/textures/jupiter.jpg',
  saturn:  '/textures/saturn.jpg',
  uranus:  '/textures/uranus.jpg',
  neptune: '/textures/neptune.jpg',
};

// Preload all textures at module level (shared across instances)
const _textureCache = {};
const _texturePromises = {};

function loadTexture(id) {
  if (_textureCache[id]) return Promise.resolve(_textureCache[id]);
  if (_texturePromises[id]) return _texturePromises[id];
  _texturePromises[id] = new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => { _textureCache[id] = img; resolve(img); };
    img.onerror = () => resolve(null); // graceful fallback to procedural
    img.src = TEXTURES[id];
  });
  return _texturePromises[id];
}

export class PlanetRenderer {
  constructor(canvas, planet) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.planet  = planet;
    this.t       = 0;
    this.raf     = null;
    this.W       = canvas.width;
    this.H       = canvas.height;
    this.CX      = this.W / 2;
    this.CY      = this.H / 2;
    this.R       = Math.min(this.W, this.H) * 0.42;
    this.texture = null;
    this.texOffset = 0; // horizontal scroll offset for rotation

    // Rotation speeds (radians per frame → mapped to texture px offset)
    this.rotSpeeds = {
      mercury: 0.10, venus:   0.06, earth:   0.30,
      mars:    0.28, jupiter: 0.80, saturn:  0.65,
      uranus:  0.22, neptune: 0.18,
    };

    // Start loading texture immediately
    loadTexture(planet.id).then(img => { this.texture = img; });
  }

  /* ─── Colour helpers ──────────────────────────────── */
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

  /* ─── Main frame ──────────────────────────────────── */
  frame() {
    const { ctx, W, H } = this;
    ctx.clearRect(0, 0, W, H);

    if (this.planet.id === 'saturn') this.drawSaturnRings('back');

    if (this.texture) {
      this.drawTexturedPlanet();
    } else {
      this.drawProceduralPlanet();
    }

    if (this.planet.id === 'saturn') this.drawSaturnRings('front');

    this.drawAtmosphericGlow();
    this.drawShineHighlight();

    this.t++;
    this.texOffset += (this.rotSpeeds[this.planet.id] || 0.2);
    this.raf = requestAnimationFrame(() => this.frame());
  }

  /* ─── TEXTURED PLANET ────────────────────────────── */
  drawTexturedPlanet() {
    const { ctx, CX, CY, R, texture, texOffset } = this;
    const diam = R * 2;
    const texW = texture.naturalWidth  || texture.width;
    const texH = texture.naturalHeight || texture.height;

    // We'll draw the texture twice side-by-side and clip to circle,
    // scrolling horizontally to simulate rotation.
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.clip();

    // Scale texture to fit the diameter
    const scale = diam / texH;
    const scaledW = texW * scale;
    const scaledH = diam;

    // Offset scrolls left continuously
    const offset = texOffset * scale % scaledW;

    // Draw texture strip (may need two copies to tile seamlessly)
    const startX = CX - R - offset;
    const startY = CY - R;

    ctx.drawImage(texture, startX,           startY, scaledW, scaledH);
    ctx.drawImage(texture, startX + scaledW, startY, scaledW, scaledH);

    // Dark limb shading (right side darker — day/night terminator)
    const shadowGrd = ctx.createRadialGradient(
      CX + R * 0.2, CY - R * 0.15, 0,
      CX, CY, R * 1.05
    );
    shadowGrd.addColorStop(0,   'rgba(255,255,255,0.06)');
    shadowGrd.addColorStop(0.5, 'rgba(0,0,0,0)');
    shadowGrd.addColorStop(0.75,'rgba(0,0,0,0.25)');
    shadowGrd.addColorStop(1,   'rgba(0,0,0,0.75)');
    ctx.fillStyle = shadowGrd;
    ctx.fillRect(CX - R, CY - R, diam, diam);

    ctx.restore();
  }

  /* ─── PROCEDURAL FALLBACK ─────────────────────────── */
  drawProceduralPlanet() {
    const { ctx, CX, CY, R, planet: p, t } = this;
    const shift = (t * 0.25) % (R * 2);

    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.clip();

    // Planet-specific realistic base colors
    const baseColors = {
      saturn:  ['#c8a96e','#b8956a','#a07850'],
      uranus:  ['#9fd4d8','#7ec8cc','#5ab0b8'],
      neptune: ['#3b6ec8','#2a55b8','#1a3a8e'],
    };
    const bc = baseColors[p.id];
    const grd = ctx.createLinearGradient(CX, CY - R, CX, CY + R);
    if (bc) {
      grd.addColorStop(0,   bc[0]);
      grd.addColorStop(0.5, bc[1]);
      grd.addColorStop(1,   bc[2]);
    } else {
      grd.addColorStop(0, this.lighten(p.color, 35));
      grd.addColorStop(0.5, p.color);
      grd.addColorStop(1, this.darken(p.color, 55));
    }
    ctx.fillStyle = grd;
    ctx.fillRect(CX - R, CY - R, R * 2, R * 2);

    this.drawSurfaceBands(shift);
    this.drawSurfaceFeatures(shift);

    // Lighting
    const litGrd = ctx.createRadialGradient(CX - R * 0.35, CY - R * 0.35, 0, CX, CY, R * 1.2);
    litGrd.addColorStop(0,    'rgba(255,255,255,0.18)');
    litGrd.addColorStop(0.45, 'transparent');
    litGrd.addColorStop(1,    'rgba(0,0,0,0.55)');
    ctx.fillStyle = litGrd;
    ctx.fillRect(CX - R, CY - R, R * 2, R * 2);

    ctx.restore();
  }

  /* ─── Atmospheric glow ────────────────────────────── */
  drawAtmosphericGlow() {
    const { ctx, CX, CY, R, planet: p } = this;
    const rgb = this.hexToRgb(p.color);

    // Outer glow halo
    const aGrd = ctx.createRadialGradient(CX, CY, R * 0.9, CX, CY, R * 1.18);
    aGrd.addColorStop(0,   `rgba(${rgb.r},${rgb.g},${rgb.b},0.28)`);
    aGrd.addColorStop(0.55,`rgba(${rgb.r},${rgb.g},${rgb.b},0.10)`);
    aGrd.addColorStop(1,   'transparent');
    ctx.fillStyle = aGrd;
    ctx.beginPath();
    ctx.arc(CX, CY, R * 1.18, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ─── Shine specular highlight ────────────────────── */
  drawShineHighlight() {
    const { ctx, CX, CY, R } = this;
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.clip();

    // Small bright specular spot (upper-left)
    const shine = ctx.createRadialGradient(
      CX - R * 0.38, CY - R * 0.38, 0,
      CX - R * 0.38, CY - R * 0.38, R * 0.55
    );
    shine.addColorStop(0,   'rgba(255,255,255,0.14)');
    shine.addColorStop(0.4, 'rgba(255,255,255,0.04)');
    shine.addColorStop(1,   'transparent');
    ctx.fillStyle = shine;
    ctx.fillRect(CX - R, CY - R, R * 2, R * 2);

    ctx.restore();
  }

  /* ─── Saturn Rings ────────────────────────────────── */
  drawSaturnRings(half = 'all') {
    if (this.planet.id !== 'saturn') return;
    const { ctx, CX, CY, R } = this;
    ctx.save();
    ctx.translate(CX, CY);
    ctx.scale(1, 0.26);

    const rings = [
      { r: R * 1.30, w: 10, c: 'rgba(228,213,160,0.50)' },
      { r: R * 1.52, w: 7,  c: 'rgba(210,195,140,0.38)' },
      { r: R * 1.72, w: 5,  c: 'rgba(195,175,120,0.28)' },
      { r: R * 1.90, w: 4,  c: 'rgba(180,160,105,0.20)' },
      { r: R * 2.05, w: 3,  c: 'rgba(170,150,95,0.14)' },
      { r: R * 2.18, w: 2,  c: 'rgba(160,140,85,0.09)' },
    ];

    rings.forEach(ring => {
      const rGrd = ctx.createRadialGradient(0, 0, ring.r - ring.w, 0, 0, ring.r + ring.w);
      rGrd.addColorStop(0, 'transparent');
      rGrd.addColorStop(0.5, ring.c);
      rGrd.addColorStop(1, 'transparent');
      ctx.strokeStyle = rGrd;
      ctx.lineWidth = ring.w * 2.2;
      ctx.beginPath();

      let s = 0, e = Math.PI * 2;
      if (half === 'back')  { s = Math.PI;     e = 2 * Math.PI; }
      if (half === 'front') { s = 0;           e = Math.PI; }
      ctx.arc(0, 0, ring.r, s, e);
      ctx.stroke();
    });
    ctx.restore();
  }

  /* ─── Procedural surface bands (fallback) ─────────── */
  drawSurfaceBands(shift) {
    const { ctx, CX, CY, R, planet: p } = this;
    const bandCount = { jupiter: 12, saturn: 10, uranus: 5, neptune: 6 }[p.id] || 4;
    const opacity   = { jupiter: 0.14, saturn: 0.10, uranus: 0.07, neptune: 0.09 }[p.id] || 0.06;
    for (let i = 0; i < bandCount; i++) {
      const y = CY - R + (i / bandCount) * R * 2;
      const grd = ctx.createLinearGradient(0, y - R * 0.08, 0, y + R * 0.08);
      grd.addColorStop(0,   'transparent');
      grd.addColorStop(0.5, `rgba(0,0,0,${opacity})`);
      grd.addColorStop(1,   'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(CX - R, y - R * 0.1, R * 2, R * 0.2);
    }
  }

  drawSurfaceFeatures(shift) {
    const { planet: p } = this;
    switch (p.id) {
      case 'jupiter': this.drawJupiter(shift);       break;
      case 'earth':   this.drawEarth(shift);         break;
      case 'mars':    this.drawMars(shift);           break;
      case 'venus':   this.drawVenus(shift);         break;
      case 'saturn':  this.drawSaturnSurface(shift); break;
      case 'uranus':  this.drawUranus(shift);        break;
      case 'neptune': this.drawNeptune(shift);       break;
      case 'mercury': this.drawMercury(shift);       break;
    }
  }

  drawJupiter(shift) {
    const { ctx, CX, CY, R, t } = this;
    const bands = [
      { y: 0.15, h: 0.12, c: 'rgba(160,80,30,0.25)' },
      { y: 0.35, h: 0.08, c: 'rgba(200,140,80,0.2)' },
      { y: 0.52, h: 0.14, c: 'rgba(140,70,20,0.22)' },
      { y: 0.72, h: 0.10, c: 'rgba(180,110,50,0.18)' },
    ];
    bands.forEach(b => {
      const y = CY - R + b.y * R * 2;
      const grd = ctx.createLinearGradient(0, y, 0, y + b.h * R * 2);
      grd.addColorStop(0,   'transparent');
      grd.addColorStop(0.5, b.c);
      grd.addColorStop(1,   'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(CX - R, y, R * 2, b.h * R * 2);
    });
    // Great Red Spot
    const grsX = CX + R * 0.2 + Math.sin(shift * 0.01) * R * 0.05;
    const grsY = CY + R * 0.1;
    const pulse = 1 + 0.04 * Math.sin(t * 0.04);
    ctx.globalAlpha = 0.8;
    const spot = ctx.createRadialGradient(grsX, grsY, 0, grsX, grsY, R * 0.19 * pulse);
    spot.addColorStop(0,   'rgba(200,80,30,0.9)');
    spot.addColorStop(0.5, 'rgba(180,60,20,0.7)');
    spot.addColorStop(1,   'transparent');
    ctx.fillStyle = spot;
    ctx.save(); ctx.scale(1.7, 1);
    ctx.beginPath(); ctx.arc(grsX / 1.7, grsY, R * 0.14 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.restore(); ctx.globalAlpha = 1;
  }

  drawEarth(shift) {
    const { ctx, CX, CY, R, t } = this;
    const continents = [
      { x: CX - R * 0.35, y: CY - R * 0.1,  rx: R * 0.22, ry: R * 0.28, rot: -0.3 },
      { x: CX + R * 0.25, y: CY - R * 0.05, rx: R * 0.20, ry: R * 0.22, rot:  0.2 },
      { x: CX - R * 0.1,  y: CY + R * 0.3,  rx: R * 0.18, ry: R * 0.15, rot:  0.1 },
      { x: CX + R * 0.1,  y: CY - R * 0.35, rx: R * 0.22, ry: R * 0.12, rot: -0.1 },
    ];
    ctx.globalAlpha = 0.7;
    continents.forEach(c => {
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot + shift * 0.002);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(c.rx, c.ry));
      g.addColorStop(0,   '#2a8a30'); g.addColorStop(0.6, '#1e6e24'); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(0, 0, c.rx, c.ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    // Polar ice
    ['top','bot'].forEach(pole => {
      const py = pole === 'top' ? CY - R * 0.88 : CY + R * 0.78;
      const ig = ctx.createRadialGradient(CX, py, 0, CX, py, R * 0.22);
      ig.addColorStop(0, 'rgba(220,240,255,0.9)'); ig.addColorStop(1, 'transparent');
      ctx.fillStyle = ig; ctx.fillRect(CX - R, py - R * 0.18, R * 2, R * 0.36);
    });
    // Clouds
    ctx.globalAlpha = 0.22;
    for (let i = 0; i < 8; i++) {
      const cx2 = CX - R + ((i * 137 + shift * 0.8) % (R * 2));
      const cy2 = CY - R * 0.7 + (i * 71 % (R * 1.4));
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath(); ctx.ellipse(cx2, cy2, R * 0.18, R * 0.06, 0.2 * i, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawMars(shift) {
    const { ctx, CX, CY, R } = this;
    ctx.globalAlpha = 0.3;
    [{ x: CX - R * 0.2, y: CY - R * 0.15, rx: R * 0.3, ry: R * 0.2 },
     { x: CX + R * 0.3, y: CY + R * 0.2,  rx: R * 0.25, ry: R * 0.15 }].forEach(reg => {
      ctx.save(); ctx.translate(reg.x, reg.y); ctx.rotate(shift * 0.002);
      ctx.fillStyle = '#7a1a04';
      ctx.beginPath(); ctx.ellipse(0, 0, reg.rx, reg.ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    ctx.globalAlpha = 0.65;
    const ig = ctx.createRadialGradient(CX, CY - R * 0.85, 0, CX, CY - R * 0.85, R * 0.25);
    ig.addColorStop(0, 'rgba(220,220,240,0.9)'); ig.addColorStop(1, 'transparent');
    ctx.fillStyle = ig; ctx.fillRect(CX - R, CY - R, R * 2, R * 0.28);
    ctx.globalAlpha = 1;
  }

  drawVenus(shift) {
    const { ctx, CX, CY, R } = this;
    ctx.globalAlpha = 0.22;
    for (let i = 0; i < 10; i++) {
      const cx = CX - R + ((i * 89 + shift * 0.3) % (R * 2));
      const cy = CY - R * 0.8 + (i * 53 % (R * 1.6));
      const s = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.3);
      s.addColorStop(0, 'rgba(255,200,80,0.6)'); s.addColorStop(1, 'transparent');
      ctx.fillStyle = s;
      ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.35, R * 0.1, i * 0.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawSaturnSurface(shift) {
    // Photorealistic Saturn: golden cloud bands with subtle streaks
    const { ctx, CX, CY, R, t } = this;
    const bands = [
      { y: 0.08, h: 0.06, c: 'rgba(210,180,100,0.35)' },
      { y: 0.18, h: 0.04, c: 'rgba(180,150,70,0.25)' },
      { y: 0.28, h: 0.08, c: 'rgba(200,165,85,0.30)' },
      { y: 0.42, h: 0.05, c: 'rgba(155,125,55,0.28)' },
      { y: 0.52, h: 0.07, c: 'rgba(220,190,110,0.32)' },
      { y: 0.65, h: 0.05, c: 'rgba(170,140,65,0.25)' },
      { y: 0.75, h: 0.07, c: 'rgba(195,160,80,0.30)' },
      { y: 0.88, h: 0.05, c: 'rgba(165,135,60,0.22)' },
    ];
    bands.forEach(b => {
      const y = CY - R + b.y * R * 2;
      const g = ctx.createLinearGradient(0, y, 0, y + b.h * R * 2);
      g.addColorStop(0,'transparent'); g.addColorStop(0.4, b.c); g.addColorStop(0.6, b.c); g.addColorStop(1,'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(CX - R, y, R * 2, b.h * R * 2);
    });
    // Subtle polar whitening
    const polar = ctx.createRadialGradient(CX, CY - R * 0.85, 0, CX, CY - R * 0.85, R * 0.5);
    polar.addColorStop(0, 'rgba(240,225,180,0.4)'); polar.addColorStop(1, 'transparent');
    ctx.fillStyle = polar; ctx.fillRect(CX - R, CY - R, R * 2, R * 0.4);
  }

  drawUranus(shift) {
    // Photorealistic Uranus: smooth icy blue-green with faint banding
    const { ctx, CX, CY, R, t } = this;
    // Subtle latitudinal bands
    const bands = [
      { y: 0.05, h: 0.12, c: 'rgba(200,240,245,0.20)' },
      { y: 0.30, h: 0.08, c: 'rgba(100,200,210,0.12)' },
      { y: 0.55, h: 0.10, c: 'rgba(80,185,200,0.14)' },
      { y: 0.75, h: 0.12, c: 'rgba(60,170,185,0.12)' },
    ];
    bands.forEach(b => {
      const y = CY - R + b.y * R * 2;
      const g = ctx.createLinearGradient(0, y, 0, y + b.h * R * 2);
      g.addColorStop(0,'transparent'); g.addColorStop(0.5, b.c); g.addColorStop(1,'transparent');
      ctx.fillStyle = g; ctx.fillRect(CX - R, y, R * 2, b.h * R * 2);
    });
    // Polar white cap
    const polar = ctx.createRadialGradient(CX, CY - R * 0.8, 0, CX, CY - R * 0.8, R * 0.55);
    polar.addColorStop(0, 'rgba(220,245,248,0.45)'); polar.addColorStop(1, 'transparent');
    ctx.fillStyle = polar; ctx.fillRect(CX - R, CY - R, R * 2, R * 0.45);
  }

  drawNeptune(shift) {
    // Photorealistic Neptune: deep cobalt blue with Great Dark Spot + white cloud streaks
    const { ctx, CX, CY, R, t } = this;
    // Dynamic cloud bands
    const bands = [
      { y: 0.10, h: 0.06, c: 'rgba(80,120,220,0.30)' },
      { y: 0.28, h: 0.05, c: 'rgba(50,90,200,0.25)' },
      { y: 0.50, h: 0.07, c: 'rgba(100,140,230,0.22)' },
      { y: 0.70, h: 0.05, c: 'rgba(60,100,210,0.20)' },
    ];
    bands.forEach(b => {
      const y = CY - R + b.y * R * 2;
      const g = ctx.createLinearGradient(0, y, 0, y + b.h * R * 2);
      g.addColorStop(0,'transparent'); g.addColorStop(0.5, b.c); g.addColorStop(1,'transparent');
      ctx.fillStyle = g; ctx.fillRect(CX - R, y, R * 2, b.h * R * 2);
    });
    // Great Dark Spot — drifts slowly
    const sx = CX - R * 0.05 + Math.sin(t * 0.015) * R * 0.06;
    const sy = CY - R * 0.18 + Math.cos(t * 0.012) * R * 0.03;
    const spot = ctx.createRadialGradient(sx, sy, 0, sx, sy, R * 0.2);
    spot.addColorStop(0, 'rgba(15,30,90,0.85)'); spot.addColorStop(0.6, 'rgba(20,40,110,0.5)'); spot.addColorStop(1, 'transparent');
    ctx.fillStyle = spot;
    ctx.save(); ctx.scale(1.5, 1);
    ctx.beginPath(); ctx.arc(sx / 1.5, sy, R * 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // White cloud streak companions
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = 'rgba(200,225,255,0.9)'; ctx.lineWidth = R * 0.018;
    for (let i = 0; i < 4; i++) {
      const wy = sy + R * (0.22 + i * 0.08);
      ctx.beginPath();
      ctx.moveTo(CX - R * 0.55, wy + Math.sin(shift * 0.009 + i * 1.2) * R * 0.03);
      ctx.bezierCurveTo(CX - R * 0.2, wy + Math.sin(shift * 0.011 + i) * R * 0.05, CX + R * 0.2, wy, CX + R * 0.55, wy + Math.sin(shift * 0.008 + i) * R * 0.04);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  drawMercury(shift) {
    const { ctx, CX, CY, R } = this;
    const craters = [
      { x: CX - R * 0.3,  y: CY + R * 0.1,  r: R * 0.13 },
      { x: CX + R * 0.25, y: CY - R * 0.3,  r: R * 0.09 },
      { x: CX - R * 0.1,  y: CY + R * 0.38, r: R * 0.08 },
      { x: CX + R * 0.4,  y: CY + R * 0.22, r: R * 0.11 },
      { x: CX - R * 0.44, y: CY - R * 0.22, r: R * 0.07 },
    ];
    ctx.globalAlpha = 0.25;
    craters.forEach(cr => {
      ctx.strokeStyle = 'rgba(80,80,80,0.6)'; ctx.lineWidth = R * 0.025;
      ctx.beginPath(); ctx.arc(cr.x, cr.y, cr.r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  start() { if (!this.raf) this.frame(); }
  stop()  { if (this.raf)  cancelAnimationFrame(this.raf); this.raf = null; }
}
