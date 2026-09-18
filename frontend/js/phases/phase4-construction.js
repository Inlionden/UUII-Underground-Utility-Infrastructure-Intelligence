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
