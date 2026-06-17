export class Starfield {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.nebulae = [];
    this.shootingStars = [];
    this.particles = [];
    this.t = 0;
    this.nextShoot = 0;
    this.raf = null;
    this.resize();
    this.init();
  }

  resize() {
    this.W = this.canvas.width = window.innerWidth;
    this.H = this.canvas.height = window.innerHeight;
    this.init();
  }

  init() {
    const { W, H } = this;
    const count = Math.min(Math.floor(W * H / 2500), 700);
    this.stars = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.4 + 0.2,
      speed: Math.random() * 0.4 + 0.05,
      phase: Math.random() * Math.PI * 2,
      brightness: Math.random() * 0.6 + 0.2,
    }));

    this.nebulae = [
      { x: W * 0.15, y: H * 0.25, r: W * 0.22, c: 'rgba(106,92,255,0.05)' },
      { x: W * 0.8,  y: H * 0.5,  r: W * 0.28, c: 'rgba(0,229,255,0.035)' },
      { x: W * 0.45, y: H * 0.8,  r: W * 0.2,  c: 'rgba(0,255,198,0.04)' },
      { x: W * 0.7,  y: H * 0.15, r: W * 0.18, c: 'rgba(106,92,255,0.04)' },
    ];
  }

  spawnShootingStar() {
    const side = Math.random() < 0.5 ? 'top' : 'left';
    let x, y;
    if (side === 'top') { x = Math.random() * this.W * 0.7; y = 0; }
    else { x = 0; y = Math.random() * this.H * 0.5; }
    this.shootingStars.push({
      x, y,
      vx: 3 + Math.random() * 5,
      vy: 2 + Math.random() * 4,
      life: 0, maxLife: 60 + Math.random() * 40,
      len: 80 + Math.random() * 80,
    });
  }

  drawNebulae() {
    const ctx = this.ctx;
    const drift = Math.sin(this.t * 0.003) * 15;
    this.nebulae.forEach(n => {
      const grd = ctx.createRadialGradient(n.x + drift * 0.3, n.y + drift * 0.2, 0, n.x, n.y, n.r);
      grd.addColorStop(0, n.c);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(n.x + drift * 0.3, n.y + drift * 0.2, n.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawStars() {
    const ctx = this.ctx;
    this.stars.forEach(s => {
      const alpha = s.brightness * (0.5 + 0.5 * Math.sin(this.t * s.speed + s.phase));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      // Occasional star cross sparkle
      if (s.r > 1.1 && alpha > 0.6) {
        ctx.globalAlpha = alpha * 0.4;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(s.x - s.r * 3, s.y);
        ctx.lineTo(s.x + s.r * 3, s.y);
        ctx.moveTo(s.x, s.y - s.r * 3);
        ctx.lineTo(s.x, s.y + s.r * 3);
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  }

  drawShootingStars() {
    const ctx = this.ctx;
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const s = this.shootingStars[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life++;

      const progress = s.life / s.maxLife;
      const alpha = progress < 0.5
        ? progress * 2
        : 1 - (progress - 0.5) * 2;

      const tailX = s.x - (s.vx / Math.sqrt(s.vx ** 2 + s.vy ** 2)) * s.len;
      const tailY = s.y - (s.vy / Math.sqrt(s.vx ** 2 + s.vy ** 2)) * s.len;

      const grd = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      grd.addColorStop(0, 'transparent');
      grd.addColorStop(0.7, `rgba(0,229,255,${alpha * 0.6})`);
      grd.addColorStop(1, `rgba(255,255,255,${alpha})`);

      ctx.strokeStyle = grd;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
      ctx.globalAlpha = 1;

      if (s.life >= s.maxLife || s.x > this.W || s.y > this.H) {
        this.shootingStars.splice(i, 1);
      }
    }
  }

  frame() {
    const { ctx, W, H } = this;
    ctx.clearRect(0, 0, W, H);
    this.drawNebulae();
    this.drawStars();
    this.t++;
    if (this.t >= this.nextShoot) {
      this.spawnShootingStar();
      this.nextShoot = this.t + 180 + Math.random() * 240;
    }
    this.drawShootingStars();
    this.raf = requestAnimationFrame(() => this.frame());
  }

  start() {
    if (this.raf) return;
    this.frame();
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  }
}
