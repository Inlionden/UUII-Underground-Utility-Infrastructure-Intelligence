/**
 * Phase 2 — Analyze Corridor
 * Utility list, conflict detection, capacity analysis, duct recommendations.
 */
window.Phase2 = (function() {

  function onEnter(corridor) {
    renderUtilityList(corridor.utilities || []);

    document.getElementById('layer-legend') &&
      document.getElementById('layer-legend').classList.remove('hidden');

    const analyzeBtn = document.getElementById('btn-analyze');
    if (analyzeBtn) {
      analyzeBtn.onclick = () => runAnalysis(corridor);
    }
  }

  function renderUtilityList(utilities) {
    const container = document.getElementById('utility-list');
    if (!container) return;

    const ICONS = { electricity:'⚡', water:'💧', fiber:'🔮', gas:'🔥', drainage:'🌊' };

    container.innerHTML = utilities.map(u => {
      const pct   = u.capacityPercent;
      const color = MapManager.UTIL_COLORS[u.type] || '#fff';
      const pctColor = pct > 80 ? 'var(--danger)' : pct > 60 ? 'var(--warning)' : 'var(--success)';

      return `
        <div class="card" style="padding:12px;margin-bottom:8px;cursor:pointer"
             onclick="MapManager.map && MapManager.map.eachLayer(l => l.openPopup && l.options && false)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <div style="width:10px;height:10px;border-radius:50%;background:${color};
                        box-shadow:0 0 6px ${color};flex-shrink:0"></div>
            <div style="font-size:0.85rem;font-weight:600;flex:1">${u.label}</div>
            <div class="badge ${u.status === 'OPERATIONAL' ? 'badge-success' : 'badge-warning'}">
              ${u.status}
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:0.76rem;margin-bottom:8px">
            <span style="color:var(--text-muted)">Depth: <strong style="color:var(--text-primary)">${u.depthM}m</strong></span>
            <span style="color:var(--text-muted)">Owner: <strong style="color:var(--text-primary)">${u.owner}</strong></span>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;font-size:0.73rem;margin-bottom:4px">
              <span style="color:var(--text-muted)">Capacity Used</span>
              <span style="color:${pctColor};font-weight:700;font-family:var(--font-mono)">${pct}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${pct}%;background:${pctColor}"></div>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  async function runAnalysis(corridor) {
    const analyzeBtn  = document.getElementById('btn-analyze');
    const loading     = document.getElementById('analysis-loading');
    const results     = document.getElementById('analysis-results');
    const utilSummary = document.getElementById('utility-summary');
    const goBtn       = document.getElementById('btn-go-plan');

    // Show loading
    analyzeBtn.classList.add('hidden');
    loading.classList.remove('hidden');
    utilSummary.style.opacity = '0.4';

    // Simulate step progress
    const steps = [
      'Checking utility separations…',
      'Calculating cross-section capacity…',
      'Identifying conflict zones…',
      'Evaluating reserved capacity options…',
      'Generating recommendations…',
    ];
    let stepIndex = 0;
    const stepEl = document.getElementById('analysis-step-label');
    const progEl = document.getElementById('analysis-progress');

    const stepInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        stepEl && (stepEl.textContent = steps[stepIndex]);
        progEl && (progEl.style.width = `${((stepIndex + 1) / steps.length) * 90}%`);
        stepIndex++;
      }
    }, 400);

    try {
      const analysis = await API.analyzeCoridor(corridor.corridorId);
      AppState.analysis = analysis;

      clearInterval(stepInterval);
      progEl && (progEl.style.width = '100%');

      await new Promise(r => setTimeout(r, 300));

      // Render results
      renderConflicts(analysis.conflicts || []);
      renderCapacity(analysis.capacityZones || []);
      renderDucts(analysis.recommendedDucts || [], corridor);

      // Add conflict markers on map
      if (analysis.conflicts.length > 0 && AppState.corridor.route) {
        const midRoute = AppState.corridor.route[Math.floor(AppState.corridor.route.length / 2)];
        analysis.conflicts.forEach(c => {
          MapManager.addConflictMarker(midRoute, c);
        });
      }

      // Add duct previews on map
      (analysis.recommendedDucts || []).forEach((duct, i) => {
        MapManager.addDuctLayer(AppState.corridor.route, duct, i);
      });

      loading.classList.add('hidden');
      results.classList.remove('hidden');
      utilSummary.style.opacity = '1';

      completePhase(2);
      goBtn && goBtn.classList.remove('hidden');

      showToast(
        `Analysis complete: ${analysis.conflicts.length} conflict(s) found`,
        analysis.conflicts.length > 0 ? 'warning' : 'success'
      );

    } catch (err) {
      clearInterval(stepInterval);
      loading.classList.add('hidden');
      analyzeBtn.classList.remove('hidden');
      showToast('Analysis failed: ' + err.message, 'error');
    }
  }

  function renderConflicts(conflicts) {
    const list  = document.getElementById('conflict-list');
    const count = document.getElementById('conflict-count');
    if (!list) return;
    count && (count.textContent = conflicts.length);

    if (conflicts.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="icon">✅</div><p>No conflicts detected</p></div>`;
      return;
    }

    list.innerHTML = conflicts.map(c => `
      <div class="conflict-card">
        <div class="conflict-header">
          <span class="conflict-icon">⚠️</span>
          <div>
            <div class="conflict-title">${c.title}</div>
            <div class="badge badge-danger" style="margin-top:3px">${c.severity}</div>
          </div>
        </div>
        <div class="conflict-body">${c.description}</div>
        ${c.solution ? `<div class="conflict-solution">💡 ${c.solution}</div>` : ''}
      </div>`).join('');
  }

  function renderCapacity(zones) {
    const list = document.getElementById('capacity-list');
    if (!list) return;

    const UTIL_COLORS = MapManager.UTIL_COLORS;

    list.innerHTML = zones.map(z => {
      const color = UTIL_COLORS[z.type] || '#fff';
      const pctColor = z.capacityPercent > 80 ? 'var(--danger)' : z.capacityPercent > 60 ? 'var(--warning)' : 'var(--success)';
      return `
        <div class="capacity-card">
          <div class="capacity-header">
            <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></div>
            <div class="capacity-label">${z.label}</div>
            <div class="capacity-pct" style="color:${pctColor}">${z.capacityPercent}%</div>
          </div>
          <div class="progress-bar" style="margin-bottom:8px">
            <div class="progress-fill" style="width:${z.capacityPercent}%;background:${pctColor}"></div>
          </div>
          <div style="font-size:0.76rem;color:var(--text-secondary)">${z.summary}</div>
        </div>`;
    }).join('');
  }

  function renderDucts(ducts, corridor) {
    const list = document.getElementById('duct-recommendations');
    if (!list) return;

    if (ducts.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="icon">🔵</div><p>No duct reservations recommended</p></div>`;
      return;
    }

    list.innerHTML = ducts.map(d => `
      <div class="duct-card">
        <div class="duct-card-header">
          <span class="duct-icon">🔵</span>
          <div class="duct-title">${d.label}</div>
          <span class="badge badge-success" style="margin-left:auto">${d.estimatedSaving} saved</span>
        </div>
        <div class="duct-body">${d.reason}</div>
      </div>`).join('');
  }

  // Wire up "Plan New Utility" button
  document.addEventListener('DOMContentLoaded', () => {
    const goBtn = document.getElementById('btn-go-plan');
    if (goBtn) {
      goBtn.addEventListener('click', () => {
        completePhase(2);
        goToPhase(3);
      });
    }
  });

  return { onEnter };
})();
