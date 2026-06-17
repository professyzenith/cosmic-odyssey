// Distances from Sun in million km
export const PLANET_DISTANCES = {
  sun:     0,
  mercury: 57.9,
  venus:   108.2,
  earth:   149.6,
  mars:    227.9,
  jupiter: 778.5,
  saturn:  1432,
  uranus:  2867,
  neptune: 4515,
};

export const PLANET_NAMES_ORDERED = ['sun','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'];

export function calcDistance(fromId, toId) {
  const a = PLANET_DISTANCES[fromId] ?? 0;
  const b = PLANET_DISTANCES[toId] ?? 0;
  const diff = Math.abs(a - b);
  const lightMinutes = diff / (299792.458 * 60 / 1e6);
  return {
    km: diff * 1e6,
    au: diff / 149.6,
    lightMinutes,
  };
}

export function formatNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' billion km';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + ' million km';
  return n.toLocaleString() + ' km';
}

export function buildCalculator(container, planets) {
  const all = [
    { id: 'sun', name: 'Sun' },
    ...planets.map(p => ({ id: p.id, name: p.name }))
  ];

  function html(from, to) {
    const dist = calcDistance(from, to);
    const lm = dist.lightMinutes < 60
      ? dist.lightMinutes.toFixed(1) + ' light-minutes'
      : (dist.lightMinutes / 60).toFixed(2) + ' light-hours';
    const km = formatNum(dist.km);
    const au = dist.au.toFixed(3) + ' AU';

    return `
      <div class="section-header">
        <p class="section-eyebrow">Interactive Tool</p>
        <h2 class="section-title">Distance Calculator</h2>
        <p class="section-subtitle">Calculate distances between planets</p>
      </div>
      <div class="calc-card">
        <div class="calc-selects">
          <select class="calc-select" id="calc-from" onchange="window._calcUpdate()">
            ${all.map(p => `<option value="${p.id}" ${p.id === from ? 'selected' : ''}>${p.name}</option>`).join('')}
          </select>
          <div class="calc-arrow">⇌</div>
          <select class="calc-select" id="calc-to" onchange="window._calcUpdate()">
            ${all.map(p => `<option value="${p.id}" ${p.id === to ? 'selected' : ''}>${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="calc-result" id="calc-result">
          <span class="calc-distance">${dist.km === 0 ? '—' : km}</span>
          <span class="calc-unit">${dist.km === 0 ? 'Same body' : au}</span>
          ${dist.km > 0 ? `<span class="calc-light">Light travel time: ${lm}</span>` : ''}
        </div>
      </div>
    `;
  }

  function update() {
    const from = document.getElementById('calc-from')?.value || 'earth';
    const to   = document.getElementById('calc-to')?.value || 'mars';
    container.innerHTML = html(from, to);
  }

  window._calcUpdate = update;
  container.innerHTML = html('earth', 'mars');
}

export function buildCompare(container, planets) {
  const plist = planets;

  function getStats(p) {
    return {
      Diameter: p.stats.diameter,
      Mass: p.stats.mass,
      Gravity: p.stats.gravity,
      Density: p.stats.density,
      Temperature: p.stats.surfaceTemp,
      Atmosphere: p.stats.atmosphere,
      Moons: p.stats.moons,
      'Orbital Period': p.stats.orbitalPeriod,
      'Day Length': p.stats.rotationPeriod,
      'Dist. from Sun': p.stats.distanceFromSun,
    };
  }

  function renderCol(p) {
    const stats = getStats(p);
    return `
      <div class="compare-col">
        <div class="compare-header">
          <div class="compare-planet-name" style="color:${p.color}">${p.name}</div>
          <div style="font-size:10px;letter-spacing:0.2em;color:rgba(255,255,255,0.35);text-transform:uppercase;margin-top:0.3rem">${p.type}</div>
          <div style="margin-top:0.5rem">
            <div style="height:3px;border-radius:2px;background:rgba(255,255,255,0.08);overflow:hidden">
              <div style="height:100%;width:${p.habitability}%;background:linear-gradient(90deg,#6A5CFF,${p.color})"></div>
            </div>
            <div style="font-size:9px;color:rgba(255,255,255,0.3);margin-top:3px;letter-spacing:0.15em;font-family:'Space Grotesk',sans-serif">HABITABILITY ${p.habitability}%</div>
          </div>
        </div>
        <div class="compare-stats">
          ${Object.entries(stats).map(([k,v]) => `
            <div class="cs-row">
              <span class="cs-key">${k}</span>
              <span class="cs-val">${v}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function update() {
    const aId = document.getElementById('cmp-a')?.value || planets[0].id;
    const bId = document.getElementById('cmp-b')?.value || planets[2].id;
    const pA = plist.find(p => p.id === aId) || plist[0];
    const pB = plist.find(p => p.id === bId) || plist[2];
    const opts = plist.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

    document.querySelector('.compare-grid').innerHTML = `
      ${renderCol(pA)}
      <div class="compare-vs">VS</div>
      ${renderCol(pB)}
    `;
  }

  container.innerHTML = `
    <div class="section-header">
      <p class="section-eyebrow">Side by Side</p>
      <h2 class="section-title">Compare Planets</h2>
    </div>
    <div class="compare-selects">
      <select class="calc-select" id="cmp-a" onchange="window._cmpUpdate()">
        ${plist.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
      </select>
      <div class="calc-arrow">VS</div>
      <select class="calc-select" id="cmp-b" onchange="window._cmpUpdate()">
        ${plist.map((p,i) => `<option value="${p.id}" ${i===2?'selected':''}>${p.name}</option>`).join('')}
      </select>
    </div>
    <div class="compare-grid">Loading...</div>
  `;

  window._cmpUpdate = update;
  update();
}
