/**
 * UtilitySync — CRUD Modal Workflows
 */
window.CrudUI = (() => {
  const utilitySpecTemplates = {
    electricity: ['voltage', 'cableType', 'diameter', 'circuitLength'],
    water: ['material', 'diameter', 'pressure', 'flowRate'],
    gas: ['material', 'diameter', 'pressure', 'type'],
    drainage: ['material', 'diameter', 'type', 'gradient'],
    fiber: ['cores', 'type', 'diameter', 'circuitLength']
  };

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function modal(title, body, footer = '') {
    closeModal();
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="app-modal" role="dialog" aria-modal="true">
        <div class="modal-header">
          <div>
            <div class="page-eyebrow">UtilitySync</div>
            <h2>${esc(title)}</h2>
          </div>
          <button class="modal-close" data-modal-close type="button">×</button>
        </div>
        <div class="modal-body">${body}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>`;
    document.body.appendChild(wrap);
    wrap.querySelectorAll('[data-modal-close]').forEach(btn => btn.addEventListener('click', closeModal));
    wrap.addEventListener('click', event => {
      if (event.target === wrap) closeModal();
    });
    return wrap;
  }

  function closeModal() {
    document.querySelector('.modal-backdrop')?.remove();
  }

  function detailGrid(items) {
    return `<div class="detail-grid">${items.map(([label, value]) => `
      <div class="detail-item"><span>${esc(label)}</span><strong>${esc(value || 'Not recorded')}</strong></div>
    `).join('')}</div>`;
  }

  function section(title, content) {
    return `<section class="modal-section"><h3>${esc(title)}</h3>${content}</section>`;
  }

  function renderSpecs(specs = {}) {
    const entries = Object.entries(specs);
    if (!entries.length) return '<p class="text-muted text-sm">No specifications recorded.</p>';
    return `<div class="detail-grid">${entries.map(([k, v]) => `
      <div class="detail-item"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>
    `).join('')}</div>`;
  }

  function viewUtility(utilityId) {
    const util = window.US_DATA.getUtility(utilityId);
    const corridor = window.US_DATA.getCorridor(util.corridorId);
    modal(util.label, `
      ${section('Overview', detailGrid([
        ['Utility ID', util.utilityId],
        ['Corridor', corridor.name],
        ['Type', util.type],
        ['Owner', util.owner],
        ['Status', util.status]
      ]))}
      ${section('Physical', detailGrid([
        ['Depth', `${util.depthM}m`],
        ['Horizontal offset', `${util.horizontalOffsetM}m`],
        ['Capacity', `${util.capacityPercent}%`],
        ['Install date', util.installDate]
      ]))}
      ${section('Specifications', renderSpecs(util.specs))}
      ${section('Notes', `<p class="modal-copy">${esc(util.notes || 'No notes recorded.')}</p>`)}
    `, `
      <button class="btn btn-secondary" data-modal-close>Close</button>
      <button class="btn btn-primary" id="modal-edit-utility">Edit Utility</button>
    `);
    document.getElementById('modal-edit-utility').addEventListener('click', () => editUtility(utilityId));
  }

  function editUtility(utilityId) {
    const isEdit = Boolean(utilityId);
    const util = isEdit ? window.US_DATA.getUtility(utilityId) : {
      type: 'electricity',
      status: 'OPERATIONAL',
      depthM: 1,
      horizontalOffsetM: 0,
      capacityPercent: 0,
      specs: {},
      corridorId: (window.AppState.corridor && window.AppState.corridor.corridorId) || (window.US_DATA.listCorridors()[0] || {}).corridorId
    };
    const corridors = window.US_DATA.listCorridors();
    const body = `
      <form id="utility-crud-form" class="crud-form">
        ${section('Basic Information', `
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Corridor</label>
              <select class="form-select" name="corridorId" required>
                ${corridors.map(c => `<option value="${esc(c.corridorId)}" ${c.corridorId === util.corridorId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" name="type" id="utility-type-input">
                ${['electricity','water','gas','drainage','fiber'].map(t => `<option value="${t}" ${util.type === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group"><label class="form-label">Label</label><input class="form-input" name="label" value="${esc(util.label || '')}" required></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Owner</label><input class="form-input" name="owner" value="${esc(util.owner || '')}"></div>
            <div class="form-group"><label class="form-label">Status</label><select class="form-select" name="status">
              ${['OPERATIONAL','PLANNED','MAINTENANCE','DECOMMISSIONED'].map(s => `<option ${util.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select></div>
          </div>
        `)}
        ${section('Physical / Capacity', `
          <div class="form-row">
            <div class="form-group"><label class="form-label">Depth (m)</label><input class="form-input" type="number" step="0.01" min="0" name="depthM" value="${esc(util.depthM)}" required></div>
            <div class="form-group"><label class="form-label">Horizontal Offset (m)</label><input class="form-input" type="number" step="0.1" name="horizontalOffsetM" value="${esc(util.horizontalOffsetM || 0)}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Capacity (%)</label><input class="form-input" type="number" min="0" max="100" name="capacityPercent" value="${esc(util.capacityPercent || 0)}" required></div>
            <div class="form-group"><label class="form-label">Install Date</label><input class="form-input" type="date" name="installDate" value="${esc(util.installDate || '')}"></div>
          </div>
        `)}
        ${section('Specifications', `<div id="utility-spec-fields"></div><button class="btn btn-secondary btn-sm" type="button" id="add-spec-row">+ Add Spec</button>`)}
        ${section('Notes', `<textarea class="form-textarea" name="notes">${esc(util.notes || '')}</textarea>`)}
      </form>`;
    modal(isEdit ? 'Edit Utility' : 'Add Utility', body, `
      <button class="btn btn-secondary" data-modal-close>Cancel</button>
      <button class="btn btn-primary" id="save-utility">${isEdit ? 'Save Changes' : 'Create Utility'}</button>
    `);

    renderSpecInputs(util.type, util.specs || {});
    document.getElementById('utility-type-input').addEventListener('change', event => {
      renderSpecInputs(event.target.value, collectSpecs());
    });
    document.getElementById('add-spec-row').addEventListener('click', () => addSpecRow('', ''));
    document.getElementById('save-utility').addEventListener('click', async () => {
      const form = document.getElementById('utility-crud-form');
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form).entries());
      data.specs = collectSpecs();
      try {
        if (isEdit) await API.updateUtility(utilityId, data);
        else await API.createUtility(data.corridorId, data);
        closeModal();
        showToast(isEdit ? 'Utility updated' : 'Utility created', 'success');
        showPlatformView('utilities');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  function renderSpecInputs(type, specs) {
    const container = document.getElementById('utility-spec-fields');
    if (!container) return;
    container.innerHTML = '';
    const keys = Array.from(new Set([...(utilitySpecTemplates[type] || []), ...Object.keys(specs || {})]));
    keys.forEach(key => addSpecRow(key, specs[key] || ''));
  }

  function addSpecRow(key, value) {
    const container = document.getElementById('utility-spec-fields');
    const row = document.createElement('div');
    row.className = 'repeat-row spec-row';
    row.innerHTML = `
      <input class="form-input" data-spec-key placeholder="Key" value="${esc(key)}">
      <input class="form-input" data-spec-value placeholder="Value" value="${esc(value)}">
      <button class="btn btn-danger btn-sm" type="button">Delete</button>`;
    row.querySelector('button').addEventListener('click', () => row.remove());
    container.appendChild(row);
  }

  function collectSpecs() {
    const specs = {};
    document.querySelectorAll('.spec-row').forEach(row => {
      const key = row.querySelector('[data-spec-key]').value.trim();
      const value = row.querySelector('[data-spec-value]').value.trim();
      if (key) specs[key] = value;
    });
    return specs;
  }

  async function deleteUtility(utilityId) {
    const util = window.US_DATA.getUtility(utilityId);
    if (!confirm(`Delete "${util.label}"?\n\nThis removes it from active inventory, maps, analysis, projects, and digital twin views.`)) return;
    await API.deleteUtility(utilityId);
    showToast('Utility deleted', 'success');
    showPlatformView('utilities');
  }

  function viewContractor(contractorId) {
    const c = window.US_DATA.getContractor(contractorId);
    modal(c.name, `
      ${section('Overview', detailGrid([
        ['Contractor ID', c.contractorId],
        ['Location', c.location],
        ['Established', c.established],
        ['Employees', c.employees],
        ['Match score', `${c.matchScore}%`]
      ]))}
      ${section('Equipment', renderTable(c.equipment, ['name', 'count', 'owned', 'note']))}
      ${section('Certifications', renderTable(c.certifications, ['name', 'status', 'expiry']))}
      ${section('Crew Types', renderTable(c.crewTypes, ['type', 'count']))}
      ${section('Previous Projects', renderList(c.previousProjects))}
      ${section('Capability Gaps', renderTable(c.gaps, ['requirement', 'severity', 'reason', 'mitigation']))}
    `, `
      <button class="btn btn-secondary" data-modal-close>Close</button>
      <button class="btn btn-primary" id="modal-edit-contractor">Edit Contractor</button>
    `);
    document.getElementById('modal-edit-contractor').addEventListener('click', () => editContractor(contractorId));
  }

  function renderTable(items = [], keys) {
    if (!items.length) return '<p class="text-muted text-sm">None recorded.</p>';
    return `<div class="mini-table">${items.map(item => `
      <div class="mini-table-row">${keys.map(key => `
        <div><span>${esc(key)}</span><strong>${esc(typeof item[key] === 'boolean' ? (item[key] ? 'Yes' : 'No') : item[key] || '')}</strong></div>
      `).join('')}</div>
    `).join('')}</div>`;
  }

  function renderList(items = []) {
    if (!items.length) return '<p class="text-muted text-sm">None recorded.</p>';
    return `<ul class="detail-list">${items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`;
  }

  function editContractor(contractorId) {
    const isEdit = Boolean(contractorId);
    const c = isEdit ? window.US_DATA.getContractor(contractorId) : {
      equipment: [], certifications: [], crewTypes: [], previousProjects: [], gaps: [], employees: 0
    };
    modal(isEdit ? 'Edit Contractor' : 'Add Contractor', `
      <form id="contractor-crud-form" class="crud-form">
        ${section('Basic Information', `
          <div class="form-row">
            <div class="form-group"><label class="form-label">Name</label><input class="form-input" name="name" required value="${esc(c.name || '')}"></div>
            <div class="form-group"><label class="form-label">Location</label><input class="form-input" name="location" value="${esc(c.location || '')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Established</label><input class="form-input" type="number" min="1800" name="established" value="${esc(c.established || '')}"></div>
            <div class="form-group"><label class="form-label">Employees</label><input class="form-input" type="number" min="0" name="employees" required value="${esc(c.employees || 0)}"></div>
          </div>
        `)}
        ${repeatSection('Equipment', 'equipment', ['name', 'count', 'owned', 'note'], c.equipment)}
        ${repeatSection('Certifications', 'certifications', ['name', 'status', 'expiry'], c.certifications)}
        ${repeatSection('Crew Types', 'crewTypes', ['type', 'count'], c.crewTypes)}
        ${repeatSection('Previous Projects', 'previousProjects', ['value'], (c.previousProjects || []).map(value => ({ value })))}
        ${repeatSection('Capability Gaps', 'gaps', ['requirement', 'severity', 'reason', 'mitigation'], c.gaps)}
      </form>
    `, `
      <button class="btn btn-secondary" data-modal-close>Cancel</button>
      <button class="btn btn-primary" id="save-contractor">${isEdit ? 'Save Changes' : 'Create Contractor'}</button>
    `);

    document.querySelectorAll('[data-add-repeat]').forEach(btn => {
      btn.addEventListener('click', () => addRepeatRow(btn.dataset.addRepeat, btn.dataset.keys.split(','), {}));
    });
    document.querySelectorAll('.repeat-row .btn-danger').forEach(btn => btn.addEventListener('click', () => btn.closest('.repeat-row').remove()));

    document.getElementById('save-contractor').addEventListener('click', async () => {
      const form = document.getElementById('contractor-crud-form');
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form).entries());
      data.equipment = collectRepeat('equipment', ['name', 'count', 'owned', 'note']).map(row => ({ ...row, count: Number(row.count || 0), owned: row.owned === 'true' || row.owned === true }));
      data.certifications = collectRepeat('certifications', ['name', 'status', 'expiry']);
      data.crewTypes = collectRepeat('crewTypes', ['type', 'count']).map(row => ({ ...row, count: Number(row.count || 0) }));
      data.previousProjects = collectRepeat('previousProjects', ['value']).map(row => row.value).filter(Boolean);
      data.gaps = collectRepeat('gaps', ['requirement', 'severity', 'reason', 'mitigation']);
      try {
        if (isEdit) await API.updateContractor(contractorId, data);
        else await API.createContractor(data);
        closeModal();
        showToast(isEdit ? 'Contractor updated' : 'Contractor created', 'success');
        showPlatformView('contractors');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  function repeatSection(title, name, keys, rows = []) {
    return section(title, `
      <div class="repeat-list" data-repeat-list="${name}">
        ${(rows.length ? rows : []).map(row => repeatRowHtml(name, keys, row)).join('')}
      </div>
      <button class="btn btn-secondary btn-sm" type="button" data-add-repeat="${name}" data-keys="${keys.join(',')}">+ Add ${esc(title.replace(/s$/, ''))}</button>
    `);
  }

  function repeatRowHtml(name, keys, row) {
    return `<div class="repeat-row" data-repeat="${name}">
      ${keys.map(key => {
        if (key === 'owned') {
          return `<select class="form-select" data-field="${key}"><option value="true" ${row[key] === true ? 'selected' : ''}>Owned</option><option value="false" ${row[key] === false ? 'selected' : ''}>Hired</option></select>`;
        }
        const type = ['count'].includes(key) ? 'number' : 'text';
        return `<input class="form-input" type="${type}" data-field="${key}" placeholder="${esc(key)}" value="${esc(row[key] || '')}">`;
      }).join('')}
      <button class="btn btn-danger btn-sm" type="button">Delete</button>
    </div>`;
  }

  function addRepeatRow(name, keys, row) {
    const list = document.querySelector(`[data-repeat-list="${name}"]`);
    const temp = document.createElement('div');
    temp.innerHTML = repeatRowHtml(name, keys, row);
    const element = temp.firstElementChild;
    element.querySelector('.btn-danger').addEventListener('click', () => element.remove());
    list.appendChild(element);
  }

  function collectRepeat(name, keys) {
    return Array.from(document.querySelectorAll(`[data-repeat="${name}"]`)).map(row => {
      const item = {};
      keys.forEach(key => {
        item[key] = row.querySelector(`[data-field="${key}"]`)?.value || '';
      });
      return item;
    }).filter(item => Object.values(item).some(Boolean));
  }

  async function deleteContractor(contractorId) {
    const c = window.US_DATA.getContractor(contractorId);
    if (!confirm(`Delete Contractor?\n\n${c.name}\n\nThis removes the contractor from active matching and equipment inventory.`)) return;
    await API.deleteContractor(contractorId);
    showToast('Contractor deleted', 'success');
    showPlatformView('contractors');
  }

  function viewCorridor(corridorId) {
    const c = window.US_DATA.getCorridor(corridorId);
    const utilities = window.US_DATA.listUtilities(corridorId);
    const projects = window.US_DATA.listProjects().filter(p => p.corridorId === corridorId);
    const alerts = window.US_DATA.listAlerts().filter(a => a.corridorId === corridorId);
    const utilitySummary = utilities.length
      ? `<div class="mini-table">${utilities.map(u => `
          <div class="mini-table-row">
            <div><span>type</span><strong>${esc(u.type)}</strong></div>
            <div><span>asset</span><strong>${esc(u.label)}</strong></div>
            <div><span>status</span><strong>${esc(u.status)}</strong></div>
            <div><span>capacity</span><strong>${esc(`${u.capacityPercent}%`)}</strong></div>
          </div>`).join('')}</div>`
      : '<p class="text-muted text-sm">No utilities recorded.</p>';
    const projectSummary = projects.length
      ? `<div class="mini-table">${projects.map(p => `
          <div class="mini-table-row">
            <div><span>project</span><strong>${esc(p.name)}</strong></div>
            <div><span>utility</span><strong>${esc(p.utilityType)}</strong></div>
            <div><span>method</span><strong>${esc(p.installMethod)}</strong></div>
            <div><span>status</span><strong>${esc(p.status)}</strong></div>
          </div>`).join('')}</div>`
      : '<p class="text-muted text-sm">No projects recorded.</p>';
    const alertSummary = alerts.length
      ? `<div class="mini-table">${alerts.map(a => `
          <div class="mini-table-row">
            <div><span>severity</span><strong>${esc(a.severity)}</strong></div>
            <div><span>type</span><strong>${esc(a.category || a.type)}</strong></div>
            <div><span>asset</span><strong>${esc(a.affectedAsset)}</strong></div>
            <div><span>state</span><strong>${esc(a.resolutionState || 'OPEN')}</strong></div>
          </div>`).join('')}</div>`
      : '<p class="text-muted text-sm">No active rule-based alerts for this corridor.</p>';

    modal(c.name, `
      ${section('Bengaluru Corridor', detailGrid([
        ['Corridor ID', c.corridorId],
        ['Location', c.location],
        ['Road type', c.roadType],
        ['Status', c.status],
        ['Length', `${c.lengthM?.toLocaleString('en-IN') || 0} m (${c.lengthKm || 0} km)`],
        ['Width', `${c.widthM || 0}m`],
        ['Route nodes', (c.route || []).length]
      ]))}
      ${section('Utilities', utilitySummary)}
      ${section('Projects', projectSummary)}
      ${section('Alerts', alertSummary)}
      ${section('Notes', `<p class="modal-copy">${esc(c.notes || 'No notes recorded.')}</p>`)}
    `, `
      <button class="btn btn-secondary" data-modal-close>Close</button>
      <button class="btn btn-secondary" id="modal-edit-corridor">Edit Corridor</button>
      <button class="btn btn-primary" id="modal-open-corridor">Open Workspace</button>
    `);
    document.getElementById('modal-edit-corridor').addEventListener('click', () => editCorridor(corridorId));
    document.getElementById('modal-open-corridor').addEventListener('click', () => {
      closeModal();
      window.openCorridor && window.openCorridor(corridorId, 2, 'corridors');
    });
  }

  function editCorridor(corridorId) {
    const c = window.US_DATA.getCorridor(corridorId);
    modal('Edit Corridor', `
      <form id="corridor-crud-form" class="crud-form">
        ${section('Metadata', `
          <div class="form-group"><label class="form-label">Name</label><input class="form-input" name="name" required value="${esc(c.name)}"></div>
          <div class="form-group"><label class="form-label">Location</label><input class="form-input" name="location" value="${esc(c.location)}"></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Length (km)</label><input class="form-input" type="number" min="0.01" step="0.01" name="lengthKm" value="${esc(c.lengthKm)}"></div>
            <div class="form-group"><label class="form-label">Width (m)</label><input class="form-input" type="number" min="1" step="0.1" name="widthM" value="${esc(c.widthM)}"></div>
          </div>
          <div class="form-group"><label class="form-label">Status</label><select class="form-select" name="status">
            ${['ACTIVE','PLANNED','PAUSED','ARCHIVED'].map(s => `<option ${c.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select></div>
          <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" name="notes">${esc(c.notes || '')}</textarea></div>
          <p class="form-hint">Open the corridor and edit the route on the map. Saving here preserves the stored route unless a route is active in the drawing tools.</p>
        `)}
      </form>
    `, `
      <button class="btn btn-secondary" data-modal-close>Cancel</button>
      <button class="btn btn-primary" id="save-corridor">Save Changes</button>
    `);
    document.getElementById('save-corridor').addEventListener('click', async () => {
      const form = document.getElementById('corridor-crud-form');
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form).entries());
      data.route = c.route;
      await API.updateCorridor(corridorId, data);
      closeModal();
      showToast('Corridor updated', 'success');
      showPlatformView('corridors');
    });
  }

  async function deleteCorridor(corridorId) {
    const c = window.US_DATA.getCorridor(corridorId);
    if (!confirm(`Delete Corridor?\n\n${c.name}\n\nThis also removes linked utilities and digital twin reserved assets from active views.`)) return;
    await API.deleteCorridor(corridorId);
    showToast('Corridor deleted', 'success');
    showPlatformView('corridors');
  }

  return {
    viewCorridor,
    viewUtility,
    editUtility,
    deleteUtility,
    viewContractor,
    editContractor,
    deleteContractor,
    editCorridor,
    deleteCorridor
  };
})();
