/**
 * Phase 6 — Digital Twin
 * Underground cross-section, element drawer, future project simulation.
 */
window.Phase6 = (function() {

  let twinData = null;

  async function onEnter() {
    try {
      const twin = await API.getDigitalTwin(
        AppState.corridor ? AppState.corridor.corridorId : window.US_CONFIG.DEFAULT_CORRIDOR_ID
      );
      AppState.twin = twin;
      twinData = twin;

      renderTwinStats(twin);
      renderElementList(twin.elements || []);
      MapManager.showDigitalTwinView(twin);

      // Drawer close
      const closeBtn = document.getElementById('drawer-close-btn');
      closeBtn && closeBtn.addEventListener('click', closeDrawer);

      // Map/twin toggle
      const backBtn = document.getElementById('twin-back-to-map');
      backBtn && backBtn.addEventListener('click', () => {
        MapManager.hideTwinView();
        document.getElementById('layer-legend').classList.remove('hidden');
      });

      const toggleBtn = document.getElementById('twin-toggle-view');
      toggleBtn && toggleBtn.addEventListener('click', () => {
        const panel = document.getElementById('twin-panel');
        if (panel.classList.contains('hidden')) {
          MapManager.showDigitalTwinView(twin);
        } else {
          MapManager.hideTwinView();
        }
      });

      // Simulation
      const simBtn = document.getElementById('btn-simulate');
      simBtn && simBtn.addEventListener('click', runSimulation);

      completePhase(6);
      showToast(`Digital Twin loaded — ${twin.totalElements} persisted asset(s)`, 'success');

    } catch (err) {
      showToast('Failed to load digital twin: ' + err.message, 'error');
    }
  }

  function renderTwinStats(twin) {
    const elEl    = document.getElementById('twin-stat-elements');
    const ductEl  = document.getElementById('twin-stat-ducts');
    const scoreEl = document.getElementById('twin-stat-score');
    if (elEl) elEl.textContent = twin.totalElements;
    if (ductEl) ductEl.textContent = (twin.elements || []).filter(e => e.type === 'reserved_duct').length;
    if (scoreEl) scoreEl.textContent = twin.futureCapacityScore;
  }

  function renderElementList(elements) {
    const container = document.getElementById('twin-element-list');
    if (!container) return;

    const ICONS = {
      electricity: '⚡', water: '💧', fiber: '🔮',
      gas: '🔥', drainage: '🌊', reserved_duct: '🔵', expansion_zone: '🟢'
    };

    container.innerHTML = elements.map(el => {
      const color = MapManager.UTIL_COLORS[el.type] || '#fff';
      const isReserved = el.type === 'reserved_duct' || el.type === 'expansion_zone';
      const cap = el.capacity;
      const pct = cap ? (cap.used / cap.total * 100) : 0;

      return `
        <div class="card" style="padding:10px 12px;margin-bottom:6px;cursor:pointer;${isReserved ? 'border-color:rgba(6,182,212,0.3);' : ''}"
             onclick="Phase6.openDrawer('${el.elementId}')">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:10px;height:10px;border-radius:50%;
                        ${isReserved ? 'border:2px dashed ' + color : 'background:' + color + ';box-shadow:0 0 6px ' + color};
                        flex-shrink:0;${isReserved ? 'background:transparent' : ''}"></div>
            <div style="flex:1;min-width:0">
              <div style="font-size:0.8rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                ${el.label}
              </div>
              <div style="font-size:0.72rem;color:var(--text-muted)">${el.depthM}m depth · ${el.owner}</div>
            </div>
            ${isReserved
              ? `<span class="badge badge-success">AVAILABLE</span>`
              : `<span style="font-size:0.75rem;font-weight:700;font-family:var(--font-mono);color:${pct > 80 ? 'var(--danger)' : pct > 60 ? 'var(--warning)' : 'var(--success)'}">${Math.round(pct)}%</span>`
            }
          </div>
        </div>`;
    }).join('');
  }

  function openDrawer(elementId) {
    if (!twinData) return;
    const el = twinData.elements.find(e => e.elementId === elementId);
    if (!el) return;

    const drawer  = document.getElementById('twin-element-drawer');
    const content = document.getElementById('drawer-content');
    if (!drawer || !content) return;

    const color = MapManager.UTIL_COLORS[el.type] || '#fff';
    const cap = el.capacity;
    const isReserved = el.type === 'reserved_duct' || el.type === 'expansion_zone';
    const pct = cap && cap.total > 0 ? Math.round(cap.used / cap.total * 100) : 0;

    const typeLabels = {
      electricity: 'Electricity', water: 'Water', gas: 'Gas',
      fiber: 'Fiber', drainage: 'Drainage',
      reserved_duct: 'Reserved Duct', expansion_zone: 'Expansion Zone'
    };

    content.innerHTML = `
      <div class="drawer-type-badge">
        <span class="badge badge-${el.type === 'reserved_duct' ? 'duct' : el.type}">${typeLabels[el.type] || el.type}</span>
      </div>
      <div class="drawer-title">${el.label}</div>

      <div class="drawer-stat"><span class="label">Depth</span><span class="value">${el.depthM}m</span></div>
      <div class="drawer-stat"><span class="label">Owner</span><span class="value">${el.owner}</span></div>
      <div class="drawer-stat"><span class="label">Installed</span><span class="value">${el.installDate}</span></div>
      <div class="drawer-stat"><span class="label">Condition</span>
        <span class="value" style="color:${el.condition === 'GOOD' || el.condition === 'NEW' ? 'var(--success)' : 'var(--warning)'}">${el.condition}</span>
      </div>
      ${el.lastInspection ? `<div class="drawer-stat"><span class="label">Last Inspection</span><span class="value">${el.lastInspection}</span></div>` : ''}

      ${cap ? `
        <div class="capacity-indicator">
          <div class="capacity-label-row">
            <span style="font-size:0.75rem;color:var(--text-muted)">${isReserved ? 'Available' : 'Capacity Used'}</span>
            <span style="font-size:0.75rem;font-weight:700;font-family:var(--font-mono);
                         color:${isReserved ? 'var(--success)' : pct > 80 ? 'var(--danger)' : pct > 60 ? 'var(--warning)' : 'var(--success)'}">
              ${isReserved ? '100%' : pct + '%'}
            </span>
          </div>
          ${!isReserved ? `
            <div class="progress-bar">
              <div class="progress-fill" style="width:${pct}%;background:${pct > 80 ? 'var(--danger)' : pct > 60 ? 'var(--warning)' : 'var(--success)'}"></div>
            </div>
            <div style="font-size:0.72rem;color:var(--text-muted);margin-top:6px">${cap.used} / ${cap.total} ${cap.unit}</div>` : ''}
        </div>` : ''}

      ${el.availableFutureCapacity ? `
        <div style="margin-top:14px;padding:10px;background:rgba(0,212,170,0.07);border:1px solid rgba(0,212,170,0.2);border-radius:8px">
          <div style="font-size:0.7rem;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Future Capacity</div>
          <div style="font-size:0.77rem;color:var(--text-secondary)">${el.availableFutureCapacity}</div>
        </div>` : ''}

      ${el.notes ? `<div style="margin-top:10px;font-size:0.74rem;color:var(--text-muted);font-style:italic">${el.notes}</div>` : ''}
    `;

    drawer.classList.add('open');
  }

  function closeDrawer() {
    const drawer = document.getElementById('twin-element-drawer');
    drawer && drawer.classList.remove('open');
  }

  async function runSimulation() {
    const utilType = document.getElementById('sim-util-type').value;
    const length   = getRouteLengthM();
    const resultEl = document.getElementById('sim-result');
    const btn      = document.getElementById('btn-simulate');

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px"></div> Checking capacity…';
    resultEl && resultEl.classList.add('hidden');

    try {
      const sim = await API.simulateFutureProject(
        AppState.corridor ? AppState.corridor.corridorId : window.US_CONFIG.DEFAULT_CORRIDOR_ID,
        utilType,
        length
      );
      AppState.simulation = sim;

      renderSimResult(sim, resultEl);

      showToast(
        sim.recommendation === 'USE_EXISTING_CAPACITY'
          ? '✅ Existing capacity can accommodate this project!'
          : 'ℹ️ New installation required — expansion zone identified',
        sim.recommendation === 'USE_EXISTING_CAPACITY' ? 'success' : 'info'
      );

    } catch (err) {
      showToast('Simulation failed: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Check Existing Capacity';
    }
  }

  function getRouteLengthM() {
    const drawn = window.MapManager && MapManager.getDrawnRoute && MapManager.getDrawnRoute();
    if (drawn && MapManager.getRouteDistanceKm) return Math.round(MapManager.getRouteDistanceKm(drawn) * 1000);
    if (AppState.corridor && Number(AppState.corridor.lengthM)) return Number(AppState.corridor.lengthM);
    return parseInt(document.getElementById('sim-length').value, 10) || 0;
  }

  function renderSimResult(sim, container) {
    if (!container) return;
    const isReuse = sim.recommendation === 'USE_EXISTING_CAPACITY';

    const detail = sim.detail ? sim.detail.replace(/\n/g, '<br>') : '';

    container.innerHTML = `
      <div class="sim-result">
        <div class="sim-result-icon">${isReuse ? '🎉' : '🔧'}</div>
        <div class="sim-result-title">${sim.title}</div>
        <div class="sim-result-body">${detail}</div>
        ${sim.savings ? `
          <div class="sim-saving">
            <div class="sim-saving-item">
              <div class="sim-saving-value money">${sim.savings.cost.value}</div>
              <div class="sim-saving-label">${sim.savings.cost.label}</div>
            </div>
            <div class="sim-saving-item">
              <div class="sim-saving-value time">${sim.savings.time.value}</div>
              <div class="sim-saving-label">${sim.savings.time.label}</div>
            </div>
            ${sim.savings.co2 ? `
            <div class="sim-saving-item">
              <div class="sim-saving-value" style="color:var(--util-drainage)">${sim.savings.co2.value}</div>
              <div class="sim-saving-label">${sim.savings.co2.label}</div>
            </div>` : ''}
          </div>` : ''}
      </div>`;

    container.classList.remove('hidden');

    // Highlight matching elements in twin view
    if (sim.matchedElements && twinData) {
      sim.matchedElements.forEach(id => {
        const el = twinData.elements.find(e => e.elementId === id);
        if (el) openDrawer(id);
      });
    }
  }

  return { onEnter, openDrawer };
})();
