/* ═══════════════════════════════════════════════════════════════
   SolarSystem3D — Cinematic NASA Eyes-style 3D experience v2
   ─ Three.js WebGL renderer with ACESFilmic tone mapping
   ─ Procedural canvas textures for each planet
   ─ Animated sun with corona + solar flares
   ─ Asteroid belt particle system
   ─ Nebula cloud backdrop (coloured particle fields)
   ─ Occasional comets streaking through
   ─ Cinematic arc camera intro
   ─ Mouse drag orbit + scroll zoom
   ─ Hover highlight + planet name tooltip
   ─ Skip button
   ═══════════════════════════════════════════════════════════════ */

import * as THREE from 'three';

/* ── Planet definitions ─────────────────────────────────────── */
const PLANET_DATA = [
  { id:'mercury', name:'Mercury', radius:0.38, orbitR:8,   speed:0.0415, tilt:0.03,
    surface: (ctx,s) => {
      ctx.fillStyle='#8C7B6E'; ctx.fillRect(0,0,s,s);
      for(let i=0;i<120;i++){
        const x=Math.random()*s,y=Math.random()*s,r=1+Math.random()*4;
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
        ctx.fillStyle=`rgba(60,50,40,${0.3+Math.random()*0.4})`; ctx.fill();
      }
    }, emissive:0x1a1008 },

  { id:'venus', name:'Venus', radius:0.95, orbitR:12, speed:0.0162, tilt:177.4,
    surface: (ctx,s) => {
      const g=ctx.createLinearGradient(0,0,s,s);
      g.addColorStop(0,'#E8C56B'); g.addColorStop(0.5,'#D4A843'); g.addColorStop(1,'#C49030');
      ctx.fillStyle=g; ctx.fillRect(0,0,s,s);
      for(let i=0;i<40;i++){
        ctx.beginPath();
        ctx.moveTo(0,Math.random()*s);
        ctx.bezierCurveTo(s/3,Math.random()*s,s*2/3,Math.random()*s,s,Math.random()*s);
        ctx.strokeStyle=`rgba(255,200,80,0.15)`; ctx.lineWidth=8; ctx.stroke();
      }
    }, emissive:0x2a1800 },

  { id:'earth', name:'Earth', radius:1.00, orbitR:16, speed:0.0100, tilt:23.4,
    surface: (ctx,s) => {
      ctx.fillStyle='#1A6FA8'; ctx.fillRect(0,0,s,s);
      // Continents
      const lands=[[0.18,0.3,0.14,0.22],[0.36,0.25,0.18,0.28],[0.55,0.3,0.08,0.18],
                   [0.62,0.15,0.12,0.12],[0.7,0.32,0.1,0.2]];
      ctx.fillStyle='#2D7A2D';
      lands.forEach(([cx,cy,w,h])=>{
        ctx.beginPath(); ctx.ellipse(cx*s,cy*s,w*s,h*s,Math.random(),0,Math.PI*2); ctx.fill();
      });
      // Clouds
      ctx.fillStyle='rgba(255,255,255,0.3)';
      for(let i=0;i<20;i++){
        ctx.beginPath(); ctx.ellipse(Math.random()*s,Math.random()*s,
          20+Math.random()*40,5+Math.random()*15,Math.random(),0,Math.PI*2); ctx.fill();
      }
    }, emissive:0x001833 },

  { id:'mars', name:'Mars', radius:0.53, orbitR:21, speed:0.0053, tilt:25.2,
    surface: (ctx,s) => {
      ctx.fillStyle='#C1440E'; ctx.fillRect(0,0,s,s);
      for(let i=0;i<60;i++){
        const x=Math.random()*s,y=Math.random()*s;
        ctx.beginPath(); ctx.arc(x,y,2+Math.random()*8,0,Math.PI*2);
        ctx.fillStyle=`rgba(${180+Math.random()*40|0},${60+Math.random()*20|0},10,0.35)`; ctx.fill();
      }
      // Polar cap
      const pg=ctx.createRadialGradient(s/2,4,0,s/2,0,s/8);
      pg.addColorStop(0,'rgba(255,255,255,0.9)'); pg.addColorStop(1,'transparent');
      ctx.fillStyle=pg; ctx.fillRect(0,0,s,s/5);
    }, emissive:0x1a0800 },

  { id:'jupiter', name:'Jupiter', radius:2.80, orbitR:32, speed:0.0008, tilt:3.1,
    surface: (ctx,s) => {
      const bands=['#C8A87A','#B5915E','#D4B88C','#8B6943','#C0A070','#E0C898'];
      const bh = s/bands.length;
      bands.forEach((c,i)=>{ ctx.fillStyle=c; ctx.fillRect(0,i*bh,s,bh+1); });
      // Great Red Spot
      ctx.fillStyle='rgba(180,60,40,0.7)';
      ctx.beginPath(); ctx.ellipse(s*0.6,s*0.55,s*0.08,s*0.05,0,0,Math.PI*2); ctx.fill();
    }, emissive:0x181008 },

  { id:'saturn', name:'Saturn', radius:2.30, orbitR:42, speed:0.0003, tilt:26.7, rings:true,
    surface: (ctx,s) => {
      const bands=['#E4D5A0','#D4C580','#EDE0B0','#C8B870','#E0D098'];
      const bh=s/bands.length;
      bands.forEach((c,i)=>{ ctx.fillStyle=c; ctx.fillRect(0,i*bh,s,bh+1); });
    }, emissive:0x181408 },

  { id:'uranus', name:'Uranus', radius:1.70, orbitR:52, speed:0.0001, tilt:97.8,
    surface: (ctx,s) => {
      const g=ctx.createLinearGradient(0,0,0,s);
      g.addColorStop(0,'#7DE8E8'); g.addColorStop(0.5,'#63D8D8'); g.addColorStop(1,'#4DCCCC');
      ctx.fillStyle=g; ctx.fillRect(0,0,s,s);
    }, emissive:0x001818 },

  { id:'neptune', name:'Neptune', radius:1.65, orbitR:60, speed:0.00006, tilt:28.3,
    surface: (ctx,s) => {
      const g=ctx.createLinearGradient(0,0,0,s);
      g.addColorStop(0,'#4060D8'); g.addColorStop(0.5,'#2848C0'); g.addColorStop(1,'#1030A8');
      ctx.fillStyle=g; ctx.fillRect(0,0,s,s);
      // Storm bands
      for(let i=0;i<5;i++){
        ctx.fillStyle='rgba(80,120,220,0.3)';
        ctx.fillRect(0,(i/5)*s,s,s*0.06);
      }
    }, emissive:0x000820 },
];

/* ── Texture factory ────────────────────────────────────────── */
function makePlanetTexture(surfaceFn, size=256) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  surfaceFn(canvas.getContext('2d'), size);
  return new THREE.CanvasTexture(canvas);
}

/* ── Glow sprite texture ────────────────────────────────────── */
function makeGlowTexture(hexColor) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const hex = '#' + hexColor.toString(16).padStart(6,'0');
  const g = ctx.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0, hex+'ff');
  g.addColorStop(0.3, hex+'88');
  g.addColorStop(0.7, hex+'22');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,128,128);
  return new THREE.CanvasTexture(c);
}

/* ── Sun texture ────────────────────────────────────────────── */
function makeSunTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(256,256,0,256,256,256);
  g.addColorStop(0,   '#FFFDE8');
  g.addColorStop(0.2, '#FFE066');
  g.addColorStop(0.6, '#FFB820');
  g.addColorStop(0.85,'#FF7800');
  g.addColorStop(1,   '#FF4400');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,512,512);
  // Surface granulation
  for(let i=0;i<400;i++){
    const x=Math.random()*512,y=Math.random()*512;
    ctx.beginPath(); ctx.arc(x,y,2+Math.random()*6,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,${180+Math.random()*60|0},0,${0.05+Math.random()*0.1})`; ctx.fill();
  }
  return new THREE.CanvasTexture(c);
}

/* ══════════════════════════════════════════════════════════════
   SolarSystem3D
══════════════════════════════════════════════════════════════ */
export class SolarSystem3D {
  constructor(container, onSkip) {
    this.container = container;
    this.onSkip    = onSkip;
    this.running   = false;
    this.objects   = [];  // { data, pivot, mesh }
    this.angles    = PLANET_DATA.map((_, i) => i * 0.9);
    this.comets    = [];
    this._nextComet = 5000;

    /* Camera orbit state */
    this._drag     = false;
    this._lastMX   = 0; this._lastMY = 0;
    this._camTheta = 0.5;
    this._camPhi   = 0.88;
    this._camR     = 80;
    this._targetR  = 80;
    this._hoveredPlanet = null;

    /* Intro arc animation */
    this._introPhase  = 0;  // 0..1
    this._introDone   = false;
    this._introStartR = 220;
    this._introStartPhi = 0.3;
  }

  /* ── Init ─────────────────────────────────────────────────── */
  init() {
    const W = window.innerWidth, H = window.innerHeight;

    /* Renderer */
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(W, H);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = false;
    Object.assign(this.renderer.domElement.style, {
      position: 'fixed', inset: '0', zIndex: '600',
      width: '100vw', height: '100vh',
      opacity: '0', transition: 'opacity 1s ease',
    });
    this.container.appendChild(this.renderer.domElement);

    /* Scene */
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000008, 0.0008);

    /* Camera */
    this.camera = new THREE.PerspectiveCamera(52, W/H, 0.1, 2000);
    this._applyCamera(true);

    /* Build scene */
    this._buildStars();
    this._buildNebula();
    this._buildSun();
    this._buildLights();
    PLANET_DATA.forEach((d, i) => this._buildPlanet(d, i));
    this._buildAsteroidBelt();
    this._buildLabelOverlay();
    this._buildHUD();
    this._buildSkipButton();

    /* Events */
    window.addEventListener('resize', () => this._onResize());
    const el = this.renderer.domElement;
    el.addEventListener('mousedown',  e => { this._drag=true; this._lastMX=e.clientX; this._lastMY=e.clientY; });
    el.addEventListener('mousemove',  e => this._onMouseMove(e));
    el.addEventListener('mouseup',    () => this._drag=false);
    el.addEventListener('mouseleave', () => this._drag=false);
    el.addEventListener('wheel',      e => this._onWheel(e), { passive: true });
    el.addEventListener('touchstart', e => { this._drag=true; this._lastMX=e.touches[0].clientX; this._lastMY=e.touches[0].clientY; }, { passive:true });
    el.addEventListener('touchmove',  e => {
      if(!this._drag) return;
      const dx=e.touches[0].clientX-this._lastMX, dy=e.touches[0].clientY-this._lastMY;
      this._lastMX=e.touches[0].clientX; this._lastMY=e.touches[0].clientY;
      this._camTheta-=dx*0.006; this._camPhi=Math.max(0.1,Math.min(1.45,this._camPhi+dy*0.006));
    }, { passive:true });
    el.addEventListener('touchend', () => this._drag=false);
  }

  /* ── Stars ─────────────────────────────────────────────────── */
  _buildStars() {
    const N = 8000;
    const pos = new Float32Array(N*3);
    const col = new Float32Array(N*3);
    const sz  = new Float32Array(N);
    const palettes = [[1,1,1],[0.7,0.85,1],[1,0.95,0.75],[0.8,0.7,1],[0.9,0.95,1]];
    for(let i=0;i<N;i++){
      const th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
      const r=500+Math.random()*500;
      pos[i*3]=r*Math.sin(ph)*Math.cos(th); pos[i*3+1]=r*Math.sin(ph)*Math.sin(th); pos[i*3+2]=r*Math.cos(ph);
      const c=palettes[Math.floor(Math.random()*palettes.length)];
      col[i*3]=c[0]; col[i*3+1]=c[1]; col[i*3+2]=c[2];
      sz[i] = 0.4 + Math.random()*1.2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col,3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sz,1));
    const mat = new THREE.PointsMaterial({ size:0.7, vertexColors:true, transparent:true, opacity:0.92, sizeAttenuation:true });
    this.scene.add(new THREE.Points(geo,mat));
  }

  /* ── Nebula clouds ─────────────────────────────────────────── */
  _buildNebula() {
    const configs = [
      { color:new THREE.Color(0.15,0.05,0.35), count:800, spread:350, y:80  },
      { color:new THREE.Color(0.05,0.1,0.4),   count:600, spread:300, y:-60 },
      { color:new THREE.Color(0.3,0.05,0.15),  count:500, spread:280, y:40  },
    ];
    configs.forEach(({color,count,spread,y})=>{
      const pos=new Float32Array(count*3);
      for(let i=0;i<count;i++){
        const th=Math.random()*Math.PI*2, r=spread*0.4+Math.random()*spread*0.6;
        pos[i*3]=Math.cos(th)*r; pos[i*3+1]=y+(Math.random()-0.5)*120; pos[i*3+2]=Math.sin(th)*r;
      }
      const geo=new THREE.BufferGeometry();
      geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
      const mat=new THREE.PointsMaterial({ color, size:12, transparent:true, opacity:0.08, sizeAttenuation:true, depthWrite:false });
      this.scene.add(new THREE.Points(geo,mat));
    });
  }

  /* ── Lights ─────────────────────────────────────────────────── */
  _buildLights() {
    this.scene.add(new THREE.AmbientLight(0x0a0a18, 1.2));
    const sun=new THREE.PointLight(0xFFF5CC, 4.5, 600, 1.5);
    sun.position.set(0,0,0);
    this.scene.add(sun);
  }

  /* ── Sun ───────────────────────────────────────────────────── */
  _buildSun() {
    const tex = makeSunTexture();
    const geo = new THREE.SphereGeometry(3.5, 48, 48);
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    this.sunMesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.sunMesh);

    /* Corona layers */
    const coronaData = [
      { r:6.5,  opacity:0.18, color:0xFF9900 },
      { r:10.5, opacity:0.10, color:0xFF7700 },
      { r:16,   opacity:0.055,color:0xFF5500 },
      { r:24,   opacity:0.025,color:0xFF3300 },
    ];
    this.coronaLayers = coronaData.map(({r,opacity,color})=>{
      const g=new THREE.SphereGeometry(r,24,24);
      const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.FrontSide,depthWrite:false});
      const mesh=new THREE.Mesh(g,m);
      this.scene.add(mesh);
      return { mesh, baseOpacity:opacity };
    });

    /* Lens flare sprite */
    const flareCanvas=document.createElement('canvas');
    flareCanvas.width=flareCanvas.height=256;
    const fc=flareCanvas.getContext('2d');
    const fg=fc.createRadialGradient(128,128,0,128,128,128);
    fg.addColorStop(0,'rgba(255,255,240,1)');
    fg.addColorStop(0.05,'rgba(255,240,180,0.9)');
    fg.addColorStop(0.2,'rgba(255,180,60,0.4)');
    fg.addColorStop(0.5,'rgba(255,120,0,0.1)');
    fg.addColorStop(1,'transparent');
    fc.fillStyle=fg; fc.fillRect(0,0,256,256);
    const flareTex=new THREE.CanvasTexture(flareCanvas);
    const flareMat=new THREE.SpriteMaterial({map:flareTex,transparent:true,opacity:0.7,blending:THREE.AdditiveBlending,depthWrite:false});
    this.flareSpr=new THREE.Sprite(flareMat);
    this.flareSpr.scale.set(30,30,1);
    this.scene.add(this.flareSpr);
  }

  /* ── Planet ─────────────────────────────────────────────────── */
  _buildPlanet(data, idx) {
    /* Orbit dashed ring */
    const orbitPts=[];
    for(let i=0;i<=128;i++) orbitPts.push(new THREE.Vector3(Math.cos(i/128*Math.PI*2)*data.orbitR,0,Math.sin(i/128*Math.PI*2)*data.orbitR));
    const orbitGeo=new THREE.BufferGeometry().setFromPoints(orbitPts);
    const orbitMat=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.055});
    this.scene.add(new THREE.LineLoop(orbitGeo,orbitMat));

    /* Planet mesh with texture */
    const tex=makePlanetTexture(data.surface, data.radius > 1.5 ? 512 : 256);
    const geo=new THREE.SphereGeometry(data.radius,36,36);
    const mat=new THREE.MeshStandardMaterial({
      map:tex, emissive:new THREE.Color(data.emissive), emissiveIntensity:0.3,
      roughness:0.8, metalness:0.05,
    });
    const mesh=new THREE.Mesh(geo,mat);

    /* Glow sprite */
    // Pick dominant texture color for glow
    const glowColors = [0xB5B5B5,0xE8C56B,0x2E8FF5,0xC1440E,0xC8A87A,0xE4D5A0,0x7DE8E8,0x4060D8];
    const glowTex=makeGlowTexture(glowColors[idx]);
    const glowMat=new THREE.SpriteMaterial({map:glowTex,transparent:true,opacity:0.55,blending:THREE.AdditiveBlending,depthWrite:false});
    const glow=new THREE.Sprite(glowMat);
    glow.scale.set(data.radius*5.5,data.radius*5.5,1);
    mesh.add(glow);

    /* Atmosphere (Earth, Venus) */
    if(data.id==='earth'||data.id==='venus'){
      const atmGeo=new THREE.SphereGeometry(data.radius*1.05,24,24);
      const atmMat=new THREE.MeshBasicMaterial({
        color: data.id==='earth' ? 0x4488ff : 0xeeaa44,
        transparent:true, opacity:0.12, side:THREE.FrontSide, depthWrite:false,
      });
      mesh.add(new THREE.Mesh(atmGeo,atmMat));
    }

    /* Saturn rings */
    if(data.rings){
      const ringBands=[
        {inner:data.radius*1.4,outer:data.radius*2.0,opacity:0.60},
        {inner:data.radius*2.1,outer:data.radius*2.5,opacity:0.40},
        {inner:data.radius*2.6,outer:data.radius*3.0,opacity:0.22},
      ];
      ringBands.forEach(({inner,outer,opacity})=>{
        const rg=new THREE.RingGeometry(inner,outer,90);
        const rm=new THREE.MeshBasicMaterial({color:0xE4D5A0,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false});
        const rmesh=new THREE.Mesh(rg,rm);
        rmesh.rotation.x=Math.PI*0.44;
        mesh.add(rmesh);
      });
    }

    /* Uranus thin rings */
    if(data.id==='uranus'){
      const rg=new THREE.RingGeometry(data.radius*1.5,data.radius*1.8,60);
      const rm=new THREE.MeshBasicMaterial({color:0x88dddd,transparent:true,opacity:0.18,side:THREE.DoubleSide,depthWrite:false});
      const rmesh=new THREE.Mesh(rg,rm);
      rmesh.rotation.x=Math.PI*0.1;
      mesh.add(rmesh);
    }

    /* Pivot */
    const pivot=new THREE.Object3D();
    pivot.add(mesh);
    mesh.position.x=data.orbitR;
    mesh.rotation.z=THREE.MathUtils.degToRad(data.tilt);
    this.scene.add(pivot);

    this.objects.push({data,pivot,mesh,glow,mat,glowMat,orbitMat});
  }

  /* ── Asteroid belt ─────────────────────────────────────────── */
  _buildAsteroidBelt() {
    const N=2000;
    const pos=new Float32Array(N*3);
    const col=new Float32Array(N*3);
    for(let i=0;i<N;i++){
      const a=Math.random()*Math.PI*2;
      const r=26+Math.random()*4; // between Mars(21) and Jupiter(32)
      const yOff=(Math.random()-0.5)*0.6;
      pos[i*3]=Math.cos(a)*r; pos[i*3+1]=yOff; pos[i*3+2]=Math.sin(a)*r;
      const br=0.4+Math.random()*0.25;
      col[i*3]=br; col[i*3+1]=br*0.9; col[i*3+2]=br*0.75;
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',   new THREE.BufferAttribute(col,3));
    const mat=new THREE.PointsMaterial({size:0.18,vertexColors:true,transparent:true,opacity:0.7});
    this.scene.add(new THREE.Points(geo,mat));
  }

  /* ── Label overlay ──────────────────────────────────────────── */
  _buildLabelOverlay() {
    this._labelDiv = document.createElement('div');
    Object.assign(this._labelDiv.style, {
      position:'fixed', inset:'0', zIndex:'601', pointerEvents:'none',
    });
    this.container.appendChild(this._labelDiv);

    this._labelEls = PLANET_DATA.map(data => {
      const el = document.createElement('div');
      Object.assign(el.style, {
        position:'absolute', transform:'translate(-50%,-50%)',
        color:'rgba(255,255,255,0.7)', fontFamily:'"Space Grotesk",sans-serif',
        fontSize:'11px', fontWeight:'500', letterSpacing:'0.08em',
        textShadow:'0 0 8px rgba(0,0,0,0.9)', pointerEvents:'none',
        opacity:'0', transition:'opacity 0.5s',
        display:'flex', flexDirection:'column', alignItems:'center', gap:'3px',
      });
      el.innerHTML=`<div style="width:1px;height:10px;background:rgba(255,255,255,0.2)"></div><span>${data.name}</span>`;
      this._labelDiv.appendChild(el);
      return el;
    });
  }

  /* ── HUD (orbit hint) ───────────────────────────────────────── */
  _buildHUD() {
    const hud=document.createElement('div');
    Object.assign(hud.style,{
      position:'fixed', bottom:'2.5rem', left:'50%', transform:'translateX(-50%)',
      zIndex:'701', color:'rgba(255,255,255,0.25)', fontFamily:'"JetBrains Mono",monospace',
      fontSize:'10px', letterSpacing:'0.3em', pointerEvents:'none',
      opacity:'0', transition:'opacity 1s ease',
    });
    hud.textContent='DRAG TO ORBIT  ·  SCROLL TO ZOOM  ·  SKIP →';
    this.container.appendChild(hud);
    this._hud=hud;
    setTimeout(()=>{ hud.style.opacity='1'; },2200);
    setTimeout(()=>{ hud.style.opacity='0'; },6000);
  }

  /* ── Skip button ────────────────────────────────────────────── */
  _buildSkipButton() {
    const btn=document.createElement('button');
    btn.innerHTML='SKIP &nbsp;→';
    Object.assign(btn.style,{
      position:'fixed', top:'2rem', right:'2rem', zIndex:'702',
      padding:'0.5rem 1.1rem',
      background:'rgba(3,4,12,0.82)',
      border:'1px solid rgba(255,255,255,0.12)',
      color:'rgba(255,255,255,0.5)',
      fontFamily:'"JetBrains Mono",monospace', fontSize:'10px', letterSpacing:'0.22em',
      cursor:'pointer', borderRadius:'2px', backdropFilter:'blur(24px)',
      transition:'all 0.22s', opacity:'0',
    });
    btn.onmouseenter=()=>{ btn.style.color='#fff'; btn.style.borderColor='rgba(255,255,255,0.38)'; };
    btn.onmouseleave=()=>{ btn.style.color='rgba(255,255,255,0.5)'; btn.style.borderColor='rgba(255,255,255,0.12)'; };
    btn.onclick=()=>this.skip();
    this.container.appendChild(btn);
    this._skipBtn=btn;
    setTimeout(()=>{ btn.style.opacity='1'; },1800);
  }

  /* ── Camera ─────────────────────────────────────────────────── */
  _applyCamera(instant=false) {
    let r, phi;
    if(!this._introDone){
      r   = THREE.MathUtils.lerp(this._introStartR, this._camR, this._introPhase);
      phi = THREE.MathUtils.lerp(this._introStartPhi, this._camPhi, this._introPhase);
    } else {
      r=this._camR; phi=this._camPhi;
    }
    const x=r*Math.sin(phi)*Math.sin(this._camTheta);
    const y=r*Math.cos(phi);
    const z=r*Math.sin(phi)*Math.cos(this._camTheta);
    this.camera.position.set(x,y,z);
    this.camera.lookAt(0,0,0);
  }

  /* ── Resize ─────────────────────────────────────────────────── */
  _onResize() {
    const W=window.innerWidth,H=window.innerHeight;
    this.renderer.setSize(W,H);
    this.camera.aspect=W/H; this.camera.updateProjectionMatrix();
  }

  /* ── Input ──────────────────────────────────────────────────── */
  _onMouseMove(e) {
    if(this._drag && this._introDone){
      const dx=e.clientX-this._lastMX, dy=e.clientY-this._lastMY;
      this._lastMX=e.clientX; this._lastMY=e.clientY;
      this._camTheta-=dx*0.005;
      this._camPhi=Math.max(0.1,Math.min(1.45,this._camPhi+dy*0.005));
    }
  }

  _onWheel(e) {
    if(!this._introDone) return;
    this._targetR=Math.max(25,Math.min(160,this._targetR+e.deltaY*0.06));
  }

  /* ── Comet ──────────────────────────────────────────────────── */
  _spawnComet() {
    const angle=Math.random()*Math.PI*2;
    const r=90;
    const start=new THREE.Vector3(Math.cos(angle)*r,20+(Math.random()-0.5)*30,Math.sin(angle)*r);
    const target=new THREE.Vector3(-Math.cos(angle)*r*0.6,(Math.random()-0.5)*10,-Math.sin(angle)*r*0.6);
    const dir=target.clone().sub(start).normalize();

    const pts=[start.clone()];
    for(let i=1;i<20;i++) pts.push(start.clone().addScaledVector(dir,i*4));
    const geo=new THREE.BufferGeometry().setFromPoints(pts);
    const mat=new THREE.LineBasicMaterial({color:0xaaddff,transparent:true,opacity:0.7});
    const line=new THREE.Line(geo,mat);
    this.scene.add(line);

    this.comets.push({line,mat,life:0,maxLife:180,dir,speed:0.55});
  }

  /* ── Main loop ──────────────────────────────────────────────── */
  start() {
    this.running=true;
    setTimeout(()=>{ this.renderer.domElement.style.opacity='1'; },80);

    const clock=new THREE.Clock();

    const animate=()=>{
      if(!this.running) return;
      requestAnimationFrame(animate);
      const t=clock.getElapsedTime();

      /* Intro arc camera */
      if(!this._introDone){
        this._introPhase=Math.min(1, this._introPhase+0.0045);
        if(this._introPhase>=1){
          this._introDone=true;
          /* Show labels when intro done */
          this._labelEls.forEach(el=>{ el.style.opacity='1'; });
        }
        this._applyCamera();
      } else {
        /* Smooth zoom */
        this._camR+=(this._targetR-this._camR)*0.05;
        this._applyCamera();
      }

      /* Sun animation */
      if(this.sunMesh){
        this.sunMesh.rotation.y=t*0.08;
        const pulse=1+0.025*Math.sin(t*1.4);
        this.sunMesh.scale.setScalar(pulse);
      }
      /* Corona pulse */
      this.coronaLayers?.forEach(({mesh,baseOpacity},i)=>{
        mesh.material.opacity=baseOpacity*(1+0.15*Math.sin(t*0.8+i*1.1));
      });
      /* Flare face camera */
      this.flareSpr?.position.copy(this.sunMesh.position);

      /* Planet orbit + self-rotate */
      this.objects.forEach(({data,pivot,mesh},i)=>{
        this.angles[i]+=data.speed*0.55;
        pivot.rotation.y=this.angles[i];
        mesh.rotation.y+=0.004;
      });

      /* Labels */
      this._updateLabels();

      /* Asteroid belt slow rotation — handled by static geometry, skip for perf */

      /* Comets */
      this._nextComet-=1;
      if(this._nextComet<=0){ this._spawnComet(); this._nextComet=500+Math.random()*600; }
      for(let i=this.comets.length-1;i>=0;i--){
        const c=this.comets[i];
        c.life++;
        const progress=c.life/c.maxLife;
        c.mat.opacity=progress<0.3?progress/0.3:1-(progress-0.3)/0.7;
        c.line.position.addScaledVector(c.dir,c.speed);
        if(c.life>=c.maxLife){ this.scene.remove(c.line); c.line.geometry.dispose(); this.comets.splice(i,1); }
      }

      this.renderer.render(this.scene,this.camera);
    };

    animate();
  }

  /* ── Label update ───────────────────────────────────────────── */
  _updateLabels() {
    if(!this._introDone) return;
    const W=window.innerWidth, H=window.innerHeight;
    this.objects.forEach(({mesh},i)=>{
      const wp=new THREE.Vector3();
      mesh.getWorldPosition(wp);
      const proj=wp.clone().project(this.camera);
      if(proj.z>1){ this._labelEls[i].style.opacity='0'; return; }
      const sx=(proj.x*0.5+0.5)*W;
      const sy=(-proj.y*0.5+0.5)*H;
      const dist=wp.distanceTo(this.camera.position);
      const labelAlpha=Math.min(1, (200-dist)/120);
      this._labelEls[i].style.left=sx+'px';
      this._labelEls[i].style.top=(sy+PLANET_DATA[i].radius*220/dist+14)+'px';
      this._labelEls[i].style.opacity=Math.max(0,labelAlpha);
    });
  }

  /* ── Skip ───────────────────────────────────────────────────── */
  skip() {
    const el=this.renderer.domElement;
    el.style.transition='opacity 0.65s ease';
    el.style.opacity='0';
    this._labelDiv.style.transition='opacity 0.5s'; this._labelDiv.style.opacity='0';
    this._skipBtn.style.opacity='0';
    if(this._hud) this._hud.style.opacity='0';

    setTimeout(()=>{
      this.running=false;
      el.remove(); this._labelDiv.remove();
      this._skipBtn.remove();
      try{ this.renderer.dispose(); }catch(_){}
      if(this.onSkip) this.onSkip();
    }, 700);
  }
}
