---
name: cosmic-terminal-theme
description: >-
  Use this skill whenever the user asks to style, theme, or redesign a web application
  with their favorite Cosmic Obsidian & Nebula Purple retro-terminal brutalist aesthetic,
  featuring the Omarchy-inspired etched 8x8 Bayer dithering canvas background engine.
---

# Cosmic Obsidian & Nebula Purple Terminal Theme

Comprehensive guide and implementation template for the user's preferred design system: a brutalist, retro-futuristic hacker console with rich obsidian/purple tones and an interactive Omarchy dither canvas background.

## 1. Design Principles

1. **Strict Brutalist Geometry**: Razor-sharp 0px borders (`border-radius: 0 !important`), hairline borders (`1px solid var(--starlight-border)`), and modular rectangular cards.
2. **High-Legibility Monospace Typography**:
   - Primary Body & Monospace: `'JetBrains Mono', monospace`
   - Insignia, Badges & Micro-tags: `'Silkscreen', monospace`
   - HUD Headers & Labels: `'Share Tech Mono', monospace`
   - Strict WCAG AAA high-contrast readability against obsidian surfaces.
3. **Omarchy Etched Raster & Dither Engine**:
   - Fixed background `<canvas id="omarchyHeroCanvas">` running under the main layout and beneath CRT scanlines.
   - Evaluates a smooth 2D continuous Hermite value-noise field in 8–10px cells.
   - 8×8 Bayer dithering matrix thresholding for authentic retro raster shading.
   - Autonomous wandering Lissajous focus beacon for continuous ambient breathing.
   - Interactive pointer proximity aura and click-triggered expanding shockwave rings.
4. **Omarchy Multi-Stop Gradient Bands**:
   - Strict stop ratio: `0% 26.316%, 26.316% 36.842%, 36.842% 57.895%, 57.895% 73.684%, 73.684% 100%`.
   - Used for card top borders, header dividers, and wordmark text clipping.
5. **Universal Theming**: Custom-styled scrollbars, text selection (`#7e22ce`), and input carets (`#c084fc`).

---

## 2. Palette & Design Tokens

```css
:root {
  /* Obsidian Void Surfaces */
  --space-void: #05060a;
  --space-obsidian: #0a0b12;
  --space-panel: #0e111a;
  --space-panel-alt: #131624;
  --space-input: #07080e;

  /* Nebula Purple & Pulsar Accents (Non-Neon, High Contrast) */
  --nebula-glow: rgba(168, 85, 247, 0.3);
  --nebula-primary: #a855f7;
  --nebula-bright: #c084fc;
  --nebula-vibrant: #d8b4fe;
  --nebula-deep: #7e22ce;
  --nebula-dim: #581c87;
  --nebula-faint: rgba(168, 85, 247, 0.08);

  /* High-Legibility Starlight Neutrals */
  --stellar-indigo: #a5b4fc;
  --stellar-cyan: #38bdf8;
  --starlight-pure: #ffffff;
  --starlight-white: #f8fafc;
  --starlight-light: #e2e8f0;
  --starlight-body: #cbd5e1;
  --starlight-muted: #94a3b8;
  --starlight-border: #222638;
  --starlight-border-active: #3b4263;
  --starlight-border-purple: #6b21a8;

  /* Omarchy 5-Tone Field Palette & Gradient Bands */
  --t-field-bg: #05060a;
  --t-field-dim: #1f1338;
  --t-field-mid: #581c87;
  --t-field-lit: #a855f7;
  --t-field-hover: #c084fc;
  --t-field-crest: #f5f3ff;
  --omarchy-band-gradient: linear-gradient(to right,
    var(--t-field-dim) 0% 26.316%,
    var(--t-field-mid) 26.316% 36.842%,
    var(--t-field-lit) 36.842% 57.895%,
    var(--t-field-hover) 57.895% 73.684%,
    var(--t-field-crest) 73.684% 100%
  );

  /* Fonts */
  --font-pixel: 'Silkscreen', monospace;
  --font-mono: 'JetBrains Mono', monospace;
  --font-hud: 'Share Tech Mono', monospace;
}
```

---

## 3. CSS Shell & Core Components

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border-radius: 0 !important; /* Strict brutalist geometry */
}

/* Custom Cosmic Scrollbars */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--nebula-dim) var(--space-obsidian);
}
*::-webkit-scrollbar { width: 6px; height: 6px; }
*::-webkit-scrollbar-track { background: var(--space-obsidian); border: 1px solid var(--starlight-border); }
*::-webkit-scrollbar-thumb { background: var(--nebula-dim); border: 1px solid var(--starlight-border-purple); }
*::-webkit-scrollbar-thumb:hover { background: var(--nebula-primary); box-shadow: 0 0 8px var(--nebula-glow); }

::selection {
  background: #7e22ce;
  color: #ffffff;
  text-shadow: 0 0 6px rgba(216, 180, 254, 0.8);
}

body {
  background-color: var(--space-void);
  color: var(--starlight-body);
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.55;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

/* Omarchy Canvas Placement */
.omarchy-hero-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 0;
  display: block;
}

/* CRT Scanlines Overlay */
body::before {
  content: " ";
  display: block;
  position: fixed;
  inset: 0;
  background: linear-gradient(rgba(18, 16, 26, 0) 50%, rgba(0, 0, 0, 0.3) 50%);
  background-size: 100% 4px;
  z-index: 999;
  pointer-events: none;
  opacity: 0.6;
}

/* CRT Vignette */
body::after {
  content: " ";
  display: block;
  position: fixed;
  inset: 0;
  box-shadow: inset 0 0 120px rgba(0, 0, 0, 0.85);
  z-index: 998;
  pointer-events: none;
}

/* Cockpit Cards with Omarchy Gradient Top Accent */
.cockpit-card {
  background-color: rgba(14, 17, 26, 0.94);
  backdrop-filter: blur(8px);
  border: 1px solid var(--starlight-border);
  padding: 18px 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
}

.cockpit-card:hover {
  border-color: var(--starlight-border-active);
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.7);
}

.cockpit-card::before {
  content: "";
  position: absolute;
  top: -1px; left: -1px; right: -1px;
  height: 2px;
  background: var(--omarchy-band-gradient);
  pointer-events: none;
}

/* Insignia / Wordmark Gradient */
.insignia-box {
  font-family: var(--font-pixel);
  font-size: 11px;
  font-weight: 700;
  background-color: var(--nebula-dim);
  background-image: linear-gradient(to bottom,
    var(--t-field-crest) 0% 26.316%,
    var(--t-field-hover) 26.316% 36.842%,
    var(--t-field-lit) 36.842% 57.895%,
    var(--t-field-mid) 57.895% 73.684%,
    var(--t-field-dim) 73.684% 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: var(--t-field-crest);
  padding: 8px 12px;
  letter-spacing: 0.08em;
  border: 1px solid var(--nebula-primary);
  box-shadow: 0 0 14px rgba(168, 85, 247, 0.3);
}
```

---

## 4. Standard Omarchy Background Engine Script

Place `<canvas id="omarchyHeroCanvas" class="omarchy-hero-canvas" aria-hidden="true"></canvas>` as the first child of `<body>`, then initialize:

```javascript
(function initOmarchyHeroBackground() {
  const canvas = document.getElementById('omarchyHeroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  const BAYER_8X8 = [
     0, 32,  8, 40,  2, 34, 10, 42,
    48, 16, 56, 24, 50, 18, 58, 26,
    12, 44,  4, 36, 14, 46,  6, 38,
    60, 28, 52, 20, 62, 30, 54, 22,
     3, 35, 11, 43,  1, 33,  9, 41,
    51, 19, 59, 27, 49, 17, 57, 25,
    15, 47,  7, 39, 13, 45,  5, 37,
    63, 31, 55, 23, 61, 29, 53, 21
  ];

  const THEME = {
    bg: '#05060a',
    dim: '#1f1338',
    mid: '#581c87',
    lit: '#a855f7',
    hover: '#c084fc',
    crest: '#f5f3ff'
  };

  const PERM = new Uint8Array(512);
  const P_VAL = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    P_VAL[i] = Math.random();
    PERM[i] = i;
  }
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = PERM[i];
    PERM[i] = PERM[j];
    PERM[j] = tmp;
  }
  for (let i = 0; i < 256; i++) {
    PERM[256 + i] = PERM[i];
  }

  function sampleNoise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);

    const a = P_VAL[PERM[PERM[X] + Y]];
    const b = P_VAL[PERM[PERM[X + 1] + Y]];
    const c = P_VAL[PERM[PERM[X] + Y + 1]];
    const d = P_VAL[PERM[PERM[X + 1] + Y + 1]];

    const x1 = a + u * (b - a);
    const x2 = c + u * (d - c);
    return x1 + v * (x2 - x1);
  }

  let dpr = 1, canvasW = 0, canvasH = 0, cols = 0, rows = 0;
  const CELL_SIZE = 9;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvasW = Math.round(w * dpr);
    canvasH = Math.round(h * dpr);
    canvas.width = canvasW;
    canvas.height = canvasH;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    cols = Math.ceil(w / CELL_SIZE);
    rows = Math.ceil(h / CELL_SIZE);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  const pointer = { x: -9999, y: -9999, active: false, strength: 0 };
  let ripples = [];

  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
    pointer.strength = 1.0;
  }, { passive: true });

  window.addEventListener('pointerleave', () => { pointer.active = false; }, { passive: true });

  window.addEventListener('pointerdown', (e) => {
    ripples.push({
      x: e.clientX,
      y: e.clientY,
      born: performance.now(),
      life: 1400,
      maxRadius: Math.max(window.innerWidth, window.innerHeight) * 0.45
    });
    if (ripples.length > 5) ripples.shift();
  }, { passive: true });

  const wanderer = { x: 0, y: 0 };
  let lastTime = 0, rafId = 0;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function render(time) {
    if (!prefersReducedMotion) rafId = requestAnimationFrame(render);
    if (time - lastTime < 32 && !prefersReducedMotion) return;
    lastTime = time;

    const t = time * 0.001;
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (pointer.active) {
      pointer.strength = Math.max(0.2, pointer.strength - 0.015);
    } else {
      pointer.strength = Math.max(0, pointer.strength - 0.04);
    }

    wanderer.x = w * (0.5 + 0.32 * Math.sin(t * 0.35));
    wanderer.y = h * (0.48 + 0.28 * Math.cos(t * 0.26));

    const now = performance.now();
    ripples = ripples.filter(r => (now - r.born) < r.life);

    ctx.fillStyle = THEME.bg;
    ctx.fillRect(0, 0, canvasW, canvasH);

    const pointerReach = 190;
    const wandererReach = 240;

    const dimBatch = [], midBatch = [], litBatch = [], hoverBatch = [], crestBatch = [];
    const cellScale = CELL_SIZE * dpr;

    for (let r = 0; r < rows; r++) {
      const cy = (r + 0.5) * CELL_SIZE;
      const bayerRow = (r & 7) * 8;

      for (let c = 0; c < cols; c++) {
        const cx = (c + 0.5) * CELL_SIZE;
        const n1 = sampleNoise2D(c * 0.045 + t * 0.025, r * 0.045 - t * 0.018);
        const n2 = sampleNoise2D(c * 0.09 - t * 0.04, r * 0.09 + t * 0.035);
        const intensity = (n1 * 0.65 + n2 * 0.35);

        let mouseBoost = 0;
        if (pointer.strength > 0.02) {
          const dist = Math.hypot(cx - pointer.x, cy - pointer.y);
          if (dist < pointerReach) {
            const factor = 1 - (dist / pointerReach);
            mouseBoost = factor * factor * pointer.strength * 0.65;
          }
        }

        let wanderBoost = 0;
        const wdist = Math.hypot(cx - wanderer.x, cy - wanderer.y);
        if (wdist < wandererReach) {
          const wfactor = 1 - (wdist / wandererReach);
          wanderBoost = wfactor * wfactor * 0.28;
        }

        let rippleBoost = 0;
        for (let i = 0; i < ripples.length; i++) {
          const rip = ripples[i];
          const progress = (now - rip.born) / rip.life;
          const currentRadius = rip.maxRadius * progress;
          const rdist = Math.hypot(cx - rip.x, cy - rip.y);
          const ringDist = Math.abs(rdist - currentRadius);
          if (ringDist < 40) {
            const ringFactor = (1 - ringDist / 40) * (1 - progress);
            if (ringFactor > rippleBoost) rippleBoost = ringFactor;
          }
        }

        const totalEnergy = intensity * 0.48 + mouseBoost + wanderBoost + rippleBoost * 0.75;
        const ditherThreshold = (BAYER_8X8[bayerRow + (c & 7)] + 0.5) / 64;

        if (totalEnergy > ditherThreshold) {
          const px = Math.round(c * cellScale);
          const py = Math.round(r * cellScale);
          const sz = Math.ceil(cellScale);

          if (rippleBoost > 0.4 || totalEnergy > 0.88) {
            crestBatch.push(px, py, sz);
          } else if (mouseBoost > 0.25 || totalEnergy > 0.72) {
            hoverBatch.push(px, py, sz);
          } else if (totalEnergy > 0.52) {
            litBatch.push(px, py, sz);
          } else if (totalEnergy > 0.32) {
            midBatch.push(px, py, sz);
          } else {
            dimBatch.push(px, py, sz);
          }
        }
      }
    }

    function drawBatch(batch, color) {
      if (batch.length === 0) return;
      ctx.fillStyle = color;
      for (let i = 0; i < batch.length; i += 3) {
        ctx.fillRect(batch[i], batch[i + 1], batch[i + 2], batch[i + 2]);
      }
    }

    drawBatch(dimBatch, THEME.dim);
    drawBatch(midBatch, THEME.mid);
    drawBatch(litBatch, THEME.lit);
    drawBatch(hoverBatch, THEME.hover);
    drawBatch(crestBatch, THEME.crest);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    } else {
      if (!rafId && !prefersReducedMotion) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(render);
      }
    }
  });

  rafId = requestAnimationFrame(render);
})();
```
