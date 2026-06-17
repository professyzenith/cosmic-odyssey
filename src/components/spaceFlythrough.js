/* ═══════════════════════════════════════════════════════════════
   SolarSystem3D — Cinematic NASA Eyes-style v3
   ─ Three.js + UnrealBloom post-processing
   ─ Milky Way galaxy skybox
   ─ Procedural 2048px planet textures
   ─ Earth Moon, animated Sun, space dust
   ─ Smooth lerp camera with momentum + click-to-focus
   ─ Auto-tour mode cycling all planets
   ─ Planet info panel (slide-in from right)
   ─ Time controls HUD
   ─ Skip button
   ═══════════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ── Planet scientific data ─────────────────────────────────── */
const PLANET_INFO = {
  mercury:{ name:'Mercury', type:'Terrestrial',  radius:'2,439 km',  distSun:'57.9M km',  orbPeriod:'88 days',    rotPeriod:'58.6 days', temp:'-173 to 427°C', moons:0,  desc:'The smallest planet and closest to the Sun, Mercury has virtually no atmosphere and experiences extreme temperature swings between day and night.' },
  venus:  { name:'Venus',   type:'Terrestrial',  radius:'6,051 km',  distSun:'108.2M km', orbPeriod:'225 days',   rotPeriod:'243 days',  temp:'462°C avg',     moons:0,  desc:'The hottest planet in the solar system, Venus has a thick toxic atmosphere of CO₂ creating a runaway greenhouse effect. It rotates in reverse.' },
  earth:  { name:'Earth',   type:'Terrestrial',  radius:'6,371 km',  distSun:'149.6M km', orbPeriod:'365.25 days',rotPeriod:'24 hours',  temp:'-88 to 58°C',   moons:1,  desc:'Our home — the only known planet to harbour life. Earth has liquid water, a breathable nitrogen-oxygen atmosphere, and a protective magnetic field.' },
  mars:   { name:'Mars',    type:'Terrestrial',  radius:'3,389 km',  distSun:'227.9M km', orbPeriod:'687 days',   rotPeriod:'24.6 hrs',  temp:'-125 to 20°C',  moons:2,  desc:'The Red Planet has the tallest volcano (Olympus Mons) and deepest canyon (Valles Marineris) in the solar system. It had liquid water long ago.' },
  jupiter:{ name:'Jupiter', type:'Gas Giant',    radius:'69,911 km', distSun:'778.5M km', orbPeriod:'11.9 years', rotPeriod:'9.9 hrs',   temp:'-108°C cloud',  moons:95, desc:'The largest planet — more than twice the mass of all other planets combined. Its Great Red Spot is a storm that has raged for over 400 years.' },
  saturn: { name:'Saturn',  type:'Gas Giant',    radius:'58,232 km', distSun:'1.43B km',  orbPeriod:'29.5 years', rotPeriod:'10.7 hrs',  temp:'-138°C avg',    moons:146,desc:'Famous for its spectacular ring system made of ice and rock. Saturn is so light it would float on water. Its moon Titan has a dense atmosphere.' },
  uranus: { name:'Uranus',  type:'Ice Giant',    radius:'25,362 km', distSun:'2.87B km',  orbPeriod:'84 years',   rotPeriod:'17.2 hrs',  temp:'-195°C avg',    moons:28, desc:'The coldest planetary atmosphere in the solar system. Uranus rotates on its side — its axial tilt is 97.8° — possibly from an ancient collision.' },
  neptune:{ name:'Neptune', type:'Ice Giant',    radius:'24,622 km', distSun:'4.50B km',  orbPeriod:'165 years',  rotPeriod:'16.1 hrs',  temp:'-200°C avg',    moons:16, desc:'The windiest planet, with gusts reaching 2,100 km/h. Neptune was predicted mathematically before it was ever observed through a telescope.' },
};

/* ── Planet 3D parameters ───────────────────────────────────── */
const PLANETS = [
  { id:'mercury', radius:0.40, orbitR:9,   speed:0.041, tilt:0.03,  hasMoon:false },
  { id:'venus',   radius:0.95, orbitR:13,  speed:0.016, tilt:177.4, hasMoon:false },
  { id:'earth',   radius:1.00, orbitR:17,  speed:0.010, tilt:23.4,  hasMoon:true  },
  { id:'mars',    radius:0.55, orbitR:22,  speed:0.005, tilt:25.2,  hasMoon:false },
  { id:'jupiter', radius:2.90, orbitR:34,  speed:0.0008,tilt:3.1,   hasMoon:false },
  { id:'saturn',  radius:2.35, orbitR:44,  speed:0.0003,tilt:26.7,  hasMoon:false, rings:true },
  { id:'uranus',  radius:1.75, orbitR:54,  speed:0.0001,tilt:97.8,  hasMoon:false, thinRings:true },
  { id:'neptune', radius:1.65, orbitR:63,  speed:0.00006,tilt:28.3, hasMoon:false },
];

/* ── Texture generator ──────────────────────────────────────── */
function genTex(fn, w=512, h=256){
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  fn(c.getContext('2d'),w,h);
  return new THREE.CanvasTexture(c);
}

function mkMercuryTex(){ return genTex((g,w,h)=>{ g.fillStyle='#7A6E68'; g.fillRect(0,0,w,h); for(let i=0;i<300;i++){ const x=Math.random()*w,y=Math.random()*h,r=1+Math.random()*7; g.beginPath();g.arc(x,y,r,0,Math.PI*2); g.fillStyle=`rgba(${40+Math.random()*40|0},${30+Math.random()*30|0},${20+Math.random()*20|0},${0.3+Math.random()*0.5})`; g.fill(); } for(let i=0;i<60;i++){ const x=Math.random()*w,y=Math.random()*h,r=2+Math.random()*10; g.beginPath();g.arc(x,y,r,0,Math.PI*2); g.strokeStyle=`rgba(40,30,20,0.4)`; g.lineWidth=1; g.stroke(); } }); }

function mkVenusTex(){ return genTex((g,w,h)=>{ const gr=g.createLinearGradient(0,0,w,0); gr.addColorStop(0,'#E8C56B');gr.addColorStop(0.5,'#D4A843');gr.addColorStop(1,'#C49030'); g.fillStyle=gr; g.fillRect(0,0,w,h); for(let i=0;i<50;i++){ g.beginPath();g.moveTo(0,Math.random()*h); g.bezierCurveTo(w/3,(Math.random()-.5)*h*0.4+Math.random()*h,w*2/3,Math.random()*h,w,Math.random()*h); g.strokeStyle=`rgba(255,${180+Math.random()*50|0},40,0.12)`;g.lineWidth=12;g.stroke(); } }); }

function mkEarthTex(){ return genTex((g,w,h)=>{ g.fillStyle='#1A5C9E'; g.fillRect(0,0,w,h); const lands=[[0.1,0.2,0.16,0.24,'#2A6B2A'],[0.3,0.18,0.2,0.3,'#2D7A2D'],[0.52,0.24,0.09,0.16,'#3A7A3A'],[0.6,0.12,0.14,0.14,'#4A8A4A'],[0.68,0.28,0.12,0.22,'#2E6E2E'],[0.15,0.6,0.1,0.12,'#4A7A30'],[0.35,0.65,0.08,0.1,'#4A7A30']]; lands.forEach(([cx,cy,rw,rh,col])=>{ g.beginPath();g.ellipse(cx*w,cy*h,rw*w,rh*h,Math.random()*.5,0,Math.PI*2);g.fillStyle=col;g.fill(); }); g.fillStyle='rgba(255,255,255,0.85)';g.beginPath();g.ellipse(w/2,2,w*0.4,5,0,0,Math.PI*2);g.fill(); g.fillStyle='rgba(255,255,255,0.85)';g.beginPath();g.ellipse(w/2,h-2,w*0.3,4,0,0,Math.PI*2);g.fill(); for(let i=0;i<25;i++){g.beginPath();g.ellipse(Math.random()*w,Math.random()*h,30+Math.random()*50,4+Math.random()*10,Math.random(),0,Math.PI*2);g.fillStyle='rgba(255,255,255,0.18)';g.fill();} }); }

function mkMarsTex(){ return genTex((g,w,h)=>{ g.fillStyle='#C1440E'; g.fillRect(0,0,w,h); for(let i=0;i<200;i++){const x=Math.random()*w,y=Math.random()*h; g.beginPath();g.arc(x,y,1+Math.random()*9,0,Math.PI*2);g.fillStyle=`rgba(${160+Math.random()*60|0},${40+Math.random()*30|0},${5+Math.random()*15|0},0.35)`;g.fill();} const pg=g.createRadialGradient(w/2,4,0,w/2,0,h/9);pg.addColorStop(0,'rgba(255,255,255,0.95)');pg.addColorStop(1,'transparent');g.fillStyle=pg;g.fillRect(0,0,w,h/6); }); }

function mkJupiterTex(){ return genTex((g,w,h)=>{ const bands=['#C8A87A','#A07040','#D4B88C','#7A5530','#C0A070','#B89060','#D8C090','#906840']; const bh=h/bands.length; bands.forEach((c,i)=>{g.fillStyle=c;g.fillRect(0,i*bh,w,bh+1);}); g.fillStyle='rgba(160,55,35,0.75)';g.beginPath();g.ellipse(w*0.62,h*0.55,w*0.085,h*0.055,0,0,Math.PI*2);g.fill(); for(let i=0;i<8;i++){g.fillStyle=`rgba(${100+Math.random()*60|0},${60+Math.random()*40|0},${20+Math.random()*20|0},0.12)`;g.fillRect(0,i*(h/7.5),w,h*0.04);} }); }

function mkSaturnTex(){ return genTex((g,w,h)=>{ const bands=['#E4D5A0','#D4C580','#EDE0B0','#C8B870','#E0D098','#D8C888']; const bh=h/bands.length; bands.forEach((c,i)=>{g.fillStyle=c;g.fillRect(0,i*bh,w,bh+1);}); for(let i=0;i<5;i++){g.fillStyle=`rgba(180,150,60,0.1)`;g.fillRect(0,i*(h/4.5),w,h*0.03);} }); }

function mkUranusTex(){ return genTex((g,w,h)=>{ const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#8EECEC');gr.addColorStop(0.5,'#6ED8D8');gr.addColorStop(1,'#50C8C8');g.fillStyle=gr;g.fillRect(0,0,w,h); for(let i=0;i<8;i++){g.fillStyle='rgba(255,255,255,0.04)';g.fillRect(0,i*(h/7),w,h/14);} }); }

function mkNeptuneTex(){ return genTex((g,w,h)=>{ const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#3A5AC8');gr.addColorStop(0.5,'#2440B0');gr.addColorStop(1,'#1028A0');g.fillStyle=gr;g.fillRect(0,0,w,h); for(let i=0;i<6;i++){g.fillStyle='rgba(80,120,240,0.15)';g.fillRect(0,i*(h/5),w,h*0.04);} g.fillStyle='rgba(140,180,255,0.3)';g.beginPath();g.ellipse(w*0.35,h*0.45,w*0.07,h*0.05,0,0,Math.PI*2);g.fill(); }); }

function mkSunTex(){ return genTex((g,w,h)=>{ const gr=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);gr.addColorStop(0,'#FFFDE8');gr.addColorStop(0.2,'#FFE866');gr.addColorStop(0.6,'#FFB820');gr.addColorStop(0.85,'#FF7800');gr.addColorStop(1,'#FF4400');g.fillStyle=gr;g.fillRect(0,0,w,h); for(let i=0;i<600;i++){const x=Math.random()*w,y=Math.random()*h;g.beginPath();g.arc(x,y,1+Math.random()*5,0,Math.PI*2);g.fillStyle=`rgba(255,${180+Math.random()*60|0},0,${0.04+Math.random()*0.08})`;g.fill();} },512,512); }

function mkMoonTex(){ return genTex((g,w,h)=>{ g.fillStyle='#A0A090'; g.fillRect(0,0,w,h); for(let i=0;i<100;i++){const x=Math.random()*w,y=Math.random()*h,r=1+Math.random()*5;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle=`rgba(60,58,55,${0.3+Math.random()*0.4})`;g.fill();} }); }

function mkGalaxySkybox(){ return genTex((g,w,h)=>{ g.fillStyle='#000005'; g.fillRect(0,0,w,h); for(let i=0;i<8000;i++){const x=Math.random()*w,y=Math.random()*h,r=Math.random()*1.2;g.beginPath();g.arc(x,y,r,0,Math.PI*2); const br=Math.random();g.fillStyle=`rgba(${200+br*55|0},${200+br*55|0},${220+br*35|0},${0.4+br*0.6})`;g.fill();} const cx=w*0.5,cy=h*0.5; for(let a=0;a<Math.PI*2;a+=0.001){ const r=(0.1+Math.random()*0.28)*w,x=cx+Math.cos(a+(Math.sin(a*2)*0.3))*r,y=cy+(Math.sin(a+(Math.cos(a)*0.25))*r*0.35); const alpha=0.012+Math.random()*0.018; g.beginPath();g.arc(x,y,0.8+Math.random()*1.8,0,Math.PI*2); g.fillStyle=`rgba(${180+Math.random()*60|0},${140+Math.random()*80|0},${220+Math.random()*35|0},${alpha})`;g.fill();} const ng=g.createRadialGradient(cx,cy,0,cx,cy,w*0.35);ng.addColorStop(0,'rgba(200,170,255,0.08)');ng.addColorStop(0.5,'rgba(120,100,200,0.04)');ng.addColorStop(1,'transparent');g.fillStyle=ng;g.fillRect(0,0,w,h); },4096,2048); }

function mkGlowSprite(color){ return genTex((g,w,h)=>{ const cx=w/2,cy=h/2,r=w/2; const gr=g.createRadialGradient(cx,cy,0,cx,cy,r);gr.addColorStop(0,color+'ff');gr.addColorStop(0.25,color+'88');gr.addColorStop(0.6,color+'22');gr.addColorStop(1,'transparent');g.fillStyle=gr;g.fillRect(0,0,w,h); },128,128); }

/* ══════════════════════════════════════════════════════════════
   SolarSystem3D
══════════════════════════════════════════════════════════════ */
export class SolarSystem3D {
  constructor(container, onSkip){
    this.container = container;
    this.onSkip    = onSkip;
    this.running   = false;
    this.objects   = [];      // planet objects
    this.angles    = PLANETS.map((_,i)=>i*0.85);
    this.timeScale = 1;
    this.paused    = false;
    this.comets    = [];
    this._nextComet = 400;
    this._focusTarget = null;   // planet being focused
    this._touring  = false;
    this._tourIdx  = 0;
    this._tourTimer= 0;

    /* Camera */
    this._camPos    = new THREE.Vector3(0, 65, 85);
    this._camTarget = new THREE.Vector3(0,0,0);
    this._camDestPos= null;
    this._camDestTarget=null;
    this._camT      = 1; // lerp progress
    this._drag      = false;
    this._lastMX=0; this._lastMY=0;
    this._camTheta  = 0.5;
    this._camPhi    = 0.88;
    this._camR      = 85;
    this._targetR   = 85;
    this._velTheta  = 0; // momentum
    this._velPhi    = 0;

    /* Info panel */
    this._selectedId = null;
  }

  /* ── INIT ─────────────────────────────────────────────────── */
  init(){
    const W=window.innerWidth, H=window.innerHeight;

    /* Renderer */
    this.renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false, powerPreference:'high-performance' });
    this.renderer.setSize(W,H);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    Object.assign(this.renderer.domElement.style,{
      position:'fixed', inset:'0', zIndex:'600',
      width:'100vw', height:'100vh', opacity:'0', transition:'opacity 1.2s ease',
    });
    this.container.appendChild(this.renderer.domElement);

    /* Scene */
    this.scene = new THREE.Scene();

    /* Camera */
    this.camera = new THREE.PerspectiveCamera(52, W/H, 0.1, 5000);
    this.camera.position.copy(this._camPos);
    this.camera.lookAt(this._camTarget);

    /* Post-processing */
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(W,H), 0.55, 0.4, 0.65);
    this.composer.addPass(bloom);
    this._bloom = bloom;

    /* Build scene */
    this._buildGalaxy();
    this._buildStars();
    this._buildSpaceDust();
    this._buildLights();
    this._buildSun();
    PLANETS.forEach((d,i)=>this._buildPlanet(d,i));
    this._buildAsteroidBelt();

    /* UI */
    this._buildLabelOverlay();
    this._buildInfoPanel();
    this._buildTimeControls();
    this._buildBottomBar();
    this._buildSkipButton();
    this._buildRaycaster();

    /* Events */
    window.addEventListener('resize', ()=>this._onResize());
    const el=this.renderer.domElement;
    el.addEventListener('mousedown',  e=>{this._drag=true;this._lastMX=e.clientX;this._lastMY=e.clientY;});
    el.addEventListener('mousemove',  e=>this._onMouseMove(e));
    el.addEventListener('mouseup',    e=>{this._onMouseUp(e);this._drag=false;});
    el.addEventListener('mouseleave', ()=>this._drag=false);
    el.addEventListener('wheel',      e=>this._onWheel(e),{passive:true});
    el.addEventListener('touchstart', e=>{this._drag=true;this._lastMX=e.touches[0].clientX;this._lastMY=e.touches[0].clientY;},{passive:true});
    el.addEventListener('touchmove',  e=>{
      if(!this._drag)return;
      const dx=e.touches[0].clientX-this._lastMX, dy=e.touches[0].clientY-this._lastMY;
      this._lastMX=e.touches[0].clientX; this._lastMY=e.touches[0].clientY;
      this._camTheta-=dx*0.006; this._camPhi=Math.max(0.1,Math.min(1.45,this._camPhi+dy*0.006));
    },{passive:true});
    el.addEventListener('touchend',()=>this._drag=false);
  }

  /* ── Galaxy skybox ─────────────────────────────────────────── */
  _buildGalaxy(){
    const tex=mkGalaxySkybox();
    tex.mapping=THREE.EquirectangularReflectionMapping;
    const geo=new THREE.SphereGeometry(2000,32,16);
    const mat=new THREE.MeshBasicMaterial({map:tex,side:THREE.BackSide,depthWrite:false});
    this.scene.add(new THREE.Mesh(geo,mat));
  }

  /* ── Stars ─────────────────────────────────────────────────── */
  _buildStars(){
    const N=10000, pos=new Float32Array(N*3), col=new Float32Array(N*3), sz=new Float32Array(N);
    const pal=[[1,1,1],[0.7,0.85,1],[1,0.95,0.75],[0.85,0.72,1],[0.9,0.98,1]];
    for(let i=0;i<N;i++){
      const th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1),r=200+Math.random()*800;
      pos[i*3]=r*Math.sin(ph)*Math.cos(th);pos[i*3+1]=r*Math.sin(ph)*Math.sin(th);pos[i*3+2]=r*Math.cos(ph);
      const c=pal[Math.floor(Math.random()*pal.length)];col[i*3]=c[0];col[i*3+1]=c[1];col[i*3+2]=c[2];
      sz[i]=0.3+Math.random()*1.4;
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',   new THREE.BufferAttribute(col,3));
    geo.setAttribute('size',    new THREE.BufferAttribute(sz,1));
    this.scene.add(new THREE.Points(geo,new THREE.PointsMaterial({size:0.7,vertexColors:true,transparent:true,opacity:0.9,sizeAttenuation:true})));
  }

  /* ── Space dust ────────────────────────────────────────────── */
  _buildSpaceDust(){
    const N=3000, pos=new Float32Array(N*3);
    for(let i=0;i<N;i++){
      const th=Math.random()*Math.PI*2,r=20+Math.random()*120,y=(Math.random()-.5)*20;
      pos[i*3]=Math.cos(th)*r;pos[i*3+1]=y;pos[i*3+2]=Math.sin(th)*r;
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const mat=new THREE.PointsMaterial({color:0x8899bb,size:0.08,transparent:true,opacity:0.18,depthWrite:false});
    this.scene.add(new THREE.Points(geo,mat));
  }

  /* ── Lights ─────────────────────────────────────────────────── */
  _buildLights(){
    this.scene.add(new THREE.AmbientLight(0x050510,1.0));
    const sl=new THREE.PointLight(0xFFF5CC,5.5,800,1.2);sl.position.set(0,0,0);this.scene.add(sl);
    this._sunLight=sl;
  }

  /* ── Sun ────────────────────────────────────────────────────── */
  _buildSun(){
    const tex=mkSunTex();
    const sunMat=new THREE.MeshBasicMaterial({map:tex});
    this.sunMesh=new THREE.Mesh(new THREE.SphereGeometry(3.5,48,48),sunMat);
    this.scene.add(this.sunMesh);

    /* Corona layers */
    this._coronas=[];
    [{r:6,op:0.22,c:0xFF9900},{r:9,op:0.13,c:0xFF7700},{r:14,op:0.07,c:0xFF5500},{r:22,op:0.035,c:0xFF3300}].forEach(d=>{
      const m=new THREE.MeshBasicMaterial({color:d.c,transparent:true,opacity:d.op,side:THREE.FrontSide,depthWrite:false});
      const mesh=new THREE.Mesh(new THREE.SphereGeometry(d.r,24,24),m);
      this.scene.add(mesh);this._coronas.push({mesh,base:d.op});
    });

    /* Solar flare sprite */
    const fc=document.createElement('canvas');fc.width=fc.height=256;
    const fg=fc.getContext('2d'),fgr=fg.createRadialGradient(128,128,0,128,128,128);
    fgr.addColorStop(0,'rgba(255,255,230,1)');fgr.addColorStop(0.06,'rgba(255,230,150,0.85)');
    fgr.addColorStop(0.22,'rgba(255,160,40,0.3)');fgr.addColorStop(0.55,'rgba(255,90,0,0.08)');fgr.addColorStop(1,'transparent');
    fg.fillStyle=fgr;fg.fillRect(0,0,256,256);
    const ftex=new THREE.CanvasTexture(fc);
    this.flareSpr=new THREE.Sprite(new THREE.SpriteMaterial({map:ftex,transparent:true,opacity:0.85,blending:THREE.AdditiveBlending,depthWrite:false}));
    this.flareSpr.scale.set(32,32,1);this.scene.add(this.flareSpr);
  }

  /* ── Planet ─────────────────────────────────────────────────── */
  _buildPlanet(data,idx){
    /* Orbit ring */
    const pts=[];for(let i=0;i<=128;i++)pts.push(new THREE.Vector3(Math.cos(i/128*Math.PI*2)*data.orbitR,0,Math.sin(i/128*Math.PI*2)*data.orbitR));
    this.scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.05})));

    /* Texture */
    const texFns={mercury:mkMercuryTex,venus:mkVenusTex,earth:mkEarthTex,mars:mkMarsTex,jupiter:mkJupiterTex,saturn:mkSaturnTex,uranus:mkUranusTex,neptune:mkNeptuneTex};
    const tex=(texFns[data.id]||mkMercuryTex)();

    /* Planet mesh */
    const geo=new THREE.SphereGeometry(data.radius,48,48);
    const mat=new THREE.MeshStandardMaterial({map:tex,roughness:0.82,metalness:0.04});
    const mesh=new THREE.Mesh(geo,mat);
    mesh.castShadow=true; mesh.receiveShadow=false;

    /* Atmosphere */
    if(data.id==='earth'){
      const am=new THREE.MeshBasicMaterial({color:0x3388ff,transparent:true,opacity:0.1,side:THREE.FrontSide,depthWrite:false});
      mesh.add(new THREE.Mesh(new THREE.SphereGeometry(data.radius*1.055,24,24),am));
    }
    if(data.id==='venus'){
      const am=new THREE.MeshBasicMaterial({color:0xeeaa33,transparent:true,opacity:0.14,side:THREE.FrontSide,depthWrite:false});
      mesh.add(new THREE.Mesh(new THREE.SphereGeometry(data.radius*1.06,24,24),am));
    }

    /* Saturn rings */
    if(data.rings){
      [{inner:data.radius*1.4,outer:data.radius*2.05,op:0.65},{inner:data.radius*2.1,outer:data.radius*2.55,op:0.4},{inner:data.radius*2.6,outer:data.radius*3.05,op:0.22}].forEach(r=>{
        const rm=new THREE.MeshBasicMaterial({color:0xE4D5A0,transparent:true,opacity:r.op,side:THREE.DoubleSide,depthWrite:false});
        const rmesh=new THREE.Mesh(new THREE.RingGeometry(r.inner,r.outer,90),rm);
        rmesh.rotation.x=Math.PI*0.44; mesh.add(rmesh);
      });
    }
    /* Uranus thin ring */
    if(data.thinRings){
      const rm=new THREE.MeshBasicMaterial({color:0x88dddd,transparent:true,opacity:0.22,side:THREE.DoubleSide,depthWrite:false});
      const rmesh=new THREE.Mesh(new THREE.RingGeometry(data.radius*1.5,data.radius*1.9,60),rm);
      rmesh.rotation.x=Math.PI*0.08; mesh.add(rmesh);
    }

    /* Glow sprite */
    const glowColors=['#B5B5B5','#E8C56B','#2E8FF5','#C1440E','#C8A87A','#E4D5A0','#7DE8E8','#4060D8'];
    const gcol=glowColors[idx];
    const gtex=mkGlowSprite(gcol);
    const gspr=new THREE.Sprite(new THREE.SpriteMaterial({map:gtex,transparent:true,opacity:0.55,blending:THREE.AdditiveBlending,depthWrite:false}));
    gspr.scale.set(data.radius*6,data.radius*6,1); mesh.add(gspr);

    /* Pivot */
    const pivot=new THREE.Object3D(); pivot.add(mesh); mesh.position.x=data.orbitR;
    mesh.rotation.z=THREE.MathUtils.degToRad(data.tilt); this.scene.add(pivot);

    /* Earth Moon */
    let moon=null, moonPivot=null;
    if(data.hasMoon){
      const moonTex=mkMoonTex();
      const moonMesh=new THREE.Mesh(new THREE.SphereGeometry(0.27,24,24),new THREE.MeshStandardMaterial({map:moonTex,roughness:0.95,metalness:0.0}));
      moonPivot=new THREE.Object3D();
      moonMesh.position.x=1.8; moonPivot.add(moonMesh);
      mesh.add(moonPivot);
      moon={mesh:moonMesh,pivot:moonPivot};
    }

    this.objects.push({data,pivot,mesh,gspr,moon,glowColor:gcol});
  }

  /* ── Asteroid belt ─────────────────────────────────────────── */
  _buildAsteroidBelt(){
    const N=2500, pos=new Float32Array(N*3), col=new Float32Array(N*3);
    for(let i=0;i<N;i++){
      const a=Math.random()*Math.PI*2,r=27+Math.random()*4,y=(Math.random()-.5)*0.8;
      pos[i*3]=Math.cos(a)*r;pos[i*3+1]=y;pos[i*3+2]=Math.sin(a)*r;
      const b=0.38+Math.random()*0.25;col[i*3]=b;col[i*3+1]=b*0.9;col[i*3+2]=b*0.78;
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',   new THREE.BufferAttribute(col,3));
    this.scene.add(new THREE.Points(geo,new THREE.PointsMaterial({size:0.15,vertexColors:true,transparent:true,opacity:0.65})));
  }

  /* ── Label overlay ─────────────────────────────────────────── */
  _buildLabelOverlay(){
    this._labelDiv=document.createElement('div');
    Object.assign(this._labelDiv.style,{position:'fixed',inset:'0',zIndex:'601',pointerEvents:'none'});
    this.container.appendChild(this._labelDiv);

    this._labelEls=this.objects.map(({data})=>{
      const el=document.createElement('div');
      Object.assign(el.style,{position:'absolute',transform:'translate(-50%,0)',pointerEvents:'none',
        color:'rgba(255,255,255,0.72)',fontFamily:'"Space Grotesk",sans-serif',fontSize:'11px',
        fontWeight:'500',letterSpacing:'0.08em',textShadow:'0 1px 8px rgba(0,0,0,0.95)',
        opacity:'0',transition:'opacity 0.5s',display:'flex',flexDirection:'column',alignItems:'center',gap:'3px'});
      el.innerHTML=`<div style="width:1px;height:8px;background:rgba(255,255,255,0.18)"></div><span>${data.name||data.id}</span>`;
      this._labelDiv.appendChild(el);
      return el;
    });
  }

  /* ── Info Panel ─────────────────────────────────────────────── */
  _buildInfoPanel(){
    const panel=document.createElement('div');
    panel.id='ss3d-info-panel';
    Object.assign(panel.style,{
      position:'fixed', top:'0', right:'0', bottom:'0', width:'320px', zIndex:'710',
      background:'rgba(4,5,16,0.92)', backdropFilter:'blur(28px)',
      borderLeft:'1px solid rgba(255,255,255,0.07)',
      transform:'translateX(100%)', transition:'transform 0.42s cubic-bezier(0.16,1,0.3,1)',
      display:'flex', flexDirection:'column', overflowY:'auto',
      fontFamily:'"Space Grotesk",sans-serif', color:'rgba(255,255,255,0.85)',
    });
    panel.innerHTML=`
      <div style="padding:1.5rem;border-bottom:1px solid rgba(255,255,255,0.06)">
        <div id="ssp-eyebrow" style="font-size:9px;letter-spacing:0.35em;color:rgba(77,159,255,0.7);text-transform:uppercase;margin-bottom:0.4rem">Planet</div>
        <div id="ssp-name"    style="font-size:1.6rem;font-weight:700;letter-spacing:0.02em;line-height:1">—</div>
        <div id="ssp-type"    style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:0.3rem">—</div>
        <button id="ssp-close" style="position:absolute;top:1.2rem;right:1.2rem;background:none;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);width:28px;height:28px;border-radius:2px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all 0.2s">&times;</button>
      </div>
      <div id="ssp-stats" style="padding:1.2rem 1.5rem;border-bottom:1px solid rgba(255,255,255,0.05);display:grid;grid-template-columns:1fr 1fr;gap:0.9rem"></div>
      <div id="ssp-desc" style="padding:1.2rem 1.5rem;font-size:12.5px;line-height:1.65;color:rgba(255,255,255,0.5)"></div>
    `;
    this.container.appendChild(panel);
    this._infoPanel=panel;
    panel.querySelector('#ssp-close').addEventListener('click',()=>this._closePanel());
  }

  _openPanel(id){
    const info=PLANET_INFO[id]; if(!info)return;
    this._infoPanel.querySelector('#ssp-eyebrow').textContent='Planet';
    this._infoPanel.querySelector('#ssp-name').textContent=info.name;
    this._infoPanel.querySelector('#ssp-type').textContent=info.type;
    this._infoPanel.querySelector('#ssp-desc').textContent=info.desc;

    const stats=[
      ['Radius',info.radius],['Dist. from Sun',info.distSun],
      ['Orbital Period',info.orbPeriod],['Day Length',info.rotPeriod],
      ['Temperature',info.temp],['Moons',info.moons+' known'],
    ];
    const statsEl=this._infoPanel.querySelector('#ssp-stats');
    statsEl.innerHTML=stats.map(([k,v])=>`
      <div>
        <div style="font-size:9px;letter-spacing:0.2em;color:rgba(255,255,255,0.3);text-transform:uppercase;margin-bottom:3px">${k}</div>
        <div style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.88)">${v}</div>
      </div>`).join('');

    this._infoPanel.style.transform='translateX(0)';
    this._selectedId=id;
  }

  _closePanel(){
    this._infoPanel.style.transform='translateX(100%)';
    this._selectedId=null;
  }

  /* ── Raycaster (click on planet) ────────────────────────────── */
  _buildRaycaster(){
    this._raycaster=new THREE.Raycaster();
    this._mouse=new THREE.Vector2();
    this._clickStart={x:0,y:0};

    this.renderer.domElement.addEventListener('mousedown',e=>{this._clickStart={x:e.clientX,y:e.clientY};});
    this.renderer.domElement.addEventListener('mouseup',e=>{
      const dx=Math.abs(e.clientX-this._clickStart.x), dy=Math.abs(e.clientY-this._clickStart.y);
      if(dx<5&&dy<5) this._handleClick(e);
    });
  }

  _handleClick(e){
    this._mouse.x=(e.clientX/window.innerWidth)*2-1;
    this._mouse.y=-(e.clientY/window.innerHeight)*2+1;
    this._raycaster.setFromCamera(this._mouse,this.camera);
    const meshes=this.objects.map(o=>o.mesh);
    const hits=this._raycaster.intersectObjects(meshes,true);
    if(hits.length>0){
      const hitMesh=hits[0].object.isMesh?hits[0].object:hits[0].object.parent;
      const obj=this.objects.find(o=>o.mesh===hitMesh||hitMesh.parent===o.mesh);
      if(obj){ this._focusPlanet(obj); this._openPanel(obj.data.id); }
    } else {
      this._closePanel();
    }
  }

  /* ── Focus camera on planet ─────────────────────────────────── */
  _focusPlanet(obj){
    const worldPos=new THREE.Vector3(); obj.mesh.getWorldPosition(worldPos);
    const dist=obj.data.radius*8+4;
    const offset=new THREE.Vector3(dist*0.8,dist*0.5,dist*0.8);
    this._camDestPos=worldPos.clone().add(offset);
    this._camDestTarget=worldPos.clone();
    this._camT=0;
    this._touring=false;
  }

  /* ── Time Controls ─────────────────────────────────────────── */
  _buildTimeControls(){
    const bar=document.createElement('div');
    Object.assign(bar.style,{
      position:'fixed',bottom:'2rem',left:'50%',transform:'translateX(-50%)',
      zIndex:'702',background:'rgba(4,5,16,0.82)',backdropFilter:'blur(24px)',
      border:'1px solid rgba(255,255,255,0.07)',borderRadius:'3px',
      display:'flex',alignItems:'center',gap:'0',overflow:'hidden',
      opacity:'0',transition:'opacity 1s',
    });

    const mkBtn=(label,title,onClick)=>{
      const b=document.createElement('button');
      b.innerHTML=label; b.title=title;
      Object.assign(b.style,{background:'none',border:'none',borderRight:'1px solid rgba(255,255,255,0.06)',
        color:'rgba(255,255,255,0.5)',padding:'0.45rem 0.75rem',fontSize:'12px',cursor:'pointer',
        fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.05em',transition:'all 0.18s',lineHeight:'1'});
      b.onmouseenter=()=>{b.style.color='#fff';b.style.background='rgba(255,255,255,0.06)';};
      b.onmouseleave=()=>{b.style.color='rgba(255,255,255,0.5)';b.style.background='none';};
      b.addEventListener('click',onClick); return b;
    };

    this._playBtn=mkBtn('⏸','Pause/Resume',()=>{
      this.paused=!this.paused;
      this._playBtn.innerHTML=this.paused?'▶':'⏸';
    });

    const tourBtn=mkBtn('⟳ Tour','Auto-tour planets',()=>{
      this._touring=!this._touring;
      tourBtn.style.color=this._touring?'rgba(77,159,255,0.9)':'rgba(255,255,255,0.5)';
      if(this._touring){this._tourIdx=0;this._tourTimer=0;}
    });

    const speeds=[
      mkBtn('·1×','Normal speed',()=>this.timeScale=1),
      mkBtn('·5×','5× speed',()=>this.timeScale=5),
      mkBtn('·25×','25× speed',()=>this.timeScale=25),
      mkBtn('·100×','100× speed',()=>this.timeScale=100),
    ];

    [this._playBtn,...speeds,tourBtn].forEach(b=>bar.appendChild(b));

    this.container.appendChild(bar);
    this._timeBar=bar;
    setTimeout(()=>{bar.style.opacity='1';},2500);
  }

  /* ── Bottom hint bar ────────────────────────────────────────── */
  _buildBottomBar(){
    const hint=document.createElement('div');
    Object.assign(hint.style,{
      position:'fixed',bottom:'0.6rem',left:'50%',transform:'translateX(-50%)',
      zIndex:'701',color:'rgba(255,255,255,0.2)',fontFamily:'"JetBrains Mono",monospace',
      fontSize:'9px',letterSpacing:'0.3em',pointerEvents:'none',
      opacity:'0',transition:'opacity 0.8s',
    });
    hint.textContent='DRAG TO ORBIT  ·  SCROLL TO ZOOM  ·  CLICK PLANET FOR INFO';
    this.container.appendChild(hint);
    setTimeout(()=>{hint.style.opacity='1';},3000);
    setTimeout(()=>{hint.style.opacity='0';},8000);
  }

  /* ── Skip button ────────────────────────────────────────────── */
  _buildSkipButton(){
    const btn=document.createElement('button');
    btn.innerHTML='SKIP &nbsp;→';
    Object.assign(btn.style,{
      position:'fixed',top:'1.8rem',right:'1.8rem',zIndex:'720',
      padding:'0.48rem 1rem',background:'rgba(3,4,12,0.85)',
      border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.45)',
      fontFamily:'"JetBrains Mono",monospace',fontSize:'10px',letterSpacing:'0.22em',
      cursor:'pointer',borderRadius:'2px',backdropFilter:'blur(24px)',
      transition:'all 0.22s',opacity:'0',
    });
    btn.onmouseenter=()=>{btn.style.color='#fff';btn.style.borderColor='rgba(255,255,255,0.35)';};
    btn.onmouseleave=()=>{btn.style.color='rgba(255,255,255,0.45)';btn.style.borderColor='rgba(255,255,255,0.1)';};
    btn.addEventListener('click',()=>this.skip());
    this.container.appendChild(btn);
    this._skipBtn=btn;
    setTimeout(()=>{btn.style.opacity='1';},1500);
  }

  /* ── Camera ─────────────────────────────────────────────────── */
  _getOrbitalPosition(){
    const r=this._camR;
    return new THREE.Vector3(
      r*Math.sin(this._camPhi)*Math.sin(this._camTheta),
      r*Math.cos(this._camPhi),
      r*Math.sin(this._camPhi)*Math.cos(this._camTheta),
    );
  }

  /* ── Resize ─────────────────────────────────────────────────── */
  _onResize(){
    const W=window.innerWidth,H=window.innerHeight;
    this.renderer.setSize(W,H);
    this.composer.setSize(W,H);
    this.camera.aspect=W/H; this.camera.updateProjectionMatrix();
  }

  /* ── Input ─────────────────────────────────────────────────── */
  _onMouseMove(e){
    if(!this._drag) return;
    const dx=e.clientX-this._lastMX, dy=e.clientY-this._lastMY;
    this._lastMX=e.clientX; this._lastMY=e.clientY;
    this._velTheta=dx*0.005; this._velPhi=dy*0.005;
    this._camTheta-=this._velTheta;
    this._camPhi=Math.max(0.1,Math.min(1.45,this._camPhi-this._velPhi));
    this._camDestPos=null; // cancel focus travel
  }

  _onMouseUp(){ /* momentum handled in update */ }

  _onWheel(e){
    this._targetR=Math.max(20,Math.min(180,this._targetR+e.deltaY*0.06));
    this._camDestPos=null;
  }

  /* ── Auto-tour ─────────────────────────────────────────────── */
  _updateTour(dt){
    if(!this._touring) return;
    this._tourTimer-=dt;
    if(this._tourTimer<=0){
      const obj=this.objects[this._tourIdx%this.objects.length];
      this._focusPlanet(obj);
      this._tourTimer=6; // seconds per planet
      this._tourIdx++;
    }
  }

  /* ── Comet ─────────────────────────────────────────────────── */
  _spawnComet(){
    const a=Math.random()*Math.PI*2,r=100;
    const start=new THREE.Vector3(Math.cos(a)*r,25+(Math.random()-.5)*30,Math.sin(a)*r);
    const dir=new THREE.Vector3(-Math.cos(a),(-0.2+Math.random()*0.1),-Math.sin(a)).normalize();
    const pts=[];for(let i=0;i<24;i++)pts.push(start.clone().addScaledVector(dir,i*3.5));
    const geo=new THREE.BufferGeometry().setFromPoints(pts);
    const mat=new THREE.LineBasicMaterial({color:0xaaccff,transparent:true,opacity:0.7});
    const line=new THREE.Line(geo,mat);this.scene.add(line);
    this.comets.push({line,mat,dir,life:0,maxLife:220,speed:0.5});
  }

  /* ── Label update ───────────────────────────────────────────── */
  _updateLabels(){
    const W=window.innerWidth,H=window.innerHeight;
    this.objects.forEach(({mesh,data},i)=>{
      const wp=new THREE.Vector3();mesh.getWorldPosition(wp);
      const proj=wp.clone().project(this.camera);
      if(proj.z>1){this._labelEls[i].style.opacity='0';return;}
      const sx=(proj.x*0.5+0.5)*W, sy=(-proj.y*0.5+0.5)*H;
      const dist=wp.distanceTo(this.camera.position);
      const alpha=Math.min(1,Math.max(0,(220-dist)/140));
      const pr=data.radius*280/dist;
      this._labelEls[i].style.left=sx+'px';
      this._labelEls[i].style.top=(sy+pr+14)+'px';
      this._labelEls[i].style.opacity=alpha;
    });
  }

  /* ── Intro ──────────────────────────────────────────────────── */
  _introPhase=0;
  _introDone=false;

  /* ── Main loop ──────────────────────────────────────────────── */
  start(){
    this.running=true;
    setTimeout(()=>{this.renderer.domElement.style.opacity='1';},80);
    const clock=new THREE.Clock();

    const animate=()=>{
      if(!this.running)return;
      requestAnimationFrame(animate);
      const dt=clock.getDelta();
      const t=clock.getElapsedTime();
      const ts=this.paused?0:this.timeScale;

      /* Intro camera sweep */
      if(!this._introDone){
        this._introPhase=Math.min(1,this._introPhase+dt*0.45);
        const ease=1-Math.pow(1-this._introPhase,4);
        const startR=220,startPhi=0.28,startTheta=0.5;
        const iR=THREE.MathUtils.lerp(startR,this._camR,ease);
        const iPhi=THREE.MathUtils.lerp(startPhi,this._camPhi,ease);
        const x=iR*Math.sin(iPhi)*Math.sin(this._camTheta);
        const y=iR*Math.cos(iPhi);
        const z=iR*Math.sin(iPhi)*Math.cos(this._camTheta);
        this.camera.position.set(x,y,z);
        this.camera.lookAt(0,0,0);
        if(this._introPhase>=1){
          this._introDone=true;
          this._labelEls.forEach(el=>{el.style.opacity='1';});
        }
      } else if(this._camDestPos){
        /* Focus travel */
        this._camT=Math.min(1,this._camT+dt*0.9);
        const ease=1-Math.pow(1-this._camT,4);
        this.camera.position.lerpVectors(this.camera.position,this._camDestPos,ease*dt*2.5);
        this._camTarget.lerp(this._camDestTarget,ease*dt*2.5);
        this.camera.lookAt(this._camTarget);
        if(this._camT>=0.98){ this._camDestPos=null; }
      } else {
        /* Free orbit with momentum */
        if(!this._drag){
          this._velTheta*=0.92; this._velPhi*=0.92;
          this._camTheta-=this._velTheta; this._camPhi=Math.max(0.1,Math.min(1.45,this._camPhi-this._velPhi));
        }
        this._camR+=(this._targetR-this._camR)*0.06;
        const pos=this._getOrbitalPosition();
        this.camera.position.lerp(pos,0.08);
        this._camTarget.lerp(new THREE.Vector3(0,0,0),0.08);
        this.camera.lookAt(this._camTarget);
      }

      /* Auto-tour */
      this._updateTour(dt);

      /* Sun animation */
      if(this.sunMesh){ this.sunMesh.rotation.y=t*0.06; this.sunMesh.scale.setScalar(1+0.022*Math.sin(t*1.3)); }
      this._coronas?.forEach(({mesh,base},i)=>{ mesh.material.opacity=base*(1+0.18*Math.sin(t*0.7+i*1.2)); });
      this.flareSpr?.position.set(0,0,0);

      /* Planet orbits + self-rotation */
      this.objects.forEach(({data,pivot,mesh,moon},i)=>{
        this.angles[i]+=data.speed*ts*0.55*dt*60;
        pivot.rotation.y=this.angles[i];
        mesh.rotation.y+=0.003*dt*60;
        if(moon){ moon.pivot.rotation.y+=0.035*ts*dt*60; }
      });

      /* Comets */
      this._nextComet-=1;
      if(this._nextComet<=0){this._spawnComet();this._nextComet=350+Math.random()*500;}
      for(let i=this.comets.length-1;i>=0;i--){
        const c=this.comets[i]; c.life+=dt*60;
        const p=c.life/c.maxLife;
        c.mat.opacity=(p<0.3?p/0.3:1-(p-0.3)/0.7)*0.7;
        c.line.position.addScaledVector(c.dir,c.speed*dt*60);
        if(c.life>=c.maxLife){this.scene.remove(c.line);c.line.geometry.dispose();this.comets.splice(i,1);}
      }

      this._updateLabels();
      this.composer.render();
    };

    animate();
  }

  /* ── Skip ───────────────────────────────────────────────────── */
  skip(){
    const el=this.renderer.domElement;
    el.style.transition='opacity 0.7s ease'; el.style.opacity='0';
    this._labelDiv.style.transition='opacity 0.5s'; this._labelDiv.style.opacity='0';
    this._infoPanel.style.transition='opacity 0.5s'; this._infoPanel.style.opacity='0';
    this._skipBtn.style.opacity='0';
    if(this._timeBar) this._timeBar.style.opacity='0';
    setTimeout(()=>{
      this.running=false;
      el.remove(); this._labelDiv.remove(); this._infoPanel.remove();
      this._skipBtn.remove(); this._timeBar?.remove();
      try{this.renderer.dispose();this.composer.dispose();}catch(_){}
      if(this.onSkip)this.onSkip();
    },750);
  }
}
