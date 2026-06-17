import { PLANETS } from '../data/planets.js';

export class PlanetSearch {
  constructor() {
    this.open = false;
    this._buildDOM();
    this._bindEvents();
  }

  _buildDOM() {
    // Search trigger button (injected into navbar)
    this.trigger = document.createElement('button');
    this.trigger.className = 'nav-item';
    this.trigger.setAttribute('aria-label', 'Search planets');
    this.trigger.setAttribute('id', 'search-trigger');
    this.trigger.textContent = '⌕';
    this.trigger.style.cssText = 'font-size:14px;padding:5px 10px;cursor:pointer;background:none;border:none;color:rgba(255,255,255,0.5);';

    const navbar = document.getElementById('navbar');
    if (navbar) navbar.appendChild(this.trigger);

    // Overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'search-overlay';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-label', 'Planet search');
    this.overlay.style.cssText = `
      position:fixed;inset:0;z-index:800;
      background:rgba(2,3,10,0.92);
      backdrop-filter:blur(24px);
      display:flex;flex-direction:column;align-items:center;
      padding-top:15vh;
      opacity:0;pointer-events:none;
      transition:opacity 0.3s ease;
    `;

    this.overlay.innerHTML = `
      <div style="width:min(90vw,640px)">
        <div style="position:relative;margin-bottom:1.5rem">
          <input
            id="search-input"
            type="text"
            placeholder="Search planets, missions, facts..."
            autocomplete="off"
            style="
              width:100%;
              background:rgba(255,255,255,0.06);
              border:1px solid rgba(0,229,255,0.25);
              border-radius:16px;
              padding:1rem 3rem 1rem 1.25rem;
              color:#fff;
              font-family:'Space Grotesk',sans-serif;
              font-size:16px;
              outline:none;
              transition:border-color 0.2s;
            "
          />
          <span style="
            position:absolute;right:1rem;top:50%;
            transform:translateY(-50%);
            font-size:18px;opacity:0.35;
          ">⌕</span>
        </div>
        <div id="search-results" style="
          display:flex;flex-direction:column;gap:0.5rem;
          max-height:50vh;overflow-y:auto;
        "></div>
        <p style="
          font-family:'Orbitron',sans-serif;font-size:9px;
          letter-spacing:0.3em;color:rgba(255,255,255,0.2);
          text-align:center;margin-top:2rem;text-transform:uppercase;
        ">Press ESC to close</p>
      </div>
    `;

    document.body.appendChild(this.overlay);
  }

  _buildResults(query) {
    const container = document.getElementById('search-results');
    if (!container) return;

    const q = query.toLowerCase().trim();

    if (!q) {
      // Default: show all planets
      container.innerHTML = PLANETS.map(p => this._resultCard(p, '')).join('');
      return;
    }

    const results = PLANETS.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q) ||
      p.overview.toLowerCase().includes(q) ||
      p.funFact.toLowerCase().includes(q) ||
      Object.values(p.stats).some(v => String(v).toLowerCase().includes(q)) ||
      p.missions.some(m => m.toLowerCase().includes(q))
    );

    if (results.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:2rem;color:rgba(255,255,255,0.3);
          font-family:'Space Grotesk',sans-serif;font-size:14px;">
          No planets found for "${query}"
        </div>
      `;
      return;
    }

    container.innerHTML = results.map(p => this._resultCard(p, q)).join('');

    // Bind clicks
    container.querySelectorAll('[data-planet-id]').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.planetId;
        this.close();
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        }, 350);
      });
    });
  }

  _resultCard(p, query) {
    const highlight = (text) => {
      if (!query) return text;
      const re = new RegExp(`(${query})`, 'gi');
      return text.replace(re, `<mark style="background:rgba(0,229,255,0.25);color:#00E5FF;border-radius:2px;padding:0 2px">$1</mark>`);
    };

    return `
      <div data-planet-id="${p.id}" style="
        background:rgba(255,255,255,0.04);
        border:1px solid rgba(255,255,255,0.07);
        border-radius:12px;padding:0.85rem 1.1rem;
        cursor:pointer;
        display:grid;grid-template-columns:auto 1fr auto;
        gap:0.75rem;align-items:center;
        transition:all 0.2s;
      "
      onmouseover="this.style.borderColor='rgba(0,229,255,0.35)';this.style.background='rgba(0,229,255,0.06)'"
      onmouseout="this.style.borderColor='rgba(255,255,255,0.07)';this.style.background='rgba(255,255,255,0.04)'"
      >
        <div style="
          width:36px;height:36px;border-radius:50%;
          background:${p.color}22;
          border:2px solid ${p.color}55;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;
        ">
          <div style="width:14px;height:14px;border-radius:50%;background:${p.color};"></div>
        </div>
        <div>
          <div style="font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700;
            color:#fff;margin-bottom:2px;">${highlight(p.name)}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:0.1em;">
            ${highlight(p.type)} · ${p.stats.orbitalPeriod}
          </div>
        </div>
        <div style="font-family:'Space Grotesk',sans-serif;font-size:11px;
          color:rgba(0,229,255,0.6);letter-spacing:0.1em;">
          Hab: ${p.habitability}%
        </div>
      </div>
    `;
  }

  _bindEvents() {
    this.trigger.addEventListener('click', () => this.toggle());

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
      }
    });

    document.getElementById('search-input')?.addEventListener('input', (e) => {
      this._buildResults(e.target.value);
    });
  }

  toggle() { this.open ? this.close() : this.openSearch(); }

  openSearch() {
    this.open = true;
    this.overlay.style.opacity = '1';
    this.overlay.style.pointerEvents = 'all';
    this._buildResults('');
    setTimeout(() => document.getElementById('search-input')?.focus(), 100);
  }

  close() {
    this.open = false;
    this.overlay.style.opacity = '0';
    this.overlay.style.pointerEvents = 'none';
    const input = document.getElementById('search-input');
    if (input) input.value = '';
  }
}
