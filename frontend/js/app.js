/**
 * UtilitySync — Core Application State Machine
 * Manages phase transitions, global state, and the stepper UI.
 */

// ── Global State ──────────────────────────────────────
window.AppState = {
  currentPhase: 1,
  completedPhases: new Set(),
  corridor: null,       // Created corridor data
  analysis: null,       // Analysis results
  project: null,        // Planned utility project
  plan: null,           // Construction plan
  contractors: null,    // Contractor match results
  twin: null,           // Digital twin data
  simulation: null,     // Simulation result
};

// ── Phase Definitions ─────────────────────────────────
const PHASES = [
  { id: 1, label: 'Create Corridor',   icon: '🗺️' },
  { id: 2, label: 'Analyze',           icon: '🔍' },
  { id: 3, label: 'Plan Utility',      icon: '📐' },
  { id: 4, label: 'Construction',      icon: '🔧' },
  { id: 5, label: 'Contractors',       icon: '👷' },
  { id: 6, label: 'Digital Twin',      icon: '🌐' },
];

// ── Stepper ───────────────────────────────────────────
function renderStepper() {
  const stepper = document.getElementById('stepper');
  if (!stepper) return;
  let html = '';
  PHASES.forEach((phase, i) => {
    const isDone    = AppState.completedPhases.has(phase.id);
    const isCurrent = AppState.currentPhase === phase.id;
    const isLocked  = !isDone && !isCurrent && phase.id > AppState.currentPhase;

    const cls = isDone ? 'completed' : isCurrent ? 'active' : isLocked ? 'locked' : '';
    const numContent = isDone ? '✓' : phase.id;

    html += `
      <div class="step-item ${cls}" data-phase="${phase.id}" onclick="navigateToPhase(${phase.id})">
        <div class="step-num">${numContent}</div>
        <span class="step-label">${phase.label}</span>
      </div>`;

    if (i < PHASES.length - 1) {
      html += `<div class="step-connector ${isDone ? 'done' : ''}"></div>`;
    }
  });
  stepper.innerHTML = html;
}

function navigateToPhase(phaseId) {
  if (phaseId > AppState.currentPhase && !AppState.completedPhases.has(phaseId - 1)) return;
  if (phaseId === AppState.currentPhase) return;
  goToPhase(phaseId);
}

// ── Phase Navigation ──────────────────────────────────
function goToPhase(phaseId) {
  // Hide all phase panes
  document.querySelectorAll('.phase-pane').forEach(el => el.classList.add('hidden'));

  // Show target
  const targetEl = document.getElementById(`phase-${phaseId}`);
  if (targetEl) {
    targetEl.classList.remove('hidden');
    // Re-trigger animation
    targetEl.classList.remove('slide-in-anim');
    void targetEl.offsetWidth;
    targetEl.style.animation = 'none';
    requestAnimationFrame(() => {
      targetEl.style.animation = '';
    });
  }

  AppState.currentPhase = phaseId;
  renderStepper();
  updateAISuggestions();
  updateMapForPhase(phaseId);
}

function completePhase(phaseId) {
  AppState.completedPhases.add(phaseId);
  renderStepper();
}

function updateMapForPhase(phaseId) {
  const legend = document.getElementById('layer-legend');
  const toolbar = document.getElementById('map-toolbar');
  const twinPanel = document.getElementById('twin-panel');

  if (phaseId === 1) {
    legend && legend.classList.add('hidden');
    toolbar && toolbar.classList.remove('hidden');
    twinPanel && twinPanel.classList.add('hidden');
  } else if (phaseId >= 2 && phaseId <= 5) {
    legend && legend.classList.remove('hidden');
    toolbar && toolbar.classList.remove('hidden');
    twinPanel && twinPanel.classList.add('hidden');
  } else if (phaseId === 6) {
    // Phase 6: show digital twin
    legend && legend.classList.remove('hidden');
    toolbar && toolbar.classList.add('hidden');
  }
}

// ── Toast Notifications ───────────────────────────────
function showToast(message, type = 'success', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Checkbox Pills ────────────────────────────────────
function initCheckboxPills() {
  document.querySelectorAll('.checkbox-pill').forEach(pill => {
    const input = pill.querySelector('input');
    const util  = pill.dataset.util;
    const color = `var(--util-${util})`;

    function update() {
      if (input.checked) {
        pill.classList.add('active');
        pill.style.background = `rgba(${hexToRgb(getUtilColor(util))}, 0.15)`;
        pill.style.borderColor = color;
        pill.style.color = color;
      } else {
        pill.classList.remove('active');
        pill.style.background = '';
        pill.style.borderColor = '';
        pill.style.color = '';
      }
    }

    pill.addEventListener('click', (e) => {
      if (e.target !== input) {
        input.checked = !input.checked;
        update();
      }
    });
    update(); // Apply initial state
  });
}

function getUtilColor(type) {
  const map = {
    electricity: '#f59e0b', water: '#3b82f6',
    fiber: '#a855f7', gas: '#ef4444', drainage: '#10b981',
    duct: '#06b6d4'
  };
  return map[type] || '#ffffff';
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1],16)},${parseInt(result[2],16)},${parseInt(result[3],16)}`
    : '255,255,255';
}

// ── Accordion Sections ────────────────────────────────
function initAccordions(container) {
  container = container || document;
  container.querySelectorAll('.plan-section-header').forEach(header => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const isOpen = header.classList.contains('open');
      // Close all in same parent
      container.querySelectorAll('.plan-section-header.open').forEach(h => {
        h.classList.remove('open');
        h.nextElementSibling.classList.remove('open');
      });
      if (!isOpen) {
        header.classList.add('open');
        body.classList.add('open');
      }
    });
  });
}

// ── DOM Ready ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderStepper();
  initCheckboxPills();
});

// update AI suggestions when called from ai-assistant.js
function updateAISuggestions() {
  if (typeof window.setAISuggestions === 'function') {
    window.setAISuggestions(AppState.currentPhase);
  }
}
