<div align="center">

<!-- ═══════════════════════════════════════════════════════════ -->
<!--                   ANIMATED SVG HEADER                       -->
<!-- ═══════════════════════════════════════════════════════════ -->

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 280" width="900" height="280">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0a0a2e"/>
      <stop offset="100%" stop-color="#000005"/>
    </radialGradient>
    <radialGradient id="sun" cx="30%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#fff7aa"/>
      <stop offset="40%" stop-color="#ffd54f"/>
      <stop offset="80%" stop-color="#ff8f00"/>
      <stop offset="100%" stop-color="#e65100"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softglow">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="titleglow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="titlegrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="35%" stop-color="#f0c040"/>
      <stop offset="65%" stop-color="#ff8f00"/>
      <stop offset="100%" stop-color="#ef5350"/>
    </linearGradient>
    <linearGradient id="subtitlegrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#80deea"/>
      <stop offset="100%" stop-color="#b39ddb"/>
    </linearGradient>
    <linearGradient id="linegrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="transparent"/>
      <stop offset="30%" stop-color="#f0c040"/>
      <stop offset="70%" stop-color="#f0c040"/>
      <stop offset="100%" stop-color="transparent"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="900" height="280" fill="url(#bg)" rx="12"/>

  <!-- Stars (static) -->
  <g opacity="0.9">
    <circle cx="45" cy="22" r="1" fill="white" opacity="0.8"><animate attributeName="opacity" values="0.8;0.2;0.8" dur="2.1s" repeatCount="indefinite"/></circle>
    <circle cx="120" cy="55" r="1.5" fill="white" opacity="0.6"><animate attributeName="opacity" values="0.6;0.1;0.6" dur="3.3s" repeatCount="indefinite"/></circle>
    <circle cx="200" cy="18" r="1" fill="white" opacity="0.9"><animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.8s" repeatCount="indefinite"/></circle>
    <circle cx="310" cy="40" r="1.2" fill="#cce" opacity="0.7"><animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.7s" repeatCount="indefinite"/></circle>
    <circle cx="420" cy="12" r="1" fill="white" opacity="0.8"><animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite"/></circle>
    <circle cx="560" cy="30" r="1.5" fill="#ffd" opacity="0.6"><animate attributeName="opacity" values="0.6;0.1;0.6" dur="3.8s" repeatCount="indefinite"/></circle>
    <circle cx="670" cy="18" r="1" fill="white" opacity="0.9"><animate attributeName="opacity" values="0.9;0.4;0.9" dur="2.2s" repeatCount="indefinite"/></circle>
    <circle cx="750" cy="50" r="1.2" fill="#cce" opacity="0.7"><animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.9s" repeatCount="indefinite"/></circle>
    <circle cx="830" cy="25" r="1" fill="white" opacity="0.8"><animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.9s" repeatCount="indefinite"/></circle>
    <circle cx="880" cy="60" r="1.5" fill="#ffd" opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="3.1s" repeatCount="indefinite"/></circle>
    <circle cx="80" cy="190" r="1" fill="white" opacity="0.6"><animate attributeName="opacity" values="0.6;0.2;0.6" dur="2.4s" repeatCount="indefinite"/></circle>
    <circle cx="160" cy="220" r="1.2" fill="#cce" opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="3.5s" repeatCount="indefinite"/></circle>
    <circle cx="780" cy="200" r="1" fill="white" opacity="0.7"><animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.0s" repeatCount="indefinite"/></circle>
    <circle cx="850" cy="230" r="1.5" fill="#ffd" opacity="0.6"><animate attributeName="opacity" values="0.6;0.1;0.6" dur="4.0s" repeatCount="indefinite"/></circle>
    <circle cx="30" cy="130" r="1" fill="white" opacity="0.7"><animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.6s" repeatCount="indefinite"/></circle>
    <circle cx="870" cy="140" r="1.2" fill="#cce" opacity="0.6"><animate attributeName="opacity" values="0.6;0.1;0.6" dur="3.2s" repeatCount="indefinite"/></circle>
  </g>

  <!-- Shooting Star -->
  <line x1="600" y1="20" x2="700" y2="60" stroke="white" stroke-width="1" opacity="0">
    <animate attributeName="opacity" values="0;0;0;0.9;0" dur="6s" repeatCount="indefinite" begin="1s"/>
    <animate attributeName="x1" values="600;600;600;700;800" dur="6s" repeatCount="indefinite" begin="1s"/>
    <animate attributeName="y1" values="20;20;20;60;100" dur="6s" repeatCount="indefinite" begin="1s"/>
    <animate attributeName="x2" values="700;700;700;800;900" dur="6s" repeatCount="indefinite" begin="1s"/>
    <animate attributeName="y2" values="60;60;60;100;140" dur="6s" repeatCount="indefinite" begin="1s"/>
  </line>

  <!-- Sun glow -->
  <circle cx="112" cy="140" r="90" fill="#ff8f00" opacity="0.04">
    <animate attributeName="r" values="85;95;85" dur="4s" repeatCount="indefinite"/>
  </circle>
  <circle cx="112" cy="140" r="60" fill="#ffd54f" opacity="0.07">
    <animate attributeName="r" values="55;65;55" dur="3s" repeatCount="indefinite"/>
  </circle>
  <!-- Sun body -->
  <circle cx="112" cy="140" r="38" fill="url(#sun)" filter="url(#softglow)">
    <animate attributeName="r" values="37;39;37" dur="2.5s" repeatCount="indefinite"/>
  </circle>
  <circle cx="100" cy="128" r="10" fill="white" opacity="0.12"/>

  <!-- Orbits (faint rings) -->
  <ellipse cx="112" cy="140" rx="70" ry="70" fill="none" stroke="rgba(200,200,255,0.07)" stroke-width="0.5"/>
  <ellipse cx="112" cy="140" rx="100" ry="100" fill="none" stroke="rgba(200,200,255,0.05)" stroke-width="0.5"/>
  <ellipse cx="112" cy="140" rx="135" ry="135" fill="none" stroke="rgba(200,200,255,0.04)" stroke-width="0.5"/>

  <!-- Planets orbiting -->
  <!-- Mercury -->
  <circle cx="182" cy="140" r="5" fill="#aaa" filter="url(#glow)">
    <animateTransform attributeName="transform" type="rotate" from="0 112 140" to="360 112 140" dur="3s" repeatCount="indefinite"/>
  </circle>
  <!-- Venus -->
  <circle cx="212" cy="140" r="7" fill="#e8c46a" filter="url(#glow)">
    <animateTransform attributeName="transform" type="rotate" from="60 112 140" to="420 112 140" dur="5s" repeatCount="indefinite"/>
  </circle>
  <!-- Earth -->
  <circle cx="247" cy="140" r="7.5" fill="#4fc3f7" filter="url(#glow)">
    <animateTransform attributeName="transform" type="rotate" from="120 112 140" to="480 112 140" dur="8s" repeatCount="indefinite"/>
  </circle>

  <!-- Title block -->
  <text x="450" y="98" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="52" font-weight="900" fill="url(#titlegrad)" filter="url(#titleglow)" letter-spacing="4">COSMIC ODYSSEY</text>

  <!-- Divider line -->
  <rect x="250" y="113" width="400" height="1" fill="url(#linegrad)" opacity="0.8"/>

  <!-- Subtitle -->
  <text x="450" y="140" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="14" fill="url(#subtitlegrad)" letter-spacing="5" opacity="0.9">WELCOME TO THE IMAGINARY WORLD</text>

  <!-- Tag line -->
  <text x="450" y="170" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="11" fill="rgba(180,180,220,0.6)" letter-spacing="2">Real-time 3D Solar System  ·  Cinematic Animations  ·  Synthesized Audio  ·  Interactive Quiz</text>

  <!-- Bottom line -->
  <rect x="250" y="185" width="400" height="0.5" fill="url(#linegrad)" opacity="0.4"/>

  <!-- Badges row area -->
  <text x="450" y="218" text-anchor="middle" font-family="monospace" font-size="10" fill="rgba(240,192,64,0.7)" letter-spacing="1">⚡ THREE.JS  ·  ⚡ VITE  ·  ⚡ WEB AUDIO API  ·  ⚡ CANVAS 2D  ·  ⚡ VANILLA JS</text>

  <!-- Bottom decorative dots -->
  <circle cx="380" cy="242" r="2" fill="#f0c040" opacity="0.5"><animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/></circle>
  <circle cx="420" cy="248" r="1.5" fill="#80deea" opacity="0.4"><animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.5s" repeatCount="indefinite"/></circle>
  <circle cx="450" cy="250" r="2.5" fill="#b39ddb" opacity="0.6"><animate attributeName="opacity" values="0.6;1;0.6" dur="1.8s" repeatCount="indefinite"/></circle>
  <circle cx="480" cy="248" r="1.5" fill="#80deea" opacity="0.4"><animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.3s" repeatCount="indefinite"/></circle>
  <circle cx="520" cy="242" r="2" fill="#f0c040" opacity="0.5"><animate attributeName="opacity" values="0.5;1;0.5" dur="2.1s" repeatCount="indefinite"/></circle>
</svg>

<br/>

<!-- ANIMATED TYPING SVG -->
<img src="https://readme-typing-svg.demolab.com?font=Orbitron&size=14&duration=3000&pause=800&color=F0C040&center=true&vCenter=true&multiline=false&width=600&lines=🌌+Exploring+the+cosmos%2C+one+planet+at+a+time...;🪐+Real-time+3D+planets+powered+by+Three.js;🎬+Cinematic+intro+with+particle+typography;🔊+Click+planets+to+hear+their+sound+signature;🚀+Interactive+space+missions+%26+timeline;⭐+Star+this+repo+if+you+love+space!" alt="Typing SVG"/>

<br/><br/>

<!-- SHIELD BADGES -->
![JavaScript](https://img.shields.io/badge/JavaScript-79.8%25-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-19.4%25-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-0.8%25-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r128-000000?style=for-the-badge&logo=threedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)

<br/>

![Stars](https://img.shields.io/github/stars/professyzenith/cosmic-odyssey?style=flat-square&color=f0c040&label=⭐%20Stars)
![Forks](https://img.shields.io/github/forks/professyzenith/cosmic-odyssey?style=flat-square&color=80deea&label=🍴%20Forks)
![Last Commit](https://img.shields.io/github/last-commit/professyzenith/cosmic-odyssey?style=flat-square&color=b39ddb&label=🕐%20Last%20Commit)
![Repo Size](https://img.shields.io/github/repo-size/professyzenith/cosmic-odyssey?style=flat-square&color=ef5350&label=📦%20Size)

</div>

<br/>

---

```
 ██████╗ ██████╗ ███████╗███╗   ███╗██╗ ██████╗
██╔════╝██╔═══██╗██╔════╝████╗ ████║██║██╔════╝
██║     ██║   ██║███████╗██╔████╔██║██║██║
██║     ██║   ██║╚════██║██║╚██╔╝██║██║██║
╚██████╗╚██████╔╝███████║██║ ╚═╝ ██║██║╚██████╗
 ╚═════╝ ╚═════╝ ╚══════╝╚═╝     ╚═╝╚═╝ ╚═════╝

 ██████╗ ██████╗ ██╗   ██╗███████╗███████╗███████╗██╗   ██╗
██╔═══██╗██╔══██╗╚██╗ ██╔╝██╔════╝██╔════╝██╔════╝╚██╗ ██╔╝
██║   ██║██║  ██║ ╚████╔╝ ███████╗███████╗█████╗   ╚████╔╝
██║   ██║██║  ██║  ╚██╔╝  ╚════██║╚════██║██╔══╝    ╚██╔╝
╚██████╔╝██████╔╝   ██║   ███████║███████║███████╗   ██║
 ╚═════╝ ╚═════╝    ╚═╝   ╚══════╝╚══════╝╚══════╝   ╚═╝
```

---

<div align="center">

## 🌠 `[ SYSTEM OVERVIEW ]`

*A production-ready, fully immersive Solar System exploration platform built with Three.js.  
Procedural planet textures, synthesized audio, cinematic particle effects — all in the browser.*

</div>

<br/>

---

## 🎬 `[ CINEMATIC FEATURES ]`

<br/>

<div align="center">

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│    ✦  FEATURE MAP  ✦                                           │
│                                                                 │
│   🎬  Cinematic Intro   ─────  Particle typography + nebula    │
│   🪐  Hero Orrery       ─────  Full 2D solar system canvas     │
│   🌍  3D Planet Viewer  ─────  Per-planet Three.js renderer    │
│   🔊  Planet Sounds     ─────  Web Audio API synthesis         │
│   🧠  Space Quiz        ─────  10 questions + score tracking   │
│   🚀  Mission Timeline  ─────  Real NASA mission data          │
│   💎  Glassmorphism UI  ─────  Blur panels + glow borders      │
│   🎨  Procedural Tex    ─────  100% in-browser, no assets      │
│   📱  Responsive        ─────  Mobile · Tablet · Desktop       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

</div>

<br/>

| 🎯 Feature | ⚡ What It Does |
|:---|:---|
| 🎬 **Cinematic Intro** | Animated particle typography spells out the title, shooting stars cross the nebula background |
| 🪐 **Hero Solar System** | Real-time 2D canvas orrery — all 8 planets orbiting with asteroid belt, comets & Saturn rings |
| 🌍 **3D Planet Sections** | Full-screen per-planet sections with a rotating Three.js canvas renderer |
| 🔥 **Surface Detail** | Jupiter's Great Red Spot · Earth's continents & clouds · Mars dust storms · Neptune's Dark Spot |
| 🔊 **Planet Sounds** | Click any planet name to trigger its unique synthesized audio signature via Web Audio API |
| 🧠 **Space Quiz** | 10-question interactive knowledge quiz with live score tracking and results |
| 🚀 **Mission Timeline** | Scrollable timeline of real space missions from Sputnik to Ingenuity |
| 💎 **Glassmorphism UI** | Frosted-glass panels, neon glow borders, animated gradient highlights throughout |
| 🎨 **Procedural Textures** | Every planet texture generated entirely in-browser — zero external image assets |

<br/>

---

## 🪐 `[ THE EIGHT WORLDS ]`

<br/>

<div align="center">

```
  ☿ MERCURY          ♀ VENUS           ♁ EARTH           ♂ MARS
  ─────────          ───────           ───────           ──────
  ●                  ●                 ●                 ●
  Smallest           Hottest           Our Home          Red Planet
  4,879 km           12,104 km         12,742 km         6,779 km
  0 moons            0 moons           1 moon            2 moons
  430°C max          465°C avg         58°C max          20°C max


  ♃ JUPITER          ♄ SATURN          ♅ URANUS          ♆ NEPTUNE
  ─────────          ────────          ────────          ─────────
  ●                  ●                 ●                 ●
  Gas Giant          Ring Master       Ice Giant         Farthest
  139,820 km         116,460 km        50,724 km         49,244 km
  95 moons           146 moons         28 moons          16 moons
  620km/h winds      Floats on water   97.8° tilt        2,100km/h winds
```

</div>

<br/>

| # | Planet | Type | Diameter | Moons | Highlight |
|:---:|:---|:---|:---:|:---:|:---|
| ☿ | **Mercury** | Terrestrial | 4,879 km | 0 | Wildest temperature swings in the solar system |
| ♀ | **Venus** | Terrestrial | 12,104 km | 0 | Hottest planet — runaway greenhouse effect |
| ♁ | **Earth** | Terrestrial | 12,742 km | 1 | Only known world to harbor life |
| ♂ | **Mars** | Terrestrial | 6,779 km | 2 | Home to the tallest volcano in the solar system |
| ♃ | **Jupiter** | Gas Giant | 139,820 km | 95 | Great Red Spot storm raging for 350+ years |
| ♄ | **Saturn** | Gas Giant | 116,460 km | 146 | Rings spanning 282,000 km yet only ~10m thick |
| ♅ | **Uranus** | Ice Giant | 50,724 km | 28 | Rotates on its side — poles face the Sun |
| ♆ | **Neptune** | Ice Giant | 49,244 km | 16 | Fastest winds in the solar system |

<br/>

---

## ⚙️ `[ QUICK START ]`

<br/>

```bash
# ══════════════════════════════════════════
#  CLONE & LAUNCH COSMIC ODYSSEY
# ══════════════════════════════════════════

# 1 ─ Clone the repository
git clone https://github.com/professyzenith/cosmic-odyssey.git

# 2 ─ Enter the project directory
cd cosmic-odyssey

# 3 ─ Install all dependencies
npm install

# 4 ─ Fire up the dev server 🚀
npm run dev
# → Open http://localhost:5173
```

<br/>

```bash
# ══════════════════════════════════════════
#  BUILD FOR PRODUCTION
# ══════════════════════════════════════════

npm run build    # Compile & optimize
npm run preview  # Preview the production build
```

<br/>

---

## 🗂️ `[ PROJECT STRUCTURE ]`

<br/>

```
🌌 cosmic-odyssey/
│
├── 📁 src/
│   └── main.js              ← Entry point — Three.js scene, planets, audio, quiz
│
├── 📄 index.html            ← App shell & HTML structure
├── ⚙️  vite.config.js       ← Vite bundler configuration
├── 📦 package.json          ← Dependencies & npm scripts
├── 🔒 package-lock.json     ← Exact dependency lock
└── 📖 README.md             ← You are here
```

<br/>

---

## 🛠️ `[ TECH STACK ]`

<br/>

<div align="center">

```
╔══════════════════════════════════════════════════════════╗
║                     TECH STACK                          ║
╠═══════════════════╦══════════════════════════════════════╣
║  Three.js         ║  3D planet rendering & orbit controls ║
║  Vite             ║  Dev server & optimized builds        ║
║  Web Audio API    ║  Synthesized planet sound signatures  ║
║  Canvas 2D API    ║  Solar orrery & cinematic intro       ║
║  CSS Glassmorphism║  Blur-glass panels & glow borders     ║
║  Vanilla JS       ║  Zero framework overhead              ║
╚═══════════════════╩══════════════════════════════════════╝
```

</div>

<br/>

---

## 🗺️ `[ ROADMAP ]`

<br/>

```
  COMPLETED                            UPCOMING
  ─────────────────────────────        ──────────────────────────────
  ✅ 3D planets with procedural tex    🔲 WebXR / VR support
  ✅ Synthesized audio per planet      🔲 Multiplayer exploration
  ✅ Cinematic particle intro          🔲 NASA API live data feed
  ✅ Space quiz with scoring           🔲 Mobile touch orbit control
  ✅ Mission history timeline          🔲 Exoplanet section
  ✅ Glassmorphism UI                  🔲 AR planet viewer
  ✅ Procedural planet textures        🔲 Voice-guided planet tours
  ✅ Responsive across devices         🔲 Dark / Light theme toggle
```

<br/>

---

## 🤝 `[ CONTRIBUTING ]`

<br/>

```bash
# ─────────────────────────────────────
#  How to contribute
# ─────────────────────────────────────

# 1. Fork this repo
# 2. Create your feature branch
git checkout -b feature/your-idea

# 3. Commit with a descriptive message
git commit -m "✨ feat: add your amazing feature"

# 4. Push to your branch
git push origin feature/your-idea

# 5. Open a Pull Request 🎉
```

All contributions are welcome — bug fixes, new features, design improvements, or documentation!

<br/>

---

## 👥 `[ CREW ]`

<br/>

<div align="center">

<table>
<tr>
<td align="center">
<img src="https://avatars.githubusercontent.com/u/mantisdarling?size=100" width="80" style="border-radius:50%"/><br/>
<b>mantisdarling</b><br/>
<a href="https://github.com/mantisdarling">@mantisdarling</a>
</td>
<td align="center">
<img src="https://avatars.githubusercontent.com/u/professyzenith?size=100" width="80" style="border-radius:50%"/><br/>
<b>professyzenith</b><br/>
<a href="https://github.com/professyzenith">@professyzenith</a>
</td>
</tr>
</table>

</div>

<br/>

---

<div align="center">

<!-- FOOTER SVG -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 120" width="900" height="120">
  <defs>
    <linearGradient id="footerbg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#000005"/>
      <stop offset="50%" stop-color="#0a0a2e"/>
      <stop offset="100%" stop-color="#000005"/>
    </linearGradient>
    <linearGradient id="footerline" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="transparent"/>
      <stop offset="30%" stop-color="#f0c040"/>
      <stop offset="70%" stop-color="#b39ddb"/>
      <stop offset="100%" stop-color="transparent"/>
    </linearGradient>
  </defs>
  <rect width="900" height="120" fill="url(#footerbg)" rx="12"/>
  <!-- Stars -->
  <circle cx="50" cy="40" r="1" fill="white" opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="2.2s" repeatCount="indefinite"/></circle>
  <circle cx="200" cy="20" r="1.5" fill="#ffd" opacity="0.4"><animate attributeName="opacity" values="0.4;0.9;0.4" dur="3.1s" repeatCount="indefinite"/></circle>
  <circle cx="450" cy="15" r="1" fill="white" opacity="0.6"><animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.8s" repeatCount="indefinite"/></circle>
  <circle cx="700" cy="25" r="1.2" fill="#cce" opacity="0.5"><animate attributeName="opacity" values="0.5;0.2;0.5" dur="2.7s" repeatCount="indefinite"/></circle>
  <circle cx="860" cy="45" r="1" fill="white" opacity="0.4"><animate attributeName="opacity" values="0.4;0.9;0.4" dur="3.4s" repeatCount="indefinite"/></circle>
  <!-- Top divider -->
  <rect x="100" y="18" width="700" height="0.5" fill="url(#footerline)"/>
  <!-- Quote -->
  <text x="450" y="55" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="13" fill="rgba(180,180,220,0.7)" font-style="italic">"The cosmos is within us. We are made of star-stuff." — Carl Sagan</text>
  <!-- Credits -->
  <text x="450" y="80" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="11" fill="rgba(240,192,64,0.6)" letter-spacing="2">COSMIC ODYSSEY  ·  MADE WITH 🌙  ·  DATA FROM NASA</text>
  <!-- Bottom dots -->
  <circle cx="390" cy="100" r="2" fill="#f0c040" opacity="0.4"><animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite"/></circle>
  <circle cx="430" cy="104" r="1.5" fill="#80deea" opacity="0.4"><animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite"/></circle>
  <circle cx="450" cy="105" r="2.5" fill="#b39ddb" opacity="0.5"><animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite"/></circle>
  <circle cx="470" cy="104" r="1.5" fill="#80deea" opacity="0.4"><animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.3s" repeatCount="indefinite"/></circle>
  <circle cx="510" cy="100" r="2" fill="#f0c040" opacity="0.4"><animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.1s" repeatCount="indefinite"/></circle>
</svg>

<br/>

*If this project sparked some wonder — drop a ⭐ star. It means the universe to us.*

</div>
