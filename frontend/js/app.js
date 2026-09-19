/**
 * UtilitySync — Platform Application State Machine
 * Manages global navigation, platform pages, corridor workspace, phase transitions,
 * and the workflow stepper.
 */

// ── Global State ──────────────────────────────────────
window.AppState = {
  currentView: 'dashboard',
  currentPhase: 1,
  completedPhases: new Set(),
  corridor: null,
  analysis: null,
  project: null,
  plan: null,
  contractors: null,
  twin: null,
  simulation: null,
};

// ── Phase Definitions ─────────────────────────────────
const PHASES = [
  { id: 1, label: 'Create Corridor', icon: '🗺️' },
  { id: 2, label: 'Analyze', icon: '🔍' },
  { id: 3, label: 'Plan Utility', icon: '📐' },
  { id: 4, label: 'Construction', icon: '🔧' },
  { id: 5, label: 'Contractors', icon: '👷' },
  { id: 6, label: 'Digital Twin', icon: '🌐' },
];

const VIEW_LABELS = {
  dashboard: 'Dashboard',
  corridors: 'Corridors',
  projects: 'Projects',
  construction: 'Construction',
  utilities: 'Utilities',
  contractors: 'Contractors',
  equipment: 'Equipment',
  alerts: 'Alerts',
  'digital-twin': 'Digital Twin',
};

// ── Platform Data Adapters ────────────────────────────
function getSeedCorridor() {
  return window.US_DATA.getCorridor(window.US_CONFIG.DEFAULT_CORRIDOR_ID || 'corr-wfd-itpl');
}

function getCorridors() {
  return window.US_DATA.listCorridors().map(c => ({
    ...c,
    status: c.status || 'ACTIVE',
    utilityCount: (c.utilities || []).length,
    lastUpdated: c.updatedAt || c.createdAt,
  }));
}

function getProjects() {
  const projects = window.US_DATA.listProjects();
  if (!projects.length) return [];
  return projects.map(project => {
    const corridor = getCorridors().find(c => c.corridorId === project.corridorId) || getCorridors()[0] || {};
    return {
    ...project,
    name: project.name || `${String(project.utilityType || 'Utility').replace('_', ' ')} Capacity Upgrade`,
    corridorName: corridor.name || 'No corridor',
    utilityTypeLabel: String(project.utilityType || 'utility').replace('_', ' '),
    timeline: project.timeline || 'Planned',
    progress: AppState.completedPhases.has(4) ? 70 : 35,
  };
  });
}

function getUtilities() {
  return window.US_DATA.listUtilities().map(u => ({
    id: u.utilityId,
    utilityId: u.utilityId,
    corridorId: u.corridorId,
    type: u.type,
    label: u.label,
    size: (u.specs && (u.specs.diameter || u.specs.cableType || u.specs.circuitLength || u.specs.material)) || 'Recorded',
    depth: `${u.depthM}m`,
    owner: u.owner,
    capacity: `${u.capacityPercent}%`,
    utilization: u.capacityPercent,
    status: u.status,
  }));
}

function getContractors() {
  return window.US_DATA.listContractors();
}

function getAlerts() {
  return window.US_DATA.listAlerts();
}

function formatDate(value) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).format(new Date(value));
}

function statusClass(value) {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('high') || normalized.includes('critical') || normalized.includes('gap')) return 'badge-danger';
  if (normalized.includes('medium') || normalized.includes('partial') || normalized.includes('planned')) return 'badge-warning';
  return 'badge-success';
}

function utilBadge(type) {
  const mapped = type === 'reserved_duct' || type === 'expansion_zone' ? 'duct' : type;
  return `badge-${mapped}`;
}

// ── Global Navigation ─────────────────────────────────
function enterPlatform() {
  const phase0 = document.getElementById('phase-0');
  const mainApp = document.getElementById('main-app');

  phase0 && phase0.classList.add('exit');
  setTimeout(() => {
    if (phase0) phase0.style.display = 'none';
    mainApp && mainApp.classList.remove('hidden');
    showPlatformView('dashboard');
    if (typeof initAIWelcome === 'function') initAIWelcome({ open: false });
  }, 600);
}

function showPlatformView(view) {
  if (view === 'ai-assistant') {
    setActiveNav('ai-assistant');
    if (typeof window.openAIAssistant === 'function') window.openAIAssistant();
    return;
  }

  AppState.currentView = view;
  const platformPage = document.getElementById('platform-page');
  const workflowShell = document.getElementById('workflow-shell');
  platformPage && platformPage.classList.remove('hidden');
  workflowShell && workflowShell.classList.add('hidden');
  setActiveNav(view);
  hideWorkflowOverlays();

  const renderers = {
    dashboard: renderDashboard,
    corridors: renderCorridorsPage,
    projects: renderProjectsPage,
    construction: renderConstructionPage,
    utilities: renderUtilitiesPage,
    contractors: renderContractorsPage,
    equipment: renderEquipmentPage,
    alerts: renderAlertsPage,
    'digital-twin': renderDigitalTwinPage,
  };
  (renderers[view] || renderDashboard)();
}

function setActiveNav(view) {
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  const assetsTrigger = document.querySelector('[data-assets-trigger]');
  if (assetsTrigger) {
    assetsTrigger.classList.toggle('active', ['utilities', 'contractors', 'equipment', 'digital-twin'].includes(view));
  }
}

function bindGlobalNav() {
  document.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', event => {
      event.preventDefault();
      showPlatformView(el.dataset.view);
    });
  });

  const createBtn = document.getElementById('global-create-corridor');
  createBtn && createBtn.addEventListener('click', startCreateCorridor);

  const assetsTrigger = document.querySelector('[data-assets-trigger]');
  const assetsMenu = document.querySelector('[data-assets-menu]');
  assetsTrigger && assetsTrigger.addEventListener('click', event => {
    event.preventDefault();
    assetsMenu && assetsMenu.classList.toggle('open');
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.nav-dropdown')) assetsMenu && assetsMenu.classList.remove('open');
  });
}

// ── Page Shell Helpers ───────────────────────────────
function renderPage(title, eyebrow, intro, body) {
  const page = document.getElementById('platform-page');
  if (!page) return;
  page.innerHTML = `
    <div class="platform-inner fade-in">
      <header class="page-header">
        <div>
          <div class="page-eyebrow">${eyebrow}</div>
          <h1>${title}</h1>
          <p>${intro}</p>
        </div>
      </header>
      ${body}
    </div>`;
}

function metricCard(label, value, note, accentClass = '') {
  return `
    <article class="metric-card ${accentClass}">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${note}</small>
    </article>`;
}

function pageSection(title, action, content) {
  return `
    <section class="platform-section">
      <div class="section-heading">
        <h2>${title}</h2>
        ${action || ''}
      </div>
      ${content}
    </section>`;
}

function actionButton(label, action, variant = 'secondary') {
  return `<button class="btn btn-${variant} btn-sm" data-action="${action}">${label}</button>`;
}

function bindPageActions(container = document.getElementById('platform-page') || document) {
  container.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', event => {
      event.preventDefault();
      showPlatformView(el.dataset.view);
    });
  });

  container.querySelectorAll('[data-action]').forEach(el => {
    el.addEventListener('click', () => {
      const action = el.dataset.action;
      if (action === 'open-corridor') openCorridor(el.dataset.corridorId || window.US_CONFIG.DEFAULT_CORRIDOR_ID || 'corr-wfd-itpl');
      if (action === 'create-corridor') startCreateCorridor();
      if (action === 'open-project') openProject(el.dataset.projectId || 'proj-001');
      if (action === 'complete-project') completeProjectFromCard(el.dataset.projectId);
      if (action === 'open-twin') openCorridorDigitalTwin(el.dataset.corridorId || window.US_CONFIG.DEFAULT_CORRIDOR_ID || 'corr-wfd-itpl');
      if (action === 'open-ai') showPlatformView('ai-assistant');
      if (action === 'view-corridor') window.CrudUI && window.CrudUI.viewCorridor(el.dataset.corridorId);
      if (action === 'view-utility') window.CrudUI && window.CrudUI.viewUtility(el.dataset.utilityId);
      if (action === 'edit-utility') window.CrudUI && window.CrudUI.editUtility(el.dataset.utilityId);
      if (action === 'delete-utility') window.CrudUI && window.CrudUI.deleteUtility(el.dataset.utilityId);
      if (action === 'create-utility') window.CrudUI && window.CrudUI.editUtility();
      if (action === 'view-contractor') window.CrudUI && window.CrudUI.viewContractor(el.dataset.contractorId);
      if (action === 'edit-contractor') window.CrudUI && window.CrudUI.editContractor(el.dataset.contractorId);
      if (action === 'delete-contractor') window.CrudUI && window.CrudUI.deleteContractor(el.dataset.contractorId);
      if (action === 'create-contractor') window.CrudUI && window.CrudUI.editContractor();
      if (action === 'edit-corridor') window.CrudUI && window.CrudUI.editCorridor(el.dataset.corridorId);
      if (action === 'delete-corridor') window.CrudUI && window.CrudUI.deleteCorridor(el.dataset.corridorId);
    });
  });
}

// ── Platform Pages ───────────────────────────────────
function renderDashboard() {
  const corridors = getCorridors();
  const projects = getProjects();
  const utilities = getUtilities();
  const contractors = getContractors();
  const alerts = getAlerts();
  const reservedAssets = getCorridors().flatMap(c => window.US_DATA.getDigitalTwin(c.corridorId).elements)
    .filter(u => u.type === 'reserved_duct' || u.type === 'expansion_zone');

  renderPage(
    'Dashboard',
    'Platform overview',
    'A single operating surface for corridor assets, active utility projects, contractor readiness, alerts, and reusable underground capacity.',
    `
      <div class="metric-grid">
        ${metricCard('Total Corridors', corridors.length, 'Shared corridor records', 'teal')}
        ${metricCard('Active Projects', projects.length, 'Connected to corridor workflows', 'blue')}
        ${metricCard('Utilities', utilities.length, 'Assets and planned reservations')}
        ${metricCard('Contractors', contractors.length, 'Readiness profiles')}
        ${metricCard('Open Alerts', alerts.length, 'Rule-based issues', alerts.length ? 'danger' : '')}
        ${metricCard('Reserved Assets', reservedAssets.length, 'Reusable future capacity', 'teal')}
      </div>
      <div class="dashboard-grid">
        ${pageSection('Your Corridors', '<button class="btn btn-secondary btn-sm" data-view="corridors">View all</button>', renderCorridorCards(corridors, true))}
        ${pageSection('Active Projects', '', renderProjectCards(projects, true))}
        ${pageSection('Alerts / Issues', '', renderAlertList(alerts.slice(0, 4)))}
        ${pageSection('Recent Activity', '', renderActivityFeed())}
      </div>
    `
  );
  bindPageActions();
}

function renderCorridorsPage() {
  const corridors = getCorridors();
  renderPage(
    'Corridors',
    'Network inventory',
    'Open a corridor to enter the existing six-phase planning workspace, or create a new shared corridor record.',
    pageSection(
      'Your Corridors',
      actionButton('+ Create Corridor', 'create-corridor', 'primary'),
      corridors.length ? renderCorridorCards(corridors, false) : `
        <div class="empty-state"><div class="icon">+</div><p>No corridors yet.</p>
        <button class="btn btn-primary" data-action="create-corridor">Create Corridor</button></div>`
    )
  );
  bindPageActions();
}

function renderProjectsPage() {
  const projects = getProjects();
  renderPage(
    'Projects',
    'Delivery pipeline',
    'Projects stay linked to their corridor context so design, construction planning, contractor matching, and digital twin updates remain connected.',
    pageSection('Active Projects', '', projects.length ? renderProjectCards(projects, false) : `
      <div class="empty-state"><div class="icon">📐</div><p>No projects yet. Create one from a corridor workflow.</p></div>`)
  );
  bindPageActions();
}

function renderUtilitiesPage() {
  const utilities = getUtilities();
  const rows = utilities.map(u => {
    const corridor = getCorridors().find(c => c.corridorId === u.corridorId);
    return `
    <article class="data-row utility-row">
      <div>
        <span class="badge ${utilBadge(u.type)}">${u.type.replace('_', ' ')}</span>
        <h3>${u.label}</h3>
        <p>${u.owner} · ${corridor ? corridor.name : 'Unassigned corridor'}</p>
      </div>
      <div class="data-cell"><span>Size</span><strong>${u.size}</strong></div>
      <div class="data-cell"><span>Depth</span><strong>${u.depth}</strong></div>
      <div class="data-cell"><span>Capacity</span><strong>${u.capacity}</strong></div>
      <div class="card-actions">
        <button class="btn btn-secondary btn-sm" data-action="view-utility" data-utility-id="${u.utilityId}">View</button>
        <button class="btn btn-secondary btn-sm" data-action="edit-utility" data-utility-id="${u.utilityId}">Edit</button>
        <button class="btn btn-danger btn-sm" data-action="delete-utility" data-utility-id="${u.utilityId}">Delete</button>
      </div>
    </article>`;
  }).join('');

  renderPage(
    'Utilities',
    'Asset inventory',
    'Electricity, water, gas, drainage, and communications assets persisted once and reused by corridors, maps, analysis, projects, and the digital twin.',
    pageSection('Utility Inventory', actionButton('+ Add Utility', 'create-utility', 'primary'),
      utilities.length ? `<div class="data-list">${rows}</div>` : `
      <div class="empty-state"><div class="icon">+</div><p>No utilities yet.</p>
      <button class="btn btn-primary" data-action="create-utility">Add Utility</button></div>`)
  );
  bindPageActions();
}

function renderContractorsPage() {
  const cards = getContractors()
    .sort((a, b) => b.matchScore - a.matchScore)
    .map(contractor => `
      <article class="contractor-summary-card">
        <div class="contractor-summary-score">${contractor.matchScore}%</div>
        <div>
          <span class="badge ${statusClass(contractor.matchScore >= 85 ? 'RECOMMENDED' : contractor.matchScore >= 55 ? 'PARTIAL MATCH' : 'SIGNIFICANT GAPS')}">${contractor.matchScore >= 85 ? 'RECOMMENDED' : contractor.matchScore >= 55 ? 'PARTIAL MATCH' : 'SIGNIFICANT GAPS'}</span>
          <h3>${contractor.name}</h3>
          <p>${contractor.location} · ${contractor.employees || 0} employees</p>
        </div>
        <div class="capability-list">
          <span class="ok">${(contractor.equipment || []).length} equipment</span>
          <span class="ok">${(contractor.certifications || []).length} certifications</span>
          <span class="ok">${(contractor.crewTypes || []).length} crew types</span>
          <span class="${(contractor.gaps || []).some(g => g.severity === 'CRITICAL') ? 'missing' : 'partial'}">${(contractor.gaps || []).length} gaps</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-secondary btn-sm" data-action="view-contractor" data-contractor-id="${contractor.contractorId}">View Details</button>
          <button class="btn btn-secondary btn-sm" data-action="edit-contractor" data-contractor-id="${contractor.contractorId}">Edit</button>
          <button class="btn btn-danger btn-sm" data-action="delete-contractor" data-contractor-id="${contractor.contractorId}">Delete</button>
        </div>
      </article>`).join('');

  renderPage(
    'Contractors',
    'Readiness matching',
    'A global contractor view built from the same readiness profile used in Phase 5 contractor matching.',
    pageSection('Contractor Capabilities', actionButton('+ Add Contractor', 'create-contractor', 'primary'),
      cards ? `<div class="summary-card-grid">${cards}</div>` : `
      <div class="empty-state"><div class="icon">+</div><p>No contractors yet.</p>
      <button class="btn btn-primary" data-action="create-contractor">Add Contractor</button></div>`)
  );
  bindPageActions();
}

function renderEquipmentPage() {
  const equipment = window.US_DATA.listEquipment();
  const rows = equipment.map(item => `
    <article class="data-row">
      <div>
        <span class="badge badge-duct">${item.category}</span>
        <h3>${item.name}</h3>
        <p>${item.contractorName}</p>
      </div>
      <div class="data-cell"><span>Quantity</span><strong>${item.count || 0}</strong></div>
      <div class="data-cell"><span>Ownership</span><strong>${item.owned ? 'Owned' : 'Hired'}</strong></div>
      <div class="data-cell"><span>Status</span><strong>${item.status || 'AVAILABLE'}</strong></div>
      <div class="data-cell"><span>Notes</span><strong>${item.notes || item.note || 'Recorded'}</strong></div>
    </article>`).join('');

  renderPage(
    'Equipment',
    'Reusable capability inventory',
    'Equipment is compiled from contractor profiles so construction planning and contractor readiness use the same capability records.',
    pageSection('Equipment Inventory', '', equipment.length ? `<div class="data-list">${rows}</div>` : `
      <div class="empty-state"><div class="icon">⚙</div><p>No equipment records yet. Add contractor equipment to populate this view.</p></div>`)
  );
}

function renderConstructionPage() {
  const projects = getProjects();
  const rows = projects.map(project => `
    <article class="data-row">
      <div>
        <span class="badge badge-warning">${project.status || 'PLANNED'}</span>
        <h3>${project.name || `${project.utilityType} project`}</h3>
        <p>${project.corridorName || project.corridorId}</p>
      </div>
      <div class="data-cell"><span>Method</span><strong>${project.installMethod || 'Not set'}</strong></div>
      <div class="data-cell"><span>Duration</span><strong>${project.timeline || 'Planned'}</strong></div>
      <div class="data-cell"><span>Utility</span><strong>${project.utilityTypeLabel || project.utilityType}</strong></div>
      <div class="data-cell"><span>Depth</span><strong>${project.targetDepthM || '-'}m</strong></div>
    </article>`).join('');

  renderPage(
    'Construction',
    'Planning handoff',
    'Construction stays intentionally lean for this MVP: method, sequence inputs, duration, cost, and equipment can be generated from saved project and asset data.',
    pageSection('Construction Plans', '', projects.length ? `<div class="data-list">${rows}</div>` : `
      <div class="empty-state"><div class="icon">🔧</div><p>No construction plans yet. Generate one from Phase 3.</p></div>`)
  );
}

function renderAlertsPage() {
  renderPage(
    'Alerts',
    'Deterministic issue register',
    'Alerts are generated from analysis rules, capacity thresholds, construction prerequisites, and contractor capability gaps. The assistant can explain them, but it is not the source of truth.',
    pageSection('Open Alerts', '', renderAlertList(getAlerts()))
  );
}

function renderDigitalTwinPage() {
  const corridors = getCorridors();
  const selectedCorridor = corridors[0];
  const twin = selectedCorridor ? window.US_DATA.getDigitalTwin(selectedCorridor.corridorId) : { elements: [], totalElements: 0, futureCapacityScore: 0 };
  const assets = (twin.elements || []).map(el => `
    <article class="data-row">
      <div>
        <span class="badge ${utilBadge(el.type)}">${el.type.replace('_', ' ')}</span>
        <h3>${el.label}</h3>
        <p>${el.owner}</p>
      </div>
      <div class="data-cell"><span>Depth</span><strong>${el.depthM}m</strong></div>
      <div class="data-cell"><span>Condition</span><strong>${el.condition}</strong></div>
      <div class="data-cell"><span>Future Capacity</span><strong>${el.availableFutureCapacity || 'Managed in corridor'}</strong></div>
    </article>`).join('');

  renderPage(
    'Digital Twin',
    'Corridor representation',
    'Open the corridor twin to inspect the underground cross-section and reusable asset capacity. Digital Twin is the representation of the corridor, not a utility type.',
    `
      ${pageSection('Available Corridor Twins', '', corridors.length ? corridors.map(c => {
        const corridorTwin = window.US_DATA.getDigitalTwin(c.corridorId);
        return `
        <article class="corridor-card featured">
          <div>
            <span class="badge badge-success">${c.status}</span>
            <h3>${c.name}</h3>
            <p>${c.location}</p>
          </div>
          <div class="corridor-meta">
            <span>${corridorTwin.totalElements} assets</span>
            <span>${corridorTwin.futureCapacityScore}/100 future score</span>
            <span>Updated ${formatDate(corridorTwin.lastUpdated)}</span>
          </div>
          <button class="btn btn-primary btn-sm" data-action="open-twin" data-corridor-id="${c.corridorId}">Open Twin</button>
        </article>`;
      }).join('') : `<div class="empty-state"><div class="icon">🌐</div><p>No corridor twins yet.</p></div>`)}
      ${pageSection('Assets in First Twin', '', assets ? `<div class="data-list">${assets}</div>` : `<div class="empty-state"><div class="icon">🌐</div><p>No twin assets yet.</p></div>`)}
    `
  );
  bindPageActions();
}

function renderCorridorCards(corridors, compact) {
  return `<div class="${compact ? 'compact-list' : 'corridor-grid'}">
    ${corridors.map(c => `
      <article class="corridor-card">
        <div>
          <span class="badge badge-success">${c.status}</span>
          <h3>${c.name}</h3>
          <p>${c.location}</p>
        </div>
        <div class="corridor-meta">
          <span>${c.lengthKm} km</span>
          <span>${c.utilityCount} utilities</span>
          <span>Updated ${formatDate(c.lastUpdated)}</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-primary btn-sm" data-action="open-corridor" data-corridor-id="${c.corridorId}">Open corridor</button>
          <button class="btn btn-secondary btn-sm" data-action="edit-corridor" data-corridor-id="${c.corridorId}">Edit</button>
          <button class="btn btn-danger btn-sm" data-action="delete-corridor" data-corridor-id="${c.corridorId}">Delete</button>
        </div>
      </article>`).join('')}
  </div>`;
}

function renderProjectCards(projects, compact) {
  return `<div class="${compact ? 'compact-list' : 'project-grid'}">
    ${projects.map(project => `
      <article class="project-card">
        <div>
          <span class="badge badge-warning">${project.status}</span>
          <h3>${project.name}</h3>
          <p>${project.corridorName}</p>
        </div>
        <div class="project-details">
          <span>${project.utilityTypeLabel}</span>
          <span>${project.timeline}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${project.progress}%;background:var(--gradient)"></div>
        </div>
        <button class="btn btn-secondary btn-sm" data-action="open-project" data-project-id="${project.projectId}">Open project</button>
        ${String(project.status || '').toUpperCase() !== 'COMPLETED'
          ? `<button class="btn btn-primary btn-sm" data-action="complete-project" data-project-id="${project.projectId}">Complete</button>`
          : ''}
      </article>`).join('')}
  </div>`;
}

async function completeProjectFromCard(projectId) {
  const project = window.US_DATA.getProject(projectId);
  if (!confirm(`Complete project?\n\n${project.name}\n\nThis will add the completed asset to the existing utility inventory and digital twin.`)) return;
  try {
    await API.completeProject(projectId);
    showToast('Project completed and digital twin updated', 'success');
    showPlatformView(AppState.currentView || 'projects');
  } catch (err) {
    showToast(`Could not complete project: ${err.message}`, 'error');
  }
}

function renderAlertList(alerts) {
  if (!alerts.length) {
    return `<div class="empty-state"><div class="icon">✅</div><p>No open alerts.</p></div>`;
  }
  return `<div class="alert-list">
    ${alerts.map(alert => `
      <article class="alert-card ${String(alert.severity).toLowerCase()}">
        <div>
          <span class="badge ${statusClass(alert.severity)}">${alert.severity}</span>
          <span class="alert-category">${alert.category || alert.type}</span>
        </div>
        <h3>${alert.affectedAsset || alert.title}</h3>
        <p>${alert.explanation || alert.detail}</p>
        ${alert.corridor ? `<small>Corridor: ${alert.corridor}${alert.project ? ` · Project: ${alert.project}` : ''}</small>` : ''}
        <small>Actual: ${alert.actualValue || 'n/a'} · Required: ${alert.requiredValue || 'n/a'}</small>
        <small>${alert.recommendedAction || alert.action}</small>
      </article>`).join('')}
  </div>`;
}

function renderActivityFeed() {
  const activity = window.US_DATA.getActivity();
  return `
    <div class="activity-list">
      ${activity.map(item => `<div><strong>${item.label}</strong><span>${item.detail} · ${formatDate(item.at)}</span></div>`).join('')}
    </div>`;
}

// ── Corridor Workspace ──────────────────────────────
function startCreateCorridor() {
  AppState.currentView = 'corridors';
  AppState.currentPhase = 1;
  AppState.completedPhases = new Set();
  AppState.corridor = null;
  AppState.analysis = null;
  AppState.project = null;
  AppState.plan = null;
  AppState.contractors = null;
  AppState.twin = null;
  AppState.simulation = null;
  showWorkflow('corridors');
  refreshWorkflowHeader();
  ensureWorkflowMap();
  if (MapManager.map) {
    MapManager.clearDraw();
    if (MapManager.drawAllCorridors) MapManager.drawAllCorridors({ fit: true });
  }
  goToPhase(1);
}

function openCorridor(corridorId, targetPhase = 2, navView = 'corridors') {
  const corridor = window.US_DATA.getCorridor(corridorId);
  AppState.corridor = corridor;
  AppState.currentPhase = targetPhase;
  AppState.completedPhases = new Set();
  for (let i = 1; i < targetPhase; i++) AppState.completedPhases.add(i);

  showWorkflow(navView);
  refreshWorkflowHeader();
  ensureWorkflowMap();
  MapManager.drawCorridor(corridor);
  if (MapManager.setDrawnRoute) MapManager.setDrawnRoute(corridor.route || []);
  goToPhase(targetPhase);
  if (typeof Phase2 !== 'undefined') Phase2.onEnter(corridor);
}

function openProject(projectId) {
  const project = getProjects().find(p => p.projectId === projectId) || getProjects()[0];
  AppState.project = project;
  openCorridor(project.corridorId, 4, 'projects');
  if (typeof Phase4 !== 'undefined') Phase4.onEnter(project);
}

function openCorridorDigitalTwin(corridorId) {
  openCorridor(corridorId, 6, 'digital-twin');
  if (typeof Phase6 !== 'undefined') Phase6.onEnter();
}

function showWorkflow(navView) {
  const platformPage = document.getElementById('platform-page');
  const workflowShell = document.getElementById('workflow-shell');
  platformPage && platformPage.classList.add('hidden');
  workflowShell && workflowShell.classList.remove('hidden');
  setActiveNav(navView);
}

function ensureWorkflowMap() {
  if (!window.MapManager) return;
  MapManager.init();
  setTimeout(() => {
    if (MapManager.map) MapManager.map.invalidateSize();
  }, 50);
}

function refreshWorkflowHeader() {
  const title = document.getElementById('workspace-corridor-name');
  const name = AppState.corridor ? AppState.corridor.name : 'New Corridor';
  if (title) title.textContent = `Corridor: ${name}`;
}

function hideWorkflowOverlays() {
  const twinPanel = document.getElementById('twin-panel');
  const legend = document.getElementById('layer-legend');
  const toolbar = document.getElementById('map-toolbar');
  twinPanel && twinPanel.classList.add('hidden');
  legend && legend.classList.add('hidden');
  toolbar && toolbar.classList.add('hidden');
}

// ── Stepper ───────────────────────────────────────────
function renderStepper() {
  const stepper = document.getElementById('stepper');
  if (!stepper) return;
  let html = '';
  PHASES.forEach((phase, i) => {
    const isDone = AppState.completedPhases.has(phase.id);
    const isCurrent = AppState.currentPhase === phase.id;
    const isLocked = !isDone && !isCurrent && phase.id > AppState.currentPhase;
    const cls = isDone ? 'completed' : isCurrent ? 'active' : isLocked ? 'locked' : '';
    const numContent = isDone ? '✓' : phase.id;

    html += `
      <button class="step-item ${cls}" data-phase="${phase.id}" onclick="navigateToPhase(${phase.id})">
        <span class="step-num">${numContent}</span>
        <span class="step-label">${phase.label}</span>
      </button>`;

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
  if (phaseId === 2 && AppState.corridor && typeof Phase2 !== 'undefined') Phase2.onEnter(AppState.corridor);
  if (phaseId === 4 && AppState.project && typeof Phase4 !== 'undefined') Phase4.onEnter(AppState.project);
  if (phaseId === 5 && typeof Phase5 !== 'undefined') Phase5.onEnter();
  if (phaseId === 6 && typeof Phase6 !== 'undefined') Phase6.onEnter();
}

// ── Phase Navigation ──────────────────────────────────
function goToPhase(phaseId) {
  document.querySelectorAll('.phase-pane').forEach(el => el.classList.add('hidden'));

  const targetEl = document.getElementById(`phase-${phaseId}`);
  if (targetEl) {
    targetEl.classList.remove('hidden');
    targetEl.style.animation = 'none';
    requestAnimationFrame(() => {
      targetEl.style.animation = '';
    });
  }

  AppState.currentPhase = phaseId;
  refreshWorkflowHeader();
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
    const util = pill.dataset.util;
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

    pill.addEventListener('click', e => {
      if (e.target !== input) {
        input.checked = !input.checked;
        update();
      }
    });
    update();
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
    ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
    : '255,255,255';
}

// ── Accordion Sections ────────────────────────────────
function initAccordions(container) {
  container = container || document;
  container.querySelectorAll('.plan-section-header').forEach(header => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const isOpen = header.classList.contains('open');
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
  bindGlobalNav();
  renderStepper();
  initCheckboxPills();
});

function updateAISuggestions() {
  if (typeof window.setAISuggestions === 'function') {
    window.setAISuggestions(AppState.currentPhase);
  }
}

window.enterPlatform = enterPlatform;
window.showPlatformView = showPlatformView;
window.startCreateCorridor = startCreateCorridor;
window.openCorridor = openCorridor;
window.openProject = openProject;
window.openCorridorDigitalTwin = openCorridorDigitalTwin;
window.refreshWorkflowHeader = refreshWorkflowHeader;
