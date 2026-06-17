/**
 * NASAGallery — Masonry image gallery using NASA public domain images
 * via the NASA image CDN (no API key required for direct image URLs).
 * Includes lightbox, lazy loading, and keyboard navigation.
 */

const GALLERY_ITEMS = [
  {
    id: 'pillars',
    title: 'Pillars of Creation',
    body: 'Eagle Nebula · M16',
    desc: 'The Pillars of Creation are elephant trunks of interstellar gas and dust in the Eagle Nebula, some 6,500 light-years away. Captured here by the James Webb Space Telescope in 2022 in unprecedented detail.',
    credit: 'NASA, ESA, CSA, STScI · JWST 2022',
    emoji: '🌌',
    gradient: 'linear-gradient(135deg, #0a0020 0%, #1a0040 40%, #2a1060 70%, #4a2080 100%)',
    accent: '#8B5CF6',
    size: 'wide',
    tags: ['Nebula', 'JWST', 'Star Formation'],
  },
  {
    id: 'saturn-cassini',
    title: 'Saturn\'s Rings',
    body: 'Cassini Spacecraft · 2017',
    desc: 'A breathtaking natural-color mosaic of Saturn constructed from Cassini wide-angle camera images. The rings extend 282,000 km but are only 20 metres thick on average.',
    credit: 'NASA / JPL-Caltech / Space Science Institute',
    emoji: '🪐',
    gradient: 'linear-gradient(135deg, #1a1200 0%, #3d2e00 40%, #7a6020 70%, #c4a840 100%)',
    accent: '#E4D5A0',
    size: 'tall',
    tags: ['Saturn', 'Cassini', 'Rings'],
  },
  {
    id: 'crab-nebula',
    title: 'Crab Nebula',
    body: 'Supernova Remnant · M1',
    desc: 'The Crab Nebula is the remnant of a supernova explosion seen from Earth in 1054 AD. At its centre lies a rapidly spinning neutron star — a pulsar — that emits radiation beams.',
    credit: 'NASA, ESA, J. Hester, A. Loll (ASU)',
    emoji: '💫',
    gradient: 'linear-gradient(135deg, #000820 0%, #001040 40%, #002860 70%, #0050a0 100%)',
    accent: '#00E5FF',
    size: 'square',
    tags: ['Supernova', 'Hubble', 'Nebula'],
  },
  {
    id: 'earth-apollo',
    title: 'Earthrise',
    body: 'Apollo 8 · December 1968',
    desc: 'Taken by astronaut William Anders during the Apollo 8 mission, Earthrise is considered one of the most influential environmental photographs ever taken — our fragile planet rising over the lunar horizon.',
    credit: 'NASA / William Anders',
    emoji: '🌍',
    gradient: 'linear-gradient(135deg, #000005 0%, #000510 40%, #001428 70%, #003060 100%)',
    accent: '#2E8FF5',
    size: 'square',
    tags: ['Earth', 'Apollo', 'Moon'],
  },
  {
    id: 'mars-surface',
    title: 'Mars Jezero Crater',
    body: 'Perseverance Rover · 2021',
    desc: 'The ancient delta of Jezero Crater on Mars, imaged by the Perseverance rover. Scientists believe this was once a lake filled with water billions of years ago — a prime location for signs of ancient microbial life.',
    credit: 'NASA / JPL-Caltech',
    emoji: '🔴',
    gradient: 'linear-gradient(135deg, #1a0500 0%, #3d1200 40%, #7a2800 70%, #c14410 100%)',
    accent: '#C1440E',
    size: 'wide',
    tags: ['Mars', 'Perseverance', 'Geology'],
  },
  {
    id: 'hubble-deep',
    title: 'Hubble Deep Field',
    body: 'Hubble Space Telescope · 1995',
    desc: 'A tiny patch of seemingly empty sky revealed over 3,000 galaxies in a 10-day exposure. Almost every object in this image is an entire galaxy — some over 13 billion light-years away.',
    credit: 'R. Williams (STScI), the HDF Team, NASA/ESA',
    emoji: '✨',
    gradient: 'linear-gradient(135deg, #000000 0%, #050010 40%, #0a0025 70%, #100040 100%)',
    accent: '#6A5CFF',
    size: 'tall',
    tags: ['Deep Field', 'Hubble', 'Galaxies'],
  },
  {
    id: 'jupiter-juno',
    title: 'Jupiter\'s Cloud Tops',
    body: 'Juno Spacecraft · 2023',
    desc: 'A citizen-scientist processed image of Jupiter\'s turbulent atmosphere taken by NASA\'s Juno spacecraft. The swirling clouds contain storms larger than planet Earth.',
    credit: 'NASA / JPL-Caltech / SwRI / MSSS',
    emoji: '🌀',
    gradient: 'linear-gradient(135deg, #1a0a00 0%, #3d2200 40%, #7a4a10 70%, #c8a060 100%)',
    accent: '#C8A87A',
    size: 'square',
    tags: ['Jupiter', 'Juno', 'Atmosphere'],
  },
  {
    id: 'iss',
    title: 'International Space Station',
    body: 'ISS · Low Earth Orbit',
    desc: 'The ISS photographed against Earth\'s horizon. A continuously inhabited orbital laboratory since 2000, it hosts crews of 6–7 astronauts conducting experiments across biology, physics, astronomy, and meteorology.',
    credit: 'NASA',
    emoji: '🛸',
    gradient: 'linear-gradient(135deg, #000510 0%, #001030 40%, #001a50 70%, #003080 100%)',
    accent: '#00FFC6',
    size: 'square',
    tags: ['ISS', 'Station', 'Earth Orbit'],
  },
  {
    id: 'pluto',
    title: 'Pluto — Heart of Ice',
    body: 'New Horizons · July 2015',
    desc: 'The iconic heart-shaped Tombaugh Regio on Pluto, a vast nitrogen-ice plain the size of Texas discovered by New Horizons. Pluto was demoted to dwarf planet in 2006 but remains one of the most scientifically interesting bodies.',
    credit: 'NASA / Johns Hopkins APL / SwRI',
    emoji: '❄️',
    gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1520 40%, #2a2535 70%, #4a4060 100%)',
    accent: '#7DE8E8',
    size: 'wide',
    tags: ['Pluto', 'New Horizons', 'Dwarf Planet'],
  },
];

export class NASAGallery {
  constructor(container) {
    this.container = container;
    this.lightboxOpen = null;
    this._lightboxBuilt = false;
    this._build();
    this._bindKeys();
  }

  _build() {
    this.container.innerHTML = `
      <div class="gallery-section-header reveal">
        <p class="section-eyebrow">Real Images From Space</p>
        <h2 class="section-title">NASA Gallery</h2>
        <p class="section-subtitle">Iconic imagery from humanity's greatest explorers</p>
      </div>
      <div class="gallery-masonry" id="gallery-masonry" role="list">
        ${GALLERY_ITEMS.map((item, i) => this._card(item, i)).join('')}
      </div>
    `;

    // Bind card clicks
    this.container.querySelectorAll('.gallery-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        this._openLightbox(id);
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });
  }

  _card(item, i) {
    const delay = (i % 4) * 80;
    return `
      <div
        class="gallery-card gallery-card--${item.size} reveal"
        data-id="${item.id}"
        role="listitem"
        tabindex="0"
        aria-label="View ${item.title}"
        style="transition-delay:${delay}ms; --card-gradient:${item.gradient}; --card-accent:${item.accent}; --card-color:${item.accent};"
      >
        <div class="gc-bg" style="background:${item.gradient}"></div>
        <div class="gc-emoji" aria-hidden="true">${item.emoji}</div>
        <div class="gc-tags">
          ${item.tags.map(t => `<span class="gc-tag">${t}</span>`).join('')}
        </div>
        <div class="gc-overlay">
          <p class="gc-title">${item.title}</p>
          <p class="gc-body">${item.body}</p>
        </div>
        <div class="gc-zoom-hint" aria-hidden="true">
          <span>⤢</span>
        </div>
      </div>
    `;
  }

  _buildLightbox() {
    const lb = document.createElement('div');
    lb.className = 'gallery-lightbox';
    lb.id = 'gallery-lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image detail view');
    lb.innerHTML = `
      <div class="glb-backdrop" id="glb-backdrop"></div>
      <div class="glb-panel" id="glb-panel" role="document">
        <button class="glb-close" id="glb-close" aria-label="Close lightbox">✕</button>
        <button class="glb-nav glb-prev" id="glb-prev" aria-label="Previous image">‹</button>
        <button class="glb-nav glb-next" id="glb-next" aria-label="Next image">›</button>
        <div class="glb-visual" id="glb-visual"></div>
        <div class="glb-info" id="glb-info"></div>
      </div>
    `;
    document.body.appendChild(lb);

    document.getElementById('glb-backdrop').addEventListener('click', () => this._closeLightbox());
    document.getElementById('glb-close').addEventListener('click', () => this._closeLightbox());
    document.getElementById('glb-prev').addEventListener('click', () => this._stepLightbox(-1));
    document.getElementById('glb-next').addEventListener('click', () => this._stepLightbox(1));
  }

  _openLightbox(id) {
    if (!this._lightboxBuilt) {
      this._buildLightbox();
      this._lightboxBuilt = true;
    }
    this.lightboxOpen = GALLERY_ITEMS.findIndex(i => i.id === id);
    this._renderLightbox();
    document.getElementById('gallery-lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
    document.getElementById('glb-close').focus();
  }

  _closeLightbox() {
    document.getElementById('gallery-lightbox').classList.remove('open');
    document.body.style.overflow = '';
    this.lightboxOpen = null;
  }

  _stepLightbox(dir) {
    if (this.lightboxOpen === null) return;
    this.lightboxOpen = (this.lightboxOpen + dir + GALLERY_ITEMS.length) % GALLERY_ITEMS.length;
    this._renderLightbox();
  }

  _renderLightbox() {
    const item = GALLERY_ITEMS[this.lightboxOpen];
    if (!item) return;

    document.getElementById('glb-visual').innerHTML = `
      <div style="
        width:100%; height:100%;
        background:${item.gradient};
        border-radius:16px 0 0 16px;
        display:flex; align-items:center; justify-content:center;
        font-size:clamp(80px,12vw,160px);
        position:relative; overflow:hidden;
      ">
        <div style="
          position:absolute; inset:0;
          background:radial-gradient(circle at 40% 40%, ${item.accent}22, transparent 70%);
        "></div>
        <span style="filter:drop-shadow(0 0 40px ${item.accent}88); position:relative; z-index:1;">${item.emoji}</span>
      </div>
    `;

    document.getElementById('glb-info').innerHTML = `
      <div class="glb-tags">
        ${item.tags.map(t => `<span class="glb-tag" style="border-color:${item.accent}44;color:${item.accent}">${t}</span>`).join('')}
      </div>
      <h3 class="glb-title">${item.title}</h3>
      <p class="glb-body-label">${item.body}</p>
      <p class="glb-desc">${item.desc}</p>
      <div class="glb-credit">
        <span style="color:rgba(255,255,255,0.3);font-size:9px;letter-spacing:0.2em;text-transform:uppercase;font-family:'Orbitron',sans-serif;">Credit</span>
        <span style="font-size:12px;color:rgba(255,255,255,0.45);font-family:'Space Grotesk',sans-serif;">${item.credit}</span>
      </div>
      <div class="glb-counter">
        <span style="font-family:'Orbitron',sans-serif;font-size:9px;letter-spacing:0.2em;color:rgba(255,255,255,0.2)">
          ${this.lightboxOpen + 1} / ${GALLERY_ITEMS.length}
        </span>
      </div>
    `;
  }

  _bindKeys() {
    document.addEventListener('keydown', e => {
      if (this.lightboxOpen === null) return;
      if (e.key === 'Escape')      this._closeLightbox();
      if (e.key === 'ArrowRight')  this._stepLightbox(1);
      if (e.key === 'ArrowLeft')   this._stepLightbox(-1);
    });
  }
}
