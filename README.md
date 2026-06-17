# 🌌 Cosmic Odyssey — Welcome To The Imaginary World

A production-ready, immersive Solar System website featuring real-time 3D planet renderers, cinematic intro, interactive tools, space missions, a quiz, live model integration, and a premium glassmorphism UI.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Cinematic Intro** | Animated particle typography, nebula background, shooting stars |
| **Hero Solar System** | Real-time 2D canvas solar system — all 8 planets, asteroid belt, comets, Saturn rings |
| **Planet Sections** | Full-screen sections for each planet with rotating 3D canvas renderer |
| **Planet Surface Detail** | Jupiter's Great Red Spot, Earth's continents & clouds, Mars dust storms, Neptune's Dark Spot |
| **Planet Sounds** | Click any planet name to hear its unique synthesized audio signature (Web Audio API) |
| **Missions Section** | 8 major missions with animated cards (Voyager, JWST, Cassini, etc.) |
| **NASA Gallery** | 9-card masonry gallery with lightbox, keyboard navigation, prev/next |
| **Educational Section** | 3-level learning cards (Beginner / Intermediate / Advanced) with tab switching |
| **Planet Search** | Overlay search with live filtering (Ctrl+K / ⌘K) |
| **Favorites** | Bookmark planets to a persistent favorites panel |
| **Compare Tool** | Side-by-side planet comparison with all stats |
| **Distance Calculator** | Real-time distance between any two bodies in km, AU, and light-minutes |
| **Space Facts Generator** | Random fact button with smooth transitions |
| **Solar System Quiz** | 8-question randomized quiz with scoring and grade system |
| **Timeline** | 14-event interactive discovery timeline |
| **Ambient Audio** | Web Audio API synthesized space music — starts on user gesture, fade in/out, mute/volume |
| **Live 3D Model** | Embedded solarsystemscope.com in futuristic glassmorphism frame |
| **Starfield Background** | Animated nebulae, twinkling stars, shooting stars throughout |
| **Nav Bar** | Floating glassmorphism navbar with scroll-based active state |
| **Footer** | Animated star field footer with newsletter, links |
| **SEO** | Full meta tags, OG tags, Twitter cards, sitemap.xml, robots.txt |
| **Accessibility** | ARIA labels, keyboard navigation, semantic HTML, reduced-motion support |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+

### Install & Run

```bash
# Clone or copy the project
cd cosmic-odyssey

# Install dependencies
npm install

# Start dev server (opens at http://localhost:5173)
npm run dev
```

### Build for Production

```bash
npm run build
# Output in ./dist — ready to deploy
```

### Preview Production Build

```bash
npm run preview
# Serves dist/ at http://localhost:4173
```

---

## 📁 Project Structure

```
cosmic-odyssey/
├── index.html                    # Entry HTML with loading screen
├── package.json
├── vite.config.js
├── public/
│   ├── favicon.svg               # Custom SVG favicon
│   ├── robots.txt                # SEO robots
│   └── sitemap.xml               # SEO sitemap
└── src/
    ├── main.js                   # App orchestrator / boot
    ├── data/
    │   └── planets.js            # All planet data, mission data, facts
    ├── styles/
    │   └── main.css              # Complete stylesheet (CSS variables, all components)
    ├── components/
    │   ├── starfield.js          # Background animated starfield + nebulae + shooting stars
    │   ├── solarSystem.js        # Hero solar system canvas renderer
    │   ├── planetRenderer.js     # Per-planet 3D-style canvas with surface detail
    │   ├── quiz.js               # Quiz questions + interactive quiz component
    │   ├── calculator.js         # Distance calculator + planet compare tool
    │   ├── search.js             # Planet search overlay (Ctrl+K)
    │   └── favorites.js          # Bookmark/favorites system with localStorage
    └── utils/
        └── scroll.js             # Scroll animator, parallax, countUp, staggerReveal
```

---

## 🎨 Design System

### Color Palette

| Variable | Value | Usage |
|---|---|---|
| `--cyan` | `#00E5FF` | Primary accent, labels, glow |
| `--purple` | `#6A5CFF` | Secondary, gradients |
| `--mint` | `#00FFC6` | Success, highlights |
| `--gold` | `#FFB820` | Sun, warnings |
| `--bg` | `#02030A` | Base background |
| `--white` | `#FFFFFF` | Primary text |

### Typography

| Role | Font | Usage |
|---|---|---|
| Headings | **Orbitron** | All display text, nav, labels |
| Body | **Inter** | Paragraphs, descriptions |
| Numbers | **Space Grotesk** | Stats, data, counters |

---

## 🛰️ Planet Data

Each planet includes:
- Full scientific overview paragraph
- 12 stats (diameter, mass, gravity, density, temp, atmosphere, moons, orbital period, rotation, distance, speed, escape velocity)
- Detailed moon descriptions
- Historical missions list
- Discovery history
- Fun fact
- Earth comparison
- Habitability score (0–100)
- Surface composition
- Visual theme for canvas renderer

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Ctrl+K` / `⌘K` | Open planet search |
| `Escape` | Close search overlay |
| `Enter` on Begin button | Start the experience |

---

## 📱 Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| `> 900px` | Full two-column planet layouts |
| `≤ 900px` | Single column, planet visual on top |
| `≤ 540px` | Reduced stat grid, compact typography |

---

## ♿ Accessibility

- All interactive elements have `aria-label` attributes
- `role` attributes on landmarks (main, nav, dialog, complementary)
- Tab/keyboard navigable search and quiz
- `prefers-reduced-motion` disables all animations
- Color contrast ratios meet WCAG AA for text elements
- Screen reader-only hints for decorative elements (`aria-hidden`)

---

## ⚡ Performance

- **Code splitting** via Vite manualChunks (starfield, solar, planet, quiz, calc bundles)
- **Lazy rendering** — planet canvas renderers only start when scrolled into view (IntersectionObserver)
- **Lazy iframe** — live model uses `loading="lazy"`
- **RAF optimization** — all canvases use requestAnimationFrame and stop when off-screen
- **Asset minimization** — Terser minification on build
- **Zero heavy dependencies** — No Three.js bundle (~600KB saved). Pure Canvas 2D API
- **CSS variables** — single token update changes the whole design system

---

## 🚢 Deployment

### Vercel
```bash
npm i -g vercel
vercel --prod
```

### Netlify
```bash
npm run build
# Drag ./dist into Netlify dashboard
# Or: netlify deploy --prod --dir=dist
```

### GitHub Pages
```bash
npm run build
# Push ./dist to gh-pages branch
# Or use GitHub Actions
```

### Docker
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

---

## 🔭 Extending the Project

### Adding a new planet / dwarf planet

1. Add entry to `src/data/planets.js` PLANETS array
2. Add a case in `src/components/planetRenderer.js` `drawSurfaceFeatures()`
3. Add nav link in `src/main.js` buildDOM() navbar

### Adding a mission

Add to `MISSIONS` array in `src/data/planets.js`

### Adding quiz questions

Add to `QUIZ_QUESTIONS` array in `src/components/quiz.js`

### Swapping in real NASA textures

Replace canvas drawing in `PlanetRenderer.drawBase()` with:
```js
const img = new Image();
img.src = '/textures/earth.jpg'; // place in /public/textures/
img.onload = () => ctx.drawImage(img, CX-R, CY-R, R*2, R*2);
```

---

## 📡 Credits & Data Sources

- Planet data: NASA Solar System Exploration (solarsystem.nasa.gov)
- Live 3D model: SolarSystemScope.com
- Fonts: Google Fonts (Orbitron, Inter, Space Grotesk)
- Mission data: NASA, ESA, JAXA mission pages

---

## 📜 License

MIT — Educational use. Not affiliated with NASA, ESA, or SpaceX.

---

*"The cosmos is within us. We are made of star-stuff." — Carl Sagan*
