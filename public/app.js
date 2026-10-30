/**
 * Assignment Submission Portal - Retro-Terminal Brutalist Client Engine
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
const submissionsList = document.getElementById('submissionsList');
const submissionsCount = document.getElementById('submissionsCount');
const formAlert = document.getElementById('formAlert');
const modeText = document.getElementById('modeText');

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
}

// Show alert banner
function showAlert(message, type = 'success') {
  formAlert.className = `terminal-alert alert-${type}`;
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
      modeText.parentElement.style.borderColor = 'var(--phosphor-bright)';
      modeText.parentElement.style.color = 'var(--phosphor-bright)';
      return;
    }
  } catch {
    // Backend offline / GitHub Pages mode
  }
  isBackendLive = false;
  modeText.textContent = 'HOST: [STANDALONE]';
  modeText.parentElement.style.borderColor = 'var(--phosphor-dim)';
  modeText.parentElement.style.color = 'var(--phosphor-dim)';
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
}

// Render submissions list
function renderSubmissions() {
  const query = (filterInput.value || '').trim().toLowerCase();
  const filtered = submissionsCache.filter(item => {
    return (
      (item.name || '').toLowerCase().includes(query) ||
      (item.regNo || '').toLowerCase().includes(query) ||
      (item.assignmentTitle || '').toLowerCase().includes(query)
    );
  });

  submissionsCount.textContent = submissionsCache.length;

  if (filtered.length === 0) {
    submissionsList.innerHTML = `
      <div class="stream-empty">
        <span class="empty-prompt">&gt; NO_EVALUATION_RECORDS_FOUND</span>
        <span>${submissionsCache.length === 0 ? '// Register buffer is currently empty. Execute submission to register.' : '// Query returned 0 matching records.'}</span>
      </div>
    `;
    return;
  }

  submissionsList.innerHTML = filtered.map(item => {
    const dateStr = item.submittedAt ? new Date(item.submittedAt).toISOString().replace('T', ' ').substring(0, 19) + ' UTC' : 'TIMESTAMP_PENDING';
    return `
      <div class="stream-record">
        <div class="record-meta-line">
          <span class="record-reg-badge">${escapeHtml(item.regNo)}</span>
          <span class="record-time">${dateStr}</span>
        </div>
        <div class="record-student-name">${escapeHtml(item.name)}</div>
        <div class="record-assignment-title">&gt; ${escapeHtml(item.assignmentTitle)}</div>
        <a href="${encodeURI(item.submissionUrl)}" target="_blank" rel="noopener noreferrer" class="record-repo-link">
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
  }
});

// Quick fill sample data button
quickFillBtn.addEventListener('click', () => {
  studentNameInput.value = 'Muhammad Huzaifa';
  regNoInput.value = 'SP21-BCS-042';
  titleInput.value = 'DevOps Lab Mid - CI/CD Automation';
  urlInput.value = 'https://github.com/CoffeeTheBest/devops-lab-mid';
  clearFieldErrors();
});

// Reset button
resetBtn.addEventListener('click', () => {
  clearFieldErrors();
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
})();
