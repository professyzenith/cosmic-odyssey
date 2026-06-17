/* ═══════════════════════════════════════════════════════════════
   SolarSystem3D v5 — Maximum achievable in a browser
   ─ GLSL atmosphere Fresnel/rim shaders on every planet
   ─ Earth day+night texture blend (city lights on dark side)
   ─ Animated solar wind particle system
   ─ Deep-space nebula sprites in background
   ─ Improved spectral star field
   ─ Search bar with instant cinematic travel
   ─ Voice navigation (Web Speech API)
   ─ Screenshot / download mode
   ─ Surface approach mode (zoom in on planets)
   ─ Real planet textures (NASA/threex.planets)
   ─ Three.js bloom post-processing
   ═══════════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ── GLSL — Atmosphere rim/Fresnel shader ──────────────────── */
const ATMO_VERT = `
  varying vec3 vNormal;
  varying vec3 vViewPos;
  void main(){
    vNormal   = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position,1.0);
    vViewPos  = -mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
  }
`;
const ATMO_FRAG = `
  uniform vec3  glowColor;
  uniform float coefficient;
  uniform float power;
  varying vec3  vNormal;
  varying vec3  vViewPos;
  void main(){
    float rim = 1.0 - abs(dot(normalize(vViewPos), vNormal));
    float intensity = coefficient * pow(clamp(rim,0.0,1.0), power);
    gl_FragColor = vec4(glowColor, clamp(intensity,0.0,1.0));
  }
`;

function makeAtmoMat(color, coeff=0.55, power=4.0){
  return new THREE.ShaderMaterial({
    uniforms:{ glowColor:{value:new THREE.Color(color)}, coefficient:{value:coeff}, power:{value:power} },
    vertexShader: ATMO_VERT,
    fragmentShader: ATMO_FRAG,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
}

/* ── Planet scientific data ─────────────────────────────────── */
const PLANET_INFO = {
  mercury:{ name:'Mercury', type:'Terrestrial',  radius:'2,439 km',  distSun:'57.9M km',  orbPeriod:'88 Earth days',   rotPeriod:'58.6 days',  temp:'-173 to 427°C', moons:0,  desc:'The smallest planet and closest to the Sun. Mercury has virtually no atmosphere and experiences extreme temperature swings — scorching days and freezing nights.' },
  venus:  { name:'Venus',   type:'Terrestrial',  radius:'6,051 km',  distSun:'108.2M km', orbPeriod:'225 Earth days',  rotPeriod:'243 days',   temp:'462°C average',  moons:0,  desc:'The hottest planet with a thick toxic CO₂ atmosphere. Venus rotates in reverse and spins so slowly that its day is longer than its year.' },
  earth:  { name:'Earth',   type:'Terrestrial',  radius:'6,371 km',  distSun:'149.6M km', orbPeriod:'365.25 days',     rotPeriod:'24 hours',   temp:'-88 to 58°C',   moons:1,  desc:'Our home — the only known planet harbouring life. Earth has liquid water, a protective magnetic field, and a breathable nitrogen-oxygen atmosphere.' },
  mars:   { name:'Mars',    type:'Terrestrial',  radius:'3,389 km',  distSun:'227.9M km', orbPeriod:'687 Earth days',  rotPeriod:'24.6 hours', temp:'-125 to 20°C',  moons:2,  desc:'The Red Planet hosts the tallest volcano (Olympus Mons, 21 km) and deepest canyon (Valles Marineris) in the solar system.' },
  jupiter:{ name:'Jupiter', type:'Gas Giant',    radius:'69,911 km', distSun:'778.5M km', orbPeriod:'11.9 Earth years',rotPeriod:'9.9 hours',  temp:'-108°C clouds',  moons:95, desc:'The largest planet — more massive than all others combined. Its Great Red Spot is a storm that has raged for over 400 years.' },
  saturn: { name:'Saturn',  type:'Gas Giant',    radius:'58,232 km', distSun:'1.43B km',  orbPeriod:'29.5 Earth years',rotPeriod:'10.7 hours', temp:'-138°C average', moons:146,desc:'Famous for its spectacular ring system spanning 282,000 km. Saturn is so light it would float on water.' },
  uranus: { name:'Uranus',  type:'Ice Giant',    radius:'25,362 km', distSun:'2.87B km',  orbPeriod:'84 Earth years',  rotPeriod:'17.2 hours', temp:'-195°C average', moons:28, desc:'The coldest planetary atmosphere in the solar system. Uranus rotates on its side with a 97.8° axial tilt.' },
  neptune:{ name:'Neptune', type:'Ice Giant',    radius:'24,622 km', distSun:'4.50B km',  orbPeriod:'165 Earth years', rotPeriod:'16.1 hours', temp:'-200°C average', moons:16, desc:'The windiest planet, with gusts reaching 2,100 km/h. Neptune was predicted mathematically before ever being observed.' },
};

const PLANETS = [
  { id:'mercury', radius:0.40, orbitR:9,  speed:0.041,  tilt:0.03,  atmoColor:null },
  { id:'venus',   radius:0.95, orbitR:13, speed:0.016,  tilt:177.4, atmoColor:'#FFD080', atmoCoeff:0.7, atmoPow:3.5 },
  { id:'earth',   radius:1.00, orbitR:17, speed:0.010,  tilt:23.4,  atmoColor:'#4499FF', atmoCoeff:0.6, atmoPow:4.5, hasMoon:true },
  { id:'mars',    radius:0.55, orbitR:22, speed:0.005,  tilt:25.2,  atmoColor:'#FF8844', atmoCoeff:0.35,atmoPow:5.0 },
  { id:'jupiter', radius:2.90, orbitR:34, speed:0.0008, tilt:3.1,   atmoColor:'#C8A870', atmoCoeff:0.5, atmoPow:3.5 },
  { id:'saturn',  radius:2.35, orbitR:44, speed:0.0003, tilt:26.7,  atmoColor:'#E4D5A0', atmoCoeff:0.5, atmoPow:3.5, rings:true   },
  { id:'uranus',  radius:1.75, orbitR:54, speed:0.0001, tilt:97.8,  atmoColor:'#88EEEE', atmoCoeff:0.55,atmoPow:4.0, thinRings:true },
  { id:'neptune', radius:1.65, orbitR:63, speed:0.00006,tilt:28.3,  atmoColor:'#4466DD', atmoCoeff:0.55,atmoPow:4.0 },
];

const GLOW_COLORS = ['#B0B0A8','#E8C56B','#2E8FF5','#C1440E','#C8A87A','#E4D5A0','#7DE8E8','#4060D8'];
const easeOutQuart = t => 1 - Math.pow(1-t, 4);

function makeGlowTex(color){
  const c=document.createElement('canvas'); c.width=c.height=128;
  const g=c.getContext('2d'), gr=g.createRadialGradient(64,64,0,64,64,64);
  gr.addColorStop(0,color+'ff'); gr.addColorStop(0.3,color+'55');
  gr.addColorStop(0.7,color+'11'); gr.addColorStop(1,'transparent');
  g.fillStyle=gr; g.fillRect(0,0,128,128);
  return new THREE.CanvasTexture(c);
}

/* ══════════════════════════════════════════════════════════════
   SolarSystem3D v5
══════════════════════════════════════════════════════════════ */
export class SolarSystem3D {
  constructor(container, onSkip){
    this.container = container;
    this.onSkip    = onSkip;
    this.running   = false;
    this.objects   = [];
    this.angles    = PLANETS.map((_,i)=>i*0.9);
    this.comets    = [];
    this._nextComet = 300;
    this.timeScale = 1;
    this.paused    = false;
    this._touring  = false;
    this._tourIdx  = 0;
    this._tourTimer= 0;
    this._selectedId = null;
    this._introPhase = 0;
    this._introDone  = false;

    /* Camera */
    this._camTheta = 0.5; this._camPhi = 0.88; this._camR = 85; this._targetR = 85;
    this._velTheta = 0;   this._velPhi = 0;
    this._drag = false;   this._lastMX=0; this._lastMY=0;
    this._clickStart={x:0,y:0};
    this._travelPos=null; this._travelTarget=null; this._travelT=1;
    this._focusedObj=null;

    /* Solar particles */
    this._solarPos=null; this._solarVel=null; this._solarGeo=null;
  }

  /* ── INIT ─────────────────────────────────────────────────── */
  init(){
    const W=window.innerWidth, H=window.innerHeight;
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
    this.renderer.setSize(W,H);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.1;
    Object.assign(this.renderer.domElement.style,{position:'fixed',inset:'0',zIndex:'600',width:'100vw',height:'100vh',opacity:'0',transition:'opacity 1.2s ease'});
    this.container.appendChild(this.renderer.domElement);

    this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(52,W/H,0.1,5000);
    this._updateCameraImmediate();

    this.composer=new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene,this.camera));
    this._bloom=new UnrealBloomPass(new THREE.Vector2(W,H),0.65,0.4,0.6);
    this.composer.addPass(this._bloom);

    this._buildLoadScreen();
    this._loadTextures().then(tex=>{
      this._fadeLoadScreen();
      this._buildScene(tex);
      this._buildUI();
      this._attachEvents();
      setTimeout(()=>{this.renderer.domElement.style.opacity='1';},200);
    });
  }

  /* ── Load screen ─────────────────────────────────────────── */
  _buildLoadScreen(){
    const el=document.createElement('div');
    Object.assign(el.style,{position:'fixed',inset:'0',zIndex:'650',background:'#000008',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'1.5rem',fontFamily:'"JetBrains Mono",monospace',color:'rgba(255,255,255,0.5)',transition:'opacity 0.8s ease'});
    el.innerHTML=`<div style="font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:rgba(77,159,255,0.6)">LOADING SOLAR SYSTEM</div><div style="width:220px;height:1px;background:rgba(255,255,255,0.08);overflow:hidden"><div id="ss-lb" style="height:100%;width:0%;background:rgba(77,159,255,0.7);transition:width 0.3s ease"></div></div><div id="ss-ll" style="font-size:9px;letter-spacing:0.22em">Downloading textures...</div>`;
    this.container.appendChild(el);
    this._loadScreen=el;
    this._loadBar=el.querySelector('#ss-lb');
    this._loadLabel=el.querySelector('#ss-ll');
  }
  _fadeLoadScreen(){ if(!this._loadScreen)return; this._loadScreen.style.opacity='0'; setTimeout(()=>this._loadScreen?.remove(),900); }

  /* ── Texture loading ────────────────────────────────────── */
  _loadTextures(){
    return new Promise(resolve=>{
      const loader=new THREE.TextureLoader();
      const files={sun:'/textures/sun.jpg',mercury:'/textures/mercury.jpg',venus:'/textures/venus.jpg',earth:'/textures/earth.jpg',mars:'/textures/mars.jpg',jupiter:'/textures/jupiter.jpg',saturn:'/textures/saturn.jpg',uranus:'/textures/uranus.jpg',neptune:'/textures/neptune.jpg',moon:'/textures/moon.jpg',stars:'/textures/stars.jpg',saturn_ring:'/textures/saturn_ring.png',earth_lights:'/textures/earth_lights.jpg'};
      const keys=Object.keys(files); const textures={}; let loaded=0; const total=keys.length;
      keys.forEach(k=>{
        loader.load(files[k],
          tex=>{ textures[k]=tex; loaded++; this._loadBar.style.width=(loaded/total*100)+'%'; this._loadLabel.textContent='Loaded '+k; if(loaded>=total)resolve(textures); },
          undefined,
          ()=>{ loaded++; this._loadBar.style.width=(loaded/total*100)+'%'; if(loaded>=total)resolve(textures); });
      });
    });
  }

  /* ── Scene ────────────────────────────────────────────────── */
  _buildScene(tex){
    this._buildSkybox(tex);
    this._buildStars();
    this._buildNebulaeSprites();
    this._buildSpaceDust();
    this._buildLights();
    this._buildSun(tex);
    this._buildSolarParticles();
    PLANETS.forEach((d,i)=>this._buildPlanet(d,i,tex));
    this._buildAsteroidBelt();
  }

  /* ── Skybox ─────────────────────────────────────────────── */
  _buildSkybox(tex){
    const geo=new THREE.SphereGeometry(2000,64,32);
    const mat=new THREE.MeshBasicMaterial({side:THREE.BackSide,depthWrite:false});
    if(tex.stars){ tex.stars.mapping=THREE.EquirectangularReflectionMapping; tex.stars.colorSpace=THREE.SRGBColorSpace; mat.map=tex.stars; }
    else mat.color=new THREE.Color(0x000010);
    this.scene.add(new THREE.Mesh(geo,mat));
  }

  /* ── Stars ───────────────────────────────────────────────── */
  _buildStars(){
    const N=12000,pos=new Float32Array(N*3),col=new Float32Array(N*3),sz=new Float32Array(N);
    /* Spectral classes: O/B=blue-white, A=white, F=yellow-white, G=yellow, K=orange, M=red */
    const spectral=[[0.6,0.7,1],[0.85,0.9,1],[1,1,1],[1,0.98,0.9],[1,0.92,0.7],[1,0.78,0.5],[1,0.6,0.4]];
    for(let i=0;i<N;i++){
      const th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1),r=190+Math.random()*750;
      pos[i*3]=r*Math.sin(ph)*Math.cos(th); pos[i*3+1]=r*Math.sin(ph)*Math.sin(th); pos[i*3+2]=r*Math.cos(ph);
      const spec=spectral[Math.floor(Math.pow(Math.random(),2.5)*spectral.length)];
      col[i*3]=spec[0]; col[i*3+1]=spec[1]; col[i*3+2]=spec[2];
      sz[i]=0.25+Math.random()*1.5;
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',   new THREE.BufferAttribute(col,3));
    geo.setAttribute('size',    new THREE.BufferAttribute(sz,1));
    this.scene.add(new THREE.Points(geo,new THREE.PointsMaterial({size:0.7,vertexColors:true,transparent:true,opacity:0.92})));
  }

  /* ── Nebula sprites ─────────────────────────────────────── */
  _buildNebulaeSprites(){
    const nebulae=[
      {color:'rgba(120,40,180,0.07)',  pos:[680,200,-550], scale:480},
      {color:'rgba(40,80,200,0.06)',   pos:[-600,-120,700],scale:420},
      {color:'rgba(180,40,60,0.055)', pos:[500,280,600],   scale:380},
      {color:'rgba(40,160,140,0.05)', pos:[-720,80,-480],  scale:440},
      {color:'rgba(180,100,20,0.045)',pos:[400,-300,-650],  scale:400},
    ];
    nebulae.forEach(({color,pos,scale})=>{
      const c=document.createElement('canvas'); c.width=c.height=256;
      const g=c.getContext('2d'), gr=g.createRadialGradient(128,128,0,128,128,128);
      gr.addColorStop(0,color); gr.addColorStop(0.5,color.replace(/[\d.]+\)$/,'0.04)')); gr.addColorStop(1,'transparent');
      g.fillStyle=gr; g.fillRect(0,0,256,256);
      const tex=new THREE.CanvasTexture(c);
      const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
      spr.position.set(...pos); spr.scale.set(scale,scale,1);
      this.scene.add(spr);
    });
  }

  /* ── Space dust ─────────────────────────────────────────── */
  _buildSpaceDust(){
    const N=3000,pos=new Float32Array(N*3);
    for(let i=0;i<N;i++){const th=Math.random()*Math.PI*2,r=18+Math.random()*110,y=(Math.random()-.5)*18;pos[i*3]=Math.cos(th)*r;pos[i*3+1]=y;pos[i*3+2]=Math.sin(th)*r;}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    this.scene.add(new THREE.Points(geo,new THREE.PointsMaterial({color:0x8899bb,size:0.06,transparent:true,opacity:0.14,depthWrite:false})));
  }

  /* ── Lights ──────────────────────────────────────────────── */
  _buildLights(){
    this.scene.add(new THREE.AmbientLight(0x303348,3.5));
    const sl=new THREE.PointLight(0xFFF5CC,4.0,0,0); sl.position.set(0,0,0); this.scene.add(sl);
    this._sunLight=sl;
  }

  /* ── Sun ─────────────────────────────────────────────────── */
  _buildSun(tex){
    const mat=new THREE.MeshBasicMaterial({map:tex.sun||null,color:tex.sun?0xffffff:0xFFB820});
    this.sunMesh=new THREE.Mesh(new THREE.SphereGeometry(3.5,48,48),mat);
    this.scene.add(this.sunMesh);
    this._coronas=[];
    [{r:4.8,op:0.16,c:0xFFCC44},{r:7,op:0.09,c:0xFFAA22},{r:11,op:0.045,c:0xFF8800},{r:18,op:0.018,c:0xFF6600}].forEach(d=>{
      const m=new THREE.MeshBasicMaterial({color:d.c,transparent:true,opacity:d.op,side:THREE.FrontSide,depthWrite:false});
      const mesh=new THREE.Mesh(new THREE.SphereGeometry(d.r,24,24),m);
      this.scene.add(mesh); this._coronas.push({mesh,base:d.op});
    });
    /* Sun atmosphere glow — subtle golden rim only */
    this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(4.2,24,24),makeAtmoMat('#FFCC44',0.7,3.5)));
    /* Flare */
    const fc=document.createElement('canvas');fc.width=fc.height=256;
    const fg=fc.getContext('2d'),fgr=fg.createRadialGradient(128,128,0,128,128,128);
    fgr.addColorStop(0,'rgba(255,255,230,1)');fgr.addColorStop(0.06,'rgba(255,240,160,0.88)');fgr.addColorStop(0.2,'rgba(255,180,40,0.22)');fgr.addColorStop(0.5,'rgba(255,100,0,0.05)');fgr.addColorStop(1,'transparent');
    fg.fillStyle=fgr;fg.fillRect(0,0,256,256);
    this.flareSpr=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(fc),transparent:true,opacity:0.75,blending:THREE.AdditiveBlending,depthWrite:false}));
    this.flareSpr.scale.set(28,28,1);this.scene.add(this.flareSpr);
  }

  /* ── Solar particle wind ─────────────────────────────────── */
  _buildSolarParticles(){
    const N=1000;
    const pos=new Float32Array(N*3); const vel=[];
    for(let i=0;i<N;i++){
      const th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1),r=3.5+Math.random()*4;
      const vx=Math.sin(ph)*Math.cos(th),vy=Math.sin(ph)*Math.sin(th),vz=Math.cos(ph);
      pos[i*3]=vx*r;pos[i*3+1]=vy*r;pos[i*3+2]=vz*r;
      vel.push(new THREE.Vector3(vx,vy,vz).multiplyScalar(0.06+Math.random()*0.1));
    }
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const mat=new THREE.PointsMaterial({color:0xFF9900,size:0.22,transparent:true,opacity:0.55,blending:THREE.AdditiveBlending,depthWrite:false});
    this._solarGeo=geo; this._solarPos=pos; this._solarVel=vel; this._solarN=N;
    this.scene.add(new THREE.Points(geo,mat));
  }

  /* ── Planet ──────────────────────────────────────────────── */
  _buildPlanet(data,idx,tex){
    /* Orbit ring */
    const pts=[];for(let i=0;i<=130;i++)pts.push(new THREE.Vector3(Math.cos(i/130*Math.PI*2)*data.orbitR,0,Math.sin(i/130*Math.PI*2)*data.orbitR));
    this.scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.05})));

    /* Texture */
    const pTex=tex[data.id];
    if(pTex)pTex.colorSpace=THREE.SRGBColorSpace;
    const mat=new THREE.MeshBasicMaterial({map:pTex||null,color:pTex?0xffffff:0x888888});
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(data.radius,52,52),mat);

    /* GLSL Atmosphere glow */
    if(data.atmoColor){
      const atmoMesh=new THREE.Mesh(
        new THREE.SphereGeometry(data.radius*(data.id==='venus'?1.15:1.12),32,32),
        makeAtmoMat(data.atmoColor, data.atmoCoeff||0.55, data.atmoPow||4.0)
      );
      mesh.add(atmoMesh);
    }

    /* Earth night lights overlay */
    if(data.id==='earth' && tex.earth_lights){
      tex.earth_lights.colorSpace=THREE.SRGBColorSpace;
      const nlMesh=new THREE.Mesh(
        new THREE.SphereGeometry(data.radius*1.001,52,52),
        new THREE.MeshBasicMaterial({map:tex.earth_lights,transparent:true,opacity:0.55,blending:THREE.AdditiveBlending,depthWrite:false})
      );
      mesh.add(nlMesh);
    }

    /* Saturn rings */
    if(data.rings){
      const ringTex=tex.saturn_ring||null;
      [{inner:data.radius*1.42,outer:data.radius*2.08,op:0.78},{inner:data.radius*2.12,outer:data.radius*2.58,op:0.5},{inner:data.radius*2.62,outer:data.radius*3.08,op:0.25}].forEach((r,ri)=>{
        const rm=new THREE.MeshBasicMaterial({map:ri===0?ringTex:null,color:ri===0&&ringTex?0xffffff:0xE4D5A0,transparent:true,opacity:r.op,side:THREE.DoubleSide,depthWrite:false});
        const rmesh=new THREE.Mesh(new THREE.RingGeometry(r.inner,r.outer,90),rm);
        rmesh.rotation.x=Math.PI*0.44;mesh.add(rmesh);
      });
    }
    if(data.thinRings){
      const rm=new THREE.MeshBasicMaterial({color:0x88dddd,transparent:true,opacity:0.22,side:THREE.DoubleSide,depthWrite:false});
      const rmesh=new THREE.Mesh(new THREE.RingGeometry(data.radius*1.5,data.radius*1.9,60),rm);
      rmesh.rotation.x=Math.PI*0.08;mesh.add(rmesh);
    }

    /* Glow sprite */
    const gspr=new THREE.Sprite(new THREE.SpriteMaterial({map:makeGlowTex(GLOW_COLORS[idx]),transparent:true,opacity:0.45,blending:THREE.AdditiveBlending,depthWrite:false}));
    gspr.scale.set(data.radius*5.5,data.radius*5.5,1);mesh.add(gspr);

    mesh.rotation.z=THREE.MathUtils.degToRad(data.tilt);

    const pivot=new THREE.Object3D();pivot.add(mesh);mesh.position.x=data.orbitR;
    this.scene.add(pivot);

    /* Moon */
    let moon=null;
    if(data.hasMoon){
      const mTex=tex.moon||null; if(mTex)mTex.colorSpace=THREE.SRGBColorSpace;
      const mMesh=new THREE.Mesh(new THREE.SphereGeometry(0.27,24,24),new THREE.MeshBasicMaterial({map:mTex||null,color:mTex?0xffffff:0x888880}));
      const mPivot=new THREE.Object3D();mMesh.position.x=1.85;mPivot.add(mMesh);mesh.add(mPivot);
      moon={mesh:mMesh,pivot:mPivot};
    }

    this.objects.push({data,pivot,mesh,gspr,moon});
  }

  /* ── Asteroid belt ──────────────────────────────────────── */
  _buildAsteroidBelt(){
    const N=2500,pos=new Float32Array(N*3),col=new Float32Array(N*3);
    for(let i=0;i<N;i++){
      const a=Math.random()*Math.PI*2,r=27.2+Math.random()*4,y=(Math.random()-.5)*0.8;
      pos[i*3]=Math.cos(a)*r;pos[i*3+1]=y;pos[i*3+2]=Math.sin(a)*r;
      const b=0.38+Math.random()*0.25;col[i*3]=b;col[i*3+1]=b*0.9;col[i*3+2]=b*0.78;
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    this.scene.add(new THREE.Points(geo,new THREE.PointsMaterial({size:0.14,vertexColors:true,transparent:true,opacity:0.62})));
  }

  /* ═══════════════════════════════════════════════════════════
     UI
  ═══════════════════════════════════════════════════════════ */
  _buildUI(){
    this._buildLabelOverlay();
    this._buildTopBar();       // Search + Voice + Screenshot
    this._buildInfoPanel();
    this._buildTimeBar();
    this._buildSurfaceHUD();
    this._buildHint();
    this._buildSkipButton();
    this._raycaster=new THREE.Raycaster();
    this._mouse=new THREE.Vector2();
  }

  /* ── Top bar: Search + Voice + Screenshot ─────────────────── */
  _buildTopBar(){
    const bar=document.createElement('div');
    Object.assign(bar.style,{
      position:'fixed',top:'1.5rem',left:'50%',transform:'translateX(-50%)',
      zIndex:'720',display:'flex',alignItems:'center',gap:'0',
      background:'rgba(4,5,18,0.88)',backdropFilter:'blur(28px)',
      border:'1px solid rgba(255,255,255,0.08)',borderRadius:'3px',
      opacity:'0',transition:'opacity 1s',overflow:'hidden',
    });

    /* Search input */
    const inp=document.createElement('input');
    inp.placeholder='Search planet...';
    inp.setAttribute('autocomplete','off');
    Object.assign(inp.style,{
      background:'none',border:'none',outline:'none',padding:'0.5rem 1rem',
      color:'rgba(255,255,255,0.8)',fontFamily:'"JetBrains Mono",monospace',
      fontSize:'11px',letterSpacing:'0.1em',width:'170px',
    });
    inp.addEventListener('keydown',e=>{ if(e.key==='Enter') this._handleSearch(inp.value); });

    const mkBarBtn=(html,title,fn)=>{
      const b=document.createElement('button');
      b.innerHTML=html; b.title=title;
      Object.assign(b.style,{background:'none',border:'none',borderLeft:'1px solid rgba(255,255,255,0.06)',
        color:'rgba(255,255,255,0.45)',padding:'0.5rem 0.75rem',fontSize:'14px',cursor:'pointer',
        transition:'all 0.16s',lineHeight:'1'});
      b.onmouseenter=()=>{b.style.color='#fff';b.style.background='rgba(255,255,255,0.06)';};
      b.onmouseleave=()=>{b.style.color='rgba(255,255,255,0.45)';b.style.background='none';};
      b.addEventListener('click',fn); return b;
    };

    const searchBtn = mkBarBtn('⌕','Search',()=>this._handleSearch(inp.value));
    const voiceBtn  = mkBarBtn('🎤','Voice navigation',()=>this._startVoice(voiceBtn));
    const shotBtn   = mkBarBtn('📷','Screenshot',()=>this._takeScreenshot());

    [inp,searchBtn,voiceBtn,shotBtn].forEach(el=>bar.appendChild(el));
    this.container.appendChild(bar);
    this._topBar=bar;
    setTimeout(()=>{bar.style.opacity='1';},2000);
  }

  _handleSearch(query){
    const q=(query||'').toLowerCase().trim();
    if(!q)return;
    const target=this.objects.find(o=>PLANET_INFO[o.data.id]?.name.toLowerCase().includes(q)||o.data.id.includes(q));
    if(target){ this._focusPlanet(target); this._openPanel(target.data.id); }
  }

  _startVoice(btn){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){ alert('Voice navigation is not supported in this browser. Try Chrome.'); return; }
    const rec=new SR(); rec.lang='en-US'; rec.interimResults=false; rec.maxAlternatives=1;
    btn.innerHTML='🔴'; btn.title='Listening...';
    rec.start();
    rec.onresult=e=>{
      const text=e.results[0][0].transcript.toLowerCase();
      btn.innerHTML='🎤'; btn.title='Voice navigation';
      /* Find planet name in transcript */
      const found=this.objects.find(o=>text.includes(o.data.id)||text.includes(PLANET_INFO[o.data.id]?.name.toLowerCase()));
      if(found){ this._focusPlanet(found); this._openPanel(found.data.id); }
    };
    rec.onerror=()=>{ btn.innerHTML='🎤'; };
    rec.onend=()=>{ btn.innerHTML='🎤'; };
  }

  _takeScreenshot(){
    this.composer.render();
    const dataURL=this.renderer.domElement.toDataURL('image/png');
    const a=document.createElement('a');
    a.href=dataURL; a.download='solar-system-'+(Date.now())+'.png';
    a.click();
  }

  /* ── Labels ──────────────────────────────────────────────── */
  _buildLabelOverlay(){
    this._labelDiv=document.createElement('div');
    Object.assign(this._labelDiv.style,{position:'fixed',inset:'0',zIndex:'601',pointerEvents:'none'});
    this.container.appendChild(this._labelDiv);
    this._labelEls=this.objects.map(({data})=>{
      const el=document.createElement('div');
      Object.assign(el.style,{position:'absolute',transform:'translate(-50%,0)',pointerEvents:'none',
        color:'rgba(255,255,255,0.68)',fontFamily:'"Space Grotesk",sans-serif',fontSize:'11px',fontWeight:'500',
        letterSpacing:'0.08em',textShadow:'0 1px 8px rgba(0,0,0,0.95)',opacity:'0',transition:'opacity 0.5s',
        display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'});
      el.innerHTML=`<div style="width:1px;height:7px;background:rgba(255,255,255,0.16)"></div><span>${PLANET_INFO[data.id]?.name||data.id}</span>`;
      this._labelDiv.appendChild(el);return el;
    });
  }

  /* ── Info panel ──────────────────────────────────────────── */
  _buildInfoPanel(){
    const panel=document.createElement('div');
    Object.assign(panel.style,{position:'fixed',top:'0',right:'0',bottom:'0',width:'300px',zIndex:'710',background:'rgba(4,5,18,0.94)',backdropFilter:'blur(32px)',borderLeft:'1px solid rgba(255,255,255,0.06)',transform:'translateX(100%)',transition:'transform 0.42s cubic-bezier(0.16,1,0.3,1)',display:'flex',flexDirection:'column',overflowY:'auto',fontFamily:'"Space Grotesk",sans-serif',color:'rgba(255,255,255,0.85)'});
    panel.innerHTML=`
      <button id="ssp-close" style="position:absolute;top:1rem;right:1rem;background:none;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.38);width:26px;height:26px;border-radius:2px;cursor:pointer;font-size:16px;line-height:1;z-index:1">&times;</button>
      <div style="padding:1.5rem 1.5rem 1rem">
        <div id="ssp-ey" style="font-size:8.5px;letter-spacing:0.38em;color:rgba(77,159,255,0.65);text-transform:uppercase;margin-bottom:0.5rem"></div>
        <div id="ssp-nm" style="font-size:2rem;font-weight:700;letter-spacing:0.01em;line-height:1"></div>
        <div id="ssp-ty" style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:0.3rem"></div>
      </div>
      <div id="ssp-st" style="padding:0 1.5rem 1rem;display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;border-bottom:1px solid rgba(255,255,255,0.05)"></div>
      <div id="ssp-de" style="padding:1rem 1.5rem;font-size:12px;line-height:1.7;color:rgba(255,255,255,0.45)"></div>
      <div style="padding:0 1.5rem 1.5rem">
        <button id="ssp-fly" style="width:100%;padding:0.55rem;background:rgba(77,159,255,0.12);border:1px solid rgba(77,159,255,0.25);color:rgba(77,159,255,0.8);font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.18em;cursor:pointer;border-radius:2px;transition:all 0.2s">FLY CLOSER →</button>
      </div>`;
    this.container.appendChild(panel);
    this._infoPanel=panel;
    panel.querySelector('#ssp-close').addEventListener('click',()=>this._closePanel());
    panel.querySelector('#ssp-fly').addEventListener('click',()=>{ if(this._selectedId){ const obj=this.objects.find(o=>o.data.id===this._selectedId); if(obj)this._flyCloser(obj); } });
  }

  _openPanel(id){
    const info=PLANET_INFO[id]; if(!info)return;
    this._infoPanel.querySelector('#ssp-ey').textContent='Planet · Solar System';
    this._infoPanel.querySelector('#ssp-nm').textContent=info.name;
    this._infoPanel.querySelector('#ssp-ty').textContent=info.type;
    this._infoPanel.querySelector('#ssp-de').textContent=info.desc;
    const stats=[['Radius',info.radius],['Dist. from Sun',info.distSun],['Orbital Period',info.orbPeriod],['Day Length',info.rotPeriod],['Avg Temp.',info.temp],['Moons',info.moons]];
    this._infoPanel.querySelector('#ssp-st').innerHTML=stats.map(([k,v])=>`<div><div style="font-size:8px;letter-spacing:0.2em;color:rgba(255,255,255,0.28);text-transform:uppercase;margin-bottom:3px">${k}</div><div style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.88)">${v}</div></div>`).join('');
    this._infoPanel.style.transform='translateX(0)'; this._selectedId=id;
  }
  _closePanel(){ this._infoPanel.style.transform='translateX(100%)'; this._selectedId=null; this._focusedObj=null; }

  /* ── Time bar ────────────────────────────────────────────── */
  _buildTimeBar(){
    const bar=document.createElement('div');
    Object.assign(bar.style,{position:'fixed',bottom:'2.4rem',left:'50%',transform:'translateX(-50%)',zIndex:'702',background:'rgba(4,5,18,0.88)',backdropFilter:'blur(24px)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'3px',display:'flex',alignItems:'center',gap:'0',overflow:'hidden',opacity:'0',transition:'opacity 1s'});
    const mkBtn=(html,title,fn)=>{
      const b=document.createElement('button'); b.innerHTML=html; b.title=title;
      Object.assign(b.style,{background:'none',border:'none',borderRight:'1px solid rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.45)',padding:'0.44rem 0.72rem',fontSize:'12px',cursor:'pointer',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.04em',transition:'all 0.16s',lineHeight:'1'});
      b.onmouseenter=()=>{b.style.color='#fff';b.style.background='rgba(255,255,255,0.05)';};
      b.onmouseleave=()=>{b.style.color='rgba(255,255,255,0.45)';b.style.background='none';};
      b.addEventListener('click',fn);return b;
    };
    this._playBtn=mkBtn('⏸','Pause',()=>{this.paused=!this.paused;this._playBtn.innerHTML=this.paused?'▶':'⏸';});
    this._tourBtn=mkBtn('⟳ Tour','Auto-tour',()=>{
      this._touring=!this._touring;
      this._tourBtn.style.color=this._touring?'rgba(77,159,255,0.85)':'rgba(255,255,255,0.45)';
      if(this._touring){this._tourIdx=0;this._tourTimer=0;}
    });
    [this._playBtn,mkBtn('1×','Normal',()=>this.timeScale=1),mkBtn('10×','10x',()=>this.timeScale=10),mkBtn('50×','50x',()=>this.timeScale=50),mkBtn('200×','200x',()=>this.timeScale=200),this._tourBtn].forEach(b=>bar.appendChild(b));
    this.container.appendChild(bar); this._timeBar=bar;
    setTimeout(()=>{bar.style.opacity='1';},3500);
  }

  /* ── Surface HUD (shows when very close to a planet) ─────── */
  _buildSurfaceHUD(){
    const el=document.createElement('div');
    Object.assign(el.style,{
      position:'fixed',top:'50%',left:'1.5rem',transform:'translateY(-50%)',zIndex:'705',
      display:'flex',flexDirection:'column',gap:'0.5rem',opacity:'0',transition:'opacity 0.6s',pointerEvents:'none',
    });
    el.innerHTML=`
      <div id="ssh-title" style="font-size:9px;letter-spacing:0.3em;color:rgba(77,159,255,0.6);font-family:'JetBrains Mono',monospace">APPROACHING</div>
      <div id="ssh-name"  style="font-size:1.2rem;font-weight:700;color:rgba(255,255,255,0.9);font-family:'Space Grotesk',sans-serif"></div>
      <div id="ssh-alt"   style="font-size:10px;color:rgba(255,255,255,0.35);font-family:'JetBrains Mono',monospace"></div>`;
    this.container.appendChild(el); this._surfaceHUD=el;
  }

  /* ── Hint ────────────────────────────────────────────────── */
  _buildHint(){
    const el=document.createElement('div');
    Object.assign(el.style,{position:'fixed',bottom:'0.7rem',left:'50%',transform:'translateX(-50%)',zIndex:'701',color:'rgba(255,255,255,0.18)',fontFamily:'"JetBrains Mono",monospace',fontSize:'9px',letterSpacing:'0.28em',pointerEvents:'none',opacity:'0',transition:'opacity 0.8s'});
    el.textContent='DRAG · SCROLL · CLICK PLANET · SEARCH · VOICE';
    this.container.appendChild(el);
    setTimeout(()=>{el.style.opacity='1';},4000);
    setTimeout(()=>{el.style.opacity='0';},10000);
  }

  /* ── Skip ────────────────────────────────────────────────── */
  _buildSkipButton(){
    const btn=document.createElement('button');
    btn.innerHTML='SKIP &nbsp;→';
    Object.assign(btn.style,{position:'fixed',top:'1.5rem',right:'1.8rem',zIndex:'730',padding:'0.46rem 1rem',background:'rgba(3,4,14,0.9)',border:'1px solid rgba(255,255,255,0.09)',color:'rgba(255,255,255,0.42)',fontFamily:'"JetBrains Mono",monospace',fontSize:'10px',letterSpacing:'0.22em',cursor:'pointer',borderRadius:'2px',backdropFilter:'blur(24px)',transition:'all 0.2s',opacity:'0'});
    btn.onmouseenter=()=>{btn.style.color='#fff';btn.style.borderColor='rgba(255,255,255,0.3)';};
    btn.onmouseleave=()=>{btn.style.color='rgba(255,255,255,0.42)';btn.style.borderColor='rgba(255,255,255,0.09)';};
    btn.addEventListener('click',()=>this.skip());
    this.container.appendChild(btn); this._skipBtn=btn;
    setTimeout(()=>{btn.style.opacity='1';},1800);
  }

  /* ── Events ──────────────────────────────────────────────── */
  _attachEvents(){
    window.addEventListener('resize',()=>this._onResize());
    const el=this.renderer.domElement;
    el.addEventListener('mousedown',e=>{this._drag=true;this._lastMX=e.clientX;this._lastMY=e.clientY;this._clickStart={x:e.clientX,y:e.clientY};});
    el.addEventListener('mousemove',e=>this._onMouseMove(e));
    el.addEventListener('mouseup',  e=>{this._onMouseUp(e);this._drag=false;});
    el.addEventListener('mouseleave',()=>this._drag=false);
    el.addEventListener('wheel',    e=>this._onWheel(e),{passive:true});
    el.addEventListener('touchstart',e=>{this._drag=true;this._lastMX=e.touches[0].clientX;this._lastMY=e.touches[0].clientY;},{passive:true});
    el.addEventListener('touchmove', e=>{if(!this._drag)return;const dx=e.touches[0].clientX-this._lastMX,dy=e.touches[0].clientY-this._lastMY;this._lastMX=e.touches[0].clientX;this._lastMY=e.touches[0].clientY;this._camTheta-=dx*0.006;this._camPhi=Math.max(0.1,Math.min(1.45,this._camPhi+dy*0.006));},{passive:true});
    el.addEventListener('touchend', ()=>this._drag=false);
  }

  /* ── Camera ──────────────────────────────────────────────── */
  _updateCameraImmediate(){
    const r=this._camR;
    this.camera.position.set(r*Math.sin(this._camPhi)*Math.sin(this._camTheta),r*Math.cos(this._camPhi),r*Math.sin(this._camPhi)*Math.cos(this._camTheta));
    this.camera.lookAt(0,0,0);
  }
  _updateCameraLerp(){
    const r=this._camR;
    const tp=new THREE.Vector3(r*Math.sin(this._camPhi)*Math.sin(this._camTheta),r*Math.cos(this._camPhi),r*Math.sin(this._camPhi)*Math.cos(this._camTheta));
    this.camera.position.lerp(tp,0.08);
    this.camera.lookAt(0,0,0);
  }

  _onResize(){
    const W=window.innerWidth,H=window.innerHeight;
    this.renderer.setSize(W,H);this.composer.setSize(W,H);
    this.camera.aspect=W/H;this.camera.updateProjectionMatrix();
  }

  _onMouseMove(e){
    if(!this._drag||!this._introDone)return;
    const dx=e.clientX-this._lastMX,dy=e.clientY-this._lastMY;
    this._lastMX=e.clientX;this._lastMY=e.clientY;
    this._velTheta=dx*0.005;this._velPhi=dy*0.005;
    this._camTheta-=this._velTheta;this._camPhi=Math.max(0.1,Math.min(1.45,this._camPhi-this._velPhi));
    this._travelPos=null;
  }

  _onMouseUp(e){
    const dx=Math.abs(e.clientX-this._clickStart.x),dy=Math.abs(e.clientY-this._clickStart.y);
    if(dx<5&&dy<5)this._handleClick(e);
  }

  _onWheel(e){
    if(!this._introDone)return;
    this._targetR=Math.max(2,Math.min(180,this._targetR+e.deltaY*0.06));
    this._travelPos=null;
  }

  _handleClick(e){
    if(!this._introDone)return;
    this._mouse.x=(e.clientX/window.innerWidth)*2-1;
    this._mouse.y=-(e.clientY/window.innerHeight)*2+1;
    this._raycaster.setFromCamera(this._mouse,this.camera);
    const hits=this._raycaster.intersectObjects(this.objects.map(o=>o.mesh),true);
    if(hits.length>0){
      const h=hits[0].object;
      const obj=this.objects.find(o=>o.mesh===h||h.parent===o.mesh||h.parent?.parent===o.mesh);
      if(obj){this._focusPlanet(obj);this._openPanel(obj.data.id);return;}
    }
    this._closePanel();
  }

  _focusPlanet(obj){
    const wp=new THREE.Vector3();obj.mesh.getWorldPosition(wp);
    const d=obj.data.radius*8+5;
    this._travelPos=wp.clone().add(new THREE.Vector3(d*0.8,d*0.5,d*0.8));
    this._travelTarget=wp.clone();
    this._travelT=0;
    this._focusedObj=obj;
    this._touring=false;
    if(this._tourBtn)this._tourBtn.style.color='rgba(255,255,255,0.45)';
  }

  _flyCloser(obj){
    const wp=new THREE.Vector3();obj.mesh.getWorldPosition(wp);
    const d=obj.data.radius*2.5;
    this._travelPos=wp.clone().add(new THREE.Vector3(d,d*0.4,d));
    this._travelTarget=wp.clone();
    this._travelT=0;
  }

  _updateTour(dt){
    if(!this._touring||!this._introDone)return;
    this._tourTimer-=dt;
    if(this._tourTimer<=0){this._focusPlanet(this.objects[this._tourIdx%this.objects.length]);this._tourTimer=6;this._tourIdx++;}
  }

  /* ── Comet ───────────────────────────────────────────────── */
  _spawnComet(){
    const a=Math.random()*Math.PI*2,r=95;
    const start=new THREE.Vector3(Math.cos(a)*r,22+(Math.random()-.5)*28,Math.sin(a)*r);
    const dir=new THREE.Vector3(-Math.cos(a),-.18+Math.random()*.1,-Math.sin(a)).normalize();
    const pts=[];for(let i=0;i<22;i++)pts.push(start.clone().addScaledVector(dir,i*3.2));
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0xaaccff,transparent:true,opacity:0.72}));
    this.scene.add(line); this.comets.push({line,mat:line.material,dir,life:0,maxLife:220,speed:0.5});
  }

  /* ── Labels ──────────────────────────────────────────────── */
  _updateLabels(){
    if(!this._introDone||!this._labelEls)return;
    const W=window.innerWidth,H=window.innerHeight;
    this.objects.forEach(({mesh,data},i)=>{
      const wp=new THREE.Vector3();mesh.getWorldPosition(wp);
      const proj=wp.clone().project(this.camera);
      if(proj.z>1){this._labelEls[i].style.opacity='0';return;}
      const sx=(proj.x*.5+.5)*W,sy=(-proj.y*.5+.5)*H;
      const dist=wp.distanceTo(this.camera.position);
      const alpha=Math.min(1,Math.max(0,(220-dist)/140));
      const pr=data.radius*280/dist;
      this._labelEls[i].style.left=sx+'px';
      this._labelEls[i].style.top=(sy+pr+14)+'px';
      this._labelEls[i].style.opacity=String(alpha);
    });
  }

  /* ── Surface mode ────────────────────────────────────────── */
  _updateSurfaceHUD(){
    if(!this._surfaceHUD||!this._introDone)return;
    let closest=null; let minDist=Infinity;
    this.objects.forEach(o=>{
      const wp=new THREE.Vector3();o.mesh.getWorldPosition(wp);
      const dist=wp.distanceTo(this.camera.position)-o.data.radius;
      if(dist<minDist){minDist=dist;closest=o;}
    });
    if(closest&&minDist<closest.data.radius*6){
      this._surfaceHUD.style.opacity='1';
      this._surfaceHUD.querySelector('#ssh-name').textContent=PLANET_INFO[closest.data.id]?.name||closest.data.id;
      this._surfaceHUD.querySelector('#ssh-alt').textContent=`ALT ${Math.max(0,minDist).toFixed(1)} AU`;
    } else {
      this._surfaceHUD.style.opacity='0';
    }
  }

  /* ── Main loop ───────────────────────────────────────────── */
  start(){
    this.running=true;
    const clock=new THREE.Clock();
    const animate=()=>{
      if(!this.running)return;
      requestAnimationFrame(animate);
      const dt=clock.getDelta();
      const t=clock.getElapsedTime();
      const ts=this.paused?0:this.timeScale;

      /* Intro fly-in */
      if(!this._introDone){
        this._introPhase=Math.min(1,this._introPhase+dt*0.42);
        const ease=easeOutQuart(this._introPhase);
        const ir=THREE.MathUtils.lerp(220,this._camR,ease);
        const ip=THREE.MathUtils.lerp(0.28,this._camPhi,ease);
        this.camera.position.set(ir*Math.sin(ip)*Math.sin(this._camTheta),ir*Math.cos(ip),ir*Math.sin(ip)*Math.cos(this._camTheta));
        this.camera.lookAt(0,0,0);
        if(this._introPhase>=1){this._introDone=true;this._labelEls?.forEach(el=>{el.style.opacity='1';});}
      } else if(this._travelPos){
        this._travelT=Math.min(1,this._travelT+dt*1.1);
        const ease=easeOutQuart(this._travelT);
        this.camera.position.lerp(this._travelPos,ease*dt*2.2);
        this.camera.lookAt(this._travelTarget||new THREE.Vector3());
        if(this._travelT>=0.98)this._travelPos=null;
      } else {
        if(!this._drag){this._velTheta*=0.91;this._velPhi*=0.91;this._camTheta-=this._velTheta;this._camPhi=Math.max(0.1,Math.min(1.45,this._camPhi-this._velPhi));}
        this._camR+=(this._targetR-this._camR)*0.06;
        this._updateCameraLerp();
      }

      this._updateTour(dt);
      this._updateSurfaceHUD();

      /* Sun */
      if(this.sunMesh){this.sunMesh.rotation.y=t*0.07;this.sunMesh.scale.setScalar(1+.022*Math.sin(t*1.3));}
      this._coronas?.forEach(({mesh,base},i)=>{mesh.material.opacity=base*(1+.18*Math.sin(t*.72+i*1.1));});
      this.flareSpr?.position.set(0,0,0);

      /* Solar particles */
      if(this._solarPos){
        const pos=this._solarPos,vel=this._solarVel;
        for(let i=0;i<this._solarN;i++){
          pos[i*3]+=vel[i].x*dt*28;pos[i*3+1]+=vel[i].y*dt*28;pos[i*3+2]+=vel[i].z*dt*28;
          const r2=pos[i*3]**2+pos[i*3+1]**2+pos[i*3+2]**2;
          if(r2>28*28){
            const th2=Math.random()*Math.PI*2,ph2=Math.acos(2*Math.random()-1);
            const vx=Math.sin(ph2)*Math.cos(th2),vy=Math.sin(ph2)*Math.sin(th2),vz=Math.cos(ph2);
            const r0=3.5+Math.random()*2;
            pos[i*3]=vx*r0;pos[i*3+1]=vy*r0;pos[i*3+2]=vz*r0;
            vel[i].set(vx,vy,vz).multiplyScalar(0.06+Math.random()*0.1);
          }
        }
        this._solarGeo.attributes.position.needsUpdate=true;
      }

      /* Planets */
      this.objects.forEach(({data,pivot,mesh,moon},i)=>{
        this.angles[i]+=data.speed*ts*0.55*dt*60;
        pivot.rotation.y=this.angles[i];
        mesh.rotation.y+=0.003*dt*60;
        if(moon)moon.pivot.rotation.y+=0.035*ts*dt*60;
      });

      /* Comets */
      this._nextComet-=1;
      if(this._nextComet<=0){this._spawnComet();this._nextComet=400+Math.random()*500;}
      for(let i=this.comets.length-1;i>=0;i--){
        const c=this.comets[i];c.life+=dt*60;
        const p=c.life/c.maxLife;c.mat.opacity=(p<0.3?p/0.3:1-(p-.3)/.7)*.72;
        c.line.position.addScaledVector(c.dir,c.speed*dt*60);
        if(c.life>=c.maxLife){this.scene.remove(c.line);c.line.geometry.dispose();this.comets.splice(i,1);}
      }

      this._updateLabels();
      this.composer.render();
    };
    animate();
  }

  /* ── Skip ─────────────────────────────────────────────────── */
  skip(){
    const el=this.renderer.domElement;
    el.style.transition='opacity 0.7s ease';el.style.opacity='0';
    [this._labelDiv,this._infoPanel,this._skipBtn,this._timeBar,this._topBar,this._surfaceHUD].forEach(e=>{if(e){e.style.transition='opacity 0.5s';e.style.opacity='0';}});
    setTimeout(()=>{
      this.running=false;
      [el,this._labelDiv,this._infoPanel,this._skipBtn,this._timeBar,this._topBar,this._surfaceHUD].forEach(e=>{try{e?.remove();}catch(_){}});
      try{this.renderer.dispose();this.composer.dispose();}catch(_){}
      if(this.onSkip)this.onSkip();
    },750);
  }
}
