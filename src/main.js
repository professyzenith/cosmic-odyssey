import { Starfield } from './components/starfield.js';
import { SolarSystemRenderer } from './components/solarSystem.js';
import { PlanetRenderer } from './components/planetRenderer.js';
import { QuizComponent } from './components/quiz.js';
import { buildCalculator, buildCompare } from './components/calculator.js';
import { PlanetSearch } from './components/search.js';
import { FavoritesSystem } from './components/favorites.js';
import { ScrollAnimator } from './utils/scroll.js';
import { AmbientAudio } from './components/ambientAudio.js';
import { NASAGallery } from './components/gallery.js';
import { PlanetSounds } from './components/planetSounds.js';
import { buildEducation } from './components/education.js';
import { PLANETS, MISSIONS, SOLAR_SYSTEM_FACTS } from './data/planets.js';

// ── Loading Screen ──────────────────────────────────────────
const loadingEl = document.getElementById('loading-screen');
const loadingBar = document.getElementById('loading-bar');
const loadingText = document.getElementById('loading-text');

const LOADING_STEPS = [
  'Igniting the Sun...',
  'Placing planets in orbit...',
  'Scattering a billion stars...',
  'Computing gravitational fields...',
  'Calibrating space-time...',
  'Ready for launch...',
];

let loadProgress = 0;
function advanceLoading(pct, text) {
  loadProgress = pct;
  if (loadingBar) loadingBar.style.width = pct + '%';
  if (loadingText) loadingText.textContent = text;
}

// ── DOM Builder ─────────────────────────────────────────────
function buildDOM() {
  advanceLoading(10, LOADING_STEPS[0]);

  // Starfield canvas
  const sfCanvas = document.createElement('canvas');
  sfCanvas.id = 'starfield-canvas';
  document.body.insertBefore(sfCanvas, document.body.firstChild);

  // Build intro
  document.getElementById('app').innerHTML = `
    <!-- INTRO -->
    <div id="intro-screen" role="region" aria-label="Cosmic Odyssey Introduction">
      <div id="intro-particles">
        <div class="intro-nebula" style="width:600px;height:600px;background:radial-gradient(circle,rgba(106,92,255,0.2),transparent);top:-10%;left:-5%"></div>
        <div class="intro-nebula" style="width:500px;height:500px;background:radial-gradient(circle,rgba(0,229,255,0.15),transparent);bottom:-5%;right:5%;animation-delay:-4s"></div>
        <div class="intro-nebula" style="width:400px;height:400px;background:radial-gradient(circle,rgba(0,255,198,0.1),transparent);top:30%;right:10%;animation-delay:-2s"></div>
      </div>
      <p class="intro-badge">Cosmic Odyssey</p>
      <h1 class="intro-heading">
        <span class="line1">Welcome To The</span>
        <span class="line2">Imaginary World</span>
        <span class="line3">of the Solar System</span>
      </h1>
      <p class="intro-subline">A Journey Through Space & Time — 4.6 Billion Years in the Making</p>
      <div class="intro-cta">
        <button class="btn-primary" id="begin-btn" aria-label="Begin the cosmic journey">
          <span>✦ BEGIN THE JOURNEY</span>
        </button>
        <button class="btn-secondary" id="explore-btn" aria-label="Jump to solar system explorer">
          Explore Planets
        </button>
      </div>
      <div class="intro-scroll-hint" aria-hidden="true">
        <span>SCROLL TO EXPLORE</span>
        <div class="scroll-line"></div>
      </div>
    </div>

    <!-- NAVIGATION -->
    <nav id="navbar" role="navigation" aria-label="Main navigation">
      <span class="nav-logo">✦ COSMIC</span>
      <div class="nav-divider" aria-hidden="true"></div>
      <a href="#hero" class="nav-item active">Home</a>
      <a href="#mercury" class="nav-item">Mercury</a>
      <a href="#venus" class="nav-item">Venus</a>
      <a href="#earth" class="nav-item">Earth</a>
      <a href="#mars" class="nav-item">Mars</a>
      <a href="#jupiter" class="nav-item">Jupiter</a>
      <a href="#saturn" class="nav-item">Saturn</a>
      <a href="#uranus" class="nav-item">Uranus</a>
      <a href="#neptune" class="nav-item">Neptune</a>
      <div class="nav-divider" aria-hidden="true"></div>
      <a href="#missions" class="nav-item">Missions</a>
      <a href="#gallery" class="nav-item">Gallery</a>
      <a href="#education" class="nav-item">Learn</a>
      <a href="#compare" class="nav-item">Compare</a>
      <a href="#quiz" class="nav-item">Quiz</a>
      <a href="#live" class="nav-item">Live</a>
    </nav>

    <!-- MAIN SITE -->
    <div id="main-site" role="main">

      <!-- HERO -->
      <section id="hero" aria-label="Solar System 3D View">
        <canvas id="hero-canvas" aria-hidden="true"></canvas>
        <div class="hero-overlay" aria-hidden="true"></div>
        
        <!-- Simulation Controls -->
        <div class="sim-controls" id="sim-controls" aria-label="Simulation controls">
          <button id="sim-play" class="sim-btn" aria-label="Pause simulation">⏸ Pause</button>
          <div class="sim-divider" aria-hidden="true"></div>
          <div class="sim-slider-wrap">
            <span class="sim-label">Orbit Warp</span>
            <input type="range" id="sim-speed" min="0.1" max="10" step="0.1" value="1" aria-label="Simulation speed" />
            <span class="sim-val" id="sim-speed-val">1.0x</span>
          </div>
          <div class="sim-divider" aria-hidden="true"></div>
          <button id="sim-trails" class="sim-btn active" aria-label="Toggle orbit trails">Orbit Trails</button>
        </div>

        <div class="hero-content">
          <p class="hero-eyebrow">Our Cosmic Neighborhood</p>
          <h2 class="hero-title">Solar System</h2>
          <p class="hero-subtitle">8 Planets · 1 Star · Infinite Wonder</p>
        </div>
        <div id="planet-hover-card" class="planet-hover-card" aria-hidden="true">
          <div class="phc-name" id="phc-name">—</div>
          <div class="phc-type" id="phc-type">—</div>
          <div class="phc-stat" id="phc-stat">—</div>
        </div>
        <div class="hero-scroll-cue" aria-hidden="true">
          <span>SCROLL TO EXPLORE</span>
          <div class="hero-scroll-arrow"></div>
        </div>
      </section>

      <!-- PLANETS (injected) -->
      <div id="planets-container"></div>

      <!-- MISSIONS -->
      <section id="missions" aria-label="Space Missions">
        <div class="section-header reveal">
          <p class="section-eyebrow">Humanity's Reach</p>
          <h2 class="section-title">Space Missions</h2>
          <p class="section-subtitle">The spacecraft that have carried our dreams to the stars</p>
        </div>
        <div class="missions-grid" id="missions-grid"></div>
      </section>

      <!-- COMPARE -->
      <section id="compare" aria-label="Planet Comparison Tool">
        <div id="compare-inner" class="compare-inner reveal"></div>
      </section>

      <!-- CALCULATOR -->
      <section id="calculator" aria-label="Distance Calculator">
        <div class="calc-inner reveal" id="calc-inner"></div>
      </section>

      <!-- FACTS -->
      <section class="facts-section" id="facts" aria-label="Space Facts Generator">
        <div class="section-header reveal">
          <p class="section-eyebrow">Did You Know?</p>
          <h2 class="section-title">Space Facts</h2>
        </div>
        <div class="fact-display reveal">
          <p class="fact-text" id="fact-text">Click the button to discover an amazing space fact.</p>
        </div>
        <button class="btn-primary" id="fact-btn" style="display:block;margin:1.5rem auto 0">
          <span>✦ Generate Fact</span>
        </button>
      </section>

      <!-- QUIZ -->
      <section id="quiz" aria-label="Solar System Quiz">
        <div class="section-header reveal">
          <p class="section-eyebrow">Test Your Knowledge</p>
          <h2 class="section-title">Space Explorer Quiz</h2>
          <p class="section-subtitle">How well do you know our Solar System?</p>
        </div>
        <div class="quiz-card reveal" id="quiz-card"></div>
      </section>

      <!-- TIMELINE -->
      <section id="timeline" aria-label="Space Exploration Timeline">
        <div class="timeline-inner reveal">
          <div class="section-header">
            <p class="section-eyebrow">Through the Ages</p>
            <h2 class="section-title">Timeline of Discovery</h2>
          </div>
          <div class="timeline-list" id="timeline-list"></div>
        </div>
      </section>

      <!-- NASA GALLERY -->
      <section id="gallery" aria-label="NASA Space Image Gallery">
        <div id="gallery-container"></div>
      </section>

      <!-- EDUCATIONAL -->
      <section id="education" aria-label="Become A Space Explorer">
        <div class="edu-inner">
          <div class="section-header reveal">
            <p class="section-eyebrow">Become A Space Explorer</p>
            <h2 class="section-title">Learn The Cosmos</h2>
            <p class="section-subtitle">Three levels of cosmic knowledge — pick your path</p>
          </div>
          <div class="edu-tabs reveal">
            <button class="edu-tab active" data-level="beginner">🌟 Beginner</button>
            <button class="edu-tab" data-level="intermediate">🔭 Intermediate</button>
            <button class="edu-tab" data-level="advanced">⚛️ Advanced</button>
          </div>
          <div id="edu-cards-beginner" class="edu-level active">
            <div class="edu-grid" id="edu-grid-beginner"></div>
          </div>
          <div id="edu-cards-intermediate" class="edu-level">
            <div class="edu-grid" id="edu-grid-intermediate"></div>
          </div>
          <div id="edu-cards-advanced" class="edu-level">
            <div class="edu-grid" id="edu-grid-advanced"></div>
          </div>
        </div>
      </section>

      <!-- LIVE MODEL -->
      <section id="live" aria-label="Live Solar System Model">
        <div class="live-inner">
          <div class="section-header reveal">
            <p class="section-eyebrow">Real-Time Simulation</p>
            <h2 class="section-title">Explore The Solar System Live</h2>
            <p class="section-subtitle">Interact with a real-time Solar System model</p>
          </div>
          <div class="live-frame-container reveal">
            <div class="live-frame-top">
              <div class="live-indicator" aria-hidden="true"></div>
              <span class="live-label">Live Solar System Model</span>
              <div class="live-badge" aria-hidden="true">
                <span>REAL-TIME</span>
                <span>·</span>
                <span>INTERACTIVE</span>
                <span>·</span>
                <span>3D</span>
              </div>
            </div>
            <div class="iframe-wrap">
              <iframe
                id="sss-iframe"
                src="https://www.solarsystemscope.com/iframe"
                title="Interactive real-time Solar System model"
                allowfullscreen
                allow="fullscreen; autoplay"
                referrerpolicy="no-referrer"
                aria-label="3D Solar System Simulation"
                style="border:none; display:block; width:100%; min-height:600px; height:80vh;"
              ></iframe>
              <!-- Fallback panel — hidden by default, shown if iframe fails -->
              <div id="sss-fallback" style="display:none; flex-direction:column; align-items:center; justify-content:center; gap:1.5rem; padding:4rem 2rem; text-align:center; min-height:400px;">
                <div style="font-size:48px; opacity:0.4;">🔭</div>
                <p style="font-family:'Orbitron',sans-serif; font-size:14px; font-weight:700; color:var(--white); letter-spacing:0.1em;">Solar System Model Unavailable</p>
                <p style="font-size:13px; color:rgba(255,255,255,0.5); max-width:400px; line-height:1.7;">The embedded model couldn't load — this is usually a temporary browser or network restriction. Open it directly in a new tab for the full experience.</p>
                <a href="https://www.solarsystemscope.com" target="_blank" rel="noopener noreferrer"
                  style="display:inline-flex; align-items:center; gap:0.5rem; font-family:'Orbitron',sans-serif; font-size:10px; letter-spacing:0.25em; color:var(--bg); background:linear-gradient(135deg,var(--cyan),var(--purple)); border-radius:30px; padding:0.75rem 2rem; text-decoration:none; transition:transform 0.2s, box-shadow 0.2s;"
                  onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 30px rgba(0,229,255,0.4)'"
                  onmouseout="this.style.transform=''; this.style.boxShadow=''">
                  ↗ OPEN SOLAR SYSTEM SCOPE
                </a>
                <button onclick="document.getElementById('sss-iframe').src='https://www.solarsystemscope.com/iframe'; document.getElementById('sss-fallback').style.display='none'; document.getElementById('sss-iframe').style.display='block';"
                  style="font-family:'Orbitron',sans-serif; font-size:9px; letter-spacing:0.2em; color:rgba(255,255,255,0.4); background:none; border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:0.45rem 1.2rem; cursor:pointer;">
                  ↺ RETRY
                </button>
              </div>
            </div>
            <div class="live-frame-bottom">
              <span class="live-source">Data: solarsystemscope.com · Positions updated in real-time</span>
              <div class="live-actions">
                <button id="audio-launch-btn" aria-label="Start ambient space music">
                  <span class="btn-pulse" aria-hidden="true"></span>
                  <span id="audio-launch-label">♪ Start Ambient Music</span>
                </button>
                <button class="live-btn" id="fullscreen-btn">⤢ FULL SCREEN</button>
              </div>
            </div>
            <div class="live-floating-labels">
              ${[
                { color: '#FFB820', label: 'Sun & Planets' },
                { color: '#00FFC6', label: 'Real-Time Orbits' },
                { color: '#6A5CFF', label: 'Gravitational Data' },
                { color: '#00E5FF', label: 'Live Distances' },
                { color: '#B5B5B5', label: 'Moon Phases' },
                { color: '#E8C56B', label: 'Ecliptic Plane' },
              ].map(f => `
                <div class="lfloat">
                  <div class="lfloat-dot" style="background:${f.color};box-shadow:0 0 6px ${f.color}"></div>
                  <span class="lfloat-text">${f.label}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer role="contentinfo">
        <canvas id="footer-canvas" aria-hidden="true"></canvas>
        <div class="footer-inner">
          <div>
            <div class="footer-brand-name">COSMIC ODYSSEY</div>
            <p class="footer-tagline">Welcome to the imaginary world<br>of the Solar System.<br>Explore. Discover. Wonder.</p>
            <p style="font-size:11px;color:rgba(255,255,255,0.2);margin-top:0.75rem;letter-spacing:0.05em">Educational · Non-commercial<br>Inspired by NASA & ESA</p>
          </div>
          <div class="footer-col">
            <h4>Explore</h4>
            <a href="#hero">Solar System</a>
            <a href="#mercury">Inner Planets</a>
            <a href="#jupiter">Outer Planets</a>
            <a href="#missions">Space Missions</a>
            <a href="#gallery">NASA Gallery</a>
            <a href="#education">Learn The Cosmos</a>
            <a href="#timeline">Timeline</a>
            <a href="#live">Live Model</a>
          </div>
          <div class="footer-col">
            <h4>Planets</h4>
            <a href="#mercury">Mercury</a>
            <a href="#venus">Venus</a>
            <a href="#earth">Earth</a>
            <a href="#mars">Mars</a>
            <a href="#jupiter">Jupiter</a>
            <a href="#saturn">Saturn</a>
            <a href="#uranus">Uranus</a>
            <a href="#neptune">Neptune</a>
          </div>
          <div class="footer-col">
            <h4>Stay Updated</h4>
            <p style="font-size:12px;color:rgba(255,255,255,0.35);margin-bottom:0.75rem;line-height:1.6">Get the latest space discoveries and cosmic events delivered to your inbox.</p>
            <div class="footer-newsletter">
              <input type="email" placeholder="your@email.com" aria-label="Email for newsletter"/>
              <button type="button" aria-label="Subscribe to newsletter">GO</button>
            </div>
            <p style="font-size:10px;color:rgba(255,255,255,0.2);margin-top:0.5rem;letter-spacing:0.1em">No spam. Unsubscribe anytime.</p>
          </div>
        </div>
        <div class="footer-bottom">
          <span class="footer-copy">© 2025 Cosmic Odyssey · Educational Project · All rights reserved</span>
          <span class="footer-copy footer-love">Made with ✦ for the cosmos</span>
        </div>
      </footer>
    </div>
  `;
}

// ── Planets HTML ─────────────────────────────────────────────
function buildPlanets() {
  advanceLoading(30, LOADING_STEPS[1]);
  const container = document.getElementById('planets-container');

  PLANETS.forEach((p, idx) => {
    const isOdd = idx % 2 === 0;
    const section = document.createElement('section');
    section.className = 'planet-section';
    section.id = p.id;
    section.style.cssText = `--section-glow:${p.glowColor}22;--glow-x:${isOdd ? '15%' : '85%'}`;
    section.setAttribute('aria-label', `${p.name} planet section`);

    const statsKeys = ['diameter','mass','gravity','density','surfaceTemp','atmosphere','moons','orbitalPeriod'];
    const statsHTML = statsKeys.map(k => `
      <div class="stat-chip">
        <span class="stat-value">${p.stats[k]}</span>
        <span class="stat-label">${k.replace(/([A-Z])/g,' $1').trim()}</span>
      </div>
    `).join('');

    const moonsHTML = p.moons.length
      ? `<div class="moons-list">${p.moons.map(m => `<div class="moon-item">${m}</div>`).join('')}</div>`
      : `<p style="font-size:13px;color:rgba(255,255,255,0.4)">No natural moons</p>`;

    const missionsHTML = `<div class="missions-chips">${p.missions.map(m => `<span class="mission-chip">${m}</span>`).join('')}</div>`;

    section.innerHTML = `
      <div class="section-inner${isOdd ? '' : ' reverse'}">

        <!-- Visual -->
        <div class="planet-visual reveal-${isOdd ? 'left' : 'right'}">
          <div class="planet-canvas-wrap" style="--planet-glow:${p.glowColor}55;--planet-glow-color:${p.glowColor}20">
            <canvas id="planet-canvas-${p.id}" width="480" height="480" aria-label="${p.name} 3D visualization"></canvas>
            <div class="planet-ring-aura"></div>
          </div>
          <div class="planet-number" aria-hidden="true">0${p.order}</div>
        </div>

        <!-- Info -->
        <div class="planet-info reveal-${isOdd ? 'right' : 'left'}">
          <div class="planet-eyebrow">Solar System · Planet ${p.order}</div>
          <h2 class="planet-name-display" style="--planet-color:${p.color}">${p.name}</h2>
          <span class="planet-type-tag" style="--planet-color:${p.color}">${p.type}</span>
          <p class="planet-overview">${p.overview}</p>

          <!-- Stats -->
          <div class="stats-grid">${statsHTML}</div>

          <!-- Habitability -->
          <div class="hab-section">
            <div class="hab-header">
              <span class="hab-title">Habitability Score</span>
              <span class="hab-score">${p.habitability} / 100</span>
            </div>
            <div class="hab-track">
              <div class="hab-fill" data-hab="${p.habitability}" style="width:0%"></div>
            </div>
          </div>

          <!-- Tabs -->
          <div>
            <div class="planet-tabs" role="tablist">
              <button class="planet-tab active" role="tab" aria-selected="true"  data-tab="${p.id}-overview">Overview</button>
              <button class="planet-tab"         role="tab" aria-selected="false" data-tab="${p.id}-moons">Moons</button>
              <button class="planet-tab"         role="tab" aria-selected="false" data-tab="${p.id}-missions">Missions</button>
              <button class="planet-tab"         role="tab" aria-selected="false" data-tab="${p.id}-discovery">Discovery</button>
            </div>
            <div id="${p.id}-overview" class="tab-content active" role="tabpanel">
              <div class="fun-fact-card">
                <p class="ff-label">✦ Fun Fact</p>
                <p>${p.funFact}</p>
              </div>
              <p style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:0.75rem;letter-spacing:0.05em">
                Compare with Earth: <span style="color:rgba(255,255,255,0.6)">${p.compareEarth}</span>
              </p>
            </div>
            <div id="${p.id}-moons" class="tab-content" role="tabpanel">${moonsHTML}</div>
            <div id="${p.id}-missions" class="tab-content" role="tabpanel">${missionsHTML}</div>
            <div id="${p.id}-discovery" class="tab-content" role="tabpanel">
              <p style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.65">${p.discovery}</p>
              <div style="margin-top:0.75rem;padding:0.75rem;background:rgba(106,92,255,0.06);border:1px solid rgba(106,92,255,0.15);border-radius:10px">
                <p style="font-size:11px;font-family:'Orbitron',sans-serif;letter-spacing:0.2em;color:rgba(106,92,255,0.8);margin-bottom:0.3rem">COMPOSITION</p>
                <p style="font-size:12px;color:rgba(255,255,255,0.5)">${p.composition.join(' · ')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.appendChild(section);
  });
}

// ── Missions HTML ────────────────────────────────────────────
function buildMissions() {
  advanceLoading(50, LOADING_STEPS[2]);
  const grid = document.getElementById('missions-grid');
  MISSIONS.forEach(m => {
    const card = document.createElement('div');
    card.className = 'mission-card reveal';
    const isComplete = m.status.includes('Complete');
    card.innerHTML = `
      <span class="mc-status${isComplete ? ' complete' : ''}">${isComplete ? '✓ COMPLETE' : '⦿ ACTIVE'}</span>
      <div class="mc-name">${m.name}</div>
      <div class="mc-agency">${m.agency} · ${m.launched}</div>
      <p class="mc-desc">${m.description}</p>
      <div class="mc-targets">${m.targets.map(t => `<span class="mc-target">${t}</span>`).join('')}</div>
      <div class="mc-highlight">${m.highlight}</div>
    `;
    grid.appendChild(card);
  });
}

// ── Timeline ─────────────────────────────────────────────────
const TIMELINE_EVENTS = [
  { year: '4.6 Bya', event: 'Formation of the Solar System', desc: 'A cloud of gas and dust collapses under gravity, forming the Sun and protoplanetary disk.' },
  { year: '3000 BCE', event: 'Ancient Astronomy', desc: 'Babylonians and Egyptians track planetary movements, creating the first star catalogs.' },
  { year: '270 BCE', event: 'Aristarchus — Heliocentric Model', desc: 'Ancient Greek astronomer proposes the Sun is at the center of the Solar System, 1800 years ahead of his time.' },
  { year: '1543', event: 'Copernican Revolution', desc: 'Nicolaus Copernicus publishes his heliocentric model of the Solar System in De revolutionibus.' },
  { year: '1610', event: 'Galileo\'s Telescope Discoveries', desc: 'Galileo discovers Jupiter\'s moons, Saturn\'s rings, and phases of Venus, confirming heliocentrism.' },
  { year: '1687', event: 'Newton\'s Law of Gravitation', desc: 'Isaac Newton publishes Principia Mathematica, explaining planetary motion through universal gravitation.' },
  { year: '1846', event: 'Neptune Discovered', desc: 'Neptune predicted mathematically by Adams and Le Verrier, then discovered by Galle exactly where predicted.' },
  { year: '1957', event: 'Space Age Begins', desc: 'Soviet Union launches Sputnik 1 — the first artificial satellite to orbit Earth.' },
  { year: '1969', event: 'Humans on the Moon', desc: 'Apollo 11 lands Neil Armstrong and Buzz Aldrin on the Moon — humanity\'s greatest exploratory achievement.' },
  { year: '1977', event: 'Voyager Grand Tour', desc: 'Voyager 1 & 2 launched to explore the outer Solar System using a rare planetary alignment.' },
  { year: '1990', event: 'Hubble Space Telescope', desc: 'Hubble begins its mission, transforming our view of the universe with unprecedented deep-field images.' },
  { year: '2006', event: 'Pluto Reclassified', desc: 'IAU redefines "planet," demoting Pluto to dwarf planet status after Eris is discovered.' },
  { year: '2021', event: 'James Webb Space Telescope', desc: 'JWST launched — the most powerful telescope ever built, able to see 13.5 billion years into the past.' },
  { year: '2030s', event: 'Humans to Mars', desc: 'NASA\'s Artemis program and SpaceX plan crewed missions to return to the Moon and travel to Mars.' },
];

function buildTimeline() {
  const list = document.getElementById('timeline-list');
  TIMELINE_EVENTS.forEach((ev, i) => {
    const item = document.createElement('div');
    item.className = 'tl-item reveal';
    item.style.transitionDelay = `${i * 0.05}s`;
    item.innerHTML = `
      <div class="tl-dot" style="box-shadow:0 0 ${i === TIMELINE_EVENTS.length-1 ? 14 : 8}px var(--cyan);${i===TIMELINE_EVENTS.length-1?'background:var(--mint)':''}"></div>
      <div class="tl-year">${ev.year}</div>
      <div class="tl-event">${ev.event}</div>
      <p class="tl-desc">${ev.desc}</p>
    `;
    list.appendChild(item);
  });
}

// ── Intersect / Reveal ───────────────────────────────────────
// ── Singleton reveal observer — call observeNewRevealElements() anytime ──────
let _revealObserver = null;

function initReveal() {
  if (_revealObserver) return; // already initialised

  _revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      // Animate hab bars
      const habFill = entry.target.querySelector?.('.hab-fill');
      if (habFill) {
        const pct = habFill.dataset.hab || 0;
        setTimeout(() => { habFill.style.width = pct + '%'; }, 400);
      }
      // edu-card bar fills
      const eduFill = entry.target.querySelector?.('.edu-card-bar-fill');
      if (eduFill) {
        setTimeout(() => { eduFill.style.width = '100%'; }, 300);
      }
      if (!entry.target.classList.contains('tl-item')) {
        _revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  _observeAllReveal();
}

function _observeAllReveal() {
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
    _revealObserver.observe(el);
  });
}

// Call this after injecting new .reveal elements into the DOM
function observeNewRevealElements() {
  if (!_revealObserver) return;
  _observeAllReveal();
}

// ── Tabs ─────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.planet-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.tab;
      const parent = tab.closest('.planet-info');
      parent.querySelectorAll('.planet-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      parent.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      parent.querySelector('#' + targetId)?.classList.add('active');
    });
  });
}

// ── Nav active state ─────────────────────────────────────────
function initNav() {
  const navbar = document.getElementById('navbar');
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('section[id]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navItems.forEach(a => a.classList.remove('active'));
        const link = document.querySelector(`.nav-item[href="#${entry.target.id}"]`);
        if (link) link.classList.add('active');
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(s => observer.observe(s));

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  }, { passive: true });
}

// ── Planet Renderers ─────────────────────────────────────────
const planetRenderers = [];

function initPlanetRenderers() {
  advanceLoading(70, LOADING_STEPS[3]);

  const rendererObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const canvas = entry.target;
      const pid = canvas.id.replace('planet-canvas-', '');
      const planet = PLANETS.find(p => p.id === pid);
      if (!planet) return;
      if (entry.isIntersecting) {
        if (!canvas._renderer) {
          canvas._renderer = new PlanetRenderer(canvas, planet);
          planetRenderers.push(canvas._renderer);
        }
        canvas._renderer.start();
      } else {
        canvas._renderer?.stop();
      }
    });
  }, { rootMargin: '200px' });

  document.querySelectorAll('[id^="planet-canvas-"]').forEach(c => rendererObs.observe(c));
}

// ── Hero Solar System ────────────────────────────────────────
function initHeroSolar() {
  advanceLoading(80, LOADING_STEPS[4]);
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const solar = new SolarSystemRenderer(canvas);
  solar.start();

  // ── Simulation Control Event Listeners ──
  const playBtn = document.getElementById('sim-play');
  const speedSlider = document.getElementById('sim-speed');
  const speedVal = document.getElementById('sim-speed-val');
  const trailsBtn = document.getElementById('sim-trails');

  playBtn?.addEventListener('click', () => {
    const isPlaying = solar.togglePlay();
    if (playBtn) {
      playBtn.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
      playBtn.classList.toggle('paused', !isPlaying);
    }
  });

  speedSlider?.addEventListener('input', (e) => {
    const val = e.target.value;
    solar.setSpeed(val);
    if (speedVal) speedVal.textContent = parseFloat(val).toFixed(1) + 'x';
  });

  trailsBtn?.addEventListener('click', () => {
    const showTrails = solar.toggleTrails();
    if (trailsBtn) {
      trailsBtn.classList.toggle('active', showTrails);
    }
  });

  const hoverCard = document.getElementById('planet-hover-card');
  const phcName = document.getElementById('phc-name');
  const phcType = document.getElementById('phc-type');
  const phcStat = document.getElementById('phc-stat');

  canvas.style.pointerEvents = 'auto';
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const planet = solar.hitTest(mx, my);
    if (planet) {
      solar.hovered = planet.id;
      canvas.style.cursor = 'pointer';
      hoverCard.classList.add('visible');
      phcName.textContent = planet.name;
      phcType.textContent = planet.type;
      const fullPlanet = PLANETS.find(p => p.id === planet.id);
      phcStat.textContent = fullPlanet ? `Orbit: ${fullPlanet.stats.orbitalPeriod}` : '';
      hoverCard.style.left = (e.clientX + 16) + 'px';
      hoverCard.style.top  = (e.clientY - 20) + 'px';
    } else {
      solar.hovered = null;
      canvas.style.cursor = 'default';
      hoverCard.classList.remove('visible');
    }
  });

  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const planet = solar.hitTest(e.clientX - rect.left, e.clientY - rect.top);
    if (planet) {
      document.getElementById(planet.id)?.scrollIntoView({ behavior: 'smooth' });
    }
  });

  canvas.addEventListener('mouseleave', () => {
    solar.hovered = null;
    hoverCard.classList.remove('visible');
  });

  window.addEventListener('resize', () => {
    solar.resize();
    solar.CX = solar.W / 2;
    solar.CY = solar.H / 2;
  }, { passive: true });
}

// ── Starfield ────────────────────────────────────────────────
let starfield;
function initStarfield() {
  const canvas = document.getElementById('starfield-canvas');
  starfield = new Starfield(canvas);
  starfield.start();
  window.addEventListener('resize', () => starfield.resize(), { passive: true });
}

// ── Footer Stars ─────────────────────────────────────────────
function initFooterStars() {
  const canvas = document.getElementById('footer-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  const stars = Array.from({ length: 200 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1 + 0.2,
    p: Math.random() * Math.PI * 2,
    s: Math.random() * 0.02 + 0.005,
  }));
  (function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      s.p += s.s;
      ctx.globalAlpha = 0.2 + 0.5 * Math.abs(Math.sin(s.p));
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  })();
}

// ── Facts Generator ──────────────────────────────────────────
function initFacts() {
  const factText = document.getElementById('fact-text');
  const factBtn  = document.getElementById('fact-btn');
  let idx = -1;
  factBtn?.addEventListener('click', () => {
    idx = (idx + 1) % SOLAR_SYSTEM_FACTS.length;
    factText.style.opacity = '0';
    factText.style.transform = 'translateY(10px)';
    setTimeout(() => {
      factText.textContent = SOLAR_SYSTEM_FACTS[idx];
      factText.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      factText.style.opacity = '1';
      factText.style.transform = 'translateY(0)';
    }, 200);
  });
}

// ── Fullscreen iframe ─────────────────────────────────────────
function initFullscreen() {
  document.getElementById('fullscreen-btn')?.addEventListener('click', () => {
    const iframe = document.querySelector('#live iframe');
    if (iframe?.requestFullscreen) iframe.requestFullscreen();
    else if (iframe?.webkitRequestFullscreen) iframe.webkitRequestFullscreen();
  });
}

// ── Intro → Main ──────────────────────────────────────────────
function initIntro() {
  const intro  = document.getElementById('intro-screen');
  const main   = document.getElementById('main-site');
  const navbar = document.getElementById('navbar');

  // Enable pointer events on buttons after fade-in animation completes (1.4s delay + 1s duration)
  const cta = intro?.querySelector('.intro-cta');
  if (cta) {
    setTimeout(() => cta.classList.add('ready'), 2500);
  }

  let galleryInited = false;
  function initGalleryOnce() {
    if (galleryInited) return;
    galleryInited = true;
    const galleryContainer = document.getElementById('gallery-container');
    if (galleryContainer) {
      try { new NASAGallery(galleryContainer); } catch (e) { console.warn('Gallery init:', e); }
    }
  }

  function launch() {
    intro.classList.add('exit');
    initGalleryOnce();
    setTimeout(() => {
      intro.style.display = 'none';
      main.classList.add('visible');
      navbar.classList.add('visible');
      initHeroSolar();
      document.getElementById('hero').scrollIntoView({ behavior: 'smooth' });
    }, 1200);
  }

  document.getElementById('begin-btn')?.addEventListener('click', launch);
  document.getElementById('explore-btn')?.addEventListener('click', () => {
    launch();
    setTimeout(() => {
      document.getElementById('planets-container')?.scrollIntoView({ behavior: 'smooth' });
    }, 1500);
  });
}

// ── Ambient Audio — Violin music + tiny on/off button ────────
function initAudio() {
  const audio = new AmbientAudio();
  let musicStarted = false;
  let startPending = false;
  let isPlaying    = true; // optimistic: will be true once started

  /* ── Tiny floating on/off button ── */
  const btn = document.createElement('button');
  btn.id = 'music-toggle-btn';
  btn.setAttribute('aria-label', 'Toggle violin music');
  btn.title = 'Toggle music';
  btn.innerHTML = `
    <svg id="mtb-icon-on" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
    <svg id="mtb-icon-off" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="display:none">
      <line x1="2" y1="2" x2="22" y2="22"/><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  `;

  /* Inline style — tiny, minimal, bottom-left */
  Object.assign(btn.style, {
    position:       'fixed',
    bottom:         '1.5rem',
    left:           '1.5rem',
    zIndex:         '500',
    width:          '34px',
    height:         '34px',
    borderRadius:   '3px',
    background:     'rgba(5,6,14,0.90)',
    border:         '1px solid rgba(255,255,255,0.08)',
    color:          'rgba(255,255,255,0.45)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    cursor:         'pointer',
    transition:     'all 0.28s',
    backdropFilter: 'blur(20px)',
    opacity:        '0',
    pointerEvents:  'none',
  });

  document.body.appendChild(btn);

  /* Show after 2s */
  setTimeout(() => {
    btn.style.opacity      = '1';
    btn.style.pointerEvents = 'all';
  }, 2000);

  /* Hover effect */
  btn.addEventListener('mouseenter', () => {
    btn.style.color       = 'rgba(77,159,255,0.9)';
    btn.style.borderColor = 'rgba(77,159,255,0.3)';
    btn.style.transform   = 'scale(1.08)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.color       = isPlaying
      ? 'rgba(77,159,255,0.65)'
      : 'rgba(255,255,255,0.28)';
    btn.style.borderColor = isPlaying
      ? 'rgba(77,159,255,0.22)'
      : 'rgba(255,255,255,0.07)';
    btn.style.transform   = 'scale(1)';
  });

  /* ── Start music on first user click anywhere ── */
  async function startMusic() {
    if (musicStarted || startPending) return;
    startPending = true;
    try {
      await audio.start();
    } catch (err) {
      console.warn('Cosmic Odyssey — Audio start failed:', err);
      startPending = false;
      return;
    }
    musicStarted = true;
    isPlaying    = true;
    _setOn();

    // Also update any existing launch label
    const launchBtn   = document.getElementById('audio-launch-btn');
    const launchLabel = document.getElementById('audio-launch-label');
    if (launchBtn)   launchBtn.classList.add('playing');
    if (launchLabel) launchLabel.textContent = '♪ Playing';
  }

  /* ── Toggle on click ── */
  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!musicStarted) {
      await startMusic();
      return;
    }
    isPlaying = !isPlaying;
    if (isPlaying) {
      await audio.resume();
      _setOn();
    } else {
      audio.stop();
      _setOff();
    }
  });

  /* ── Auto-start on first interaction anywhere ── */
  const _autoStart = (e) => {
    // Exclude iframe to avoid Cloudflare fingerprinting issues
    if (e.target.closest('iframe, #sss-iframe')) return;
    startMusic();
    document.removeEventListener('click', _autoStart, { capture: true });
  };
  document.addEventListener('click', _autoStart, { capture: true, passive: true });

  /* ── Icon helpers ── */
  function _setOn() {
    document.getElementById('mtb-icon-on').style.display  = '';
    document.getElementById('mtb-icon-off').style.display = 'none';
    btn.style.color       = 'rgba(77,159,255,0.65)';
    btn.style.borderColor = 'rgba(77,159,255,0.22)';
    btn.setAttribute('aria-label', 'Pause violin music');
  }

  function _setOff() {
    document.getElementById('mtb-icon-on').style.display  = 'none';
    document.getElementById('mtb-icon-off').style.display = '';
    btn.style.color       = 'rgba(255,255,255,0.28)';
    btn.style.borderColor = 'rgba(255,255,255,0.07)';
    btn.setAttribute('aria-label', 'Play violin music');
  }
}

// ── Iframe load guard — detect Cloudflare challenge & activate fallback ──
function initIframeGuard() {
  const iframe   = document.getElementById('sss-iframe');
  const fallback = document.getElementById('sss-fallback');
  if (!iframe || !fallback) return;

  let checkCount = 0;

  function showFallback() {
    iframe.style.display   = 'none';
    fallback.style.display = 'flex';
  }

  function checkIframeContent() {
    try {
      // If we can access contentDocument, the iframe is same-origin or errored.
      // Cross-origin success means contentDocument is null but no error is thrown.
      const doc = iframe.contentDocument;
      if (doc && doc.title) {
        const title = doc.title.toLowerCase();
        // Cloudflare challenge pages have known title patterns
        if (
          title.includes('just a moment') ||
          title.includes('captcha') ||
          title.includes('attention required') ||
          title.includes('checking your browser') ||
          title.includes('ray id')
        ) {
          showFallback();
        }
      }
    } catch {
      // Cross-origin block = iframe loaded correctly (expected behaviour).
      // Do nothing — this is the success path.
    }
  }

  iframe.addEventListener('load', () => {
    // Give Cloudflare JS challenge time to redirect if it's going to
    checkCount = 0;
    setTimeout(checkIframeContent, 2500);
  });

  iframe.addEventListener('error', () => {
    showFallback();
  });

  // Secondary poll: if after 12s the iframe src is still the challenge page
  // (some Cloudflare challenges redirect without firing a second load event)
  const poll = setInterval(() => {
    checkCount++;
    checkIframeContent();
    if (checkCount >= 3) clearInterval(poll);
  }, 4000);
}

// ── Keyboard accessibility ────────────────────────────────────
function initKeyboard() {
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.activeElement.id === 'begin-btn') {
      document.getElementById('begin-btn').click();
    }
  });
}

// ── Main Boot ────────────────────────────────────────────────
async function boot() {
  // _hideLoader is always called — even if something earlier throws.
  const _hideLoader = () => {
    const loader = document.getElementById('loading-screen');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(() => { try { loader.remove(); } catch (_) {} }, 850);
    }
  };

  try {
    buildDOM();
    buildPlanets();
    buildMissions();
    buildTimeline();

    // NOTE: NASAGallery is initialised in initIntro() launch() — NOT here.
    // Initialising it here caused #gallery-lightbox to exist in the DOM during
    // the intro screen, intercepting all clicks via #glb-info.
    try { buildEducation(); } catch (e) { console.warn('Education init:', e); }

    // Calculator & Compare
    const calcEl = document.getElementById('calc-inner');
    const cmpEl  = document.getElementById('compare-inner');
    if (calcEl) buildCalculator(calcEl, PLANETS);
    if (cmpEl)  buildCompare(cmpEl, PLANETS);

    // Quiz
    const quizCard = document.getElementById('quiz-card');
    if (quizCard) new QuizComponent(quizCard);

    advanceLoading(85, LOADING_STEPS[4]);
    initStarfield();
    initPlanetRenderers();
    initReveal();
    initTabs();
    initNav();
    initFacts();
    initKeyboard();

    advanceLoading(100, LOADING_STEPS[5]);

    // Short pause so loading bar is visible at 100%, then hide loader
    await new Promise(r => setTimeout(r, 600));

  } catch (err) {
    console.error('Cosmic Odyssey boot error:', err);
  } finally {
    // Always remove loading screen — even if boot() threw
    _hideLoader();
  }

  // These run after loader is hidden — safe even if boot had partial errors
  initIntro();
  initFullscreen();
  initAudio();
  initIframeGuard();

  setTimeout(initFooterStars, 500);

  setTimeout(() => {
    try { new PlanetSearch(); } catch (e) { console.warn('Search init:', e); }
    try { new FavoritesSystem(); } catch (e) { console.warn('Favorites init:', e); }

    const missionsGrid = document.getElementById('missions-grid');
    if (missionsGrid) ScrollAnimator.staggerReveal(missionsGrid, '.mission-card', 60);

    try {
      const sounds = new PlanetSounds();
      const pst = document.createElement('button');
      pst.id = 'planet-sound-toggle';
      pst.setAttribute('aria-label', 'Toggle planet sounds');
      pst.innerHTML = `<span style="font-size:13px">🔔</span><span style="font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:0.2em;color:rgba(255,255,255,0.4);text-transform:uppercase" id="pst-label">Planet Sounds On</span>`;
      document.body.appendChild(pst);
      pst.addEventListener('click', () => {
        const enabled = sounds.toggle();
        const icon  = pst.querySelector('span:first-child');
        const label = document.getElementById('pst-label');
        if (icon)  icon.textContent = enabled ? '🔔' : '🔕';
        if (label) label.textContent = enabled ? 'Planet Sounds On' : 'Planet Sounds Off';
        pst.style.borderColor = enabled
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(255,107,107,0.25)';
      });
    } catch (e) { console.warn('PlanetSounds init:', e); }

    observeNewRevealElements();
  }, 200);
}

// ── Kick off ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', boot);
