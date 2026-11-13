for visit site https://amirali548.github.io/solar-system/
# ORBITAL — Interactive 3D Solar System

A cinematic, real-time 3D Solar System built with HTML, CSS, JavaScript, Three.js and WebGL. All eight planets orbit a textured Sun in a procedurally generated deep-space environment, and every world can be inspected through a futuristic glass interface with camera choreography, a live 3D preview and NASA/JPL-sourced data.

The site is fully static and self-contained: textures, fonts and Three.js are bundled locally, so it works completely offline with no build step and no external requests.

## Quick start

A local web server is required because the app uses ES modules (`importmap`), which browsers block on `file://`.

**Python (recommended)**

```bash
cd 4840e577
python -m http.server 8080
```

Open <http://localhost:8080>.

**Node.js alternative**

```bash
npx serve . -l 8080
```

Open <http://localhost:8080>.

**Requirements**

- A modern browser with WebGL 2 — Chrome, Edge, Firefox or Safari (latest versions).
- Hardware acceleration enabled for the smoothest frame rate.
- No installation, npm install or internet connection needed.

## Features

### Scene

- Textured Sun with animated corona glow, point-light illumination and subtle surface motion.
- All 8 planets with NASA-inspired surface maps, correct axial tilts, elliptical orbits and continuous orbital motion.
- Jupiter's Great Red Spot, Saturn's Cassini-style ring system, Uranus's faint vertical rings and Earth's drifting clouds.
- Earth atmosphere rendered as a two-shell Fresnel halo, with normal and specular maps for ocean highlights.
- Major moons, a 1,300-rock instanced asteroid belt, the Kuiper belt and a Milky Way sky sphere with procedural nebulae, galaxies and a twinkling star field.
- ACES filmic tone mapping, sRGB output, bloom post-processing, vignette and film grain.

### Interaction

- Drag to orbit the camera, scroll or pinch to zoom, with damped and clamped controls.
- Hover a planet for a scale-up highlight, name tooltip and cursor feedback.
- Click a planet, its label in the navigation bar, or a body in the view to trigger a cinematic flight: the camera eases into a sunlit three-quarter angle, the planet shifts into a presentation position and a glass information panel slides in from the right.
- On mobile the panel becomes a bottom sheet and the camera frames the planet above it.
- Camera gently auto-orbits after 9 seconds of inactivity and stops on interaction.

### Information panel

- Planet class, catalog order, name and tagline.
- Live 3D render of the selected body, rotating with its cloud layer and rings.
- Description plus 8 statistics: distance from the Sun, diameter, mass, orbital period, rotation period, average temperature, known moons and surface gravity — with Earth-relative comparisons where useful.
- 3 curated scientific facts per body.
- Full keyboard and screen-reader support, ESC to close and return to the system view.

### Controls and HUD

- Destination navigation for the Sun and all 8 planets.
- Orbital speed slider from 0.1× to 5× with a live readout.
- Pause/resume, orbit-line visibility toggle, reset view, and BACK TO SOLAR SYSTEM.
- Live UTC clock, system status, focus tag, loading screen and graceful fatal-error screen.

### Responsive

- Dedicated layouts for desktop, tablet and mobile, including a compact navigation rail, safe-area insets and a reduced-motion fallback.

### Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Space` | Pause / resume orbital motion |
| `O` | Show / hide orbit lines |
| `R` | Reset to the system overview |
| `Esc` | Close the information panel and return to orbit |

## Project structure

```text
4840e577/
├── index.html                 Page structure, HUD, panel, loader, import map
├── css/
│   └── style.css              Design system, glass UI, responsive layouts
├── js/
│   ├── main.js                Renderer, scene loop, picking, input, boot intro
│   ├── core/
│   │   ├── SolarSystem.js     Sun, planets, rings, moons, belts, lighting
│   │   ├── CameraDirector.js  Overview framing and cinematic focus flights
│   │   ├── Sky.js             Sky sphere, stars, nebulae, galaxies
│   │   └── TextureFactory.js  Procedural fallbacks and generated textures
│   ├── ui/
│   │   ├── UIController.js    Navigation, HUD, panel content, tooltips
│   │   └── PlanetPreview.js   Live 3D preview renderer inside the panel
│   ├── data/
│   │   └── planets.js         Planet data, stats, facts, moons, orbital layout
│   └── utils/
│       ├── noise.js           Perlin / fBm noise
│       └── tween.js           Camera and property tween manager
├── assets/
│   ├── fonts/                 Space Grotesk and Inter (WOFF2)
│   └── textures/              Planet, moon, ring, cloud and star maps
└── vendor/
    ├── three.module.js        Three.js r169
    └── addons/                OrbitControls and post-processing passes
```

## Scientific data

Statistics are rounded for readability and sourced from NASA and JPL planetary fact sheets. Moon counts reflect the latest confirmed discoveries (Jupiter 115, Saturn 293, Uranus 29, Neptune 16). Surface temperatures are averages or day-side ranges as noted in each panel. Orbital and rotational data use sidereal periods. Sizes and distances in the 3D scene are compressed for composition, not to scale.

## Performance

- Capped device pixel ratio, adaptive bloom strength and a lighter mobile preset.
- Textures load with graceful procedural fallbacks if an asset is unavailable.
- Asteroid and Kuiper belts render as instanced meshes / point clouds rather than individual objects.
- The information-panel preview uses a separate, small WebGL context that renders only while the panel is open.
- Pauses rendering when the tab is hidden.

## Credits

- **Three.js r169** — MIT License, © three.js authors. Vendored under `vendor/`.
- **Planet surface textures, Sun texture and Saturn ring map** — [Solar System Scope](https://www.solarsystemscope.com/textures/), CC BY 4.0.
- **Earth cloud, normal and specular maps** — via the three.js examples repository (MIT); original planet maps courtesy of Planet Pixel Emporium.
- **Space Grotesk and Inter** — SIL Open Font License 1.1.
- **Planetary data** — NASA / JPL Planetary Fact Sheets, NASA Solar System Exploration.
- Stars, nebulae, galaxies, glow sprites and all additional textures are generated procedurally in `TextureFactory.js` / `Sky.js`.

All code in this project was written for this build and may be reused with attribution.
