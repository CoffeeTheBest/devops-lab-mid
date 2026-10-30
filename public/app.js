/**
 * Assignment Submission Portal - Cosmic Terminal Client Engine
 * Supports Express Backend & Static LocalStorage for GitHub Pages.
 */

const API_BASE = '/api/submissions';
let isBackendLive = false;
let submissionsCache = [];

// DOM Elements
const form = document.getElementById('submissionForm');
const studentNameInput = document.getElementById('studentName');
const regNoInput = document.getElementById('regNo');
const titleInput = document.getElementById('assignmentTitle');
const urlInput = document.getElementById('submissionUrl');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const quickFillBtn = document.getElementById('quickFillBtn');
const refreshBtn = document.getElementById('refreshBtn');
const filterInput = document.getElementById('filterInput');
const filterModeSelect = document.getElementById('filterModeSelect');
const submissionsList = document.getElementById('submissionsList');
const submissionsCount = document.getElementById('submissionsCount');
const formAlert = document.getElementById('formAlert');
const modeText = document.getElementById('modeText');
const jsonPreviewBox = document.getElementById('jsonPreviewBox');

// Field errors
const nameError = document.getElementById('nameError');
const regNoError = document.getElementById('regNoError');
const titleError = document.getElementById('titleError');
const urlError = document.getElementById('urlError');

// Validate URL helper
function isValidUrl(urlString) {
  try {
    const parsed = new URL(urlString.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Update real-time JSON payload inspector
function updateJsonPreview() {
  if (!jsonPreviewBox) return;
  const payload = {
    endpoint: '/api/submissions',
    method: 'POST',
    payload: {
      name: studentNameInput.value.trim() || null,
      regNo: regNoInput.value.trim() || null,
      assignmentTitle: titleInput.value.trim() || null,
      submissionUrl: urlInput.value.trim() || null
    },
    meta: {
      clientTimestamp: new Date().toISOString(),
      registryBufferCount: submissionsCache.length
    }
  };
  jsonPreviewBox.textContent = JSON.stringify(payload, null, 2);
}

// Clear validation errors
function clearFieldErrors() {
  nameError.textContent = '';
  regNoError.textContent = '';
  titleError.textContent = '';
  urlError.textContent = '';

  studentNameInput.classList.remove('is-invalid');
  regNoInput.classList.remove('is-invalid');
  titleInput.classList.remove('is-invalid');
  urlInput.classList.remove('is-invalid');
  formAlert.style.display = 'none';
  updateJsonPreview();
}

// Show alert banner
function showAlert(message, type = 'success') {
  formAlert.className = `cockpit-alert-toast alert-${type}`;
  formAlert.innerHTML = `
    <span>${type === 'success' ? '[SYS.OK]' : '[SYS.ERR]'}</span>
    <span>${escapeHtml(message)}</span>
  `;
  formAlert.style.display = 'flex';
}

// Detect if running with Express backend
async function detectBackend() {
  try {
    const res = await fetch('/health', { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      isBackendLive = true;
      modeText.textContent = 'HOST: [LIVE_API]';
      modeText.parentElement.style.borderColor = 'var(--nebula-primary)';
      modeText.parentElement.style.color = 'var(--nebula-bright)';
      return;
    }
  } catch {
    // Backend offline / GitHub Pages mode
  }
  isBackendLive = false;
  modeText.textContent = 'HOST: [STANDALONE]';
  modeText.parentElement.style.borderColor = 'var(--starlight-border-active)';
  modeText.parentElement.style.color = 'var(--starlight-light)';
}

// Fetch submissions
async function fetchSubmissions() {
  if (isBackendLive) {
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        submissionsCache = data.submissions || [];
        renderSubmissions();
        updateJsonPreview();
        return;
      }
    } catch (err) {
      console.warn('Failed to fetch from backend API, using local store:', err);
    }
  }

  // Fallback to localStorage
  try {
    const saved = localStorage.getItem('portal_submissions');
    submissionsCache = saved ? JSON.parse(saved) : [];
  } catch {
    submissionsCache = [];
  }
  renderSubmissions();
  updateJsonPreview();
}

// Render submissions list
function renderSubmissions() {
  const query = (filterInput.value || '').trim().toLowerCase();
  let filtered = submissionsCache.filter(item => {
    return (
      (item.name || '').toLowerCase().includes(query) ||
      (item.regNo || '').toLowerCase().includes(query) ||
      (item.assignmentTitle || '').toLowerCase().includes(query)
    );
  });

  const mode = filterModeSelect ? filterModeSelect.value : 'all';
  if (mode === 'recent') {
    filtered = filtered.slice(0, 5);
  }

  submissionsCount.textContent = submissionsCache.length;

  if (filtered.length === 0) {
    submissionsList.innerHTML = `
      <div class="audit-empty-view">
        <span class="empty-lead-tag">&gt; NO_EVALUATION_RECORDS_FOUND</span>
        <span>${submissionsCache.length === 0 ? '// Register buffer is currently empty. Dispatch payload to register.' : '// Query returned 0 matching records.'}</span>
      </div>
    `;
    return;
  }

  submissionsList.innerHTML = filtered.map(item => {
    const dateStr = item.submittedAt ? new Date(item.submittedAt).toISOString().replace('T', ' ').substring(0, 19) + ' UTC' : 'TIMESTAMP_PENDING';
    return `
      <div class="audit-item-box">
        <div class="item-meta-strip">
          <span class="item-reg-tag">${escapeHtml(item.regNo)}</span>
          <span class="item-iso-time">${dateStr}</span>
        </div>
        <div class="item-student-name">${escapeHtml(item.name)}</div>
        <div class="item-assignment-title">&gt; ${escapeHtml(item.assignmentTitle)}</div>
        <a href="${encodeURI(item.submissionUrl)}" target="_blank" rel="noopener noreferrer" class="item-repo-anchor">
          <span>REPO: ${escapeHtml(item.submissionUrl)}</span>
          <span>[↗]</span>
        </a>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Real-time input listener for live JSON preview
[studentNameInput, regNoInput, titleInput, urlInput].forEach(el => {
  if (el) el.addEventListener('input', updateJsonPreview);
});

// Dropdown filter listener
if (filterModeSelect) {
  filterModeSelect.addEventListener('change', () => {
    renderSubmissions();
  });
}

// Handle Form Submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFieldErrors();

  const name = studentNameInput.value.trim();
  const regNo = regNoInput.value.trim();
  const assignmentTitle = titleInput.value.trim();
  const submissionUrl = urlInput.value.trim();

  let hasError = false;

  // Terminal input validation
  if (!name) {
    nameError.textContent = 'ERR_01: STUDENT_NAME_REQUIRED';
    studentNameInput.classList.add('is-invalid');
    hasError = true;
  }
  if (!regNo) {
    regNoError.textContent = 'ERR_02: REGISTRATION_NUMBER_REQUIRED';
    regNoInput.classList.add('is-invalid');
    hasError = true;
  }
  if (!assignmentTitle) {
    titleError.textContent = 'ERR_03: ASSIGNMENT_TITLE_REQUIRED';
    titleInput.classList.add('is-invalid');
    hasError = true;
  }
  if (!submissionUrl) {
    urlError.textContent = 'ERR_04: REPOSITORY_URL_REQUIRED';
    urlInput.classList.add('is-invalid');
    hasError = true;
  } else if (!isValidUrl(submissionUrl)) {
    urlError.textContent = 'ERR_05: INVALID_URI_PROTOCOL [MUST_BE_HTTP_OR_HTTPS]';
    urlInput.classList.add('is-invalid');
    hasError = true;
  }

  if (hasError) {
    showAlert('EXEC_ABORT: Resolve input validation errors highlighted above.', 'error');
    return;
  }

  const payload = { name, regNo, assignmentTitle, submissionUrl };
  submitBtn.disabled = true;

  try {
    if (isBackendLive) {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showAlert('PAYLOAD_COMMITTED: Submission written to registry store.', 'success');
        form.reset();
        await fetchSubmissions();
      } else {
        showAlert(data.error || 'EXEC_FAIL: Backend rejected payload.', 'error');
        if (data.error?.toLowerCase().includes('registration')) {
          regNoError.textContent = `ERR: ${data.error}`;
          regNoInput.classList.add('is-invalid');
        } else if (data.error?.toLowerCase().includes('url')) {
          urlError.textContent = `ERR: ${data.error}`;
          urlInput.classList.add('is-invalid');
        }
      }
    } else {
      // Local fallback mode (GitHub Pages)
      const newRecord = {
        id: Date.now(),
        name,
        regNo,
        assignmentTitle,
        submissionUrl,
        submittedAt: new Date().toISOString()
      };
      submissionsCache.unshift(newRecord);
      localStorage.setItem('portal_submissions', JSON.stringify(submissionsCache));
      showAlert('PAYLOAD_COMMITTED: Record stored in local terminal buffer.', 'success');
      form.reset();
      renderSubmissions();
    }
  } catch (err) {
    showAlert(`SYS_NETWORK_FAULT: ${err.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    updateJsonPreview();
  }
});

// Quick fill sample data button
quickFillBtn.addEventListener('click', () => {
  studentNameInput.value = 'Muhammad Huzaifa';
  regNoInput.value = 'SP21-BCS-042';
  titleInput.value = 'DevOps Lab Mid - CI/CD Automation';
  urlInput.value = 'https://github.com/CoffeeTheBest/devops-lab-mid';
  clearFieldErrors();
  updateJsonPreview();
});

// Reset button
resetBtn.addEventListener('click', () => {
  clearFieldErrors();
  updateJsonPreview();
});

// Refresh button
refreshBtn.addEventListener('click', () => {
  fetchSubmissions();
});

// Filter input
filterInput.addEventListener('input', () => {
  renderSubmissions();
});

// Initialization
(async function init() {
  await detectBackend();
  await fetchSubmissions();
  updateJsonPreview();
})();

/* ==========================================================================
   OMARCHY-INSPIRED ETCHED PIXEL RASTER & DITHER BACKGROUND ENGINE
   Features:
   - 8x8 Bayer Ordered Dithering Matrix thresholding
   - Smooth 2D hermite value-noise field with dual-octave temporal drift
   - Autonomous roving focus beacon (sinusoidal Lissajous orbit)
   - Interactive mouse aura (spatial proximity glow with quadratic decay)
   - Expanding click-shockwave ripples (pixelated pulse wave propagation)
   - Obsidian & Cosmic Nebula Purple 5-stop color palette
   - Reduced-motion accessible & background tab throttling (visibilitychange)
   ========================================================================== */

(function initOmarchyHeroBackground() {
  const canvas = document.getElementById('omarchyHeroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  // 8x8 Bayer Ordered Dithering Matrix (as used by retro hardware & Omarchy)
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

  // Cosmic Obsidian & Nebula Purple 5-Tone Field Palette
  const THEME = {
    bg: '#05060a',       // Deep cosmic obsidian void
    dim: '#1f1338',      // Faint nebula dust
    mid: '#581c87',      // Deep violet
    lit: '#a855f7',      // Vibrant nebula purple
    hover: '#c084fc',    // Bright pulsar lilac
    crest: '#f5f3ff'     // Pure stellar crest
  };

  // Precomputed fast permutation & noise value tables
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

  // Smooth Hermite 2D value-noise
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

  // Canvas geometry & grid sizing
  let dpr = 1;
  let canvasW = 0;
  let canvasH = 0;
  let cols = 0;
  let rows = 0;
  const CELL_SIZE = 9; // CSS pixel cell size for crisp retro raster

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

  // Pointer state & shockwave ripples
  const pointer = {
    x: -9999,
    y: -9999,
    active: false,
    strength: 0
  };

  let ripples = [];

  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
    pointer.strength = 1.0;
  }, { passive: true });

  window.addEventListener('pointerleave', () => {
    pointer.active = false;
  }, { passive: true });

  window.addEventListener('pointerdown', (e) => {
    // Add expanding shockwave ring
    ripples.push({
      x: e.clientX,
      y: e.clientY,
      born: performance.now(),
      life: 1400, // ms duration
      maxRadius: Math.max(window.innerWidth, window.innerHeight) * 0.45
    });
    if (ripples.length > 5) ripples.shift();
  }, { passive: true });

  // Autonomous wandering beacon
  const wanderer = { x: 0, y: 0 };
  let lastTime = 0;
  let rafId = 0;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function render(time) {
    if (!prefersReducedMotion) {
      rafId = requestAnimationFrame(render);
    }

    // Throttle to ~32ms (~30 FPS) for battery & CPU conservation
    if (time - lastTime < 32 && !prefersReducedMotion) return;
    lastTime = time;

    const t = time * 0.001;
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Decay pointer strength when stationary
    if (pointer.active) {
      pointer.strength = Math.max(0.2, pointer.strength - 0.015);
    } else {
      pointer.strength = Math.max(0, pointer.strength - 0.04);
    }

    // Wanderer Lissajous orbit
    wanderer.x = w * (0.5 + 0.32 * Math.sin(t * 0.35));
    wanderer.y = h * (0.48 + 0.28 * Math.cos(t * 0.26));

    // Filter active ripples
    const now = performance.now();
    ripples = ripples.filter(r => (now - r.born) < r.life);

    // Clear background
    ctx.fillStyle = THEME.bg;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Pre-calculate interaction radiuses in CSS coordinates
    const pointerReach = 190;
    const wandererReach = 240;

    // Categorized pixel buckets for ultra-fast single-pass rendering
    const dimBatch = [];
    const midBatch = [];
    const litBatch = [];
    const hoverBatch = [];
    const crestBatch = [];

    const cellScale = CELL_SIZE * dpr;

    for (let r = 0; r < rows; r++) {
      const cy = (r + 0.5) * CELL_SIZE;
      const bayerRow = (r & 7) * 8;

      for (let c = 0; c < cols; c++) {
        const cx = (c + 0.5) * CELL_SIZE;

        // Dual-octave moving smooth nebulae
        const n1 = sampleNoise2D(c * 0.045 + t * 0.025, r * 0.045 - t * 0.018);
        const n2 = sampleNoise2D(c * 0.09 - t * 0.04, r * 0.09 + t * 0.035);
        const intensity = (n1 * 0.65 + n2 * 0.35);

        // Interaction with mouse pointer
        let mouseBoost = 0;
        if (pointer.strength > 0.02) {
          const dx = cx - pointer.x;
          const dy = cy - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < pointerReach) {
            const factor = 1 - (dist / pointerReach);
            mouseBoost = factor * factor * pointer.strength * 0.65;
          }
        }

        // Ambient roving beacon
        let wanderBoost = 0;
        const wdx = cx - wanderer.x;
        const wdy = cy - wanderer.y;
        const wdist = Math.hypot(wdx, wdy);
        if (wdist < wandererReach) {
          const wfactor = 1 - (wdist / wandererReach);
          wanderBoost = wfactor * wfactor * 0.28;
        }

        // Expanding click shockwaves
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

        // Total field energy
        const totalEnergy = intensity * 0.48 + mouseBoost + wanderBoost + rippleBoost * 0.75;

        // 8x8 Bayer Dither Thresholding
        const ditherThreshold = (BAYER_8X8[bayerRow + (c & 7)] + 0.5) / 64;

        if (totalEnergy > ditherThreshold) {
          const px = Math.round(c * cellScale);
          const py = Math.round(r * cellScale);
          const sz = Math.ceil(cellScale);

          // Select tone based on field excitement
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

    // Flush batches to GPU
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

  // Lifecycle listeners: tab focus & pause
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    } else {
      if (!rafId && !prefersReducedMotion) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(render);
      }
    }
  });

  // Start animation loop
  rafId = requestAnimationFrame(render);
})();
