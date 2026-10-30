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
