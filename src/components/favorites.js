import { PLANETS } from '../data/planets.js';

const STORAGE_KEY = 'cosmic-odyssey-favorites';

export class FavoritesSystem {
  constructor() {
    this.favorites = this._load();
    this._injectStyles();
    this._buildPanel();
    this._injectButtons();
    this._updatePanel();
  }

  _load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.favorites));
    } catch {}
  }

  _injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .fav-btn {
        display:inline-flex;align-items:center;gap:0.4rem;
        font-family:'Orbitron',sans-serif;font-size:9px;letter-spacing:0.2em;
        color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.04);
        border:1px solid rgba(255,255,255,0.1);border-radius:20px;
        padding:5px 12px;cursor:pointer;transition:all 0.2s;
        text-transform:uppercase;
      }
      .fav-btn:hover { border-color:rgba(255,184,32,0.5);color:#FFB820; }
      .fav-btn.active { border-color:rgba(255,184,32,0.6);color:#FFB820;background:rgba(255,184,32,0.08); }
      .fav-btn .fav-icon { font-size:12px; transition:transform 0.2s; }
      .fav-btn.active .fav-icon { transform:scale(1.2); }

      #fav-panel {
        position:fixed;bottom:2rem;right:2rem;z-index:300;
        background:rgba(6,8,18,0.92);backdrop-filter:blur(20px);
        border:1px solid rgba(0,229,255,0.15);border-radius:20px;
        padding:1.25rem;width:260px;
        transform:translateY(calc(100% + 2rem));
        transition:transform 0.4s cubic-bezier(0.4,0,0.2,1);
        pointer-events:none;
      }
      #fav-panel.open { transform:translateY(0);pointer-events:all; }

      #fav-toggle {
        position:fixed;bottom:2rem;right:2rem;z-index:301;
        width:50px;height:50px;border-radius:50%;
        background:linear-gradient(135deg,#6A5CFF,#00E5FF);
        border:none;cursor:pointer;
        display:flex;align-items:center;justify-content:center;
        font-size:20px;box-shadow:0 4px 20px rgba(0,229,255,0.3);
        transition:transform 0.2s,box-shadow 0.2s;
      }
      #fav-toggle:hover { transform:scale(1.1);box-shadow:0 6px 30px rgba(0,229,255,0.5); }
      #fav-badge {
        position:absolute;top:-4px;right:-4px;
        width:18px;height:18px;border-radius:50%;
        background:#00FFC6;color:#02030A;
        font-family:'Space Grotesk',sans-serif;font-size:10px;font-weight:700;
        display:flex;align-items:center;justify-content:center;
        opacity:0;transform:scale(0);transition:all 0.2s;
      }
      #fav-badge.visible { opacity:1;transform:scale(1); }
    `;
    document.head.appendChild(style);
  }

  _buildPanel() {
    // Toggle button
    const toggle = document.createElement('button');
    toggle.id = 'fav-toggle';
    toggle.setAttribute('aria-label', 'Toggle favorites panel');
    toggle.innerHTML = `<span>★</span><div id="fav-badge"></div>`;
    document.body.appendChild(toggle);

    // Panel
    const panel = document.createElement('div');
    panel.id = 'fav-panel';
    panel.setAttribute('role', 'complementary');
    panel.setAttribute('aria-label', 'Favorite planets');
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <span style="font-family:'Orbitron',sans-serif;font-size:10px;letter-spacing:0.3em;color:#00E5FF;text-transform:uppercase;">★ Favorites</span>
        <button id="fav-clear" style="font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:0.2em;color:rgba(255,255,255,0.3);background:none;border:none;cursor:pointer;text-transform:uppercase;">Clear All</button>
      </div>
      <div id="fav-list" style="display:flex;flex-direction:column;gap:0.5rem;min-height:60px"></div>
    `;
    document.body.appendChild(panel);

    // Events
    let panelOpen = false;
    toggle.addEventListener('click', () => {
      panelOpen = !panelOpen;
      panel.classList.toggle('open', panelOpen);
      // Shift panel above toggle
      if (panelOpen) panel.style.bottom = '5.5rem';
    });

    document.getElementById('fav-clear')?.addEventListener('click', () => {
      this.favorites = [];
      this._save();
      this._updateAll();
    });

    document.addEventListener('click', (e) => {
      if (panelOpen && !panel.contains(e.target) && e.target !== toggle && !toggle.contains(e.target)) {
        panelOpen = false;
        panel.classList.remove('open');
      }
    });
  }

  _injectButtons() {
    // Add a fav button to each planet section after it's built
    PLANETS.forEach(p => {
      const section = document.getElementById(p.id);
      if (!section) return;
      const info = section.querySelector('.planet-info');
      if (!info) return;

      const btn = document.createElement('button');
      btn.className = `fav-btn${this.favorites.includes(p.id) ? ' active' : ''}`;
      btn.dataset.planetId = p.id;
      btn.setAttribute('aria-label', `${this.favorites.includes(p.id) ? 'Remove' : 'Add'} ${p.name} to favorites`);
      btn.innerHTML = `<span class="fav-icon">${this.favorites.includes(p.id) ? '★' : '☆'}</span> <span class="fav-label">${this.favorites.includes(p.id) ? 'Saved' : 'Bookmark'}</span>`;

      btn.addEventListener('click', () => this.toggle(p.id));
      info.appendChild(btn);
    });
  }

  toggle(planetId) {
    const idx = this.favorites.indexOf(planetId);
    if (idx === -1) {
      this.favorites.push(planetId);
    } else {
      this.favorites.splice(idx, 1);
    }
    this._save();
    this._updateAll();
  }

  _updateAll() {
    this._updatePanel();
    this._updateButtons();
    this._updateBadge();
  }

  _updateButtons() {
    document.querySelectorAll('.fav-btn[data-planet-id]').forEach(btn => {
      const id = btn.dataset.planetId;
      const isFav = this.favorites.includes(id);
      btn.classList.toggle('active', isFav);
      btn.querySelector('.fav-icon').textContent = isFav ? '★' : '☆';
      btn.querySelector('.fav-label').textContent = isFav ? 'Saved' : 'Bookmark';
    });
  }

  _updateBadge() {
    const badge = document.getElementById('fav-badge');
    if (!badge) return;
    badge.textContent = this.favorites.length;
    badge.classList.toggle('visible', this.favorites.length > 0);
  }

  _updatePanel() {
    const list = document.getElementById('fav-list');
    if (!list) return;

    if (this.favorites.length === 0) {
      list.innerHTML = `<p style="font-size:12px;color:rgba(255,255,255,0.3);text-align:center;padding:1rem 0;font-family:'Space Grotesk',sans-serif;">Bookmark planets to save them here</p>`;
      this._updateBadge();
      return;
    }

    list.innerHTML = this.favorites.map(id => {
      const p = PLANETS.find(pl => pl.id === id);
      if (!p) return '';
      return `
        <div style="
          display:flex;align-items:center;gap:0.6rem;
          padding:0.6rem 0.8rem;border-radius:10px;
          background:rgba(255,255,255,0.04);cursor:pointer;
          border:1px solid rgba(255,255,255,0.06);
          transition:all 0.2s;
        "
        onclick="document.getElementById('${p.id}')?.scrollIntoView({behavior:'smooth'})"
        onmouseover="this.style.borderColor='${p.color}44';this.style.background='${p.color}11'"
        onmouseout="this.style.borderColor='rgba(255,255,255,0.06)';this.style.background='rgba(255,255,255,0.04)'"
        >
          <div style="width:28px;height:28px;border-radius:50%;background:${p.color}33;
            border:1.5px solid ${p.color}77;flex-shrink:0;
            display:flex;align-items:center;justify-content:center">
            <div style="width:10px;height:10px;border-radius:50%;background:${p.color}"></div>
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;color:#fff">${p.name}</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.35);letter-spacing:0.1em">${p.type}</div>
          </div>
          <button onclick="event.stopPropagation();window._favToggle('${p.id}')"
            style="background:none;border:none;color:rgba(255,255,255,0.3);cursor:pointer;font-size:14px;padding:2px 4px"
            aria-label="Remove ${p.name} from favorites">✕</button>
        </div>
      `;
    }).join('');

    window._favToggle = (id) => {
      this.toggle(id);
    };

    this._updateBadge();
  }
}
