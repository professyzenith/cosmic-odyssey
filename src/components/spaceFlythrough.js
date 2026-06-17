/* ═══════════════════════════════════════════════════════════════
   SolarSystem3D v7 — Cinematic Journey: Earth → Milky Way
   ─ 9 seamless narrative scale zones
   ─ Adaptive camera speed per zone
   ─ Dramatic cinematic captions with story text
   ─ Live distance counter (km → AU → ly → kly)
   ─ Stellar Neighborhood (5k spectral stars, 400–1500 units)
   ─ Orion Arm cloud (12k stars + HII nebulae, 700–4000 units)
   ─ High-detail 2048px galaxy disc (4 arms, dust lanes, LMC/SMC)
   ─ Galaxy slowly rotates; "You are here" blue pulse
   ─ Scale-aware LOD: every layer fades in/out smoothly
   ─ GLSL atmosphere shaders (Fresnel rim) on all planets
   ─ Earth night city lights, solar wind particles, comets
   ─ Search, voice nav, screenshot, auto-tour
   ═══════════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ── GLSL Atmosphere (Fresnel rim) ─────────────────────────── */
const ATMO_V=`varying vec3 vN,vVP;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vVP=-mv.xyz;gl_Position=projectionMatrix*mv;}`;
const ATMO_F=`uniform vec3 gc;uniform float co,pw;varying vec3 vN,vVP;void main(){float r=1.-abs(dot(normalize(vVP),vN));float i=co*pow(clamp(r,0.,1.),pw);gl_FragColor=vec4(gc,clamp(i,0.,1.));}`;
function makeAtmoMat(c,co=0.55,pw=4.){return new THREE.ShaderMaterial({uniforms:{gc:{value:new THREE.Color(c)},co:{value:co},pw:{value:pw}},vertexShader:ATMO_V,fragmentShader:ATMO_F,side:THREE.FrontSide,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false});}
function makeGlowTex(c){const col=c||'#ffffff';const cv=document.createElement('canvas');cv.width=cv.height=128;const g=cv.getContext('2d'),gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,col+'ff');gr.addColorStop(0.3,col+'55');gr.addColorStop(0.7,col+'11');gr.addColorStop(1,'transparent');g.fillStyle=gr;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(cv);}
const easeOutQuart=t=>1-Math.pow(1-t,4);
const lerp=(a,b,t)=>a+(b-a)*t;

/* ── 9 Narrative Scale Zones ───────────────────────────────── */
const ZONES=[
  {id:'earth',      minR:0,     maxR:14,    title:'Earth',               sub:'THE BLUE MARBLE · 6,371 KM RADIUS',                         color:'#4499FF'},
  {id:'moon',       minR:14,    maxR:45,    title:'The Earth–Moon System',sub:'384,400 KM BETWEEN WORLDS',                                 color:'#AABBCC'},
  {id:'inner_ss',   minR:45,    maxR:150,   title:'The Inner Solar System',sub:'MERCURY TO MARS · SUN AT THE CENTRE',                     color:'#FFB844'},
  {id:'outer_ss',   minR:150,   maxR:380,   title:'The Outer Solar System',sub:'JUPITER TO NEPTUNE · 30 AU FROM THE SUN',                 color:'#88AACC'},
  {id:'oort',       minR:380,   maxR:900,   title:'The Oort Cloud',       sub:'THE SOLAR SYSTEM\'S OUTER SHELL · ~100,000 AU ACROSS',     color:'#8899BB'},
  {id:'near_stars', minR:900,   maxR:2500,  title:'Nearby Star Systems',  sub:'PROXIMA CENTAURI · SIRIUS · 4–12 LIGHT-YEARS AWAY',        color:'#BBDDFF'},
  {id:'stellar_nbhd',minR:2500, maxR:6000,  title:'The Stellar Neighborhood',sub:'THOUSANDS OF STARS WITHIN 100 LIGHT-YEARS',             color:'#CCDDF5'},
  {id:'orion_arm',  minR:6000,  maxR:13000, title:'The Orion Arm',        sub:'OUR SPIRAL ARM · 10,000 LIGHT-YEARS WIDE',                 color:'#FFD080'},
  {id:'milky_way',  minR:13000, maxR:99999, title:'The Milky Way Galaxy', sub:'100,000 LIGHT-YEARS · ~300 BILLION STARS',                 color:'#FFE8AA'},
];

/* ── Planet data ────────────────────────────────────────────── */
const PLANET_INFO={
  mercury:{name:'Mercury',type:'Terrestrial',radius:'2,439 km',distSun:'57.9M km',orbPeriod:'88 days',rotPeriod:'58.6 days',temp:'-173 to 427°C',moons:0,desc:'The smallest planet and closest to the Sun. Mercury has virtually no atmosphere and extreme temperature swings.'},
  venus:  {name:'Venus',  type:'Terrestrial',radius:'6,051 km',distSun:'108.2M km',orbPeriod:'225 days',rotPeriod:'243 days',temp:'462°C average',moons:0,desc:'The hottest planet, with a thick toxic CO₂ atmosphere. Venus rotates in reverse.'},
  earth:  {name:'Earth',  type:'Terrestrial',radius:'6,371 km',distSun:'149.6M km',orbPeriod:'365.25 days',rotPeriod:'24 hours',temp:'-88 to 58°C',moons:1,desc:'Our home — the only known planet harbouring life. Earth has liquid water, a magnetic field, and a breathable atmosphere.'},
  mars:   {name:'Mars',   type:'Terrestrial',radius:'3,389 km',distSun:'227.9M km',orbPeriod:'687 days',rotPeriod:'24.6 hours',temp:'-125 to 20°C',moons:2,desc:'The Red Planet with the tallest volcano (Olympus Mons, 21 km) and deepest canyon in the Solar System.'},
  jupiter:{name:'Jupiter',type:'Gas Giant',  radius:'69,911 km',distSun:'778.5M km',orbPeriod:'11.9 years',rotPeriod:'9.9 hours',temp:'-108°C',moons:95,desc:'The largest planet — more massive than all others combined. Its Great Red Spot is a storm raging 400+ years.'},
  saturn: {name:'Saturn', type:'Gas Giant',  radius:'58,232 km',distSun:'1.43B km',orbPeriod:'29.5 years',rotPeriod:'10.7 hours',temp:'-138°C',moons:146,desc:'Famous for its ring system spanning 282,000 km. Saturn is so light it could float on water.'},
  uranus: {name:'Uranus', type:'Ice Giant',  radius:'25,362 km',distSun:'2.87B km',orbPeriod:'84 years',rotPeriod:'17.2 hours',temp:'-195°C',moons:28,desc:'The coldest planetary atmosphere. Uranus rotates on its side with a 97.8° axial tilt.'},
  neptune:{name:'Neptune',type:'Ice Giant',  radius:'24,622 km',distSun:'4.50B km',orbPeriod:'165 years',rotPeriod:'16.1 hours',temp:'-200°C',moons:16,desc:'The windiest planet (2,100 km/h gusts). Predicted mathematically before it was first observed.'},
  pluto:  {name:'Pluto',  type:'Dwarf',      radius:'1,188 km',distSun:'5.90B km',orbPeriod:'248 years',rotPeriod:'6.4 days',temp:'-229°C',moons:5,desc:'The enigmatic dwarf planet at the edge of the Kuiper Belt.'},
};
const PLANETS=[
  {id:'mercury',radius:0.40,orbitR:9, speed:0.041, tilt:0.03, atmoColor:'#996633',aC:0.18,aP:5.5},
  {id:'venus',  radius:0.95,orbitR:13,speed:0.016, tilt:177.4,atmoColor:'#FFD080',aC:0.92,aP:2.8},
  {id:'earth',  radius:1.00,orbitR:17,speed:0.010, tilt:23.4, atmoColor:'#4499FF',aC:0.88,aP:3.2,hasMoon:true},
  {id:'mars',   radius:0.55,orbitR:22,speed:0.005, tilt:25.2, atmoColor:'#FF8844',aC:0.55,aP:4.0},
  {id:'jupiter',radius:2.90,orbitR:34,speed:0.0008,tilt:3.1,  atmoColor:'#C8A870',aC:0.68,aP:3.0},
  {id:'saturn', radius:2.35,orbitR:44,speed:0.0003,tilt:26.7, atmoColor:'#E4D5A0',aC:0.68,aP:3.0,rings:true},
  {id:'uranus', radius:1.75,orbitR:54,speed:0.0001,tilt:97.8, atmoColor:'#88EEEE',aC:0.72,aP:3.2,thinRings:true},
  {id:'neptune',radius:1.65,orbitR:63,speed:0.00006,tilt:28.3,atmoColor:'#4466DD',aC:0.75,aP:3.0},
  {id:'pluto',  radius:0.19,orbitR:80,speed:0.00004,tilt:122.5,atmoColor:null},
];
const GLOW=['#B0B0A8','#E8C56B','#2E8FF5','#C1440E','#C8A87A','#E4D5A0','#7DE8E8','#4060D8','#C8C0B8'];
const NEARBY_STARS=[
  {name:'Proxima Centauri',pos:new THREE.Vector3(560,80,-380), color:0xFF6644,r:0.7,ly:'4.24 ly'},
  {name:'Alpha Centauri A', pos:new THREE.Vector3(540,95,-370),color:0xFFEEB0,r:0.9,ly:'4.37 ly'},
  {name:'Sirius',           pos:new THREE.Vector3(-580,-60,420),color:0xCCE8FF,r:1.1,ly:'8.60 ly'},
  {name:"Barnard's Star",   pos:new THREE.Vector3(380,140,510), color:0xFF5533,r:0.55,ly:'5.96 ly'},
  {name:'Wolf 359',         pos:new THREE.Vector3(-350,180,-510),color:0xFF4422,r:0.45,ly:'7.78 ly'},
  {name:'Epsilon Eridani',  pos:new THREE.Vector3(-420,-120,480),color:0xFFCC88,r:0.75,ly:'10.5 ly'},
  {name:'Tau Ceti',         pos:new THREE.Vector3(310,-200,-580),color:0xFFDD99,r:0.78,ly:'11.9 ly'},
];

/* ══════════════════════════════════════════════════════════════ */
export class SolarSystem3D{
  constructor(container,onSkip){
    this.container=container; this.onSkip=onSkip;
    this.running=false; this.objects=[]; this.angles=PLANETS.map((_,i)=>i*0.9);
    this.comets=[]; this._nextComet=300;
    this.timeScale=1; this.paused=false;
    this._touring=false; this._tourIdx=0; this._tourTimer=0;
    this._selectedId=null; this._introPhase=0; this._introDone=false;
    this._camTheta=0.5; this._camPhi=0.88; this._camR=85; this._targetR=85;
    this._velTheta=0; this._velPhi=0; this._drag=false;
    this._lastMX=0; this._lastMY=0; this._clickStart={x:0,y:0};
    this._travelPos=null; this._travelTarget=null; this._travelT=1;
    this._solarPos=null; this._solarVel=null; this._solarGeo=null;
    this._currentZoneId=null; this._narTimeout=null;
    /* Orbit-around-focus: camera orbits _orbitCenter, smoothly targets _orbitCenterTarget */
    this._orbitCenter=new THREE.Vector3();
    this._orbitCenterTarget=new THREE.Vector3();
    /* LOD material refs */
    this._stellarNeighMat=null; this._orionArmMat=null;
    this._orionNebMats=[]; this._galaxyDiscMat=null;
    this._galHazeMat=null; this._galBandMat=null;
    this._andromedaMat=null; this._globularMats=[];
    this._sunRays=[];
  }

  /* ── INIT ─────────────────────────────────────────────────── */
  init(){
    const W=window.innerWidth,H=window.innerHeight;
    this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
    this.renderer.setSize(W,H); this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure=1.1;
    Object.assign(this.renderer.domElement.style,{position:'fixed',inset:'0',zIndex:'600',opacity:'0',transition:'opacity 1.2s'});
    this.container.appendChild(this.renderer.domElement);
    this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(52,W/H,0.01,25000);
    this._updateCamImmediate();
    this.composer=new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene,this.camera));
    this._bloom=new UnrealBloomPass(new THREE.Vector2(W,H),0.75,0.42,0.6);
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

  /* ── Load screen ──────────────────────────────────────────── */
  _buildLoadScreen(){
    const el=document.createElement('div');
    Object.assign(el.style,{position:'fixed',inset:'0',zIndex:'650',background:'#000008',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'1.5rem',fontFamily:'"JetBrains Mono",monospace',color:'rgba(255,255,255,0.4)',transition:'opacity 0.8s'});
    el.innerHTML=`<div style="font-size:9px;letter-spacing:0.45em;color:rgba(77,159,255,0.55)">INITIALISING UNIVERSE</div><div style="width:200px;height:1px;background:rgba(255,255,255,0.07);overflow:hidden"><div id="lb" style="height:100%;width:0%;background:rgba(77,159,255,0.7);transition:width 0.25s"></div></div><div id="ll" style="font-size:8.5px;letter-spacing:0.2em"></div>`;
    this.container.appendChild(el);
    this._ls=el; this._lb=el.querySelector('#lb'); this._ll=el.querySelector('#ll');
  }
  _fadeLoadScreen(){if(!this._ls)return;this._ls.style.opacity='0';setTimeout(()=>this._ls?.remove(),900);}

  /* ── Textures ─────────────────────────────────────────────── */
  _loadTextures(){
    return new Promise(res=>{
      const L=new THREE.TextureLoader();
      const F={sun:'/textures/sun.jpg',mercury:'/textures/mercury.jpg',venus:'/textures/venus.jpg',earth:'/textures/earth.jpg',mars:'/textures/mars.jpg',jupiter:'/textures/jupiter.jpg',saturn:'/textures/saturn.jpg',uranus:'/textures/uranus.jpg',neptune:'/textures/neptune.jpg',moon:'/textures/moon.jpg',stars:'/textures/stars.jpg',saturn_ring:'/textures/saturn_ring.png',earth_lights:'/textures/earth_lights.jpg'};
      const keys=Object.keys(F),T={};let n=0,tot=keys.length;
      keys.forEach(k=>L.load(F[k],t=>{T[k]=t;n++;this._lb.style.width=(n/tot*100)+'%';this._ll.textContent=k;if(n>=tot)res(T);},0,()=>{n++;if(n>=tot)res(T);}));
    });
  }

  /* ── Scene ────────────────────────────────────────────────── */
  _buildScene(tex){
    this._buildSkybox(tex);
    this._buildBackgroundStars();
    this._buildLights();
    this._buildSun(tex);
    this._buildSolarParticles();
    PLANETS.forEach((d,i)=>this._buildPlanet(d,i,tex));
    this._buildAsteroidBelt();
    this._buildKuiperBelt();
    this._buildHeliosphere();
    this._buildOortCloud();
    this._buildNearbyStarSystems();
    /* Deferred heavy builds to not block first frame */
    setTimeout(()=>{ try{this._buildStellarNeighborhood();}catch(e){} }, 100);
    setTimeout(()=>{ try{this._buildOrionArm();}catch(e){} }, 400);
    setTimeout(()=>{ try{this._buildGalacticHaze();}catch(e){} }, 800);
    setTimeout(()=>{ try{this._buildGalaxyDisc();}catch(e){} }, 1400);
    setTimeout(()=>{ try{this._buildAndromeda();}catch(e){} }, 1800);
    setTimeout(()=>{ try{this._buildGlobularClusters();}catch(e){} }, 2200);
  }

  /* ── Skybox ──────────────────────────────────────────────── */
  _buildSkybox(tex){
    const geo=new THREE.SphereGeometry(18000,48,24);
    const mat=new THREE.MeshBasicMaterial({side:THREE.BackSide,depthWrite:false});
    if(tex.stars){tex.stars.mapping=THREE.EquirectangularReflectionMapping;tex.stars.colorSpace=THREE.SRGBColorSpace;mat.map=tex.stars;}
    else mat.color=new THREE.Color(0x000008);
    this.scene.add(new THREE.Mesh(geo,mat));
  }

  /* ── Background stars ────────────────────────────────────── */
  _buildBackgroundStars(){
    const N=16000,P=new Float32Array(N*3),C=new Float32Array(N*3);
    const sp=[[0.55,0.65,1],[0.8,0.9,1],[1,1,1],[1,0.97,0.88],[1,0.91,0.68],[1,0.76,0.48],[1,0.58,0.38]];
    for(let i=0;i<N;i++){
      const th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1),r=250+Math.random()*1200;
      P[i*3]=r*Math.sin(ph)*Math.cos(th);P[i*3+1]=r*Math.sin(ph)*Math.sin(th);P[i*3+2]=r*Math.cos(ph);
      const s=sp[Math.floor(Math.pow(Math.random(),2.5)*sp.length)];
      C[i*3]=s[0];C[i*3+1]=s[1];C[i*3+2]=s[2];
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(P,3));
    geo.setAttribute('color',   new THREE.BufferAttribute(C,3));
    this.scene.add(new THREE.Points(geo,new THREE.PointsMaterial({size:0.65,vertexColors:true,transparent:true,opacity:0.9})));
  }

  /* ── Stellar Neighborhood ────────────────────────────────── */
  /* Thousands of stars within ~100 ly, fade 400→1500 */
  _buildStellarNeighborhood(){
    const N=6000,P=new Float32Array(N*3),C=new Float32Array(N*3);
    const sp=[[1,0.55,0.4],[1,0.72,0.48],[1,0.88,0.68],[1,1,0.92],[1,1,1],[0.88,0.93,1],[0.62,0.75,1]];
    for(let i=0;i<N;i++){
      /* Flatten to galactic plane: y is compressed */
      const th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1);
      const r=120+Math.pow(Math.random(),0.55)*2400;
      P[i*3]=r*Math.sin(ph)*Math.cos(th);
      P[i*3+1]=r*Math.sin(ph)*Math.sin(th)*0.28;
      P[i*3+2]=r*Math.cos(ph);
      const s=sp[Math.floor(Math.pow(Math.random(),1.8)*sp.length)];
      const br=0.45+Math.random()*0.55;
      C[i*3]=s[0]*br;C[i*3+1]=s[1]*br;C[i*3+2]=s[2]*br;
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(P,3));
    geo.setAttribute('color',   new THREE.BufferAttribute(C,3));
    const mat=new THREE.PointsMaterial({size:1.4,vertexColors:true,transparent:true,opacity:0,depthWrite:false,sizeAttenuation:true});
    this.scene.add(new THREE.Points(geo,mat));
    this._stellarNeighMat=mat;
  }

  /* ── Orion Arm ───────────────────────────────────────────── */
  /* Dense elongated star cloud; fade 700→4000 */
  _buildOrionArm(){
    const N=14000,P=new Float32Array(N*3),C=new Float32Array(N*3);
    for(let i=0;i<N;i++){
      /* Elongated ellipsoid: 4000 long, 1000 wide, 280 tall */
      const t=(Math.random()-.5)*4200;
      const w=(Math.random()-.5)*1100*Math.exp(-Math.abs(t)/3500);
      const h=(Math.random()-.5)*290;
      /* Slight logarithmic curve to the arm */
      const curve=t*Math.abs(t)/18000;
      P[i*3]=t; P[i*3+1]=h; P[i*3+2]=w+curve;
      /* Bluer outward, yellower inward */
      const d=Math.abs(t)/2100;
      const br=0.25+Math.random()*0.65;
      C[i*3]=(0.65+0.35*(1-Math.min(1,d)))*br;
      C[i*3+1]=(0.68+0.32*(1-Math.min(1,d)*0.5))*br;
      C[i*3+2]=(0.72+0.28*Math.min(1,d))*br;
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(P,3));
    geo.setAttribute('color',   new THREE.BufferAttribute(C,3));
    const mat=new THREE.PointsMaterial({size:3.8,vertexColors:true,transparent:true,opacity:0,depthWrite:false,sizeAttenuation:true});
    const pts=new THREE.Points(geo,mat);
    pts.rotation.y=THREE.MathUtils.degToRad(12);
    this.scene.add(pts);
    this._orionArmMat=mat;

    /* HII emission nebulae along the arm */
    this._orionNebMats=[];
    [[-700,0,280,90,'rgba(255,50,70,0.32)'],[600,20,-320,75,'rgba(255,60,40,0.26)'],
     [1600,-15,200,65,'rgba(200,35,110,0.22)'],[-1400,10,400,60,'rgba(80,110,255,0.2)'],
     [2200,25,-250,55,'rgba(255,90,40,0.18)']].forEach(([x,y,z,r,c])=>{
      const cv=document.createElement('canvas');cv.width=cv.height=128;
      const g=cv.getContext('2d'),gr=g.createRadialGradient(64,64,0,64,64,64);
      gr.addColorStop(0,c);gr.addColorStop(1,'transparent');
      g.fillStyle=gr;g.fillRect(0,0,128,128);
      const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
      spr.position.set(x,y,z);spr.scale.set(r*3,r*3,1);
      this.scene.add(spr);this._orionNebMats.push(spr.material);
    });
  }

  /* ── Galactic Interior Haze ──────────────────────────────── */
  /* Phase 3: Milky Way interior glow seen from WITHIN.        */
  /* Camera 1800-7000 units. Bridges Orion Arm → Galaxy Disc.  */
  _buildGalacticHaze(){
    /* ── 22k star particles: flattened hot cloud (galactic disc interior) */
    const N=22000,P=new Float32Array(N*3),C=new Float32Array(N*3);
    for(let i=0;i<N;i++){
      const th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1);
      const r=900+Math.pow(Math.random(),0.45)*9100;
      /* Very flat — compressed to galactic disc plane */
      P[i*3]=r*Math.sin(ph)*Math.cos(th);
      P[i*3+1]=r*Math.sin(ph)*Math.sin(th)*0.09;
      P[i*3+2]=r*Math.cos(ph);
      /* Warm orange/yellow core, cool blue rim — galactic bulge vs disc arms */
      const d=Math.min(1,r/8000);
      const br=0.16+Math.random()*0.44;
      C[i*3]  =(0.74+0.26*(1-d))*br;
      C[i*3+1]=(0.64+0.16*(1-d))*br;
      C[i*3+2]=(0.48+0.52*d)*br;
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(P,3));
    geo.setAttribute('color',   new THREE.BufferAttribute(C,3));
    const mat=new THREE.PointsMaterial({
      size:8,vertexColors:true,transparent:true,opacity:0,
      depthWrite:false,sizeAttenuation:true,blending:THREE.AdditiveBlending
    });
    this.scene.add(new THREE.Points(geo,mat));
    this._galHazeMat=mat;

    /* ── Galactic equator band: 8k bright stars in a tight ring  */
    /* Like looking along the Milky Way band from a dark-sky site */
    const N2=8000,P2=new Float32Array(N2*3),C2=new Float32Array(N2*3);
    for(let i=0;i<N2;i++){
      const a=Math.random()*Math.PI*2;
      const r=1200+Math.random()*8800;
      /* Very thin disc — y spread is only 4% of radius */
      const h=(Math.random()-.5)*r*0.038;
      P2[i*3]=Math.cos(a)*r; P2[i*3+1]=h; P2[i*3+2]=Math.sin(a)*r;
      const br=0.3+Math.random()*0.58;
      C2[i*3]=br*0.96; C2[i*3+1]=br*0.87; C2[i*3+2]=br*0.68;
    }
    const geo2=new THREE.BufferGeometry();
    geo2.setAttribute('position',new THREE.BufferAttribute(P2,3));
    geo2.setAttribute('color',   new THREE.BufferAttribute(C2,3));
    const mat2=new THREE.PointsMaterial({
      size:11,vertexColors:true,transparent:true,opacity:0,
      depthWrite:false,sizeAttenuation:true,blending:THREE.AdditiveBlending
    });
    this.scene.add(new THREE.Points(geo2,mat2));
    this._galBandMat=mat2;
  }

  /* ── Galaxy Disc ─────────────────────────────────────────── */
  /* Phase 4: 2048px canvas spiral, fades in from 5000 units.  */
  _buildGalaxyDisc(){
    const SZ=2048,CX=SZ/2,CY=SZ/2,HR=SZ*0.476;
    const canvas=document.createElement('canvas');canvas.width=canvas.height=SZ;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#000000';ctx.fillRect(0,0,SZ,SZ);
    const img=ctx.getImageData(0,0,SZ,SZ),d=img.data;

    function px(x,y,r,g,b){
      const xi=Math.round(x),yi=Math.round(y);
      if(xi<0||xi>=SZ||yi<0||yi>=SZ)return;
      const dx=xi-CX,dy=yi-CY;if(dx*dx+dy*dy>HR*HR)return;
      const i=(yi*SZ+xi)*4;
      d[i]=Math.min(255,d[i]+r);d[i+1]=Math.min(255,d[i+1]+g);d[i+2]=Math.min(255,d[i+2]+b);d[i+3]=255;
    }

    /* Spiral arms (4 main arms, log-spiral) */
    for(let i=0;i<120000;i++){
      const arm=i%4,t=Math.pow(Math.random(),0.52);
      const ang=arm*Math.PI/2+t*Math.PI*3.4+(Math.random()-.5)*0.52;
      const rr=(0.04+t*0.46+(Math.random()-.5)*0.055)*HR;
      const sc=HR*0.024*(1-t*0.45);
      const x=CX+Math.cos(ang)*rr+(Math.random()-.5)*sc*2.2;
      const y=CY+Math.sin(ang)*rr+(Math.random()-.5)*sc*2.2;
      const br=Math.floor(35+Math.random()*155*(1-t*0.22));
      px(x,y,Math.floor(br*(t<0.3?1:0.72)),Math.floor(br*(t<0.3?0.88:0.68)),Math.floor(br*(t<0.3?0.52:0.98)));
    }
    /* Disc background */
    for(let i=0;i<28000;i++){
      const r=Math.sqrt(Math.random())*HR*0.95,a=Math.random()*Math.PI*2;
      const br=Math.floor(8+Math.random()*45);
      px(CX+Math.cos(a)*r,CY+Math.sin(a)*r,br,br,Math.floor(br*1.08));
    }
    /* Central bulge */
    for(let i=0;i<28000;i++){
      const r=Math.pow(Math.random(),2.2)*HR*0.11,a=Math.random()*Math.PI*2;
      const br=Math.floor(75+Math.random()*180);
      px(CX+Math.cos(a)*r,CY+Math.sin(a)*r*0.72,br,Math.floor(br*0.86),Math.floor(br*0.5));
    }
    ctx.putImageData(img,0,0);

    /* Galactic core glow */
    const gG=ctx.createRadialGradient(CX,CY,0,CX,CY,SZ*0.13);
    gG.addColorStop(0,'rgba(255,235,145,0.82)');gG.addColorStop(0.22,'rgba(255,185,65,0.5)');
    gG.addColorStop(0.6,'rgba(200,105,22,0.18)');gG.addColorStop(1,'transparent');
    ctx.fillStyle=gG;ctx.fillRect(0,0,SZ,SZ);

    /* HII emission nebulae */
    [[0.62,0.46,0.056,'rgba(255,55,75,0.24)'],[0.73,0.59,0.042,'rgba(255,42,58,0.2)'],
     [0.34,0.57,0.049,'rgba(210,38,115,0.18)'],[0.56,0.75,0.038,'rgba(255,85,40,0.16)'],
     [0.82,0.44,0.035,'rgba(255,70,50,0.15)']].forEach(([fx,fy,fr,c])=>{
      const n=ctx.createRadialGradient(fx*SZ,fy*SZ,0,fx*SZ,fy*SZ,fr*SZ);
      n.addColorStop(0,c);n.addColorStop(1,'transparent');ctx.fillStyle=n;ctx.fillRect(0,0,SZ,SZ);
    });
    /* Reflection nebulae */
    [[0.38,0.54,0.046,'rgba(38,95,255,0.2)'],[0.47,0.27,0.039,'rgba(58,175,255,0.15)'],
     [0.79,0.43,0.041,'rgba(38,78,205,0.14)']].forEach(([fx,fy,fr,c])=>{
      const n=ctx.createRadialGradient(fx*SZ,fy*SZ,0,fx*SZ,fy*SZ,fr*SZ);
      n.addColorStop(0,c);n.addColorStop(1,'transparent');ctx.fillStyle=n;ctx.fillRect(0,0,SZ,SZ);
    });
    /* Galactic bar (Milky Way is a barred spiral) */
    const bG=ctx.createLinearGradient(CX-SZ*0.08,CY,CX+SZ*0.08,CY);
    bG.addColorStop(0,'transparent');bG.addColorStop(0.5,'rgba(255,220,120,0.14)');bG.addColorStop(1,'transparent');
    ctx.fillStyle=bG;ctx.fillRect(CX-SZ*0.08,CY-SZ*0.02,SZ*0.16,SZ*0.04);

    /* Edge vignette */
    const vG=ctx.createRadialGradient(CX,CY,HR*0.7,CX,CY,HR);
    vG.addColorStop(0,'transparent');vG.addColorStop(1,'rgba(0,0,0,1)');
    ctx.fillStyle=vG;ctx.fillRect(0,0,SZ,SZ);

    /* LMC / SMC satellite galaxies */
    [[CX+HR*0.86,CY+HR*0.54,HR*0.065,'rgba(205,192,162,0.3)'],
     [CX+HR*0.70,CY+HR*0.66,HR*0.042,'rgba(185,178,158,0.24)']].forEach(([gx,gy,gr,c])=>{
      const g2=ctx.createRadialGradient(gx,gy,0,gx,gy,gr);
      g2.addColorStop(0,c);g2.addColorStop(1,'transparent');
      ctx.fillStyle=g2;ctx.fillRect(0,0,SZ,SZ);
    });

    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
    const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
    const disc=new THREE.Mesh(new THREE.PlaneGeometry(14000,14000,1,1),mat);
    disc.rotation.x=Math.PI/2;
    disc.rotation.z=THREE.MathUtils.degToRad(25);
    disc.position.set(0,-30,0);
    this.scene.add(disc);
    this._galaxyDisc=disc; this._galaxyDiscMat=mat;

    /* "You are here" blue pulsing marker */
    const ySpr=new THREE.Sprite(new THREE.SpriteMaterial({map:makeGlowTex('#4499FF'),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
    ySpr.scale.set(55,55,1);this.scene.add(ySpr);this._ourPosSpr=ySpr;
  }

  /* ── Andromeda Galaxy ──────────────────────────────────────── */
  /* Nearest major galaxy, 2.5M ly away. Fades in at 8000+ units. */
  _buildAndromeda(){
    const cv=document.createElement('canvas');cv.width=cv.height=256;
    const g=cv.getContext('2d');
    /* Bright nucleus */
    const gr=g.createRadialGradient(128,128,0,128,128,100);
    gr.addColorStop(0,'rgba(230,218,200,1)');gr.addColorStop(0.12,'rgba(210,195,175,0.7)');
    gr.addColorStop(0.4,'rgba(175,162,140,0.3)');gr.addColorStop(0.75,'rgba(120,110,95,0.08)');gr.addColorStop(1,'transparent');
    g.save();g.translate(128,128);g.rotate(0.55);g.scale(1.0,0.28);g.translate(-128,-128);
    g.fillStyle=gr;g.fillRect(0,0,256,256);g.restore();
    /* Outer halo */
    const hr=g.createRadialGradient(128,128,0,128,128,120);
    hr.addColorStop(0,'transparent');hr.addColorStop(0.5,'rgba(150,140,125,0.06)');hr.addColorStop(1,'transparent');
    g.fillStyle=hr;g.fillRect(0,0,256,256);
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({
      map:new THREE.CanvasTexture(cv),transparent:true,opacity:0,
      blending:THREE.AdditiveBlending,depthWrite:false
    }));
    spr.position.set(12000,1800,-8200);
    spr.scale.set(4200,1400,1);
    this.scene.add(spr);
    this._andromedaMat=spr.material;
  }

  /* ── Globular Clusters ────────────────────────────────────── */
  /* 8 bright spherical clusters orbiting the galactic halo.       */
  _buildGlobularClusters(){
    const cv=document.createElement('canvas');cv.width=cv.height=128;
    const g=cv.getContext('2d');
    const gr=g.createRadialGradient(64,64,0,64,64,55);
    gr.addColorStop(0,'rgba(255,248,220,0.95)');gr.addColorStop(0.25,'rgba(240,225,180,0.6)');
    gr.addColorStop(0.6,'rgba(200,185,140,0.18)');gr.addColorStop(1,'transparent');
    g.fillStyle=gr;g.fillRect(0,0,128,128);
    const tex=new THREE.CanvasTexture(cv);
    this._globularMats=[];
    const positions=[
      [5200,3800,-2200],[-4800,4200,3100],[3100,-3600,5500],[-5600,3200,-1800],
      [6200,-2800,2400],[-2200,5100,-4800],[4400,2100,-5800],[-3800,-4400,3600]
    ];
    positions.forEach(([x,y,z])=>{
      const spr=new THREE.Sprite(new THREE.SpriteMaterial({
        map:tex,transparent:true,opacity:0,
        blending:THREE.AdditiveBlending,depthWrite:false
      }));
      spr.position.set(x,y,z);
      const s=280+Math.random()*180;
      spr.scale.set(s,s,1);
      this.scene.add(spr);
      this._globularMats.push(spr.material);
    });
  }

  /* ── Lights ──────────────────────────────────────────────── */
  _buildLights(){
    this.scene.add(new THREE.AmbientLight(0x303348,3.5));
    const sl=new THREE.PointLight(0xFFF5CC,4.0,0,0);sl.position.set(0,0,0);this.scene.add(sl);
  }

  /* ── Sun ─────────────────────────────────────────────────── */
  _buildSun(tex){
    const mat=new THREE.MeshBasicMaterial({map:tex.sun||null,color:tex.sun?0xffffff:0xFFB820});
    this.sunMesh=new THREE.Mesh(new THREE.SphereGeometry(3.5,48,48),mat);this.scene.add(this.sunMesh);
    this._coronas=[];
    [{r:4.8,op:0.16,c:0xFFCC44},{r:7,op:0.09,c:0xFFAA22},{r:11,op:0.045,c:0xFF8800},{r:18,op:0.018,c:0xFF6600}].forEach(({r,op,c})=>{
      const m=new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:op,depthWrite:false});
      const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,24,24),m);
      this.scene.add(mesh);this._coronas.push({mesh,base:op});
    });
    this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(4.2,24,24),makeAtmoMat('#FFCC44',0.7,3.5)));
    const fc=document.createElement('canvas');fc.width=fc.height=256;
    const fg=fc.getContext('2d'),fgr=fg.createRadialGradient(128,128,0,128,128,128);
    fgr.addColorStop(0,'rgba(255,255,230,1)');fgr.addColorStop(0.06,'rgba(255,240,160,0.88)');
    fgr.addColorStop(0.2,'rgba(255,180,40,0.22)');fgr.addColorStop(0.5,'rgba(255,100,0,0.05)');fgr.addColorStop(1,'transparent');
    fg.fillStyle=fgr;fg.fillRect(0,0,256,256);
    this.flareSpr=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(fc),transparent:true,opacity:0.75,blending:THREE.AdditiveBlending,depthWrite:false}));
    this.flareSpr.scale.set(28,28,1);this.scene.add(this.flareSpr);

    /* Animated corona ray spikes */
    this._sunRays=[];
    for(let i=0;i<18;i++){
      const baseAng=i/18*Math.PI*2;
      const baseLen=8+Math.random()*18;
      const cv=document.createElement('canvas');cv.width=4;cv.height=128;
      const rg=cv.getContext('2d'),gr=rg.createLinearGradient(0,0,0,128);
      gr.addColorStop(0,'rgba(255,230,120,0)');gr.addColorStop(0.08,'rgba(255,220,100,0.55)');
      gr.addColorStop(0.5,'rgba(255,190,60,0.18)');gr.addColorStop(1,'rgba(255,120,0,0)');
      rg.fillStyle=gr;rg.fillRect(0,0,4,128);
      const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),transparent:true,opacity:0.0,blending:THREE.AdditiveBlending,depthWrite:false,rotation:baseAng}));
      const r=4.5+baseLen*0.5,hl=baseLen*0.5;
      spr.position.set(Math.cos(baseAng)*r,Math.sin(baseAng)*r,0);
      spr.scale.set(1.2,baseLen*1.4,1);
      this.scene.add(spr);
      this._sunRays.push({spr,mat:spr.material,baseAng,baseLen,phase:Math.random()*Math.PI*2,speed:0.4+Math.random()*0.8});
    }
  }

  /* ── Solar particles ─────────────────────────────────────── */
  _buildSolarParticles(){
    const N=1000,P=new Float32Array(N*3),vel=[];
    for(let i=0;i<N;i++){
      const th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1),r=3.5+Math.random()*4;
      const vx=Math.sin(ph)*Math.cos(th),vy=Math.sin(ph)*Math.sin(th),vz=Math.cos(ph);
      P[i*3]=vx*r;P[i*3+1]=vy*r;P[i*3+2]=vz*r;
      vel.push(new THREE.Vector3(vx,vy,vz).multiplyScalar(0.06+Math.random()*0.1));
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));
    const mat=new THREE.PointsMaterial({color:0xFF9900,size:0.22,transparent:true,opacity:0.55,blending:THREE.AdditiveBlending,depthWrite:false});
    this._solarGeo=geo;this._solarPos=P;this._solarVel=vel;this._solarN=N;
    this.scene.add(new THREE.Points(geo,mat));
  }

  /* ── Planet ──────────────────────────────────────────────── */
  _buildPlanet(data,idx,tex){
    const pts=[];for(let i=0;i<=130;i++)pts.push(new THREE.Vector3(Math.cos(i/130*Math.PI*2)*data.orbitR,0,Math.sin(i/130*Math.PI*2)*data.orbitR));
    this.scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.05})));
    const pT=tex[data.id];if(pT)pT.colorSpace=THREE.SRGBColorSpace;
    const mat=new THREE.MeshBasicMaterial({map:pT||null,color:pT?0xffffff:0x888888});
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(data.radius,52,52),mat);
    if(data.atmoColor)mesh.add(new THREE.Mesh(new THREE.SphereGeometry(data.radius*(data.id==='venus'?1.15:1.12),32,32),makeAtmoMat(data.atmoColor,data.aC||0.55,data.aP||4.0)));
    if(data.id==='earth'&&tex.earth_lights){
      tex.earth_lights.colorSpace=THREE.SRGBColorSpace;
      mesh.add(new THREE.Mesh(new THREE.SphereGeometry(data.radius*1.001,52,52),new THREE.MeshBasicMaterial({map:tex.earth_lights,transparent:true,opacity:0.55,blending:THREE.AdditiveBlending,depthWrite:false})));
    }
    if(data.rings){
      const rT=tex.saturn_ring;
      [{i:data.radius*1.42,o:data.radius*2.08,op:0.78},{i:data.radius*2.12,o:data.radius*2.58,op:0.5},{i:data.radius*2.62,o:data.radius*3.08,op:0.25}].forEach((r,ri)=>{
        const rm=new THREE.MeshBasicMaterial({map:ri===0?rT:null,color:ri===0&&rT?0xffffff:0xE4D5A0,transparent:true,opacity:r.op,side:THREE.DoubleSide,depthWrite:false});
        const rmesh=new THREE.Mesh(new THREE.RingGeometry(r.i,r.o,90),rm);rmesh.rotation.x=Math.PI*0.44;mesh.add(rmesh);
      });
    }
    if(data.thinRings){const rm=new THREE.Mesh(new THREE.RingGeometry(data.radius*1.5,data.radius*1.9,60),new THREE.MeshBasicMaterial({color:0x88dddd,transparent:true,opacity:0.22,side:THREE.DoubleSide,depthWrite:false}));rm.rotation.x=Math.PI*0.08;mesh.add(rm);}
    const gspr=new THREE.Sprite(new THREE.SpriteMaterial({map:makeGlowTex(GLOW[idx]),transparent:true,opacity:0.45,blending:THREE.AdditiveBlending,depthWrite:false}));
    gspr.scale.set(data.radius*5.5,data.radius*5.5,1);mesh.add(gspr);
    mesh.rotation.z=THREE.MathUtils.degToRad(data.tilt);
    const pivot=new THREE.Object3D();pivot.add(mesh);mesh.position.x=data.orbitR;this.scene.add(pivot);
    let moon=null;
    if(data.hasMoon){
      const mT=tex.moon;if(mT)mT.colorSpace=THREE.SRGBColorSpace;
      const mM=new THREE.Mesh(new THREE.SphereGeometry(0.27,24,24),new THREE.MeshBasicMaterial({map:mT||null,color:mT?0xffffff:0x888880}));
      const mP=new THREE.Object3D();mM.position.x=1.85;mP.add(mM);mesh.add(mP);moon={mesh:mM,pivot:mP};
    }
    this.objects.push({data,pivot,mesh,gspr,moon});
  }

  /* ── Asteroid Belt ───────────────────────────────────────── */
  _buildAsteroidBelt(){
    const N=2500,P=new Float32Array(N*3),C=new Float32Array(N*3);
    for(let i=0;i<N;i++){const a=Math.random()*Math.PI*2,r=27.2+Math.random()*4,y=(Math.random()-.5)*0.8;P[i*3]=Math.cos(a)*r;P[i*3+1]=y;P[i*3+2]=Math.sin(a)*r;const b=0.38+Math.random()*0.25;C[i*3]=b;C[i*3+1]=b*0.9;C[i*3+2]=b*0.78;}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('color',new THREE.BufferAttribute(C,3));
    this.scene.add(new THREE.Points(geo,new THREE.PointsMaterial({size:0.14,vertexColors:true,transparent:true,opacity:0.62})));
  }

  /* ── Kuiper Belt ─────────────────────────────────────────── */
  _buildKuiperBelt(){
    const N=4000,P=new Float32Array(N*3),C=new Float32Array(N*3);
    for(let i=0;i<N;i++){const a=Math.random()*Math.PI*2,r=74+Math.random()*22,y=(Math.random()-.5)*3.5;P[i*3]=Math.cos(a)*r;P[i*3+1]=y;P[i*3+2]=Math.sin(a)*r;const b=0.28+Math.random()*0.18;C[i*3]=b*0.75;C[i*3+1]=b*0.82;C[i*3+2]=b;}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('color',new THREE.BufferAttribute(C,3));
    this.scene.add(new THREE.Points(geo,new THREE.PointsMaterial({size:0.22,vertexColors:true,transparent:true,opacity:0.45})));
  }

  /* ── Heliosphere ─────────────────────────────────────────── */
  _buildHeliosphere(){
    this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(105,48,24),new THREE.MeshBasicMaterial({color:0x2255AA,transparent:true,opacity:0.018,side:THREE.BackSide,depthWrite:false})));
    this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(118,48,24),makeAtmoMat('#44AACC',0.12,5.5)));
  }

  /* ── Oort Cloud ──────────────────────────────────────────── */
  _buildOortCloud(){
    const N=12000,P=new Float32Array(N*3);
    for(let i=0;i<N;i++){const th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1),r=155+Math.pow(Math.random(),0.6)*340;P[i*3]=r*Math.sin(ph)*Math.cos(th);P[i*3+1]=r*Math.sin(ph)*Math.sin(th);P[i*3+2]=r*Math.cos(ph);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));
    this.scene.add(new THREE.Points(geo,new THREE.PointsMaterial({color:0x8899CC,size:0.35,transparent:true,opacity:0.22,depthWrite:false})));
  }

  /* ── Nearby Star Systems ─────────────────────────────────── */
  _buildNearbyStarSystems(){
    this._starLabels=[];
    NEARBY_STARS.forEach(star=>{
      const mesh=new THREE.Mesh(new THREE.SphereGeometry(star.r,16,16),new THREE.MeshBasicMaterial({color:star.color}));
      mesh.position.copy(star.pos);this.scene.add(mesh);
      const glowSpr=new THREE.Sprite(new THREE.SpriteMaterial({map:makeGlowTex('#'+star.color.toString(16).padStart(6,'0')),transparent:true,opacity:0.8,blending:THREE.AdditiveBlending,depthWrite:false}));
      glowSpr.scale.set(star.r*22,star.r*22,1);mesh.add(glowSpr);
      const el=document.createElement('div');
      Object.assign(el.style,{position:'fixed',pointerEvents:'none',transform:'translate(-50%,-100%)',color:'rgba(180,220,255,0)',fontFamily:'"Space Grotesk",sans-serif',fontSize:'10px',fontWeight:'500',letterSpacing:'0.08em',textShadow:'0 1px 8px rgba(0,0,0,0.9)',display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',transition:'color 0.5s',zIndex:'602'});
      el.innerHTML=`<span style="font-size:9px;color:rgba(77,159,255,0.6);letter-spacing:0.2em">${star.ly}</span><span>${star.name}</span>`;
      this.container.appendChild(el);this._starLabels.push({mesh,el,star});
    });
  }

  /* ═══════════════════════════════════════════════════════════
     UI
  ═══════════════════════════════════════════════════════════ */
  _buildUI(){
    this._buildLabelOverlay();
    this._buildTopBar();
    this._buildInfoPanel();
    this._buildTimeBar();
    this._buildNarrativeCaption();
    this._buildDistanceCounter();
    this._buildScaleIndicator();
    this._buildSurfaceHUD();
    this._buildHint();
    this._buildSkipButton();
    this._raycaster=new THREE.Raycaster();
    this._mouse=new THREE.Vector2();
    /* Cinematic vignette */
    const vig=document.createElement('div');
    Object.assign(vig.style,{position:'fixed',inset:'0',zIndex:'598',background:'radial-gradient(ellipse at 50% 50%, transparent 48%, rgba(0,0,5,0.55) 100%)',pointerEvents:'none'});
    this.container.appendChild(vig);
  }

  /* ── Top bar ─────────────────────────────────────────────── */
  _buildTopBar(){
    const bar=document.createElement('div');
    Object.assign(bar.style,{position:'fixed',top:'1.4rem',left:'50%',transform:'translateX(-50%)',zIndex:'720',display:'flex',alignItems:'center',background:'rgba(4,5,18,0.88)',backdropFilter:'blur(28px)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'3px',opacity:'0',transition:'opacity 1s',overflow:'hidden'});
    const inp=document.createElement('input');inp.placeholder='Search planet, star…';
    Object.assign(inp.style,{background:'none',border:'none',outline:'none',padding:'0.5rem 1rem',color:'rgba(255,255,255,0.8)',fontFamily:'"JetBrains Mono",monospace',fontSize:'11px',letterSpacing:'0.1em',width:'185px'});
    inp.addEventListener('keydown',e=>{if(e.key==='Enter')this._handleSearch(inp.value);});
    const mkB=(h,ti,fn)=>{const b=document.createElement('button');b.innerHTML=h;b.title=ti;Object.assign(b.style,{background:'none',border:'none',borderLeft:'1px solid rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.45)',padding:'0.5rem 0.75rem',fontSize:'14px',cursor:'pointer',transition:'all 0.16s',lineHeight:'1'});b.onmouseenter=()=>{b.style.color='#fff';b.style.background='rgba(255,255,255,0.06)';};b.onmouseleave=()=>{b.style.color='rgba(255,255,255,0.45)';b.style.background='none';};b.addEventListener('click',fn);return b;};
    const vBtn=mkB('🎤','Voice',()=>this._startVoice(vBtn));
    [inp,mkB('⌕','Search',()=>this._handleSearch(inp.value)),vBtn,mkB('📷','Screenshot',()=>this._takeScreenshot())].forEach(el=>bar.appendChild(el));
    this.container.appendChild(bar);this._topBar=bar;
    setTimeout(()=>{bar.style.opacity='1';},2200);
  }

  _handleSearch(q){
    q=(q||'').toLowerCase().trim();if(!q)return;
    const p=this.objects.find(o=>PLANET_INFO[o.data.id]?.name.toLowerCase().includes(q)||o.data.id.includes(q));
    if(p){this._focusPlanet(p);this._openPanel(p.data.id);return;}
    const s=NEARBY_STARS.find(st=>st.name.toLowerCase().includes(q));
    if(s){this._travelPos=s.pos.clone().add(new THREE.Vector3(18,8,18));this._travelTarget=s.pos.clone();this._travelT=0;return;}
    if(q.includes('milky')||q.includes('galaxy')||q.includes('orion arm')){
      this._targetR=9000;
    }
  }
  _startVoice(btn){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){alert('Voice nav requires Chrome.');return;}
    const rec=new SR();rec.lang='en-US';rec.interimResults=false;
    btn.innerHTML='🔴';rec.start();
    rec.onresult=e=>{btn.innerHTML='🎤';this._handleSearch(e.results[0][0].transcript);};
    rec.onerror=()=>{btn.innerHTML='🎤';};rec.onend=()=>{btn.innerHTML='🎤';};
  }
  _takeScreenshot(){
    this.composer.render();
    const a=document.createElement('a');a.href=this.renderer.domElement.toDataURL('image/png');a.download='cosmos-'+Date.now()+'.png';a.click();
  }

  /* ── Narrative captions ───────────────────────────────────── */
  _buildNarrativeCaption(){
    const el=document.createElement('div');
    Object.assign(el.style,{
      position:'fixed',left:'50%',bottom:'8.5rem',transform:'translateX(-50%)',
      zIndex:'708',textAlign:'center',pointerEvents:'none',opacity:'0',
      transition:'opacity 1.1s ease',fontFamily:'"Space Grotesk",sans-serif',
    });
    el.innerHTML=`
      <div id="nar-t" style="font-size:clamp(1rem,2.5vw,1.65rem);font-weight:700;letter-spacing:0.04em;text-shadow:0 0 50px currentColor;line-height:1.1"></div>
      <div id="nar-s" style="font-size:9.5px;letter-spacing:0.28em;opacity:0.5;margin-top:0.4rem;font-family:'JetBrains Mono',monospace"></div>`;
    this.container.appendChild(el);
    this._narEl=el;this._narT=el.querySelector('#nar-t');this._narS=el.querySelector('#nar-s');
    this._narZoneId=null;
  }

  _updateNarrative(){
    if(!this._narEl||!this._introDone)return;
    const r=this._camR;
    const zone=ZONES.find(z=>r>=z.minR&&r<z.maxR)||null;
    if(!zone){this._narEl.style.opacity='0';return;}
    if(zone.id===this._narZoneId)return;
    this._narZoneId=zone.id;
    /* Fade out → update → fade in */
    this._narEl.style.opacity='0';
    clearTimeout(this._narTimeout);
    this._narTimeout=setTimeout(()=>{
      this._narT.textContent=zone.title;
      this._narT.style.color=zone.color;
      this._narS.textContent=zone.sub;
      this._narEl.style.opacity='1';
    },600);
  }

  /* ── Distance counter ────────────────────────────────────── */
  _buildDistanceCounter(){
    const el=document.createElement('div');
    Object.assign(el.style,{position:'fixed',top:'4.2rem',left:'50%',transform:'translateX(-50%)',zIndex:'706',
      fontFamily:'"JetBrains Mono",monospace',fontSize:'9.5px',letterSpacing:'0.22em',
      color:'rgba(255,255,255,0.25)',pointerEvents:'none',textAlign:'center',opacity:'0',transition:'opacity 1s'});
    el.innerHTML=`<span id="dv">—</span>`;
    this.container.appendChild(el);this._distEl=el;this._distVal=el.querySelector('#dv');
    setTimeout(()=>{el.style.opacity='1';},4000);
  }

  _updateDistanceCounter(){
    if(!this._distVal||!this._introDone)return;
    const r=this._camR;
    let txt;
    if(r<80)       txt=`DIST FROM SUN  ${(r*1.496).toFixed(1)} × 10⁸ km`;
    else if(r<800) txt=`DIST FROM SUN  ${r.toFixed(0)} AU`;
    else if(r<5000)txt=`DIST FROM SUN  ${(r/63.24).toFixed(2)} LY`;
    else if(r<20000)txt=`FROM GALACTIC PLANE  ${(r/634).toFixed(1)} KLY`;
    else           txt=`GALACTIC SCALE  ${(r/6340).toFixed(2)} KLY`;
    this._distVal.textContent=txt;
  }

  /* ── Scale indicator bar ─────────────────────────────────── */
  _buildScaleIndicator(){
    const el=document.createElement('div');
    Object.assign(el.style,{position:'fixed',bottom:'5rem',left:'50%',transform:'translateX(-50%)',zIndex:'703',display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',opacity:'0',transition:'opacity 0.8s',pointerEvents:'none'});
    el.innerHTML=`<div id="sz-lbl" style="font-size:8.5px;letter-spacing:0.32em;color:rgba(77,159,255,0.55);font-family:'JetBrains Mono',monospace"></div><div style="display:flex;align-items:center;gap:5px"><div style="width:5px;height:5px;border-radius:50%;background:rgba(77,159,255,0.5)"></div><div style="width:120px;height:1px;background:rgba(255,255,255,0.06);position:relative;overflow:hidden"><div id="sz-fill" style="height:100%;background:rgba(77,159,255,0.45);width:0%;transition:width 0.35s ease"></div></div><div style="width:5px;height:5px;border-radius:50%;border:1px solid rgba(255,255,255,0.15)"></div></div>`;
    this.container.appendChild(el);this._scaleEl=el;
    this._szLbl=el.querySelector('#sz-lbl');this._szFill=el.querySelector('#sz-fill');
    setTimeout(()=>{el.style.opacity='1';},3500);
  }

  _updateScaleIndicator(){
    if(!this._szLbl)return;
    const r=this._camR;
    const zone=ZONES.find(z=>r>=z.minR&&z.maxR>r)||ZONES[ZONES.length-1];
    this._szLbl.textContent=zone.id.replace(/_/g,' ').toUpperCase();
    this._szFill.style.width=(Math.min(100,r/150)+'%');
  }

  /* ── Planet labels ───────────────────────────────────────── */
  _buildLabelOverlay(){
    this._labelDiv=document.createElement('div');
    Object.assign(this._labelDiv.style,{position:'fixed',inset:'0',zIndex:'601',pointerEvents:'none'});
    this.container.appendChild(this._labelDiv);
    this._labelEls=this.objects.map(({data})=>{
      const el=document.createElement('div');
      Object.assign(el.style,{position:'absolute',transform:'translate(-50%,0)',pointerEvents:'none',color:'rgba(255,255,255,0.68)',fontFamily:'"Space Grotesk",sans-serif',fontSize:'11px',fontWeight:'500',letterSpacing:'0.08em',textShadow:'0 1px 8px rgba(0,0,0,0.95)',opacity:'0',transition:'opacity 0.5s',display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'});
      el.innerHTML=`<div style="width:1px;height:7px;background:rgba(255,255,255,0.16)"></div><span>${PLANET_INFO[data.id]?.name||data.id}</span>`;
      this._labelDiv.appendChild(el);return el;
    });
  }
  _updateLabels(){
    if(!this._introDone||!this._labelEls)return;
    const W=window.innerWidth,H=window.innerHeight,r=this._camR;
    this.objects.forEach(({mesh,data},i)=>{
      if(r>600){this._labelEls[i].style.opacity='0';return;}
      const wp=new THREE.Vector3();mesh.getWorldPosition(wp);
      const proj=wp.clone().project(this.camera);
      if(proj.z>1){this._labelEls[i].style.opacity='0';return;}
      const sx=(proj.x*.5+.5)*W,sy=(-proj.y*.5+.5)*H;
      const dist=wp.distanceTo(this.camera.position);
      const alpha=Math.min(1,Math.max(0,(220-dist)/140));
      const pr=data.radius*280/dist;
      this._labelEls[i].style.left=sx+'px';this._labelEls[i].style.top=(sy+pr+14)+'px';
      this._labelEls[i].style.opacity=String(alpha);
    });
    /* Nearby star labels */
    if(this._starLabels){
      this._starLabels.forEach(({el,mesh})=>{
        const wp=new THREE.Vector3();mesh.getWorldPosition(wp);
        const proj=wp.clone().project(this.camera);
        if(proj.z>1){el.style.color='rgba(180,220,255,0)';return;}
        const alpha=r>600?Math.min(0.9,(r-600)/400)*Math.max(0,1-(r-2200)/600):0;
        el.style.left=((proj.x*.5+.5)*W)+'px';el.style.top=((-proj.y*.5+.5)*H)+'px';
        el.style.color=`rgba(180,220,255,${alpha})`;
      });
    }
  }

  /* ── Info Panel ──────────────────────────────────────────── */
  _buildInfoPanel(){
    const panel=document.createElement('div');
    Object.assign(panel.style,{position:'fixed',top:'0',right:'0',bottom:'0',width:'300px',zIndex:'710',background:'rgba(4,5,18,0.94)',backdropFilter:'blur(32px)',borderLeft:'1px solid rgba(255,255,255,0.06)',transform:'translateX(100%)',transition:'transform 0.42s cubic-bezier(0.16,1,0.3,1)',display:'flex',flexDirection:'column',overflowY:'auto',fontFamily:'"Space Grotesk",sans-serif',color:'rgba(255,255,255,0.85)'});
    panel.innerHTML=`<button id="ssp-close" style="position:absolute;top:1rem;right:1rem;background:none;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.38);width:26px;height:26px;border-radius:2px;cursor:pointer;font-size:16px;line-height:1">&times;</button><div style="padding:1.5rem 1.5rem 1rem"><div id="ssp-ey" style="font-size:8.5px;letter-spacing:0.38em;color:rgba(77,159,255,0.65);margin-bottom:0.5rem"></div><div id="ssp-nm" style="font-size:2rem;font-weight:700;line-height:1"></div><div id="ssp-ty" style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:0.3rem"></div></div><div id="ssp-st" style="padding:0 1.5rem 1rem;display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;border-bottom:1px solid rgba(255,255,255,0.05)"></div><div id="ssp-de" style="padding:1rem 1.5rem;font-size:12px;line-height:1.7;color:rgba(255,255,255,0.45)"></div><div style="padding:0 1.5rem 1.5rem"><button id="ssp-fly" style="width:100%;padding:0.55rem;background:rgba(77,159,255,0.12);border:1px solid rgba(77,159,255,0.25);color:rgba(77,159,255,0.8);font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.18em;cursor:pointer;border-radius:2px;transition:all 0.2s">FLY CLOSER →</button></div>`;
    this.container.appendChild(panel);this._infoPanel=panel;
    panel.querySelector('#ssp-close').addEventListener('click',()=>this._closePanel());
    panel.querySelector('#ssp-fly').addEventListener('click',()=>{if(this._selectedId){const o=this.objects.find(x=>x.data.id===this._selectedId);if(o)this._flyCloser(o);}});
  }
  _openPanel(id){
    const info=PLANET_INFO[id];if(!info)return;
    this._infoPanel.querySelector('#ssp-ey').textContent='Planet · Solar System';
    this._infoPanel.querySelector('#ssp-nm').textContent=info.name;
    this._infoPanel.querySelector('#ssp-ty').textContent=info.type;
    this._infoPanel.querySelector('#ssp-de').textContent=info.desc;
    this._infoPanel.querySelector('#ssp-st').innerHTML=[['Radius',info.radius],['Dist. Sun',info.distSun],['Orbit',info.orbPeriod],['Day',info.rotPeriod],['Temp.',info.temp],['Moons',info.moons]].map(([k,v])=>`<div><div style="font-size:8px;letter-spacing:0.18em;color:rgba(255,255,255,0.28);text-transform:uppercase;margin-bottom:3px">${k}</div><div style="font-size:13px;font-weight:600">${v}</div></div>`).join('');
    this._infoPanel.style.transform='translateX(0)';this._selectedId=id;
  }
  _closePanel(){this._infoPanel.style.transform='translateX(100%)';this._selectedId=null;this._orbitCenterTarget.set(0,0,0);}

  /* ── Time bar ────────────────────────────────────────────── */
  _buildTimeBar(){
    const bar=document.createElement('div');
    Object.assign(bar.style,{position:'fixed',bottom:'2.3rem',left:'50%',transform:'translateX(-50%)',zIndex:'702',background:'rgba(4,5,18,0.88)',backdropFilter:'blur(24px)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'3px',display:'flex',alignItems:'center',overflow:'hidden',opacity:'0',transition:'opacity 1s'});
    const mkB=(h,ti,fn)=>{const b=document.createElement('button');b.innerHTML=h;b.title=ti;Object.assign(b.style,{background:'none',border:'none',borderRight:'1px solid rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.45)',padding:'0.44rem 0.72rem',fontSize:'12px',cursor:'pointer',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.04em',transition:'all 0.16s',lineHeight:'1'});b.onmouseenter=()=>{b.style.color='#fff';b.style.background='rgba(255,255,255,0.05)';};b.onmouseleave=()=>{b.style.color='rgba(255,255,255,0.45)';b.style.background='none';};b.addEventListener('click',fn);return b;};
    this._playBtn=mkB('⏸','Pause',()=>{this.paused=!this.paused;this._playBtn.innerHTML=this.paused?'▶':'⏸';});
    this._tourBtn=mkB('⟳ Tour','Auto-tour',()=>{this._touring=!this._touring;this._tourBtn.style.color=this._touring?'rgba(77,159,255,0.85)':'rgba(255,255,255,0.45)';if(this._touring){this._tourIdx=0;this._tourTimer=0;}});
    [this._playBtn,mkB('1×','Normal',()=>this.timeScale=1),mkB('10×','10x',()=>this.timeScale=10),mkB('50×','50x',()=>this.timeScale=50),mkB('200×','200x',()=>this.timeScale=200),this._tourBtn].forEach(b=>bar.appendChild(b));
    this.container.appendChild(bar);this._timeBar=bar;setTimeout(()=>{bar.style.opacity='1';},3500);
  }

  /* ── Surface HUD ─────────────────────────────────────────── */
  _buildSurfaceHUD(){
    const el=document.createElement('div');
    Object.assign(el.style,{position:'fixed',top:'50%',left:'1.5rem',transform:'translateY(-50%)',zIndex:'705',display:'flex',flexDirection:'column',gap:'0.5rem',opacity:'0',transition:'opacity 0.6s',pointerEvents:'none'});
    el.innerHTML=`<div style="font-size:9px;letter-spacing:0.3em;color:rgba(77,159,255,0.6);font-family:'JetBrains Mono',monospace">APPROACHING</div><div id="ssh-name" style="font-size:1.2rem;font-weight:700;color:rgba(255,255,255,0.9);font-family:'Space Grotesk',sans-serif"></div><div id="ssh-alt" style="font-size:10px;color:rgba(255,255,255,0.35);font-family:'JetBrains Mono',monospace"></div>`;
    this.container.appendChild(el);this._surfaceHUD=el;
  }
  _updateSurfaceHUD(){
    if(!this._surfaceHUD||!this._introDone||this._camR>200)return;
    let closest=null,minDist=Infinity;
    this.objects.forEach(o=>{const wp=new THREE.Vector3();o.mesh.getWorldPosition(wp);const d=wp.distanceTo(this.camera.position)-o.data.radius;if(d<minDist){minDist=d;closest=o;}});
    if(closest&&minDist<closest.data.radius*6){
      this._surfaceHUD.style.opacity='1';
      this._surfaceHUD.querySelector('#ssh-name').textContent=PLANET_INFO[closest.data.id]?.name||closest.data.id;
      this._surfaceHUD.querySelector('#ssh-alt').textContent=`ALT ${Math.max(0,minDist).toFixed(2)} AU`;
    } else this._surfaceHUD.style.opacity='0';
  }

  /* ── Hint ────────────────────────────────────────────────── */
  _buildHint(){
    const el=document.createElement('div');
    Object.assign(el.style,{position:'fixed',bottom:'0.6rem',left:'50%',transform:'translateX(-50%)',zIndex:'701',color:'rgba(255,255,255,0.16)',fontFamily:'"JetBrains Mono",monospace',fontSize:'8.5px',letterSpacing:'0.28em',pointerEvents:'none',opacity:'0',transition:'opacity 0.8s'});
    el.textContent='DRAG TO ORBIT · SCROLL TO JOURNEY FROM EARTH TO THE MILKY WAY · CLICK PLANET';
    this.container.appendChild(el);
    setTimeout(()=>{el.style.opacity='1';},4000);setTimeout(()=>{el.style.opacity='0';},14000);
  }

  /* ── Skip button ─────────────────────────────────────────── */
  _buildSkipButton(){
    const btn=document.createElement('button');btn.innerHTML='SKIP &nbsp;→';
    Object.assign(btn.style,{position:'fixed',top:'1.4rem',right:'1.8rem',zIndex:'730',padding:'0.46rem 1rem',background:'rgba(3,4,14,0.9)',border:'1px solid rgba(255,255,255,0.09)',color:'rgba(255,255,255,0.42)',fontFamily:'"JetBrains Mono",monospace',fontSize:'10px',letterSpacing:'0.22em',cursor:'pointer',borderRadius:'2px',backdropFilter:'blur(24px)',transition:'all 0.2s',opacity:'0'});
    btn.onmouseenter=()=>{btn.style.color='#fff';btn.style.borderColor='rgba(255,255,255,0.3)';};
    btn.onmouseleave=()=>{btn.style.color='rgba(255,255,255,0.42)';btn.style.borderColor='rgba(255,255,255,0.09)';};
    btn.addEventListener('click',()=>this.skip());
    this.container.appendChild(btn);this._skipBtn=btn;setTimeout(()=>{btn.style.opacity='1';},1800);
  }

  /* ── Events ──────────────────────────────────────────────── */
  _attachEvents(){
    window.addEventListener('resize',()=>this._onResize());
    const el=this.renderer.domElement;
    el.addEventListener('mousedown',e=>{this._drag=true;this._lastMX=e.clientX;this._lastMY=e.clientY;this._clickStart={x:e.clientX,y:e.clientY};});
    el.addEventListener('mousemove',e=>this._onMMove(e));
    el.addEventListener('mouseup',  e=>{this._onMUp(e);this._drag=false;});
    el.addEventListener('mouseleave',()=>this._drag=false);
    el.addEventListener('wheel',    e=>this._onWheel(e),{passive:true});
    el.addEventListener('touchstart',e=>{this._drag=true;this._lastMX=e.touches[0].clientX;this._lastMY=e.touches[0].clientY;},{passive:true});
    el.addEventListener('touchmove', e=>{if(!this._drag)return;const dx=e.touches[0].clientX-this._lastMX,dy=e.touches[0].clientY-this._lastMY;this._lastMX=e.touches[0].clientX;this._lastMY=e.touches[0].clientY;this._camTheta-=dx*0.006;this._camPhi=Math.max(0.1,Math.min(1.45,this._camPhi+dy*0.006));},{passive:true});
    el.addEventListener('touchend',()=>this._drag=false);
  }
  _onResize(){const W=window.innerWidth,H=window.innerHeight;this.renderer.setSize(W,H);this.composer.setSize(W,H);this.camera.aspect=W/H;this.camera.updateProjectionMatrix();}
  _onMMove(e){if(!this._drag||!this._introDone)return;const dx=e.clientX-this._lastMX,dy=e.clientY-this._lastMY;this._lastMX=e.clientX;this._lastMY=e.clientY;this._velTheta=dx*0.005;this._velPhi=dy*0.005;this._camTheta-=this._velTheta;this._camPhi=Math.max(0.1,Math.min(1.45,this._camPhi-this._velPhi));this._travelPos=null;}
  _onMUp(e){const dx=Math.abs(e.clientX-this._clickStart.x),dy=Math.abs(e.clientY-this._clickStart.y);if(dx<5&&dy<5)this._handleClick(e);}
  _onWheel(e){
    if(!this._introDone)return;
    /* Proportional zoom — feels natural at ALL scales (planet surface → galaxy) */
    /* Math.pow(1.0012, 100) ≈ 1.127 → ~13% zoom per mouse-wheel notch */
    const delta=Math.sign(e.deltaY)*Math.min(Math.abs(e.deltaY),250);
    const factor=Math.pow(1.0012,delta);
    this._targetR=Math.max(0.8,Math.min(18000,this._targetR*factor));
    this._travelPos=null;
  }
  _handleClick(e){
    if(!this._introDone)return;
    this._mouse.x=(e.clientX/window.innerWidth)*2-1;this._mouse.y=-(e.clientY/window.innerHeight)*2+1;
    this._raycaster.setFromCamera(this._mouse,this.camera);
    const hits=this._raycaster.intersectObjects(this.objects.map(o=>o.mesh),true);
    if(hits.length>0){const h=hits[0].object;const obj=this.objects.find(o=>o.mesh===h||h.parent===o.mesh||h.parent?.parent===o.mesh);if(obj){this._focusPlanet(obj);this._openPanel(obj.data.id);return;}}
    this._closePanel();
  }

  /* ── Camera ──────────────────────────────────────────────── */
  _updateCamImmediate(){
    const r=this._camR,oc=this._orbitCenter;
    this.camera.position.set(oc.x+r*Math.sin(this._camPhi)*Math.sin(this._camTheta),oc.y+r*Math.cos(this._camPhi),oc.z+r*Math.sin(this._camPhi)*Math.cos(this._camTheta));
    this.camera.lookAt(oc);
  }
  _updateCamLerp(){
    /* Smoothly glide orbit center toward its target */
    this._orbitCenter.lerp(this._orbitCenterTarget,0.038);
    const r=this._camR,oc=this._orbitCenter;
    const tp=new THREE.Vector3(oc.x+r*Math.sin(this._camPhi)*Math.sin(this._camTheta),oc.y+r*Math.cos(this._camPhi),oc.z+r*Math.sin(this._camPhi)*Math.cos(this._camTheta));
    this.camera.position.lerp(tp,0.07);
    this.camera.lookAt(oc);
  }

  _focusPlanet(obj){
    const wp=new THREE.Vector3(); obj.mesh.getWorldPosition(wp);
    /* Shift orbit center to planet — scroll now zooms around planet, not sun */
    this._orbitCenterTarget.copy(wp);
    this._targetR=Math.max(obj.data.radius*5+3, this._targetR>200?obj.data.radius*6+4:this._targetR);
    this._travelPos=null; this._touring=false;
  }
  _flyCloser(obj){
    const wp=new THREE.Vector3(); obj.mesh.getWorldPosition(wp);
    this._orbitCenterTarget.copy(wp);
    this._targetR=obj.data.radius*1.55+0.35;
    this._travelPos=null;
  }
  _updateTour(dt){if(!this._touring||!this._introDone)return;this._tourTimer-=dt;if(this._tourTimer<=0){this._focusPlanet(this.objects[this._tourIdx%this.objects.length]);this._tourTimer=6;this._tourIdx++;}}

  /* ── LOD opacity manager — 4 distinct phases ────────────── */
  _updateLOD(){
    const r=this._camR;

    /* PHASE 1 — Stellar Neighborhood (180→1200 units)
       Thousands of individual nearby stars flood in. */
    if(this._stellarNeighMat)
      this._stellarNeighMat.opacity=Math.min(0.94,Math.max(0,(r-180)/1020));

    /* PHASE 2 — Orion Arm + HII Nebulae (700→3500 units)
       Dense river of stars; our spiral arm becomes visible. */
    const orA=Math.min(0.82,Math.max(0,(r-700)/2800));
    if(this._orionArmMat)this._orionArmMat.opacity=orA;
    this._orionNebMats.forEach(m=>{m.opacity=Math.min(0.65,orA);});

    /* PHASE 3 — Galactic Interior Haze (1800→7000 units)
       Warm diffuse glow of the Milky Way seen from inside —
       bridges Orion Arm and the face-on disc. */
    if(this._galHazeMat)
      this._galHazeMat.opacity=Math.min(0.72,Math.max(0,(r-1800)/5200));
    /* Galactic equator band: bright ring along galactic plane */
    if(this._galBandMat)
      this._galBandMat.opacity=Math.min(0.58,Math.max(0,(r-1500)/4000));

    /* PHASE 4 — Galaxy Disc face-on view (5000→11000 units)
       Full spiral galaxy appears as you exit the Milky Way. */
    if(this._galaxyDiscMat)
      this._galaxyDiscMat.opacity=Math.min(0.90,Math.max(0,(r-5000)/6000));

    /* "You are here" blue dot: galaxy scale only (6000+) */
    if(this._ourPosSpr)
      this._ourPosSpr.material.opacity=Math.min(0.9,Math.max(0,(r-6000)/3000));

    /* Globular clusters: visible at galaxy scale (7000+) */
    const gcA=Math.min(0.82,Math.max(0,(r-7000)/4000));
    this._globularMats.forEach(m=>m.opacity=gcA);

    /* Andromeda: the neighbour galaxy (8000+) */
    if(this._andromedaMat)
      this._andromedaMat.opacity=Math.min(0.78,Math.max(0,(r-8000)/5000));

    /* Slowly rotate galaxy disc */
    if(this._galaxyDisc)this._galaxyDisc.rotation.z+=0.000012;
    /* Pulse "You are here" */
    if(this._ourPosSpr&&r>6000){const p=Math.sin(Date.now()*0.0009);this._ourPosSpr.scale.setScalar(55+p*9);}

    /* Sun corona rays: only visible when close to sun */
    const sunVis=Math.max(0,1-this.camera.position.length()/80);
    this._sunRays.forEach(ray=>{
      ray.mat.opacity=sunVis*(0.08+0.07*Math.sin(Date.now()*0.001*ray.speed+ray.phase));
    });
  }

  /* ── Comet ───────────────────────────────────────────────── */
  _spawnComet(){
    const a=Math.random()*Math.PI*2,r=95;
    const start=new THREE.Vector3(Math.cos(a)*r,22+(Math.random()-.5)*28,Math.sin(a)*r);
    const dir=new THREE.Vector3(-Math.cos(a),-.18+Math.random()*.1,-Math.sin(a)).normalize();
    const pts=[];for(let i=0;i<22;i++)pts.push(start.clone().addScaledVector(dir,i*3.2));
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0xaaccff,transparent:true,opacity:0.72}));
    this.scene.add(line);this.comets.push({line,mat:line.material,dir,life:0,maxLife:220,speed:0.5});
  }

  /* ── Main loop ───────────────────────────────────────────── */
  start(){
    this.running=true;
    const clock=new THREE.Clock();
    const animate=()=>{
      if(!this.running)return;
      requestAnimationFrame(animate);
      const dt=clock.getDelta(),t=clock.getElapsedTime(),ts=this.paused?0:this.timeScale;

      /* Intro cinematic fly-in */
      if(!this._introDone){
        this._introPhase=Math.min(1,this._introPhase+dt*0.38);
        const ease=easeOutQuart(this._introPhase);
        const ir=lerp(220,this._camR,ease),ip=lerp(0.28,this._camPhi,ease);
        this.camera.position.set(ir*Math.sin(ip)*Math.sin(this._camTheta),ir*Math.cos(ip),ir*Math.sin(ip)*Math.cos(this._camTheta));
        this.camera.lookAt(0,0,0);
        if(this._introPhase>=1){this._introDone=true;this._labelEls?.forEach(el=>{el.style.opacity='1';});}
      } else if(this._travelPos){
        this._travelT=Math.min(1,this._travelT+dt*1.1);
        const ease=easeOutQuart(this._travelT);
        this.camera.position.lerp(this._travelPos,ease*dt*2.2);
        this.camera.lookAt(this._travelTarget||new THREE.Vector3());
        if(this._travelT>=0.98){
          this._travelPos=null;
          /* Sync orbit params from final camera pos relative to orbitCenter */
          const off=this.camera.position.clone().sub(this._orbitCenter);
          this._camR=Math.max(0.8,off.length()); this._targetR=this._camR;
          this._camPhi=Math.acos(Math.min(1,Math.max(-1,off.y/Math.max(0.001,this._camR))));
          this._camTheta=Math.atan2(off.x,off.z);
        }
      } else {
        if(!this._drag){this._velTheta*=0.92;this._velPhi*=0.92;this._camTheta-=this._velTheta;this._camPhi=Math.max(0.1,Math.min(1.45,this._camPhi-this._velPhi));}
        this._camR+=(this._targetR-this._camR)*0.055;
        this._updateCamLerp();
      }

      /* Per-frame updates */
      this._updateTour(dt);
      this._updateLOD();
      this._updateNarrative();
      this._updateScaleIndicator();
      this._updateDistanceCounter();
      this._updateSurfaceHUD();
      this._updateLabels();

      /* Sun animation + corona rays */
      if(this.sunMesh){this.sunMesh.rotation.y=t*0.07;this.sunMesh.scale.setScalar(1+.022*Math.sin(t*1.3));}
      this._coronas?.forEach(({mesh,base},i)=>{mesh.material.opacity=base*(1+.18*Math.sin(t*.72+i*1.1));});
      this.flareSpr?.position.set(0,0,0);
      /* Animate sun ray positions (breathing scale) */
      if(this._sunRays.length){
        this._sunRays.forEach(ray=>{
          const breathe=1+0.18*Math.sin(t*ray.speed+ray.phase);
          const r=4.5+ray.baseLen*0.5*breathe,hl=ray.baseLen*breathe;
          ray.spr.position.set(Math.cos(ray.baseAng)*r,Math.sin(ray.baseAng)*r,0);
          ray.spr.scale.set(1.2,hl*1.4,1);
        });
      }

      /* Solar wind */
      if(this._solarPos){
        const P=this._solarPos,V=this._solarVel;
        for(let i=0;i<this._solarN;i++){
          P[i*3]+=V[i].x*dt*28;P[i*3+1]+=V[i].y*dt*28;P[i*3+2]+=V[i].z*dt*28;
          if(P[i*3]**2+P[i*3+1]**2+P[i*3+2]**2>28*28){
            const th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1);
            const vx=Math.sin(ph)*Math.cos(th),vy=Math.sin(ph)*Math.sin(th),vz=Math.cos(ph);
            const r0=3.5+Math.random()*2;
            P[i*3]=vx*r0;P[i*3+1]=vy*r0;P[i*3+2]=vz*r0;
            V[i].set(vx,vy,vz).multiplyScalar(0.06+Math.random()*0.1);
          }
        }
        this._solarGeo.attributes.position.needsUpdate=true;
      }

      /* Planet orbits & rotation */
      this.objects.forEach(({data,pivot,mesh,moon},i)=>{
        this.angles[i]+=data.speed*ts*0.55*dt*60;pivot.rotation.y=this.angles[i];
        mesh.rotation.y+=0.003*dt*60;if(moon)moon.pivot.rotation.y+=0.035*ts*dt*60;
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

      /* Dynamic bloom: stronger near sun / planet surfaces */
      let _nd=this.camera.position.length();
      this.objects.forEach(o=>{const _wp=new THREE.Vector3();o.mesh.getWorldPosition(_wp);const _d=this.camera.position.distanceTo(_wp)-o.data.radius;if(_d<_nd)_nd=_d;});
      this._bloom.strength=Math.max(0.28,Math.min(1.65,0.52+14/Math.max(4,_nd)));
      this._bloom.radius  =Math.max(0.26,Math.min(0.56,0.30+ 7/Math.max(7,_nd)));

      this.composer.render();
    };
    animate();
  }

  /* ── Skip ─────────────────────────────────────────────────── */
  skip(){
    const el=this.renderer.domElement;
    el.style.transition='opacity 0.7s ease';el.style.opacity='0';
    [this._labelDiv,this._infoPanel,this._skipBtn,this._timeBar,this._topBar,this._surfaceHUD,this._scaleEl,this._narEl,this._distEl].forEach(e=>{if(e){e.style.transition='opacity 0.5s';e.style.opacity='0';}});
    if(this._starLabels)this._starLabels.forEach(({el})=>el?.remove());
    setTimeout(()=>{
      this.running=false;
      [el,this._labelDiv,this._infoPanel,this._skipBtn,this._timeBar,this._topBar,this._surfaceHUD,this._scaleEl,this._narEl,this._distEl].forEach(e=>{try{e?.remove();}catch(_){}});
      try{this.renderer.dispose();this.composer.dispose();}catch(_){}
      if(this.onSkip)this.onSkip();
    },750);
  }
}
