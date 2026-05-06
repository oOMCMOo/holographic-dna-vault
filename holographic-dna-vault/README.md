# 🧬 Holographic DNA Vault

A real-time Three.js WebGL visualization of a holographic genomic archive — a vault built from synthetic DNA strands floating in a futuristic sci-fi HUD.

[Holographic DNA Vault](https://oomcmoo.github.io/holographic-dna-vault/holographic-dna-vault/)

## ✨ Features

- **28 animated DNA double-helix strands** orbiting the vault at varying radii, each with backbone lines, base-pair rungs, and custom GLSL shaders
- **Holographic vault shell** — dual IcosahedronGeometry & OctahedronGeometry wireframe cages with slow counter-rotation
- **Beam columns** — 8 vertical TubeGeometry pillars around the perimeter
- **Floating rings** — 4 pulsing TorusGeometry rings at different heights and speeds
- **3,000-particle cloud** — AdditiveBlending GPU points inside the vault sphere
- **Holographic data planes** — semi-transparent intersecting planes
- **Glowing core orb** — pulsing sphere with a PointLight corona
- **Full HUD overlay** — real-time readouts, bars, DNA base-pair stream, archive node list, coordinates
- **Loading sequence** — animated progress bar with staged initialization messages

## 🗂 Project Structure

```
holographic-dna-vault/
├── index.html          # Entry point — HUD markup + ES module bootstrap
├── package.json        # npm scripts (dev server)
├── css/
│   └── style.css       # HUD, panels, scanlines, vignette, loader
├── js/
│   ├── main.js         # App bootstrap, HUD logic, data simulation
│   └── DataVault.js    # Three.js engine — all 3D geometry, shaders, animation
└── assets/             # Place any additional assets here
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A modern browser with WebGL2 support

### Run locally

```bash
# Clone / copy the project
cd holographic-dna-vault

# Install dev server
npm install

# Start
npm run dev
```

Then open **http://localhost:3000** in your browser.

### No Node.js? Use any static server:

```bash
# Python
python3 -m http.server 3000

# Or just open index.html via a local server (not file://)
```

> ⚠️ **Must be served over HTTP** — ES modules don't work from `file://` URLs.

## 🔧 Customization

### DNA Strand count
In `js/DataVault.js`, find `_buildDNAStrands()` and change `STRAND_COUNT`:
```js
const STRAND_COUNT = 28; // increase for more strands
```

### Colors
Edit the `C` palette object at the top of `DataVault.js`:
```js
const C = {
  cyan:   0x00f5ff,
  green:  0x00ff9d,
  // ...
};
```

### HUD data update rate
In `js/main.js`, adjust the interval values in `startDataSimulation()`.

## 🛠 Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| Three.js | 0.160.0 | 3D rendering |
| Orbitron | Google Fonts | HUD display font |
| JetBrains Mono | Google Fonts | Data readout font |

Three.js is loaded via CDN with an ES module importmap — no bundler required.

## 📄 License

MIT
