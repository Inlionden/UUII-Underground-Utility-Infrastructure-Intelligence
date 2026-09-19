

# FILE: phase0-landing.js
```javascript
/**
 * Phase 0 — Landing Screen
 * Particle canvas animation + CTA to start workflow.
 */
(function() {

  // ── Particle Animation ────────────────────────────
  function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const COLORS = ['#00d4aa', '#2563eb', '#f59e0b', '#a855f7', '#3b82f6', '#ef4444'];
    const particles = [];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x:  Math.random() * canvas.width,
        y:  Math.random() * canvas.height,
        r:  Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: Math.random() * 0.6 + 0.2,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });

      // Draw connections
      ctx.globalAlpha = 1;
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            const alpha = (1 - dist / 120) * 0.15;
            ctx.strokeStyle = a.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });
      ctx.globalAlpha = 1;

      requestAnimationFrame(draw);
    }
    draw();
  }

  // ── Start Button ──────────────────────────────────
  function initStartButton() {
    const btn = document.getElementById('start-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const phase0 = document.getElementById('phase-0');
      const mainApp = document.getElementById('main-app');

      // Exit animation on landing
      phase0.classList.add('exit');

      setTimeout(() => {
        phase0.style.display = 'none';
        mainApp.classList.remove('hidden');

        // Initialize map now that container is visible
        MapManager.init();

        // Go to Phase 1
        goToPhase(1);

        // Show AI welcome after a moment
        setTimeout(() => {
          if (typeof initAIWelcome === 'function') initAIWelcome();
        }, 1200);

      }, 600);
    });
  }

  // ── Init ──────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initStartButton();
  });

})();
```


# FILE: phase1-create.js
```javascript
/**
 * Phase 1 — Create Corridor
 * Form submission, route drawing, corridor creation.
 */
(function() {

  function init() {
    const drawBtn = document.getElementById('btn-draw-route');
    const demoBtn = document.getElementById('btn-load-demo');
    const createBtn = document.getElementById('btn-create-corridor');

    drawBtn && drawBtn.addEventListener('click', () => {
      MapManager.toggleDrawMode();
    });

    demoBtn && demoBtn.addEventListener('click', () => {
      MapManager.loadDemoRoute();
    });

    createBtn && createBtn.addEventListener('click', handleCreateCorridor);
  }

  async function handleCreateCorridor() {
    const name     = document.getElementById('road-name').value.trim();
    const location = document.getElementById('location').value.trim();
    const lengthKm = parseFloat(document.getElementById('length-km').value) || 2.3;
    const widthM   = parseFloat(document.getElementById('width-m').value) || 15;
    const roadType = document.getElementById('road-type').value;
    const notes    = document.getElementById('corridor-notes').value;

    if (!name) {
      showToast('Please enter a road name', 'warning');
      return;
    }

    // Collect selected utilities
    const selectedUtils = [];
    document.querySelectorAll('#utility-checkboxes input:checked').forEach(cb => {
      selectedUtils.push(cb.value);
    });

    if (selectedUtils.length === 0) {
      showToast('Select at least one existing utility', 'warning');
      return;
    }

    // Get drawn route (or fall back to demo)
    let route = MapManager.getDrawnRoute();
    if (!route) {
      // Auto-load demo route if none drawn
      MapManager.loadDemoRoute();
      route = MapManager.getDrawnRoute();
    }

    // Disable button, show loading
    const btn = document.getElementById('btn-create-corridor');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px"></div> Creating...';

    try {
      const data = { name, location, lengthKm, widthM, roadType, notes, selectedUtils, route };
      const corridor = await API.createCorridor(data);

      // Store in state
      AppState.corridor = corridor;

      // Draw on map
      MapManager.drawCorridor(corridor);

      showToast(`Corridor "${corridor.name}" created successfully`, 'success');

      // Mark complete + advance
      completePhase(1);
      setTimeout(() => goToPhase(2), 600);

      // Trigger Phase 2 setup
      if (typeof Phase2 !== 'undefined') Phase2.onEnter(corridor);

    } catch (err) {
      showToast('Failed to create corridor: ' + err.message, 'error');
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Create Corridor & Visualize →';
    }
  }

  document.addEventListener('DOMContentLoaded', init);

})();
```


# FILE: phase2-analyze.js
```javascript
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
```


# FILE: phase3-utility.js
```javascript
/**
 * Phase 3 — Plan New Utility
 */
(function() {

  document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('btn-generate-plan');
    if (generateBtn) {
      generateBtn.addEventListener('click', handleGeneratePlan);
    }
  });

  async function handleGeneratePlan() {
    const utilType     = document.getElementById('util-type').value;
    const lengthM      = parseInt(document.getElementById('util-length').value) || 2300;
    const pipeSize     = document.getElementById('util-size').value.trim();
    const installMethod= document.getElementById('install-method').value;
    const bends        = parseInt(document.getElementById('num-bends').value) || 0;
    const crossings    = parseInt(document.getElementById('road-crossings').value) || 0;
    const depth        = parseFloat(document.getElementById('target-depth').value) || 0.6;
    const constraints  = document.getElementById('util-constraints').value;
    const timeline     = document.getElementById('project-timeline').value;

    const btn = document.getElementById('btn-generate-plan');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px"></div> Generating…';

    try {
      const projectData = {
        corridorId:    AppState.corridor ? AppState.corridor.corridorId : 'corr-001',
        utilityType:   utilType,
        lengthM,
        pipeSize,
        installMethod,
        bends,
        roadCrossings: crossings,
        targetDepthM:  depth,
        constraints,
        timeline,
      };

      const project = await API.createProject(projectData);
      AppState.project = project;

      completePhase(3);
      goToPhase(4);

      // Trigger Phase 4
      if (typeof Phase4 !== 'undefined') Phase4.onEnter(project);

    } catch (err) {
      showToast('Failed to create project: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '🤖 Generate Construction Plan →';
    }
  }

})();
```


# FILE: phase4-construction.js
```javascript
/**
 * Phase 4 — Construction Plan
 * Displays AI-generated equipment, crew, sequence, risks, and missing info.
 */
window.Phase4 = (function() {

  async function onEnter(project) {
    const loading = document.getElementById('plan-loading');
    const content = document.getElementById('plan-content');
    const btn     = document.getElementById('btn-check-contractors');

    loading && loading.classList.remove('hidden');
    content && content.classList.add('hidden');
    btn && btn.classList.add('hidden');

    // Step labels for realism
    const steps = [
      'Analyzing project requirements…',
      'Calculating equipment needs…',
      'Building installation sequence…',
      'Assessing construction risks…',
      'Finalizing plan…',
    ];
    let si = 0;
    const stepEl = document.getElementById('plan-step-label');
    const iv = setInterval(() => {
      if (si < steps.length && stepEl) stepEl.textContent = steps[si++];
    }, 360);

    try {
      const plan = await API.getConstructionPlan(project ? project.projectId : 'proj-001');
      AppState.plan = plan;
      clearInterval(iv);

      renderPlan(plan);
      loading && loading.classList.add('hidden');
      content && content.classList.remove('hidden');
      btn && btn.classList.remove('hidden');

      completePhase(4);
    } catch (err) {
      clearInterval(iv);
      showToast('Failed to generate plan: ' + err.message, 'error');
    }
  }

  function renderPlan(plan) {
    renderSummary(plan.summary);
    renderSections(plan);
    setTimeout(() => initAccordions(document.getElementById('plan-sections')), 50);
  }

  function renderSummary(summary) {
    const el = document.getElementById('plan-summary');
    if (!el || !summary) return;
    el.innerHTML = Object.entries(summary).map(([k, v]) => {
      const labels = {
        utilityType: 'Utility Type', totalLength: 'Total Length',
        installMethods: 'Methods', estimatedDuration: 'Duration',
        estimatedCrew: 'Crew Size', estimatedCost: 'Est. Cost'
      };
      return `
        <div class="info-row">
          <span class="info-label">${labels[k] || k}</span>
          <span class="info-value">${v}</span>
        </div>`;
    }).join('');
  }

  function renderSections(plan) {
    const container = document.getElementById('plan-sections');
    if (!container) return;

    const sections = [
      {
        icon: '🏗️', label: 'Equipment Required',
        content: renderEquipment(plan.equipment),
        openByDefault: true
      },
      {
        icon: '👷', label: 'Crew Requirements',
        content: renderCrew(plan.crewRequirements),
      },
      {
        icon: '📋', label: 'Installation Sequence',
        content: renderSequence(plan.installationSequence),
      },
      {
        icon: '⚠️', label: 'Risk Assessment',
        content: renderRisks(plan.risks),
      },
      {
        icon: '❗', label: 'Missing Information',
        content: renderMissing(plan.missingInformation),
      },
    ];

    container.innerHTML = sections.map((s, i) => `
      <div class="plan-section">
        <div class="plan-section-header ${s.openByDefault ? 'open' : ''}">
          <span class="plan-icon">${s.icon}</span>
          <span class="plan-section-label">${s.label}</span>
          <span class="plan-chevron">▾</span>
        </div>
        <div class="plan-section-body ${s.openByDefault ? 'open' : ''}">
          ${s.content}
        </div>
      </div>`).join('');
  }

  function renderEquipment(equipment = []) {
    return `<ul class="plan-list">
      ${equipment.map(e => `
        <li>
          <div>
            <div style="font-weight:600;color:var(--text-primary)">${e.name}
              ${e.critical ? '<span class="badge badge-danger" style="margin-left:6px">Critical</span>' : ''}
              <span style="color:var(--text-muted);margin-left:4px">× ${e.qty}</span>
            </div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">${e.reason}</div>
          </div>
        </li>`).join('')}
    </ul>`;
  }

  function renderCrew(crew = []) {
    return `<ul class="plan-list">
      ${crew.map(c => `
        <li>
          <div>
            <div style="font-weight:600;color:var(--text-primary)">${c.role}
              ${c.critical ? '<span class="badge badge-danger" style="margin-left:6px">Critical</span>' : ''}
              <span style="color:var(--text-muted);margin-left:4px">× ${c.count}</span>
            </div>
          </div>
        </li>`).join('')}
    </ul>`;
  }

  function renderSequence(seq = []) {
    return seq.map(s => `
      <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="width:24px;height:24px;border-radius:50%;background:var(--gradient);
                    display:flex;align-items:center;justify-content:center;
                    font-size:0.7rem;font-weight:800;flex-shrink:0;color:#fff">${s.step}</div>
        <div>
          <div style="font-weight:600;font-size:0.85rem;color:var(--text-primary)">${s.title}</div>
          <div style="font-size:0.76rem;color:var(--text-secondary);margin-top:3px">${s.detail}</div>
        </div>
      </div>`).join('');
  }

  function renderRisks(risks = []) {
    return risks.map(r => `
      <div class="risk-item risk-${r.level.toLowerCase()}">
        <div>
          <div class="risk-level" style="color:${r.level==='HIGH'?'var(--danger)':r.level==='MEDIUM'?'var(--warning)':'var(--success)'}">
            ${r.level}
          </div>
          <div style="font-weight:600;font-size:0.82rem;color:var(--text-primary);margin:3px 0">${r.risk}</div>
          <div class="risk-text">${r.description}</div>
        </div>
      </div>`).join('');
  }

  function renderMissing(items = []) {
    return `<div>
      ${items.map(m => `
        <div class="missing-item">
          <span class="missing-icon">${m.status}</span>
          <div>
            <div style="font-weight:600;font-size:0.82rem;color:var(--text-primary)">${m.item}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">${m.detail}</div>
          </div>
        </div>`).join('')}
    </div>`;
  }

  // Wire button
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-check-contractors');
    btn && btn.addEventListener('click', () => {
      completePhase(4);
      goToPhase(5);
      if (typeof Phase5 !== 'undefined') Phase5.onEnter();
    });
  });

  return { onEnter };
})();
```


# FILE: phase5-contractor.js
```javascript
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
```


# FILE: phase6-digital-twin.js
```javascript
/**
 * Phase 6 — Digital Twin
 * Underground cross-section, element drawer, future project simulation.
 */
window.Phase6 = (function() {

  let twinData = null;

  async function onEnter() {
    try {
      const twin = await API.getDigitalTwin(
        AppState.corridor ? AppState.corridor.corridorId : 'corr-001'
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
      showToast('Digital Twin loaded — 2.3km corridor fully recorded', 'success');

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
    const length   = parseInt(document.getElementById('sim-length').value) || 2300;
    const resultEl = document.getElementById('sim-result');
    const btn      = document.getElementById('btn-simulate');

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px"></div> Checking capacity…';
    resultEl && resultEl.classList.add('hidden');

    try {
      const sim = await API.simulateFutureProject(
        AppState.corridor ? AppState.corridor.corridorId : 'corr-001',
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
      btn.innerHTML = '🤖 Check Existing Capacity';
    }
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
```
