'use strict';

/* ============================================================
   CONFIG
   Centralised so endpoints/keys are changed in exactly one place.
   ============================================================ */
const CONFIG = {
  UPLOAD_ENDPOINT:   'https://finlens-back.onrender.com/upload',
  REPORT_ENDPOINT:   'https://finlens-back.onrender.com/report',
  STORAGE_KEY:       'analysisData',
  STORAGE_META_KEY:  'analysisMeta',
  MAX_FILE_BYTES:    50 * 1024 * 1024, // 50 MB
  FETCH_TIMEOUT_MS:  10_000,
};

/* ============================================================
   DEMO DATASET
   Lets a visitor see the product without a real ledger.
   Shape matches exactly what the backend returns after /upload.
   ============================================================ */
const DEMO_ANALYSIS = {
  summary: {
    totalTransactions: 12_480,
    totalAccounts: 847,
    suspiciousAccounts: 43,
    highestRiskScore: 97,
  },
  riskData: [
    { account: 'ACC-0047', risk: 97 },
    { account: 'ACC-0193', risk: 92 },
    { account: 'ACC-0312', risk: 88 },
    { account: 'ACC-0081', risk: 83 },
    { account: 'ACC-0556', risk: 79 },
    { account: 'ACC-0204', risk: 74 },
    { account: 'ACC-0731', risk: 68 },
    { account: 'ACC-0418', risk: 61 },
    { account: 'ACC-0097', risk: 55 },
    { account: 'ACC-0623', risk: 49 },
    { account: 'ACC-0142', risk: 41 },
    { account: 'ACC-0889', risk: 33 },
    { account: 'ACC-0275', risk: 22 },
    { account: 'ACC-0364', risk: 14 },
    { account: 'ACC-0711', risk: 8 },
  ],
  graph: {
    nodes: [
      { id: 'ACC-0047', label: 'ACC-0047', risk: 97 },
      { id: 'ACC-0193', label: 'ACC-0193', risk: 92 },
      { id: 'ACC-0312', label: 'ACC-0312', risk: 88 },
      { id: 'ACC-0081', label: 'ACC-0081', risk: 83 },
      { id: 'ACC-0556', label: 'ACC-0556', risk: 79 },
      { id: 'ACC-0204', label: 'ACC-0204', risk: 74 },
      { id: 'ACC-0731', label: 'ACC-0731', risk: 68 },
      { id: 'ACC-0418', label: 'ACC-0418', risk: 61 },
      { id: 'ACC-0097', label: 'ACC-0097', risk: 55 },
      { id: 'ACC-0623', label: 'ACC-0623', risk: 49 },
      { id: 'ACC-0142', label: 'ACC-0142', risk: 41 },
      { id: 'ACC-0889', label: 'ACC-0889', risk: 33 },
    ],
    edges: [
      { from: 'ACC-0047', to: 'ACC-0193', amount: 142_000 },
      { from: 'ACC-0193', to: 'ACC-0312', amount: 87_500 },
      { from: 'ACC-0312', to: 'ACC-0047', amount: 135_000 },
      { from: 'ACC-0081', to: 'ACC-0047', amount: 63_200 },
      { from: 'ACC-0556', to: 'ACC-0193', amount: 29_800 },
      { from: 'ACC-0204', to: 'ACC-0312', amount: 91_000 },
      { from: 'ACC-0731', to: 'ACC-0081', amount: 17_400 },
      { from: 'ACC-0418', to: 'ACC-0556', amount: 44_600 },
      { from: 'ACC-0097', to: 'ACC-0731', amount: 12_300 },
      { from: 'ACC-0623', to: 'ACC-0418', amount: 38_900 },
      { from: 'ACC-0142', to: 'ACC-0623', amount: 9_750 },
      { from: 'ACC-0889', to: 'ACC-0142', amount: 22_100 },
      { from: 'ACC-0047', to: 'ACC-0081', amount: 55_000 },
      { from: 'ACC-0193', to: 'ACC-0556', amount: 71_200 },
    ],
  },
  transactions: [
    { id: 'TXN-001', from: 'ACC-0047', to: 'ACC-0193', amount: 142_000, date: '2024-06-01 09:14', status: 'Flagged' },
    { id: 'TXN-002', from: 'ACC-0193', to: 'ACC-0312', amount: 87_500,  date: '2024-06-01 11:32', status: 'Flagged' },
    { id: 'TXN-003', from: 'ACC-0312', to: 'ACC-0047', amount: 135_000, date: '2024-06-01 14:55', status: 'Flagged' },
    { id: 'TXN-004', from: 'ACC-0081', to: 'ACC-0047', amount: 63_200,  date: '2024-06-02 08:03', status: 'Suspicious' },
    { id: 'TXN-005', from: 'ACC-0556', to: 'ACC-0193', amount: 29_800,  date: '2024-06-02 10:47', status: 'Suspicious' },
    { id: 'TXN-006', from: 'ACC-0204', to: 'ACC-0312', amount: 91_000,  date: '2024-06-03 13:22', status: 'Flagged' },
    { id: 'TXN-007', from: 'ACC-0731', to: 'ACC-0081', amount: 17_400,  date: '2024-06-03 15:09', status: 'Clear' },
    { id: 'TXN-008', from: 'ACC-0418', to: 'ACC-0556', amount: 44_600,  date: '2024-06-04 09:55', status: 'Suspicious' },
  ],
};

/* ============================================================
   UTILITIES
   ============================================================ */

function safeText(el, text) {
  if (!el) return;
  el.textContent = String(text ?? '—');
}

function riskTier(score) {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function riskLabel(score) {
  const t = riskTier(score);
  return { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }[t];
}

function formatCurrency(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

function formatNumber(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US').format(n);
}

function toggleVisible(el, visible, cls = 'visible') {
  if (!el) return;
  el.classList.toggle(cls, visible);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

function showError(bannerEl, message) {
  if (!bannerEl) return;
  const span = bannerEl.querySelector('.error-msg');
  if (span) safeText(span, message);
  toggleVisible(bannerEl, true);
}

function hideError(bannerEl) {
  toggleVisible(bannerEl, false);
}

/* ============================================================
   PERSISTED ANALYSIS STATE
   Single source of truth read/written across all three pages.
   ============================================================ */

function getStoredAnalysis() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function getStoredMeta() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_META_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAnalysis(analysis, meta) {
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(analysis));
  localStorage.setItem(CONFIG.STORAGE_META_KEY, JSON.stringify(meta));
}

function hasAnalysisData() {
  return !!getStoredAnalysis();
}

/* ============================================================
   NAV GUARD
   Runs on every page. Locks Dashboard/Investigation until an
   analysis exists, and keeps header state consistent afterward.
   ============================================================ */

let navToastTimer = null;

function showNavToast(message) {
  const toast = document.getElementById('nav-toast');
  if (!toast) return;
  safeText(toast, message);
  toast.classList.add('visible');
  clearTimeout(navToastTimer);
  navToastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

function navGuardClickHandler(e) {
  e.preventDefault();
  showNavToast('Upload a ledger first to unlock this page.');
}

function initNavGuard() {
  const unlocked = hasAnalysisData();
  document.querySelectorAll('[data-requires-upload]').forEach(link => {
    link.removeEventListener('click', navGuardClickHandler);
    if (unlocked) {
      link.classList.remove('nav-locked');
      link.removeAttribute('aria-disabled');
    } else {
      link.classList.add('nav-locked');
      link.setAttribute('aria-disabled', 'true');
      link.addEventListener('click', navGuardClickHandler);
    }
  });
}

/* ============================================================
   MOBILE NAVBAR MENU
   Hamburger toggle for the nav-links dropdown. Runs on every page.
   ============================================================ */
function initMobileNav() {
  const toggle   = document.getElementById('nav-menu-toggle');
  const links    = document.getElementById('fcis-nav-links');
  const backdrop = document.getElementById('nav-menu-backdrop');

  if (!toggle || !links) return;

  function closeMenu() {
    links.classList.remove('mobile-open');
    backdrop?.classList.remove('visible');
    toggle.setAttribute('aria-expanded', 'false');
  }

  function openMenu() {
    links.classList.add('mobile-open');
    backdrop?.classList.add('visible');
    toggle.setAttribute('aria-expanded', 'true');
  }

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.contains('mobile-open');
    isOpen ? closeMenu() : openMenu();
  });

  backdrop?.addEventListener('click', closeMenu);
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeMenu();
  });
}

/* ============================================================
   PAGE: UPLOAD (index.html)
   ============================================================ */
/* ============================================================
   PROCESSING MODAL CONTROLLER
   8 named stages matching the spec exactly. Stage 0 ("Uploading
   File") tracks REAL upload byte-progress via XHR — not simulated.
   Stages 1-6 happen inside one opaque server round trip with no
   granular signal available, so they advance on a steady,
   deliberate timer as a clearly best-effort approximation, and
   they never outrun reality: if the real response arrives first,
   remaining stages fast-forward instantly instead of making the
   user wait on fake delays. Stage 7 ("Analysis Complete") only
   ever lights up on an actual successful response.
   ============================================================ */
const PROCESSING_STAGES = [
  { label: 'Uploading File',                   status: 'Uploading file…' },
  { label: 'Reading CSV',                      status: 'Reading transaction data…' },
  { label: 'Parsing Transactions',             status: 'Parsing transaction records…' },
  { label: 'Building Transaction Network',     status: 'Building financial network…' },
  { label: 'Running Risk Analysis',            status: 'Running AI risk analysis…' },
  { label: 'Detecting Suspicious Patterns',    status: 'Searching for suspicious transaction patterns…' },
  { label: 'Generating Investigation Results', status: 'Preparing investigation workspace…' },
  { label: 'Analysis Complete',                status: 'Analysis completed successfully.' },
];

function createProcessingController() {
  const overlayEl = document.getElementById('processing-overlay');
  const statusEl  = document.getElementById('processing-status-text');
  const fillEl    = document.getElementById('processing-progress-fill');
  const stageEls  = Array.from(document.querySelectorAll('.processing-stage'));

  if (!overlayEl || !fillEl || stageEls.length === 0) return null; // markup not present on this page

  const STAGE_COUNT = stageEls.length;
  let currentIndex = -1;
  let simTimer = null;
  let statusTimer = null;

  function show() {
    overlayEl.classList.add('visible');
    overlayEl.setAttribute('aria-hidden', 'false');
  }

  function hide() {
    overlayEl.classList.remove('visible');
    overlayEl.setAttribute('aria-hidden', 'true');
  }

  function reset() {
    clearTimeout(simTimer);
    clearTimeout(statusTimer);
    currentIndex = -1;
    fillEl.style.width = '0%';
    stageEls.forEach(li => li.classList.remove('stage-visible', 'stage-active', 'stage-done', 'stage-error'));
    if (statusEl) { statusEl.style.opacity = '1'; statusEl.textContent = 'Preparing upload…'; }
  }

  function setStatus(text) {
    if (!statusEl || !text) return;
    statusEl.style.opacity = '0';
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      statusEl.textContent = text;
      statusEl.style.opacity = '1';
    }, 140);
  }

  function setPercent(pct) {
    fillEl.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  }

  // Reveals every stage up to `index` (in case several are being caught
  // up at once), marks the target stage active or done, and updates the
  // status line + progress bar to match. Never moves backwards.
  function goToStage(index, { done = false, status } = {}) {
    if (index < currentIndex) return;
    currentIndex = index;

    stageEls.forEach((li, i) => {
      li.classList.remove('stage-error');
      if (i <= index) li.classList.add('stage-visible');
      if (i < index || (i === index && done)) {
        li.classList.add('stage-done');
        li.classList.remove('stage-active');
      } else if (i === index) {
        li.classList.add('stage-active');
        li.classList.remove('stage-done');
      } else {
        li.classList.remove('stage-active', 'stage-done');
      }
    });

    setStatus(status);
    setPercent(((index + (done ? 1 : 0.5)) / STAGE_COUNT) * 100);
  }

  function setUploadProgress(fraction) {
    // Real byte-level progress, scaled into stage 0's slice of the bar.
    setPercent((Math.max(0, Math.min(1, fraction)) / STAGE_COUNT) * 100);
  }

  function startSimulatedProcessing() {
    goToStage(0, { done: true, status: PROCESSING_STAGES[0].status });
    let i = 1;

    function next() {
      if (i >= STAGE_COUNT - 1) return; // hold just before "Analysis Complete"
      goToStage(i, { status: PROCESSING_STAGES[i].status });
      i++;
      if (i < STAGE_COUNT - 1) simTimer = setTimeout(next, 620);
    }
    simTimer = setTimeout(next, 350);
  }

  function complete() {
    clearTimeout(simTimer);
    goToStage(STAGE_COUNT - 1, { done: true, status: PROCESSING_STAGES[STAGE_COUNT - 1].status });
  }

  function fail() {
    clearTimeout(simTimer);
    const idx = Math.max(0, currentIndex);
    stageEls[idx]?.classList.add('stage-error');
    stageEls[idx]?.classList.remove('stage-active');
  }

  return { show, hide, reset, goToStage, setUploadProgress, startSimulatedProcessing, complete, fail };
}

/**
 * Uploads a file with real byte-level progress via XHR (fetch has no
 * upload-progress API). Resolves with the parsed JSON body for any
 * response the server sends; rejects only on network failure, a
 * timeout, or a non-JSON body.
 */
function uploadWithProgress(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.open('POST', url, true);
    xhr.timeout = CONFIG.FETCH_TIMEOUT_MS * 6; // real analysis can take longer than a simple fetch

    xhr.upload.onprogress = e => {
      if (e.lengthComputable && typeof onProgress === 'function') onProgress(e.loaded / e.total);
    };
    xhr.upload.onload = () => { if (typeof onProgress === 'function') onProgress(1); };

    xhr.onload = () => {
      let body = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error('Server returned an invalid response.'));
        return;
      }
      resolve({ status: xhr.status, ok: xhr.status >= 200 && xhr.status < 300, body });
    };

    xhr.onerror = () => reject(new Error('Network error during upload.'));
    xhr.ontimeout = () => reject(new Error('Upload timed out. Please try again.'));

    xhr.send(formData);
  });
}

/* ============================================================
   PAGE: UPLOAD (index.html)
   ============================================================ */
function initUploadPage() {
  const dropZone     = document.getElementById('drop-zone');
  const fileInput    = document.getElementById('csv-file-input');
  const browseBtn    = document.getElementById('browse-btn');
  const uploadBtn    = document.getElementById('upload-btn');
  const statusEl     = document.getElementById('upload-status');
  const statusIcon   = document.getElementById('status-icon');
  const statusMsg    = document.getElementById('status-msg');
  const fileInfoEl   = document.getElementById('file-selected-info');
  const fileNameEl   = document.getElementById('file-name');
  const fileSizeEl   = document.getElementById('file-size');
  const demoBtn      = document.getElementById('demo-data-btn');

  if (!dropZone || !fileInput || !uploadBtn) return;

  const processing = createProcessingController();

  let selectedFile = null;

  function validateFile(file) {
    if (!file) return 'No file provided.';
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'csv') return `Invalid file type ".${ext}". Only .csv files are accepted.`;
    if (file.size > CONFIG.MAX_FILE_BYTES) return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 50 MB.`;
    return null;
  }

  function setSelectedFile(file) {
    const err = validateFile(file);

    if (err) {
      selectedFile = null;
      dropZone.classList.remove('has-file');
      dropZone.classList.add('error-state');
      showStatus('error', '⚠', err);
      toggleVisible(fileInfoEl, false);
      return;
    }

    selectedFile = file;
    dropZone.classList.remove('error-state');
    dropZone.classList.add('has-file');
    showStatus('success', '✓', `File ready: ${file.name}`);

    safeText(fileNameEl, file.name);
    safeText(fileSizeEl, `(${(file.size / 1024).toFixed(1)} KB)`);
    toggleVisible(fileInfoEl, true);

    uploadBtn.disabled = false;
  }

  function clearSelection() {
    selectedFile = null;
    fileInput.value = '';
    dropZone.classList.remove('has-file', 'error-state');
    toggleVisible(fileInfoEl, false);
    hideStatusEl();
    uploadBtn.disabled = true;
  }

  function showStatus(type, iconChar, message) {
    statusEl.className = `upload-status visible status-${type}`;
    safeText(statusIcon, iconChar);
    safeText(statusMsg, message);
  }

  function hideStatusEl() {
    statusEl.className = 'upload-status';
  }

  /* --- Drag-and-drop --- */
  ['dragenter', 'dragover'].forEach(evt =>
    dropZone.addEventListener(evt, e => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    })
  );

  ['dragleave', 'dragend'].forEach(evt =>
    dropZone.addEventListener(evt, () => dropZone.classList.remove('drag-over'))
  );

  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) setSelectedFile(files[0]);
  });

  /* --- Click browse --- */
  browseBtn.addEventListener('click', e => {
    e.stopPropagation();
    fileInput.click();
  });

  dropZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      setSelectedFile(fileInput.files[0]);
    }
  });

  /* --- Upload --- */
  uploadBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    const err = validateFile(selectedFile);
    if (err) {
      showStatus('error', '⚠', err);
      return;
    }

    uploadBtn.disabled = true;
    hideStatusEl();
    processing?.reset();
    processing?.show();
    processing?.goToStage(0, { status: PROCESSING_STAGES[0].status });

    try {
      const { ok, status, body } = await uploadWithProgress(
        CONFIG.UPLOAD_ENDPOINT,
        selectedFile,
        fraction => {
          processing?.setUploadProgress(fraction);
          if (fraction >= 1) processing?.startSimulatedProcessing();
        }
      );

      if (!ok) {
        throw new Error(body?.error || `Upload failed (HTTP ${status}).`);
      }
      if (!body || body.success === false) {
        throw new Error(body?.error || 'Upload failed.');
      }

      saveAnalysis(body, {
        filename: selectedFile.name,
        uploadedAt: new Date().toISOString(),
      });

      // Only now — on a real, successful response — does the final
      // stage light up and the app move on to the dashboard.
      processing?.complete();

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 900);

    } catch (err) {
      processing?.fail();
      setTimeout(() => processing?.hide(), 1400);
      showStatus('error', '⚠', err.message || 'Upload failed. Please try again.');
      uploadBtn.disabled = false;
    }
  });

  /* --- Try with sample data --- */
  demoBtn?.addEventListener('click', () => {
    saveAnalysis(DEMO_ANALYSIS, {
      filename: 'sample-ledger.csv (demo data)',
      uploadedAt: new Date().toISOString(),
    });
    window.location.href = 'dashboard.html';
  });

  /* --- Reset on double-click --- */
  dropZone.addEventListener('dblclick', clearSelection);

  uploadBtn.disabled = true;
}


/* ============================================================
   PAGE: DASHBOARD (dashboard.html)
   ============================================================ */
function initDashboardPage() {
  const errorBanner    = document.getElementById('error-banner');
  const loadingOverlay = document.getElementById('loading-overlay');
  const emptyStateEl   = document.getElementById('dashboard-empty-state');
  const mainEl         = document.getElementById('dashboard-main');

  if (!document.getElementById('stat-total-tx')) return; // not on this page

  if (!hasAnalysisData()) {
    toggleVisible(loadingOverlay, false);
    if (mainEl) mainEl.style.display = 'none';
    if (emptyStateEl) emptyStateEl.style.display = 'flex';
    return;
  }

  const analysis = getStoredAnalysis();
  const meta = getStoredMeta();

  let allRiskScores  = [];
  let sortDir        = 'desc'; // 'asc' | 'desc'
  let searchQuery    = '';

  function renderCaseStrip() {
    safeText(document.getElementById('case-filename'), meta?.filename ?? '—');
    safeText(
      document.getElementById('case-uploaded-at'),
      meta?.uploadedAt ? new Date(meta.uploadedAt).toLocaleString() : '—'
    );
  }

  function loadStats() {
    try {
      const data = analysis.summary || {};
      safeText(document.getElementById('stat-total-tx'),     formatNumber(data.totalTransactions));
      safeText(document.getElementById('stat-total-acc'),    formatNumber(data.totalAccounts));
      safeText(document.getElementById('stat-suspicious'),   formatNumber(data.suspiciousAccounts));
      safeText(document.getElementById('stat-highest-risk'), data.highestRiskScore ?? '—');
    } catch (err) {
      showError(errorBanner, `Failed to load dashboard stats: ${err.message}`);
    }
  }

  function loadRiskTable() {
    const tbody = document.getElementById('risk-table-body');
    if (!tbody) return;

    try {
      const scores = analysis.riskData;
      allRiskScores = Array.isArray(scores) ? scores : [];
      renderTable();
    } catch (err) {
      showError(errorBanner, `Failed to load risk scores: ${err.message}`);
      tbody.innerHTML = '';
      const emptyRow = tbody.insertRow();
      const cell = emptyRow.insertCell();
      cell.colSpan = 3;
      cell.className = 'text-center';
      safeText(cell, 'Failed to load data. Refresh to retry.');
    }
  }

  function renderTable() {
    const tbody = document.getElementById('risk-table-body');
    const emptyState = document.getElementById('table-empty');
    if (!tbody) return;

    let filtered = allRiskScores.filter(item => {
      if (!searchQuery) return true;
      return (item.account ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    });

    filtered.sort((a, b) => sortDir === 'desc' ? b.risk - a.risk : a.risk - b.risk);

    tbody.innerHTML = '';

    if (filtered.length === 0) {
      toggleVisible(emptyState, true);
      return;
    }

    toggleVisible(emptyState, false);

    filtered.forEach((item, idx) => {
      const row = tbody.insertRow();
      row.style.cursor = 'pointer';

      const rankCell = row.insertCell();
      rankCell.className = 'mono-cell';
      rankCell.dataset.label = 'Rank';
      safeText(rankCell, String(idx + 1).padStart(2, '0'));
      rankCell.style.color = 'var(--text-muted)';
      rankCell.style.fontFamily = 'var(--font-mono)';
      rankCell.style.fontSize = '12px';

      const accCell = row.insertCell();
      accCell.dataset.label = 'Account';
      const link = el('a', 'account-link', item.account ?? '—');
      link.href = `investigation.html?account=${encodeURIComponent(item.account ?? '')}`;
      link.addEventListener('click', e => e.stopPropagation());
      accCell.appendChild(link);

      const riskCell = row.insertCell();
      riskCell.dataset.label = 'Risk';
      const tier = riskTier(item.risk);
      const wrap = el('div', 'risk-bar-wrap');
      const track = el('div', 'risk-bar-track');
      const fill = el('div', `risk-bar-fill fill-${tier}`);
      fill.style.width = `${Math.min(100, Math.max(0, item.risk))}%`;
      track.appendChild(fill);

      const scoreSpan = el('span', `risk-score-num`, item.risk);
      scoreSpan.style.color = `var(--${tier === 'critical' ? 'danger' : tier === 'high' ? 'warning' : tier === 'medium' ? 'info' : 'safe'})`;

      const badge = el('span', `fcis-badge badge-${tier}`, riskLabel(item.risk));
      wrap.appendChild(track);
      wrap.appendChild(scoreSpan);
      wrap.appendChild(badge);
      riskCell.appendChild(wrap);

      row.addEventListener('click', () => {
        window.location.href = `investigation.html?account=${encodeURIComponent(item.account ?? '')}`;
      });
    });
  }

  const searchInput = document.getElementById('account-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value ?? '';
      renderTable();
    });
  }

  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.sort;
      if (!dir) return;
      sortDir = dir;
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('sort-active'));
      btn.classList.add('sort-active');
      renderTable();
    });
  });

  (async () => {
    toggleVisible(loadingOverlay, true);
    renderCaseStrip();
    loadStats();
    loadRiskTable();
    toggleVisible(loadingOverlay, false);
  })();
}

/* ============================================================
   PAGE: INVESTIGATION (investigation.html)
   ============================================================ */
function initInvestigationPage() {
  if (!document.getElementById('network-graph')) return;

  const errorBanner    = document.getElementById('error-banner');
  const loadingOverlay = document.getElementById('loading-overlay');
  const emptyStateEl   = document.getElementById('investigation-empty-state');
  const mainEl         = document.getElementById('investigation-main');

  if (!hasAnalysisData()) {
    toggleVisible(loadingOverlay, false);
    if (mainEl) mainEl.style.display = 'none';
    if (emptyStateEl) emptyStateEl.style.display = 'flex';
    return;
  }

  const analysis = getStoredAnalysis();
  const ALL_TRANSACTIONS = Array.isArray(analysis.transactions) ? analysis.transactions : [];
  const ALL_RISK         = Array.isArray(analysis.riskData) ? analysis.riskData : [];

  /* --- Mission Control header: filename, aggregate risk, status --- */
  function renderMissionControl() {
    const meta = getStoredMeta();

    safeText(document.getElementById('mc-filename'), meta?.filename ?? 'Untitled ledger');

    const highestRisk = analysis.summary?.highestRiskScore;
    const riskTierEl = document.getElementById('mc-risk-tier');
    const riskPctEl  = document.getElementById('mc-risk-pct');

    if (riskTierEl) {
      if (typeof highestRisk === 'number') {
        riskTierEl.textContent = riskLabel(highestRisk).toUpperCase();
        riskTierEl.className = `mc-risk-tier tier-${riskTier(highestRisk)}`;
      } else {
        riskTierEl.textContent = '—';
        riskTierEl.className = 'mc-risk-tier';
      }
    }
    if (riskPctEl) safeText(riskPctEl, typeof highestRisk === 'number' ? `(${highestRisk}%)` : '');

    const statusEl = document.getElementById('mc-status');
    const statusTextEl = document.getElementById('mc-status-text');
    if (statusEl && statusTextEl) {
      statusEl.classList.remove('status-pending');
      statusEl.classList.add('status-complete');
      statusTextEl.textContent = 'COMPLETE';
    }
  }

  const accountIdEl    = document.getElementById('selected-account-id');
  const riskBadgeEl    = document.getElementById('selected-risk-badge');
  const reportTextEl   = document.getElementById('ai-report-text');
  const reportPlacEl   = document.getElementById('report-placeholder');
  const reportBtn      = document.getElementById('generate-report');
  const detailsBodyEl  = document.getElementById('account-details-body');
  const txTbodyEl      = document.getElementById('tx-table-body');
  const txEmptyEl      = document.getElementById('tx-empty');
  const txTableView    = document.getElementById('tx-table-view');
  const txTimelineView = document.getElementById('tx-timeline-view');

  const noSelectionHTML = detailsBodyEl ? detailsBodyEl.innerHTML : '';

  let network = null;
  let selectedNodeId = null;
  let statusFilter = 'all';
  let viewMode = 'table';

  /* --- Mobile section switcher (graph/entity/report/history tabs below 1100px) --- */
  const invWrapperEl = document.getElementById('investigation-main');
  const invTabButtons = document.querySelectorAll('.inv-tab');
  const mobileStageQuery = window.matchMedia('(max-width: 1100px)');

  function setActiveTab(tab) {
    if (!invWrapperEl) return;
    invWrapperEl.dataset.activeTab = tab;
    invTabButtons.forEach(btn => {
      const active = btn.dataset.tab === tab;
      btn.classList.toggle('inv-tab-active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    if (tab === 'graph' && network) {
      // Panel was display:none; vis-network needs a nudge to re-measure and re-center.
      setTimeout(() => {
        network.redraw();
        network.fit({ animation: false });
      }, 50);
    }
  }

  invTabButtons.forEach(btn => {
    btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
  });

  function getAccountParam() {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get('account') ?? '';
      return raw.replace(/[^a-zA-Z0-9\-_]/g, '').slice(0, 64);
    } catch {
      return '';
    }
  }

  const preselectedAccount = getAccountParam();

  function nodeStyle(risk) {
    const t = riskTier(risk ?? 0);
    const styles = {
      critical: { background: '#241516', border: '#E05353', font: '#F0A8A8', shadow: true },
      high:     { background: '#241B14', border: '#D17A4A', font: '#E5B690', shadow: false },
      medium:   { background: '#241F14', border: '#DF9F4F', font: '#EEC988', shadow: false },
      low:      { background: '#12201B', border: '#52A47F', font: '#8FCBAA', shadow: false },
    };
    return styles[t] || styles.low;
  }

  function riskOf(accountId) {
    const entry = ALL_RISK.find(r => r.account === accountId);
    return entry ? entry.risk : null;
  }

  /* --- Derive entity stats client-side from real graph + tx data --- */
  function computeEntityStats(accountId) {
    const related = ALL_TRANSACTIONS.filter(t =>
      (t.from ?? t.sender) === accountId || (t.to ?? t.receiver) === accountId
    );
    const totalVolume = related.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const counterparties = new Set();
    related.forEach(t => {
      const from = t.from ?? t.sender;
      const to = t.to ?? t.receiver;
      if (from && from !== accountId) counterparties.add(from);
      if (to && to !== accountId) counterparties.add(to);
    });

    const flaggedCount = related.filter(t => t.status === 'Flagged').length;
    const dates = related.map(t => t.date).filter(Boolean).sort();

    return {
      account: accountId,
      risk: riskOf(accountId),
      txCount: related.length,
      totalVolume,
      counterpartyCount: counterparties.size,
      flaggedCount,
      firstSeen: dates[0] ?? null,
      lastSeen: dates[dates.length - 1] ?? null,
    };
  }

  function renderAccountDetails(stats) {
    if (!detailsBodyEl) return;
    detailsBodyEl.innerHTML = '';

    const rows = [
      { label: 'Account ID',        value: stats.account },
      { label: 'Risk Score',        value: stats.risk != null ? `${stats.risk} — ${riskLabel(stats.risk)}` : '—' },
      { label: 'Total Volume',      value: formatCurrency(stats.totalVolume) },
      { label: 'Transaction Count',value: formatNumber(stats.txCount) },
      { label: 'Counterparties',    value: formatNumber(stats.counterpartyCount) },
      { label: 'Flagged Transfers', value: formatNumber(stats.flaggedCount) },
      { label: 'First Seen',        value: stats.firstSeen ?? '—' },
      { label: 'Last Seen',         value: stats.lastSeen ?? '—' },
    ];

    rows.forEach(r => {
      const row = el('div', 'detail-row');
      row.appendChild(el('span', 'detail-label', r.label));
      row.appendChild(el('span', 'detail-value', r.value));
      detailsBodyEl.appendChild(row);
    });

    if (accountIdEl) safeText(accountIdEl, stats.account ?? '—');
    if (riskBadgeEl) {
      if (stats.risk != null) {
        const tier = riskTier(stats.risk);
        riskBadgeEl.className = `fcis-badge mc-entity-badge badge-${tier}`;
        riskBadgeEl.textContent = `${stats.account} — ${riskLabel(stats.risk)} (${stats.risk})`;
      } else {
        riskBadgeEl.className = 'fcis-badge mc-entity-badge';
        riskBadgeEl.textContent = stats.account ?? 'None';
      }
    }
  }

  function resetDetailsPanel() {
    if (detailsBodyEl) detailsBodyEl.innerHTML = noSelectionHTML;
    if (accountIdEl) safeText(accountIdEl, '—');
    if (riskBadgeEl) { riskBadgeEl.className = 'fcis-badge mc-entity-badge'; riskBadgeEl.textContent = 'None'; }
    if (reportTextEl) reportTextEl.textContent = '';
    if (reportPlacEl) {
      toggleVisible(reportPlacEl, true);
      safeText(reportPlacEl, 'Select an entity, then generate its investigation report.');
    }
    if (reportBtn) reportBtn.disabled = true;
    safeText(document.getElementById('page-account-label'), '');
  }

  function selectNode(nodeId) {
    selectedNodeId = nodeId;
    const stats = computeEntityStats(nodeId);
    renderAccountDetails(stats);
    filterTransactions();

    if (mobileStageQuery.matches) setActiveTab('details');

    if (reportBtn) reportBtn.disabled = false;
    if (reportTextEl) reportTextEl.textContent = '';
    if (reportPlacEl) {
      toggleVisible(reportPlacEl, true);
      safeText(reportPlacEl, 'Click "Generate AI Report" to analyse this entity.');
    }
    safeText(document.getElementById('page-account-label'), nodeId);
  }

  /* --- AI report generation (backend call, one entity at a time) --- */
  reportBtn?.addEventListener('click', async () => {
    if (!selectedNodeId) return;

    reportBtn.disabled = true;
    if (reportPlacEl) toggleVisible(reportPlacEl, false);
    if (reportTextEl) reportTextEl.textContent = 'Generating AI report…';

    try {
      const response = await fetch(CONFIG.REPORT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: selectedNodeId,
          summary: analysis.summary,
          riskData: analysis.riskData,
          graph: analysis.graph,
        }),
      });

      if (!response.ok) throw new Error(`Report request failed (HTTP ${response.status}).`);

      const data = await response.json();
      if (reportTextEl) reportTextEl.textContent = data.report || 'No report content returned.';

    } catch (err) {
      if (reportTextEl) reportTextEl.textContent = '';
      if (reportPlacEl) {
        toggleVisible(reportPlacEl, true);
        safeText(reportPlacEl, `Couldn't generate a report: ${err.message}`);
      }
      console.error(err);
    } finally {
      reportBtn.disabled = false;
    }
  });

  /* --- Load & render graph --- */
  function loadGraph() {
    try {
      const data = analysis.graph;

      if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
        throw new Error('No graph data available for this ledger.');
      }

      const visNodes = data.nodes.map(n => {
        const s = nodeStyle(n.risk ?? 0);
        return {
          id:    n.id,
          label: n.label ?? n.id,
          color: {
            background: s.background,
            border:     s.border,
            highlight:  { background: s.background, border: '#ffffff' },
            hover:      { background: s.background, border: '#ffffff' },
          },
          font:       { color: s.font, size: 12, face: 'JetBrains Mono' },
          shape:      'dot',
          size:       14 + Math.floor((n.risk ?? 0) / 15),
          borderWidth: 2,
          shadow:     s.shadow ? { enabled: true, color: '#E0535380', size: 12 } : false,
          title:      `${n.id} — Risk: ${n.risk ?? '?'}`,
          risk:       n.risk ?? 0,
        };
      });

      const visEdges = data.edges.map((e, idx) => ({
        id:    `edge-${idx}`,
        from:  e.from,
        to:    e.to,
        label: e.amount ? formatCurrency(e.amount) : '',
        value: e.amount || 1,
        font:  { color: '#6E7683', size: 9, face: 'JetBrains Mono', align: 'middle', strokeWidth: 0 },
        color: { color: '#323847', highlight: '#5B7C99', hover: '#5B7C99' },
        arrows:{ to: { enabled: true, scaleFactor: 0.6 } },
        smooth: { enabled: true, type: 'continuous', roundness: 0.45 },
      }));

      const container = document.getElementById('network-graph');

      const options = {
        interaction: {
          hover:         true,
          tooltipDelay:  150,
          zoomView:      true,
          dragView:      true,
          dragNodes:     true,
          keyboard:      { enabled: false },
        },
        physics: {
          enabled: true,
          solver:  'forceAtlas2Based',
          forceAtlas2Based: {
            gravitationalConstant: -52,
            centralGravity:         0.008,
            springLength:           140,
            springConstant:         0.06,
            damping:                0.65,
          },
          stabilization: { iterations: 180, updateInterval: 25 },
        },
        edges: {
          smooth:  { enabled: true, type: 'continuous', roundness: 0.45 },
          scaling: { min: 1, max: 6 },
        },
        nodes: {
          scaling: { min: 10, max: 30 },
        },
        layout: { improvedLayout: true },
      };

      const visDataNodes = new vis.DataSet(visNodes);
      const visDataEdges = new vis.DataSet(visEdges);

      network = new vis.Network(container, { nodes: visDataNodes, edges: visDataEdges }, options);

      const baseSizes = new Map(visNodes.map(n => [n.id, n.size]));
      network.on('hoverNode', params => {
        const base = baseSizes.get(params.node);
        if (base != null) visDataNodes.update({ id: params.node, size: base * 1.18 });
      });
      network.on('blurNode', params => {
        const base = baseSizes.get(params.node);
        if (base != null) visDataNodes.update({ id: params.node, size: base });
      });

      network.on('selectNode', params => {
        const nodeId = params.nodes?.[0];
        if (!nodeId) return;
        selectNode(nodeId);
      });

      network.on('deselectNode', () => {
        selectedNodeId = null;
        resetDetailsPanel();
        filterTransactions();
      });

      document.getElementById('graph-zoom-in')?.addEventListener('click', () =>
        network.moveTo({ scale: network.getScale() * 1.25, animation: { duration: 200 } })
      );
      document.getElementById('graph-zoom-out')?.addEventListener('click', () =>
        network.moveTo({ scale: network.getScale() * 0.8, animation: { duration: 200 } })
      );
      document.getElementById('graph-fit')?.addEventListener('click', () =>
        network.fit({ animation: { duration: 400 } })
      );

      if (preselectedAccount && data.nodes.some(n => n.id === preselectedAccount)) {
        setTimeout(() => {
          network.selectNodes([preselectedAccount]);
          network.focus(preselectedAccount, { scale: 1.4, animation: { duration: 600 } });
          selectNode(preselectedAccount);
        }, 800);
      }

    } catch (err) {
      showError(errorBanner, `Graph load failed: ${err.message}`);
    }
  }

  /* --- Filters + view toggle --- */
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      statusFilter = chip.dataset.status;
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('filter-chip-active'));
      chip.classList.add('filter-chip-active');
      filterTransactions();
    });
  });

  document.querySelectorAll('.tx-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      viewMode = btn.dataset.view;
      document.querySelectorAll('.tx-view-btn').forEach(b => b.classList.remove('tx-view-active'));
      btn.classList.add('tx-view-active');
      filterTransactions();
    });
  });

  function filterTransactions() {
    let list = ALL_TRANSACTIONS;

    if (selectedNodeId) {
      list = list.filter(t =>
        (t.from ?? t.sender) === selectedNodeId || (t.to ?? t.receiver) === selectedNodeId
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter(t => t.status === statusFilter);
    }

    const countBadge = document.getElementById('tx-count-badge');
    if (countBadge) safeText(countBadge, `${list.length} tx`);

    if (txTableView) txTableView.style.display = viewMode === 'table' ? '' : 'none';
    if (txTimelineView) txTimelineView.style.display = viewMode === 'timeline' ? '' : 'none';

    if (viewMode === 'table') renderTransactionsTable(list);
    else renderTransactionsTimeline(list);
  }

  function renderTransactionsTable(list) {
    if (!txTbodyEl) return;
    txTbodyEl.innerHTML = '';

    if (!list || list.length === 0) {
      toggleVisible(txEmptyEl, true);
      return;
    }
    toggleVisible(txEmptyEl, false);

    list.forEach((tx, idx) => {
      const row = txTbodyEl.insertRow();

      const cells = [
        { val: tx.id ?? `TXN-${String(idx + 1).padStart(3, '0')}`, cls: 'mono-cell', label: 'Tx ID' },
        { val: tx.from ?? tx.sender ?? '—', cls: 'mono-cell', label: 'From' },
        { val: tx.to ?? tx.receiver ?? '—', cls: 'mono-cell', label: 'To' },
        { val: tx.amount ? formatCurrency(Number(tx.amount)) : '—', cls: 'mono-cell', label: 'Amount' },
        { val: tx.date ?? '—', cls: 'mono-cell', label: 'Timestamp' },
        { val: null, cls: '', label: 'Status' },
      ];

      cells.forEach((c, i) => {
        const td = row.insertCell();
        if (c.cls) td.className = c.cls;
        td.dataset.label = c.label;

        if (i === 5) {
          const tier =
            tx.status === 'Flagged'    ? 'critical' :
            tx.status === 'Suspicious' ? 'high'     :
            'low';
          td.appendChild(el('span', `fcis-badge badge-${tier}`, tx.status ?? '—'));
        } else {
          safeText(td, c.val);
        }
      });
    });
  }

  function renderTransactionsTimeline(list) {
    if (!txTimelineView) return;
    txTimelineView.innerHTML = '';

    if (!list || list.length === 0) {
      toggleVisible(txEmptyEl, true);
      return;
    }
    toggleVisible(txEmptyEl, false);

    const sorted = [...list].sort((a, b) => String(a.date ?? '').localeCompare(String(b.date ?? '')));

    sorted.forEach(tx => {
      const tier =
        tx.status === 'Flagged'    ? 'critical' :
        tx.status === 'Suspicious' ? 'high'     :
        'low';

      const item = el('div', 'timeline-item');
      const dot  = el('span', `timeline-dot timeline-dot-${tier}`);
      const body = el('div', 'timeline-body');
      const head = el('div', 'timeline-head');

      head.appendChild(el('span', 'timeline-date mono', tx.date ?? '—'));
      head.appendChild(el('span', `fcis-badge badge-${tier}`, tx.status ?? '—'));

      const desc = el(
        'div', 'timeline-desc',
        `${tx.from ?? tx.sender ?? '—'} → ${tx.to ?? tx.receiver ?? '—'} · ${tx.amount ? formatCurrency(Number(tx.amount)) : '—'}`
      );

      body.appendChild(head);
      body.appendChild(desc);
      item.appendChild(dot);
      item.appendChild(body);
      txTimelineView.appendChild(item);
    });
  }

  /* --- Init --- */
  (async () => {
    toggleVisible(loadingOverlay, true);

    renderMissionControl();
    resetDetailsPanel();
    filterTransactions();
    loadGraph();

    toggleVisible(loadingOverlay, false);
  })();
}

/* ============================================================
   ROUTER — call the right init function based on current page
   ============================================================ */
function route() {
  initNavGuard();
  initMobileNav();

  const path = window.location.pathname;

  if (path.endsWith('index.html') || path === '/' || path.endsWith('/')) {
    initUploadPage();
  } else if (path.endsWith('dashboard.html')) {
    initDashboardPage();
  } else if (path.endsWith('investigation.html')) {
    initInvestigationPage();
  }
}

document.addEventListener('DOMContentLoaded', route);



(function () {
  const STORAGE_KEY = 'analysisData';

  const feedEl      = document.getElementById('activity-feed');
  const liveBadgeEl = document.getElementById('activity-live-badge');
  const liveTextEl  = document.getElementById('activity-live-text');

  if (!feedEl) return; // not on the investigation page

  /* --- helpers --- */

  function nowStamp() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function getAnalysis() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  function logEntry(text, tone = 'ok') {
    const row = document.createElement('div');
    row.className = `activity-entry activity-${tone}`;

    const icon = document.createElement('span');
    icon.className = 'activity-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = tone === 'ok' ? '✓' : tone === 'warn' ? '!' : '›';

    const msg = document.createElement('span');
    msg.className = 'activity-msg';
    msg.textContent = text;

    const time = document.createElement('span');
    time.className = 'activity-time';
    time.textContent = nowStamp();

    row.appendChild(icon);
    row.appendChild(msg);
    row.appendChild(time);
    feedEl.appendChild(row);

    // Keep the log tailed like a real console.
    feedEl.scrollTop = feedEl.scrollHeight;
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /* --- lightweight analysis of the already-loaded data, so the
     feed reflects what's actually in the ledger rather than being
     purely decorative --- */

  function detectCircularFlow(graph) {
    if (!graph || !Array.isArray(graph.edges) || graph.edges.length === 0) return false;

    const adjacency = new Map();
    graph.edges.forEach(e => {
      if (!e || !e.from || !e.to) return;
      if (!adjacency.has(e.from)) adjacency.set(e.from, []);
      adjacency.get(e.from).push(e.to);
    });

    let steps = 0;
    const STEP_CAP = 800; // keep this cheap regardless of graph size

    function hasCycleFrom(start) {
      const stack = [[start, new Set([start])]];
      while (stack.length && steps < STEP_CAP) {
        steps++;
        const [node, path] = stack.pop();
        const neighbors = adjacency.get(node) || [];
        for (const next of neighbors) {
          if (next === start && path.size > 1) return true;
          if (!path.has(next)) {
            const nextPath = new Set(path);
            nextPath.add(next);
            stack.push([next, nextPath]);
          }
        }
      }
      return false;
    }

    for (const node of adjacency.keys()) {
      if (steps >= STEP_CAP) break;
      if (hasCycleFrom(node)) return true;
    }
    return false;
  }

  function findHighestRisk(riskData) {
    if (!Array.isArray(riskData) || riskData.length === 0) return null;
    return riskData.reduce(
      (max, r) => (r && typeof r.risk === 'number' && r.risk > (max?.risk ?? -1) ? r : max),
      null
    );
  }

  /* --- boot sequence: replays the pipeline as a system log --- */

  async function runBootSequence() {
    const analysis = getAnalysis();
    if (!analysis) return; // nothing analysed yet — parent page shows its own empty state

    const txCount    = Array.isArray(analysis.transactions) ? analysis.transactions.length : 0;
    const nodeCount   = analysis.graph && Array.isArray(analysis.graph.nodes) ? analysis.graph.nodes.length : 0;
    const edgeCount   = analysis.graph && Array.isArray(analysis.graph.edges) ? analysis.graph.edges.length : 0;
    const hasCycle    = detectCircularFlow(analysis.graph);
    const topRisk     = findHighestRisk(analysis.riskData);

    const steps = [
      { text: 'CSV Parsed', delay: 260 },
      { text: txCount ? `Transactions Loaded (${txCount})` : 'Transactions Loaded', delay: 420 },
      { text: nodeCount ? `Network Built (${nodeCount} nodes, ${edgeCount} links)` : 'Network Built', delay: 480 },
    ];

    if (hasCycle) {
      steps.push({ text: 'Circular Flow Detected', delay: 420, tone: 'warn' });
    }
    if (topRisk && topRisk.risk >= 60) {
      steps.push({ text: `High Risk Node Identified — ${topRisk.account} (${topRisk.risk})`, delay: 420, tone: 'warn' });
    }

    steps.push({ text: 'Report Ready', delay: 320 });

    for (const step of steps) {
      await delay(step.delay);
      logEntry(step.text, step.tone || 'ok');
    }

    if (liveBadgeEl && liveTextEl) {
      liveBadgeEl.classList.add('activity-idle');
      liveTextEl.textContent = 'IDLE';
    }
  }

  /* --- live reactions to user interaction on the graph, without
     touching graph logic: just watch the two DOM nodes app.js
     already keeps in sync --- */

  function watchEntitySelection() {
    const label = document.getElementById('page-account-label');
    if (!label || typeof MutationObserver === 'undefined') return;

    let last = label.textContent.trim();
    const observer = new MutationObserver(() => {
      const current = label.textContent.trim();
      if (current === last) return;
      last = current;
      if (current) {
        setLiveBriefly();
        logEntry(`Entity Selected — ${current}`, 'info');
      }
    });
    observer.observe(label, { childList: true, characterData: true, subtree: true });
  }

  function watchReportGeneration() {
    const reportText = document.getElementById('ai-report-text');
    if (!reportText || typeof MutationObserver === 'undefined') return;

    const observer = new MutationObserver(() => {
      const current = reportText.textContent.trim();
      if (!current) return;

      if (current === 'Generating AI report…') {
        setLiveBriefly();
        logEntry('Generating AI Report…', 'info');
        return;
      }

      setLiveBriefly();
      logEntry('AI Report Generated', 'ok');
    });
    observer.observe(reportText, { childList: true, characterData: true, subtree: true });
  }

  function setLiveBriefly() {
    if (!liveBadgeEl || !liveTextEl) return;
    liveBadgeEl.classList.remove('activity-idle');
    liveTextEl.textContent = 'LIVE';
    clearTimeout(setLiveBriefly._t);
    setLiveBriefly._t = setTimeout(() => {
      liveBadgeEl.classList.add('activity-idle');
      liveTextEl.textContent = 'IDLE';
    }, 4000);
  }

  function init() {
    watchEntitySelection();
    watchReportGeneration();
    runBootSequence();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


(function () {
  const STORAGE_KEY = 'analysisData';
  const SUSPICIOUS_RISK_THRESHOLD = 40; // medium tier and above

  const tbody       = document.getElementById('suspicious-table-body');
  const countBadge  = document.getElementById('suspicious-count-badge');
  const emptyEl     = document.getElementById('suspicious-empty');
  const headerCells = document.querySelectorAll('.suspicious-table thead th.sortable');

  if (!tbody) return; // not on this page

  /* --- data --- */

  function getAnalysis() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  function riskTier(score) {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  function riskLabel(score) {
    const t = riskTier(score);
    return { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }[t];
  }

  function statusTier(status) {
    if (status === 'Flagged') return 'critical';
    if (status === 'Suspicious') return 'high';
    if (status === 'Clear') return 'low';
    return 'medium'; // Unverified — risk-flagged but no matching ledger activity found
  }

  function buildRows(analysis) {
    const riskData     = Array.isArray(analysis.riskData) ? analysis.riskData : [];
    const transactions = Array.isArray(analysis.transactions) ? analysis.transactions : [];

    return riskData
      .filter(r => r && typeof r.risk === 'number' && r.risk >= SUSPICIOUS_RISK_THRESHOLD)
      .map(r => {
        const related = transactions.filter(t =>
          (t.from ?? t.sender) === r.account || (t.to ?? t.receiver) === r.account
        );

        const counterparties = new Set();
        let hasFlagged = false;
        let hasSuspicious = false;

        related.forEach(t => {
          const from = t.from ?? t.sender;
          const to   = t.to ?? t.receiver;
          if (from && from !== r.account) counterparties.add(from);
          if (to && to !== r.account) counterparties.add(to);
          if (t.status === 'Flagged') hasFlagged = true;
          if (t.status === 'Suspicious') hasSuspicious = true;
        });

        let status = 'Unverified';
        if (hasFlagged) status = 'Flagged';
        else if (hasSuspicious) status = 'Suspicious';
        else if (related.length > 0) status = 'Clear';

        return {
          account: r.account,
          risk: r.risk,
          transfers: related.length,
          status,
          connections: counterparties.size,
        };
      });
  }

  /* --- state --- */

  let rows = [];
  let sortKey = 'risk';
  let sortDir = 'desc';

  function sortRows() {
    const dir = sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string') return av.localeCompare(bv) * dir;
      return (av - bv) * dir;
    });
  }

  /* --- render --- */

  function goToAccount(accountId) {
    window.location.href = `investigation.html?account=${encodeURIComponent(accountId)}`;
  }

  function renderRows() {
    tbody.innerHTML = '';

    if (rows.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }
    if (emptyEl) emptyEl.style.display = 'none';

    rows.forEach(row => {
      const tr = document.createElement('tr');
      tr.tabIndex = 0;
      tr.setAttribute('role', 'button');
      tr.setAttribute('aria-label', `Investigate ${row.account}`);

      const accCell = document.createElement('td');
      accCell.dataset.label = 'Account';
      const link = document.createElement('a');
      link.href = `investigation.html?account=${encodeURIComponent(row.account)}`;
      link.className = 'account-link';
      link.textContent = row.account;
      link.addEventListener('click', e => e.stopPropagation());
      accCell.appendChild(link);

      const riskCell = document.createElement('td');
      riskCell.dataset.label = 'Risk';
      riskCell.className = 'mono-cell';
      const riskBadge = document.createElement('span');
      riskBadge.className = `fcis-badge badge-${riskTier(row.risk)}`;
      riskBadge.textContent = `${row.risk} · ${riskLabel(row.risk)}`;
      riskCell.appendChild(riskBadge);

      const transfersCell = document.createElement('td');
      transfersCell.dataset.label = 'Transfers';
      transfersCell.className = 'mono-cell';
      transfersCell.textContent = String(row.transfers);

      const statusCell = document.createElement('td');
      statusCell.dataset.label = 'Status';
      const statusBadge = document.createElement('span');
      statusBadge.className = `fcis-badge badge-${statusTier(row.status)}`;
      statusBadge.textContent = row.status;
      statusCell.appendChild(statusBadge);

      const connCell = document.createElement('td');
      connCell.dataset.label = 'Connections';
      connCell.className = 'mono-cell';
      connCell.textContent = String(row.connections);

      tr.appendChild(accCell);
      tr.appendChild(riskCell);
      tr.appendChild(transfersCell);
      tr.appendChild(statusCell);
      tr.appendChild(connCell);

      tr.addEventListener('click', () => goToAccount(row.account));
      tr.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToAccount(row.account);
        }
      });

      tbody.appendChild(tr);
    });
  }

  function updateSortIndicators() {
    headerCells.forEach(th => {
      const key = th.dataset.sortKey;
      const icon = th.querySelector('.sort-icon');
      const active = key === sortKey;
      th.classList.toggle('sort-active', active);
      if (icon) {
        icon.textContent = active ? (sortDir === 'asc' ? '↑' : '↓') : '↕';
        icon.classList.toggle('active', active);
      }
    });
  }

  function updateCountBadge() {
    if (countBadge) countBadge.textContent = `${rows.length} flagged`;
  }

  headerCells.forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sortKey;
      if (sortKey === key) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortKey = key;
        sortDir = (key === 'account' || key === 'status') ? 'asc' : 'desc';
      }
      sortRows();
      updateSortIndicators();
      renderRows();
    });
  });

  /* --- init --- */

  function init() {
    const analysis = getAnalysis();
    if (!analysis) return; // parent page already shows its own empty state

    rows = buildRows(analysis);
    sortRows();
    updateSortIndicators();
    updateCountBadge();
    renderRows();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


/* ============================================================
   DASHBOARD: CIRCULAR RISK GAUGE (new — appended, nothing above
   this line was changed)

   Presentation-only. Reads the same analysis.summary.highestRiskScore
   already used above and reuses the existing riskTier() thresholds
   untouched — the risk calculation itself is not modified here,
   only how the number is displayed.
   ============================================================ */
(function () {
  const cardEl    = document.getElementById('risk-gauge-card') || document.querySelector('.risk-gauge-card');
  const fillEl    = document.getElementById('risk-gauge-fill');
  const percentEl = document.getElementById('risk-gauge-percent');
  const levelEl   = document.getElementById('risk-gauge-level');

  if (!fillEl || !percentEl || !levelEl) return; // not on dashboard.html

  const RADIUS = 58;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  // Green = Safe, Amber = Warning, Orange = Elevated, Red = Critical.
  // Same four tiers/thresholds riskTier() already uses everywhere else.
  const GAUGE_COLOR_VAR = {
    low:      '--low',      // green
    medium:   '--medium',   // amber
    high:     '--high',     // orange
    critical: '--critical', // red
  };

  const GAUGE_LEVEL_LABEL = {
    low:      'Safe',
    medium:   'Warning',
    high:     'Elevated',
    critical: 'Critical',
  };

  fillEl.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
  fillEl.style.strokeDashoffset = `${CIRCUMFERENCE}`;

  function renderGauge() {
    if (typeof hasAnalysisData !== 'function' || !hasAnalysisData()) return;

    const analysis = typeof getStoredAnalysis === 'function' ? getStoredAnalysis() : null;
    const score = analysis?.summary?.highestRiskScore;

    if (typeof score !== 'number' || Number.isNaN(score)) {
      percentEl.textContent = '—';
      levelEl.textContent = '';
      return;
    }

    const clamped = Math.max(0, Math.min(100, score));
    const tier = riskTier(clamped); // unchanged existing function — same cutoffs as the rest of the app
    const colorVar = `var(${GAUGE_COLOR_VAR[tier] || GAUGE_COLOR_VAR.low})`;
    const levelWord = GAUGE_LEVEL_LABEL[tier] || GAUGE_LEVEL_LABEL.low;

    percentEl.textContent = `${Math.round(clamped)}%`;
    levelEl.textContent = levelWord;
    levelEl.style.color = colorVar;
    fillEl.style.stroke = colorVar;

    if (cardEl) cardEl.style.setProperty('--gauge-accent', colorVar);

    // Paint the empty ring first, then animate to the real value on the
    // next frame so the fill sweeps in smoothly instead of snapping.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const offset = CIRCUMFERENCE * (1 - clamped / 100);
        fillEl.style.strokeDashoffset = `${offset}`;
      });
    });
  }

  document.addEventListener('DOMContentLoaded', renderGauge);
})();