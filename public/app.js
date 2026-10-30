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
  formAlert.className = `alert-box alert-${type}`;
  formAlert.innerHTML = `
    <span>${type === 'success' ? '✅' : '⚠️'}</span>
    <span>${message}</span>
  `;
  formAlert.style.display = 'flex';
}

// Detect if running with Express backend
async function detectBackend() {
  try {
    const res = await fetch('/health', { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      isBackendLive = true;
      modeText.textContent = 'Backend: Live API';
      modeText.parentElement.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      modeText.parentElement.style.color = '#34d399';
      return;
    }
  } catch {
    // Backend offline / GitHub Pages mode
  }
  isBackendLive = false;
  modeText.textContent = 'Demo Mode (Local)';
  modeText.parentElement.style.borderColor = 'rgba(245, 158, 11, 0.4)';
  modeText.parentElement.style.color = '#fbbf24';
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
      <div class="empty-state">
        <svg class="empty-state-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <p>${submissionsCache.length === 0 ? 'No assignments submitted yet.' : 'No matching submissions found.'}</p>
      </div>
    `;
    return;
  }

  submissionsList.innerHTML = filtered.map(item => {
    const dateStr = item.submittedAt ? new Date(item.submittedAt).toLocaleString() : 'Just now';
    return `
      <div class="submission-item">
        <div class="submission-meta-top">
          <span class="student-reg">${escapeHtml(item.regNo)}</span>
          <span class="submission-date">${dateStr}</span>
        </div>
        <div class="student-name">${escapeHtml(item.name)}</div>
        <div class="assignment-name">${escapeHtml(item.assignmentTitle)}</div>
        <a href="${encodeURI(item.submissionUrl)}" target="_blank" rel="noopener noreferrer" class="submission-url-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
          <span>${escapeHtml(item.submissionUrl)}</span>
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
    nameError.textContent = 'Student name is required.';
    studentNameInput.classList.add('is-invalid');
    hasError = true;
  }
  if (!regNo) {
    regNoError.textContent = 'Registration number is required.';
    regNoInput.classList.add('is-invalid');
    hasError = true;
  }
  if (!assignmentTitle) {
    titleError.textContent = 'Assignment title is required.';
    titleInput.classList.add('is-invalid');
    hasError = true;
  }
  if (!submissionUrl) {
    urlError.textContent = 'Submission URL is required.';
    urlInput.classList.add('is-invalid');
    hasError = true;
  } else if (!isValidUrl(submissionUrl)) {
    urlError.textContent = 'Invalid URL. Must begin with http:// or https://';
    urlInput.classList.add('is-invalid');
    hasError = true;
  }

  if (hasError) {
    showAlert('Please resolve the highlighted validation errors.', 'error');
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
        showAlert('Assignment submission saved successfully!', 'success');
        form.reset();
        await fetchSubmissions();
      } else {
        showAlert(data.error || 'Failed to save submission.', 'error');
        if (data.error?.toLowerCase().includes('registration')) {
          regNoError.textContent = data.error;
          regNoInput.classList.add('is-invalid');
        } else if (data.error?.toLowerCase().includes('url')) {
          urlError.textContent = data.error;
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
      showAlert('Submission saved locally (GitHub Pages Demo Mode)!', 'success');
      form.reset();
      renderSubmissions();
    }
  } catch (err) {
    showAlert(`Submission error: ${err.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
  }
});

// Quick fill sample data button
quickFillBtn.addEventListener('click', () => {
  studentNameInput.value = 'Muhammad Huzaifa';
  regNoInput.value = 'SP21-BCS-042';
  titleInput.value = 'DevOps Lab Mid - CI/CD Automation';
  urlInput.value = 'https://github.com/huzaifa/devops-lab-mid';
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
