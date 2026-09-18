/**
 * Phase 5 — Contractor Readiness
 * Animated match rings, requirement vs. capability cards, AI narrative.
 */
window.Phase5 = (function() {

  async function onEnter() {
    const loading = document.getElementById('contractor-loading');
    const list    = document.getElementById('contractor-list');
    const twinBtn = document.getElementById('btn-open-twin');

    loading && loading.classList.remove('hidden');
    list && list.classList.add('hidden');
    twinBtn && twinBtn.classList.add('hidden');

    try {
      const result = await API.matchContractors(
        AppState.project ? AppState.project.projectId : 'proj-001'
      );
      AppState.contractors = result;

      loading && loading.classList.add('hidden');
      list && list.classList.remove('hidden');

      renderContractors(result.contractors || []);
      completePhase(5);
      twinBtn && twinBtn.classList.remove('hidden');

    } catch (err) {
      loading && loading.classList.add('hidden');
      showToast('Contractor matching failed: ' + err.message, 'error');
    }
  }

  function renderContractors(contractors) {
    const list = document.getElementById('contractor-list');
    if (!list) return;

    // Sort by match score desc
    const sorted = [...contractors].sort((a, b) => b.matchScore - a.matchScore);

    list.innerHTML = sorted.map((c, i) => buildContractorCard(c, i)).join('');

    // Animate rings after DOM paint
    setTimeout(() => animateRings(sorted), 100);
  }

  function buildContractorCard(c, index) {
    const isRecommended = c.verdict === 'RECOMMENDED';
    const verdictColor  = c.verdictColor === 'success' ? 'var(--success)'
                        : c.verdictColor === 'warning' ? 'var(--warning)'
                        : 'var(--danger)';

    const reqItems = (c.requirements || []).map(r => {
      const icons   = { ok: '✅', missing: '❌', partial: '⚠️' };
      const classes = { ok: 'req-ok', missing: 'req-missing', partial: 'req-partial' };
      const labels  = { ok: 'Met', missing: 'Missing', partial: 'Partial' };
      return `
        <div class="req-item">
          <span class="req-icon">${icons[r.status]}</span>
          <span class="req-name">${r.name}</span>
          <span class="req-status ${classes[r.status]}">${labels[r.status]}</span>
        </div>`;
    }).join('');

    return `
      <div class="contractor-card ${isRecommended ? 'best-match' : ''}" style="animation-delay:${index * 0.1}s">
        <div class="contractor-header">
          <div class="match-ring" id="ring-${c.contractorId}">
            <svg width="60" height="60" viewBox="0 0 60 60">
              <circle class="match-ring-bg" cx="30" cy="30" r="24"/>
              <circle class="match-ring-fill" cx="30" cy="30" r="24"
                id="ring-fill-${c.contractorId}"
                stroke="${verdictColor}"
                stroke-dasharray="0 151"/>
            </svg>
            <div class="match-score" style="color:${verdictColor}"
                 id="ring-score-${c.contractorId}">0%</div>
          </div>
          <div class="contractor-info">
            <div class="contractor-name">${c.name}</div>
            <div class="contractor-sub">${c.location}</div>
            <div class="contractor-verdict" style="color:${verdictColor}">
              ${c.verdictIcon} ${c.verdict}
              ${isRecommended ? '<span class="badge badge-success" style="margin-left:6px">Best Match</span>' : ''}
            </div>
          </div>
        </div>

        <div class="section-divider">Requirements</div>
        <div class="req-list">${reqItems}</div>

        ${c.narrative ? `
          <div class="section-divider">AI Analysis</div>
          <div class="contractor-narrative">
            "${c.narrative}"
          </div>` : ''}
      </div>`;
  }

  function animateRings(contractors) {
    contractors.forEach(c => {
      const circ = 2 * Math.PI * 24; // r=24
      const fill = document.getElementById(`ring-fill-${c.contractorId}`);
      const score = document.getElementById(`ring-score-${c.contractorId}`);
      if (!fill || !score) return;

      const targetDash = (c.matchScore / 100) * circ;
      let current = 0;
      let scoreVal = 0;

      const interval = setInterval(() => {
        current = Math.min(current + circ / 40, targetDash);
        scoreVal = Math.min(scoreVal + 2.5, c.matchScore);
        fill.setAttribute('stroke-dasharray', `${current} ${circ - current}`);
        score.textContent = `${Math.round(scoreVal)}%`;
        if (current >= targetDash) clearInterval(interval);
      }, 30);
    });
  }

  // Wire button
  document.addEventListener('DOMContentLoaded', () => {
    const twinBtn = document.getElementById('btn-open-twin');
    twinBtn && twinBtn.addEventListener('click', () => {
      completePhase(5);
      goToPhase(6);
      if (typeof Phase6 !== 'undefined') Phase6.onEnter();
    });
  });

  return { onEnter };
})();
