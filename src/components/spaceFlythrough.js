/* ═══════════════════════════════════════════════════════════════
   SolarSystem3D — NASA Eyes-style 3D intro experience
   ─ Three.js WebGL renderer
   ─ 3D orbiting planets with glow, rings, labels
   ─ Tilted orbital plane view (like NASA Eyes)
   ─ Mouse-drag camera orbit + scroll zoom
   ─ Animated intro camera fly-in
   ─ Skip button reveals main site
   ═══════════════════════════════════════════════════════════════ */

import * as THREE from 'three';

/* ── Planet data ────────────────────────────────────────────── */
const PLANETS = [
  { id:'mercury', name:'Mercury', radius:0.38, orbitR:8,  speed:0.0415, color:0xB5B5B5, tilt:0,   emissive:0x333333 },
  { id:'venus',   name:'Venus',   radius:0.95, orbitR:12, speed:0.0162, color:0xE8C56B, tilt:0,   emissive:0x442200 },
  { id:'earth',   name:'Earth',   radius:1.00, orbitR:16, speed:0.0100, color:0x2E8FF5, tilt:23.4,emissive:0x001133 },
  { id:'mars',    name:'Mars',    radius:0.53, orbitR:21, speed:0.0053, color:0xC1440E, tilt:25.2,emissive:0x220800 },
  { id:'jupiter', name:'Jupiter', radius:2.80, orbitR:32, speed:0.0008, color:0xC8A87A, tilt:3.1, emissive:0x221100 },
  { id:'saturn',  name:'Saturn',  radius:2.30, orbitR:42, speed:0.0003, color:0xE4D5A0, tilt:26.7,emissive:0x221100, rings:true },
  { id:'uranus',  name:'Uranus',  radius:1.70, orbitR:52, speed:0.0001, color:0x7DE8E8, tilt:97.8,emissive:0x002222 },
  { id:'neptune', name:'Neptune', radius:1.65, orbitR:60, speed:0.00006,color:0x4060D8, tilt:28.3,emissive:0x000022 },
];

export class SolarSystem3D {
  constructor(container, onSkip) {
    this.container = container;
    this.onSkip    = onSkip;
    this.running   = false;
    this.planets   = [];
    this._angles   = PLANETS.map((p, i) => i * 0.8); // stagger start angles

    /* Mouse orbit state */
    this._drag    = false;
    this._lastMX  = 0;
    this._lastMY  = 0;
    this._camTheta = 0.3;   // horizontal angle
    this._camPhi   = 0.92;  // vertical angle (slightly above orbital plane)
    this._camR     = 85;    // distance
    this._targetR  = 85;

    /* Intro fly-in */
    this._introR     = 220; // start far away
    this._introDone  = false;
  }

  /* ── Init ─────────────────────────────────────────────────── */
  init() {
    const W = window.innerWidth, H = window.innerHeight;

    /* Renderer */
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(W, H);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    Object.assign(this.renderer.domElement.style, {
      position: 'fixed', inset: '0', zIndex: '600',
      width: '100vw', height: '100vh', opacity: '0',
      transition: 'opacity 0.8s ease',
    });
    this.container.appendChild(this.renderer.domElement);

    /* Scene */
    this.scene = new THREE.Scene();

    /* Camera */
    this.camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 2000);
    this._updateCamera(true);

    /* Starfield */
    this._buildStars();

    /* Lighting */
    const ambient = new THREE.AmbientLight(0x111122, 0.6);
    this.scene.add(ambient);

    const sunLight = new THREE.PointLight(0xFFF5CC, 3.5, 500);
    sunLight.position.set(0, 0, 0);
    this.scene.add(sunLight);

    /* Sun */
    this._buildSun();

    /* Planets */
    PLANETS.forEach((data, i) => {
      this._buildPlanet(data, i);
    });

    /* CSS2D labels (done manually with canvas overlay) */
    this._buildLabelCanvas();

    /* UI — Skip button */
    this._buildSkipButton();

    /* Resize */
    window.addEventListener('resize', () => this._onResize());

    /* Mouse events */
    this.renderer.domElement.addEventListener('mousedown',  e => this._onMouseDown(e));
    this.renderer.domElement.addEventListener('mousemove',  e => this._onMouseMove(e));
    this.renderer.domElement.addEventListener('mouseup',    ()  => this._drag = false);
    this.renderer.domElement.addEventListener('mouseleave', ()  => this._drag = false);
    this.renderer.domElement.addEventListener('wheel',      e => this._onWheel(e), { passive: true });

    /* Touch */
    this.renderer.domElement.addEventListener('touchstart', e => {
      this._drag = true; this._lastMX = e.touches[0].clientX; this._lastMY = e.touches[0].clientY;
    }, { passive: true });
    this.renderer.domElement.addEventListener('touchmove', e => {
      if (!this._drag) return;
      const dx = e.touches[0].clientX - this._lastMX;
      const dy = e.touches[0].clientY - this._lastMY;
      this._lastMX = e.touches[0].clientX;
      this._lastMY = e.touches[0].clientY;
      this._camTheta -= dx * 0.006;
      this._camPhi    = Math.max(0.15, Math.min(1.4, this._camPhi + dy * 0.006));
    }, { passive: true });
  }

  /* ── Starfield ─────────────────────────────────────────────── */
  _buildStars() {
    const N = 6000;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const colors = [
      [1, 1, 1], [0.7, 0.85, 1], [1, 0.95, 0.75], [0.8, 0.7, 1],
    ];
    for (let i = 0; i < N; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 600 + Math.random() * 400;
      pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = r * Math.cos(phi);
      const c = colors[Math.floor(Math.random() * colors.length)];
      col[i*3] = c[0]; col[i*3+1] = c[1]; col[i*3+2] = c[2];
    }
    const geo  = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    const mat  = new THREE.PointsMaterial({ size: 0.6, vertexColors: true, transparent: true, opacity: 0.9 });
    this.scene.add(new THREE.Points(geo, mat));
  }

  /* ── Sun ───────────────────────────────────────────────────── */
  _buildSun() {
    /* Core */
    const sunGeo = new THREE.SphereGeometry(3.5, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFF5CC });
    this.sun = new THREE.Mesh(sunGeo, sunMat);
    this.scene.add(this.sun);

    /* Corona layers */
    [8, 12, 18].forEach((r, i) => {
      const g = new THREE.SphereGeometry(r, 24, 24);
      const m = new THREE.MeshBasicMaterial({
        color: new THREE.Color(1, 0.7 - i * 0.15, 0.1),
        transparent: true,
        opacity: [0.08, 0.05, 0.03][i],
        side: THREE.FrontSide,
        depthWrite: false,
      });
      this.scene.add(new THREE.Mesh(g, m));
    });
  }

  /* ── Planet ────────────────────────────────────────────────── */
  _buildPlanet(data, idx) {
    /* Orbit ring */
    const ringGeo = new THREE.RingGeometry(data.orbitR - 0.08, data.orbitR + 0.08, 120);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.06,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    this.scene.add(ring);

    /* Planet body */
    const geo = new THREE.SphereGeometry(data.radius, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: data.color,
      emissive: data.emissive,
      emissiveIntensity: 0.25,
      roughness: 0.78,
      metalness: 0.05,
    });
    const mesh = new THREE.Mesh(geo, mat);

    /* Pivot for orbit */
    const pivot = new THREE.Object3D();
    pivot.add(mesh);
    mesh.position.x = data.orbitR;
    this.scene.add(pivot);

    /* Glow sprite */
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = glowCanvas.height = 128;
    const gc = glowCanvas.getContext('2d');
    const grd = gc.createRadialGradient(64, 64, 0, 64, 64, 64);
    const hex = '#' + data.color.toString(16).padStart(6, '0');
    grd.addColorStop(0, hex + 'cc');
    grd.addColorStop(0.4, hex + '44');
    grd.addColorStop(1, 'transparent');
    gc.fillStyle = grd;
    gc.fillRect(0, 0, 128, 128);
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    const glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0.5, depthWrite: false });
    const glowSprite = new THREE.Sprite(glowMat);
    glowSprite.scale.set(data.radius * 5, data.radius * 5, 1);
    mesh.add(glowSprite);

    /* Saturn rings */
    if (data.rings) {
      [
        { inner: data.radius * 1.4, outer: data.radius * 2.0, opacity: 0.55 },
        { inner: data.radius * 2.1, outer: data.radius * 2.6, opacity: 0.35 },
        { inner: data.radius * 2.7, outer: data.radius * 3.0, opacity: 0.20 },
      ].forEach(r => {
        const rg  = new THREE.RingGeometry(r.inner, r.outer, 80);
        const rm  = new THREE.MeshBasicMaterial({
          color: 0xE4D5A0, transparent: true, opacity: r.opacity,
          side: THREE.DoubleSide, depthWrite: false,
        });
        const rmesh = new THREE.Mesh(rg, rm);
        rmesh.rotation.x = Math.PI * 0.42;
        mesh.add(rmesh);
      });
    }

    /* Axial tilt */
    pivot.rotation.z = THREE.MathUtils.degToRad(data.tilt * 0.15);

    this.planets.push({ data, pivot, mesh, glowSprite });
  }

  /* ── Label canvas overlay ──────────────────────────────────── */
  _buildLabelCanvas() {
    this._labelCanvas = document.createElement('canvas');
    Object.assign(this._labelCanvas.style, {
      position: 'fixed', inset: '0', zIndex: '601',
      pointerEvents: 'none', width: '100vw', height: '100vh',
    });
    this.container.appendChild(this._labelCanvas);
    this._lctx = this._labelCanvas.getContext('2d');
    this._labelCanvas.width  = window.innerWidth;
    this._labelCanvas.height = window.innerHeight;
  }

  _drawLabels() {
    const lc = this._lctx;
    lc.clearRect(0, 0, this._labelCanvas.width, this._labelCanvas.height);
    if (!this._introDone) return;

    this.planets.forEach(({ data, mesh, pivot }) => {
      /* World position of planet */
      const worldPos = new THREE.Vector3();
      mesh.getWorldPosition(worldPos);

      /* Project to screen */
      const proj = worldPos.clone().project(this.camera);
      const sx = (proj.x * 0.5 + 0.5) * this._labelCanvas.width;
      const sy = (-proj.y * 0.5 + 0.5) * this._labelCanvas.height;
      if (proj.z > 1) return; // behind camera

      const radius = (data.radius / (worldPos.distanceTo(this.camera.position))) * 600;

      lc.save();
      lc.globalAlpha = 0.75;
      lc.fillStyle = '#ffffff';
      lc.font = '500 11px "Space Grotesk", sans-serif';
      lc.textAlign = 'center';
      lc.fillText(data.name, sx, sy + radius + 18);

      /* Dot connector */
      lc.strokeStyle = 'rgba(255,255,255,0.22)';
      lc.lineWidth = 0.7;
      lc.beginPath();
      lc.moveTo(sx, sy + radius + 3);
      lc.lineTo(sx, sy + radius + 10);
      lc.stroke();

      lc.restore();
    });
  }

  /* ── Skip button ───────────────────────────────────────────── */
  _buildSkipButton() {
    this._skipBtn = document.createElement('button');
    this._skipBtn.textContent = 'SKIP  →';
    Object.assign(this._skipBtn.style, {
      position:       'fixed',
      bottom:         '2.5rem',
      right:          '2.5rem',
      zIndex:         '700',
      padding:        '0.55rem 1.2rem',
      background:     'rgba(5,6,14,0.85)',
      border:         '1px solid rgba(255,255,255,0.14)',
      color:          'rgba(255,255,255,0.55)',
      fontFamily:     '"JetBrains Mono", monospace',
      fontSize:       '11px',
      letterSpacing:  '0.18em',
      cursor:         'pointer',
      backdropFilter: 'blur(20px)',
      borderRadius:   '2px',
      transition:     'all 0.22s',
      opacity:        '0',
    });
    this._skipBtn.addEventListener('mouseenter', () => {
      this._skipBtn.style.color  = '#fff';
      this._skipBtn.style.borderColor = 'rgba(255,255,255,0.4)';
    });
    this._skipBtn.addEventListener('mouseleave', () => {
      this._skipBtn.style.color = 'rgba(255,255,255,0.55)';
      this._skipBtn.style.borderColor = 'rgba(255,255,255,0.14)';
    });
    this._skipBtn.addEventListener('click', () => this.skip());
    this.container.appendChild(this._skipBtn);

    /* Show after 1.5s */
    setTimeout(() => { this._skipBtn.style.opacity = '1'; }, 1500);
  }

  /* ── Camera ────────────────────────────────────────────────── */
  _updateCamera(instant = false) {
    const r = this._introDone ? this._camR : this._introR;
    const x = r * Math.sin(this._camPhi) * Math.sin(this._camTheta);
    const y = r * Math.cos(this._camPhi);
    const z = r * Math.sin(this._camPhi) * Math.cos(this._camTheta);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  /* ── Resize ────────────────────────────────────────────────── */
  _onResize() {
    const W = window.innerWidth, H = window.innerHeight;
    this.renderer.setSize(W, H);
    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
    this._labelCanvas.width  = W;
    this._labelCanvas.height = H;
  }

  /* ── Mouse input ───────────────────────────────────────────── */
  _onMouseDown(e) {
    this._drag = true;
    this._lastMX = e.clientX;
    this._lastMY = e.clientY;
  }

  _onMouseMove(e) {
    if (!this._drag || !this._introDone) return;
    const dx = e.clientX - this._lastMX;
    const dy = e.clientY - this._lastMY;
    this._lastMX = e.clientX;
    this._lastMY = e.clientY;
    this._camTheta -= dx * 0.005;
    this._camPhi = Math.max(0.15, Math.min(1.45, this._camPhi + dy * 0.005));
  }

  _onWheel(e) {
    if (!this._introDone) return;
    this._targetR = Math.max(30, Math.min(160, this._targetR + e.deltaY * 0.08));
  }

  /* ── Main animation loop ───────────────────────────────────── */
  start() {
    this.running = true;

    /* Fade in renderer */
    setTimeout(() => {
      this.renderer.domElement.style.opacity = '1';
    }, 50);

    const animate = () => {
      if (!this.running) return;
      requestAnimationFrame(animate);

      const t = performance.now() * 0.001;

      /* Intro fly-in — camera zooms from far to normal */
      if (!this._introDone) {
        this._introR *= 0.972;
        if (this._introR <= this._camR + 0.5) {
          this._introR  = this._camR;
          this._introDone = true;
        }
        this._updateCamera();
      } else {
        /* Smooth zoom */
        this._camR += (this._targetR - this._camR) * 0.06;
        this._updateCamera();
      }

      /* Sun pulse */
      if (this.sun) {
        const pulse = 1 + 0.018 * Math.sin(t * 1.2);
        this.sun.scale.setScalar(pulse);
      }

      /* Orbit planets */
      this.planets.forEach(({ data }, i) => {
        this._angles[i] += data.speed * 0.6;
        const { pivot, mesh } = this.planets[i];
        pivot.rotation.y = this._angles[i];

        /* Subtle self-rotation */
        mesh.rotation.y += 0.003;
      });

      this.renderer.render(this.scene, this.camera);
      this._drawLabels();
    };

    animate();
  }

  /* ── Skip ──────────────────────────────────────────────────── */
  skip() {
    /* Fade out everything */
    this.renderer.domElement.style.transition = 'opacity 0.7s ease';
    this.renderer.domElement.style.opacity    = '0';
    this._labelCanvas.style.transition  = 'opacity 0.7s ease';
    this._labelCanvas.style.opacity     = '0';
    this._skipBtn.style.opacity         = '0';

    setTimeout(() => {
      this.running = false;
      this.renderer.domElement.remove();
      this._labelCanvas.remove();
      this._skipBtn.remove();
      this.renderer.dispose();
      if (this.onSkip) this.onSkip();
    }, 750);
  }

  destroy() {
    this.running = false;
    try { this.renderer.dispose(); } catch (_) {}
  }
}
