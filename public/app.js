/**
 * Assignment Submission Portal - Client Logic
 * Works seamlessly with Express Backend or fallback LocalStorage (for GitHub Pages demo).
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
  formAlert.className = `system-alert-banner alert-${type}`;
  formAlert.innerHTML = `
    <span>${type === 'success' ? '[STATUS: OK]' : '[ERROR]'}</span>
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
      modeText.textContent = 'BACKEND: LIVE API';
      modeText.parentElement.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      modeText.parentElement.style.color = '#34d399';
      return;
    }
  } catch {
    // Backend offline / GitHub Pages mode
  }
  isBackendLive = false;
  modeText.textContent = 'GH-PAGES: STATIC REPO';
  modeText.parentElement.style.borderColor = 'var(--border-medium)';
  modeText.parentElement.style.color = '#94a3b8';
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
      <div class="ledger-empty">
        <span class="empty-msg">&gt; NO SUBMISSION RECORDS FOUND</span>
        <span class="empty-diag">${submissionsCache.length === 0 ? 'The register is currently clear. Submit the form to add an entry.' : 'No entries match your search query.'}</span>
      </div>
    `;
    return;
  }

  submissionsList.innerHTML = filtered.map(item => {
    const dateStr = item.submittedAt ? new Date(item.submittedAt).toLocaleString() : 'Just now';
    return `
      <div class="ledger-entry">
        <div class="ledger-header">
          <span class="ledger-reg-badge">${escapeHtml(item.regNo)}</span>
          <span class="ledger-timestamp">${dateStr}</span>
        </div>
        <div class="ledger-student">${escapeHtml(item.name)}</div>
        <div class="ledger-title">${escapeHtml(item.assignmentTitle)}</div>
        <a href="${encodeURI(item.submissionUrl)}" target="_blank" rel="noopener noreferrer" class="ledger-link">
          <span>${escapeHtml(item.submissionUrl)}</span>
          <span class="link-arrow">&nearr;</span>
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

  // Client-side validation
  if (!name) {
    nameError.textContent = '> Student name is required.';
    studentNameInput.classList.add('is-invalid');
    hasError = true;
  }
  if (!regNo) {
    regNoError.textContent = '> Registration number is required.';
    regNoInput.classList.add('is-invalid');
    hasError = true;
  }
  if (!assignmentTitle) {
    titleError.textContent = '> Assignment title is required.';
    titleInput.classList.add('is-invalid');
    hasError = true;
  }
  if (!submissionUrl) {
    urlError.textContent = '> Submission link is required.';
    urlInput.classList.add('is-invalid');
    hasError = true;
  } else if (!isValidUrl(submissionUrl)) {
    urlError.textContent = '> Invalid protocol. Must begin with http:// or https://';
    urlInput.classList.add('is-invalid');
    hasError = true;
  }

  if (hasError) {
    showAlert('Resolve highlighted input errors before dispatching.', 'error');
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
        showAlert('Submission saved and verified in register.', 'success');
        form.reset();
        await fetchSubmissions();
      } else {
        showAlert(data.error || 'Failed to save submission.', 'error');
        if (data.error?.toLowerCase().includes('registration')) {
          regNoError.textContent = `> ${data.error}`;
          regNoInput.classList.add('is-invalid');
        } else if (data.error?.toLowerCase().includes('url')) {
          urlError.textContent = `> ${data.error}`;
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
      showAlert('Record saved to browser ledger (GitHub Pages Static Host).', 'success');
      form.reset();
      renderSubmissions();
    }
  } catch (err) {
    showAlert(`Network dispatch error: ${err.message}`, 'error');
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
