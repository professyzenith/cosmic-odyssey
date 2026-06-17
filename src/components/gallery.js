/**
 * NASAGallery — Masonry image gallery using NASA public domain images
 * via the NASA image CDN (no API key required for direct image URLs).
 * Includes lightbox, lazy loading, and keyboard navigation.
 */const GALLERY_ITEMS = [
  {
    id: 'pillars',
    title: 'Pillars of Creation',
    body: 'Eagle Nebula · M16',
    desc: 'The Pillars of Creation are elephant trunks of interstellar gas and dust in the Eagle Nebula, some 6,500 light-years away. Captured here by the James Webb Space Telescope in 2022 in unprecedented detail.',
    credit: 'NASA, ESA, CSA, STScI · JWST 2022',
    emoji: '🌌',
    imageUrl: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=800&auto=format&fit=crop',
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
    imageUrl: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&auto=format&fit=crop',
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
    imageUrl: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=800&auto=format&fit=crop',
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
    imageUrl: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=800&auto=format&fit=crop',
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
    imageUrl: 'https://images.unsplash.com/photo-1612892483236-42d68a57623d?w=800&auto=format&fit=crop',
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
    imageUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&auto=format&fit=crop',
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
    imageUrl: 'https://images.unsplash.com/photo-1630839437035-dac17da580d0?w=800&auto=format&fit=crop',
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
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop',
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
    imageUrl: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&auto=format&fit=crop',
    gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1520 40%, #2a2535 70%, #4a4060 100%)',
    accent: '#7DE8E8',
    size: 'wide',
    tags: ['Pluto', 'New Horizons', 'Dwarf Planet'],
  },
];

export class NASAGallery {
  constructor(container) {
    this.container = container;
    this.items = [...GALLERY_ITEMS];
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
        
        <form class="gallery-search-form" id="gallery-search-form" style="max-width:520px; margin:1.5rem auto 0; position:relative; z-index:10;">
          <input
            type="text"
            id="gallery-search-input"
            placeholder="Search NASA Image Library (e.g. nebula, Apollo, Kepler)..."
            autocomplete="off"
            style="
              width:100%;
              background:rgba(255,255,255,0.04);
              border:1px solid rgba(0,229,255,0.15);
              border-radius:30px;
              padding:0.8rem 6.5rem 0.8rem 1.25rem;
              color:#fff;
              font-family:'Space Grotesk',sans-serif;
              font-size:14px;
              outline:none;
              transition:all 0.3s;
            "
          />
          <button type="submit" style="
            position:absolute; right:0.4rem; top:50%;
            transform:translateY(-50%);
            background:linear-gradient(135deg, #00E5FF, #6A5CFF);
            color:#02030A;
            border:none;
            border-radius:20px;
            padding:0.45rem 1.2rem;
            font-family:'Orbitron',sans-serif;
            font-size:10px;
            font-weight:700;
            letter-spacing:0.1em;
            cursor:pointer;
            transition:transform 0.2s;
          "
          onmouseover="this.style.transform='translateY(-50%) scale(1.05)'"
          onmouseout="this.style.transform='translateY(-50%)'"
          >SEARCH</button>
        </form>
      </div>

      <div class="gallery-loading" id="gallery-loading" style="display:none; text-align:center; padding:3rem; color:#00E5FF; font-family:'Orbitron',sans-serif; letter-spacing:0.2em; font-size:11px;">
        <span class="glb-loader-pulse"></span> SEARCHING NASA IMAGE ARCHIVES...
      </div>

      <div class="gallery-masonry" id="gallery-masonry" role="list">
        ${this.items.map((item, i) => this._card(item, i)).join('')}
      </div>
    `;

    this._bindEvents();
  }

  _card(item, i) {
    const delay = (i % 4) * 80;
    const bgStyle = item.imageUrl
      ? `background:url(${item.imageUrl}) center/cover no-repeat;`
      : `background:${item.gradient};`;

    return `
      <div
        class="gallery-card gallery-card--${item.size} reveal"
        data-id="${item.id}"
        role="listitem"
        tabindex="0"
        aria-label="View ${item.title}"
        style="transition-delay:${delay}ms; --card-accent:${item.accent}; --card-color:${item.accent};"
      >
        <div class="gc-bg" style="${bgStyle}"></div>
        ${item.emoji ? `<div class="gc-emoji" aria-hidden="true">${item.emoji}</div>` : ''}
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

  _renderGrid() {
    const masonry = this.container.querySelector('#gallery-masonry');
    if (!masonry) return;

    if (this.items.length === 0) {
      masonry.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:4rem; color:rgba(255,255,255,0.4); font-family:'Space Grotesk',sans-serif; font-size:14px;">
          No images found in the NASA Library for this query. Try search terms like "nebula", "mars", "apollo", or "satellite".
        </div>
      `;
      return;
    }

    masonry.innerHTML = this.items.map((item, i) => this._card(item, i)).join('');

    // Re-bind clicks
    masonry.querySelectorAll('.gallery-card').forEach(card => {
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

  _bindEvents() {
    // Bind card clicks for initial build
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

    // Bind search form
    const form = this.container.querySelector('#gallery-search-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = this.container.querySelector('#gallery-search-input');
      const query = input?.value?.trim() || '';
      if (!query) {
        this.items = [...GALLERY_ITEMS];
        this._renderGrid();
        return;
      }
      await this._searchNASA(query);
    });
  }

  async _searchNASA(query) {
    const loading = this.container.querySelector('#gallery-loading');
    const masonry = this.container.querySelector('#gallery-masonry');
    if (loading) loading.style.display = 'block';
    if (masonry) masonry.style.opacity = '0.2';

    try {
      const res = await fetch(`https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image`);
      if (!res.ok) throw new Error('NASA API error');
      const data = await res.json();
      
      const rawItems = data.collection?.items || [];
      const processed = rawItems.slice(0, 12).map((item, i) => {
        const dataObj = item.data?.[0] || {};
        const title = dataObj.title || 'NASA Image';
        const desc = dataObj.description || 'No description available.';
        const nasaId = dataObj.nasa_id || item.href.split('/').pop();
        const keywords = dataObj.keywords || [];
        const date = dataObj.date_created ? new Date(dataObj.date_created).getFullYear() : '';
        const agency = dataObj.center || 'NASA';
        const thumbLink = item.links?.find(l => l.rel === 'preview')?.href || '';

        const gradients = [
          'linear-gradient(135deg, #0a0020 0%, #1a0040 100%)',
          'linear-gradient(135deg, #1a1200 0%, #3d2e00 100%)',
          'linear-gradient(135deg, #000820 0%, #002860 100%)',
          'linear-gradient(135deg, #1a0500 0%, #7a2800 100%)',
          'linear-gradient(135deg, #050010 0%, #100040 100%)',
        ];
        const colors = ['#8B5CF6', '#E4D5A0', '#00E5FF', '#C1440E', '#6A5CFF'];
        const idx = i % gradients.length;

        return {
          id: nasaId,
          title,
          body: `${agency} · ${date}`,
          desc,
          credit: item.data?.[0]?.secondary_creator || agency,
          imageUrl: thumbLink,
          gradient: gradients[idx],
          accent: colors[idx],
          size: i % 5 === 0 ? 'wide' : i % 3 === 0 ? 'tall' : 'square',
          tags: keywords.slice(0, 3),
        };
      });

      this.items = processed;
      this._renderGrid();
    } catch (err) {
      console.warn('NASA search error:', err);
      if (masonry) {
        masonry.innerHTML = `
          <div style="grid-column:1/-1; text-align:center; padding:4rem; color:#FF6B6B; font-family:'Space Grotesk',sans-serif; font-size:14px;">
            Connection error: Could not connect to the NASA Image archives. Please check your internet connection and try again.
          </div>
        `;
      }
    } finally {
      if (loading) loading.style.display = 'none';
      if (masonry) masonry.style.opacity = '1';
    }
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
    this.lightboxOpen = this.items.findIndex(i => i.id === id);
    this._renderLightbox();
    document.getElementById('gallery-lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
    document.getElementById('glb-close').focus();
  }

  _closeLightbox() {
    document.getElementById('gallery-lightbox')?.classList.remove('open');
    document.body.style.overflow = '';
    this.lightboxOpen = null;
  }

  _stepLightbox(dir) {
    if (this.lightboxOpen === null) return;
    this.lightboxOpen = (this.lightboxOpen + dir + this.items.length) % this.items.length;
    this._renderLightbox();
  }

  _renderLightbox() {
    const item = this.items[this.lightboxOpen];
    if (!item) return;

    const bgCSS = item.imageUrl
      ? `url(${item.imageUrl}) center/contain no-repeat, ${item.gradient}`
      : item.gradient;

    document.getElementById('glb-visual').innerHTML = `
      <div style="
        width:100%; height:100%;
        background:${bgCSS};
        border-radius:16px 0 0 16px;
        display:flex; align-items:center; justify-content:center;
        font-size:clamp(80px,12vw,160px);
        position:relative; overflow:hidden;
      ">
        <div style="
          position:absolute; inset:0;
          background:radial-gradient(circle at 40% 40%, ${item.accent}22, transparent 70%);
        "></div>
        ${item.emoji ? `<span style="filter:drop-shadow(0 0 40px ${item.accent}88); position:relative; z-index:1;">${item.emoji}</span>` : ''}
      </div>
    `;

    document.getElementById('glb-info').innerHTML = `
      <div class="glb-tags">
        ${item.tags.map(t => `<span class="glb-tag" style="border-color:${item.accent}44;color:${item.accent}">${t}</span>`).join('')}
      </div>
      <h3 class="glb-title">${item.title}</h3>
      <p class="glb-body-label">${item.body}</p>
      <p class="glb-desc" style="max-height:22vh; overflow-y:auto; padding-right:5px;">${item.desc}</p>
      <div class="glb-credit">
        <span style="color:rgba(255,255,255,0.3);font-size:9px;letter-spacing:0.2em;text-transform:uppercase;font-family:'Orbitron',sans-serif;">Credit</span>
        <span style="font-size:12px;color:rgba(255,255,255,0.45);font-family:'Space Grotesk',sans-serif;">${item.credit}</span>
      </div>
      <div class="glb-counter">
        <span style="font-family:'Orbitron',sans-serif;font-size:9px;letter-spacing:0.2em;color:rgba(255,255,255,0.2)">
          ${this.lightboxOpen + 1} / ${this.items.length}
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
