/**
 * UtilitySync — Leaflet Map Manager
 */

window.MapManager = (() => {
  let map = null;
  let corridorLayer = null;
  let corridorAccentLayer = null;
  let corridorOverviewLayers = [];
  let utilityLayers = {};   // { type: L.Polyline }
  let conflictMarkers = []; // L.Markers for conflicts
  let drawPoints = [];
  let nodeMarkers = [];
  let drawPolyline = null;
  let drawMode = false;
  let hiddenLayers = new Set();
  let undoStack = [];
  let redoStack = [];

  const UTIL_COLORS = {
    electricity: '#f59e0b',
    water:       '#3b82f6',
    fiber:       '#a855f7',
    gas:         '#ef4444',
    drainage:    '#10b981',
    reserved_duct: '#06b6d4',
    expansion_zone:'#84cc16',
    ev_charging: '#f97316',
  };

  const UTIL_WEIGHTS = {
    electricity: 4, water: 5, gas: 4, drainage: 6,
    fiber: 3, reserved_duct: 3, expansion_zone: 3
  };

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  // ── Initialize ───────────────────────────────────
  function init() {
    if (map) return;
    const cfg = window.US_CONFIG;

    map = L.map('map', {
      center: cfg.MAP_CENTER,
      zoom: cfg.MAP_ZOOM,
      zoomControl: false,
    });

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri — Esri, DeLorme, NAVTEQ',
      maxZoom: 16,
    }).addTo(map);

    // Custom zoom control position
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Layer legend toggle
    initLayerLegend();

    // Map toolbar
    initMapToolbar();
  }

  // ── Layer Legend Toggle ───────────────────────────
  function initLayerLegend() {
    document.querySelectorAll('#layer-legend .legend-item').forEach(item => {
      item.addEventListener('click', () => {
        const layer = item.dataset.layer;
        if (layer === 'all') {
          hiddenLayers.clear();
          document.querySelectorAll('#layer-legend .legend-item').forEach(i => i.classList.remove('hidden-layer'));
          applyLayerVisibility();
          return;
        }
        if (hiddenLayers.has(layer)) {
          hiddenLayers.delete(layer);
          item.classList.remove('hidden-layer');
        } else {
          hiddenLayers.add(layer);
          item.classList.add('hidden-layer');
        }
        applyLayerVisibility();
      });
    });
  }

  function applyLayerVisibility() {
    Object.values(utilityLayers).forEach(entry => {
      const layerType = entry.type;
      const visibleType = layerType === 'reserved_duct' || layerType === 'expansion_zone' ? 'duct' : layerType;
      const shouldHide = hiddenLayers.has(layerType) || hiddenLayers.has(visibleType);
      if (shouldHide && map.hasLayer(entry.layer)) map.removeLayer(entry.layer);
      if (!shouldHide && !map.hasLayer(entry.layer)) entry.layer.addTo(map);
    });
  }

  // ── Map Toolbar ───────────────────────────────────
  function initMapToolbar() {
    const drawBtn  = document.getElementById('tool-draw');
    const clearBtn = document.getElementById('tool-clear');
    const fitBtn   = document.getElementById('tool-fit');
    const finishBtn = document.getElementById('tool-finish');
    const undoBtn = document.getElementById('tool-undo');
    const redoBtn = document.getElementById('tool-redo');
    const deleteNodeBtn = document.getElementById('tool-delete-node');

    drawBtn && drawBtn.addEventListener('click', () => {
      toggleDrawMode();
    });

    finishBtn && finishBtn.addEventListener('click', finishDraw);
    undoBtn && undoBtn.addEventListener('click', undoRoute);
    redoBtn && redoBtn.addEventListener('click', redoRoute);
    deleteNodeBtn && deleteNodeBtn.addEventListener('click', deleteLastNode);

    clearBtn && clearBtn.addEventListener('click', () => {
      clearDraw();
      const status = document.getElementById('route-status');
      if (status) status.textContent = 'Route cleared';
    });

    fitBtn && fitBtn.addEventListener('click', () => {
      fitToCorridor();
    });
  }

  // ── Draw Mode ─────────────────────────────────────
  function toggleDrawMode() {
    drawMode = !drawMode;
    const btn    = document.getElementById('tool-draw');
    const banner = document.getElementById('draw-mode-banner');

    if (drawMode) {
      btn && btn.classList.add('active');
      btn && (btn.textContent = drawPoints.length ? 'Continue' : 'Start');
      banner && banner.classList.remove('hidden');
      map.getContainer().style.cursor = 'crosshair';
      map.on('click', onMapClick);
      map.on('dblclick', finishDraw);
    } else {
      btn && btn.classList.remove('active');
      btn && (btn.textContent = drawPoints.length ? 'Continue' : 'Start');
      banner && banner.classList.add('hidden');
      map.getContainer().style.cursor = '';
      map.off('click', onMapClick);
      map.off('dblclick', finishDraw);
    }
  }

  function onMapClick(e) {
    pushHistory();
    const latlng = [e.latlng.lat, e.latlng.lng];
    drawPoints.push(latlng);
    renderEditableRoute(true);
  }

  function finishDraw() {
    if (drawPoints.length < 2) {
      showToast('Add at least 2 points to define a corridor route', 'warning');
      return;
    }
    map.off('click', onMapClick);
    if (drawMode) toggleDrawMode();
    renderEditableRoute(false);

    map.fitBounds(drawPolyline.getBounds(), { padding: [40, 40] });

    const status = document.getElementById('route-status');
    if (status) {
      status.style.color = 'var(--teal)';
      status.textContent = `✓ Route saved in form: ${drawPoints.length} nodes · ${routeDistanceKm(drawPoints).toFixed(2)} km`;
    }
    showToast('Corridor route ready — save the corridor to persist it', 'success');
  }

  function clearDraw() {
    pushHistory();
    drawPoints = [];
    if (drawPolyline) { map.removeLayer(drawPolyline); drawPolyline = null; }
    clearNodeMarkers();
    if (drawMode) toggleDrawMode();
    updateRouteStatus();
  }

  function clearCorridorOverview() {
    corridorOverviewLayers.forEach(layer => map.removeLayer(layer));
    corridorOverviewLayers = [];
  }

  function pushHistory() {
    undoStack.push(JSON.stringify(drawPoints));
    undoStack = undoStack.slice(-40);
    redoStack = [];
  }

  function undoRoute() {
    if (!undoStack.length) return;
    redoStack.push(JSON.stringify(drawPoints));
    drawPoints = JSON.parse(undoStack.pop() || '[]');
    renderEditableRoute(drawMode);
  }

  function redoRoute() {
    if (!redoStack.length) return;
    undoStack.push(JSON.stringify(drawPoints));
    drawPoints = JSON.parse(redoStack.pop() || '[]');
    renderEditableRoute(drawMode);
  }

  function deleteLastNode() {
    if (!drawPoints.length) return;
    pushHistory();
    drawPoints.pop();
    renderEditableRoute(drawMode);
  }

  function clearNodeMarkers() {
    nodeMarkers.forEach(marker => map.removeLayer(marker));
    nodeMarkers = [];
  }

  function renderEditableRoute(isDashed) {
    if (!map) return;
    if (drawPolyline) map.removeLayer(drawPolyline);
    clearNodeMarkers();
    if (drawPoints.length) {
      drawPolyline = L.polyline(drawPoints, {
        color: '#00d4aa',
        weight: 3,
        dashArray: isDashed ? '6,6' : null,
        opacity: 0.9
      }).addTo(map);
    }
    drawPoints.forEach((point, index) => {
      const isEndpoint = index === drawPoints.length - 1;
      const marker = L.marker(point, {
        draggable: true,
        icon: L.divIcon({
          className: '',
          html: `<div class="route-node ${isEndpoint ? 'endpoint' : ''}">${index + 1}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(map);
      marker.on('dragstart', pushHistory);
      marker.on('drag', event => {
        drawPoints[index] = [event.latlng.lat, event.latlng.lng];
        if (drawPolyline) drawPolyline.setLatLngs(drawPoints);
        updateRouteStatus();
      });
      marker.bindTooltip(`Node ${index + 1}${index === drawPoints.length - 1 ? ' · endpoint' : ''}`, { direction: 'top' });
      nodeMarkers.push(marker);
    });
    updateRouteStatus();
  }

  function updateRouteStatus() {
    const distance = routeDistanceKm(drawPoints);
    const status = document.getElementById('route-status');
    const mapStats = document.getElementById('route-map-stats');
    const text = `${drawPoints.length} node${drawPoints.length === 1 ? '' : 's'} · ${distance.toFixed(2)} km${drawMode ? ' · drawing active' : ''}`;
    if (status) status.textContent = drawPoints.length ? text : 'No route drawn';
    if (mapStats) mapStats.textContent = text;
    syncRouteLengthInputs(distance);
  }

  function routeDistanceKm(points) {
    let metres = 0;
    for (let i = 1; i < points.length; i++) {
      metres += map ? map.distance(points[i - 1], points[i]) : 0;
    }
    return metres / 1000;
  }

  function syncRouteLengthInputs(distanceKm) {
    const km = Number(distanceKm || 0);
    const metres = Math.round(km * 1000);
    const lengthKmInput = document.getElementById('length-km');
    const utilLengthInput = document.getElementById('util-length');
    const simLengthInput = document.getElementById('sim-length');
    if (lengthKmInput && km > 0) lengthKmInput.value = km.toFixed(2);
    if (utilLengthInput && metres > 0) utilLengthInput.value = metres;
    if (simLengthInput && metres > 0) simLengthInput.value = metres;
  }

  function getDrawnRoute() {
    return drawPoints.length >= 2 ? [...drawPoints] : null;
  }

  function setDrawnRoute(route) {
    drawPoints = Array.isArray(route) ? route.map(point => [Number(point[0]), Number(point[1])]) : [];
    undoStack = [];
    redoStack = [];
    renderEditableRoute(false);
  }

  // ── Bengaluru Corridor Overview ───────────────────
  function drawAllCorridors(options = {}) {
    if (!map || !window.US_DATA) return;
    clearCorridorOverview();
    const selectedId = options.selectedCorridorId || '';
    const corridors = window.US_DATA.listCorridors();

    corridors.forEach(corridor => {
      if (!corridor.route || corridor.route.length < 2) return;
      const isSelected = corridor.corridorId === selectedId;
      const layer = L.polyline(corridor.route, {
        color: isSelected ? '#00d4aa' : '#38bdf8',
        weight: isSelected ? 7 : 5,
        opacity: isSelected ? 0.75 : 0.45,
        dashArray: isSelected ? null : '6,6',
        lineCap: 'round',
        lineJoin: 'round',
        className: 'corridor-overview-layer'
      }).addTo(map);

      layer.bindPopup(buildCorridorPopup(corridor), { maxWidth: 320 });
      layer.on('click', () => layer.openPopup());
      layer.on('mouseover', () => layer.setStyle({ opacity: 0.95, weight: isSelected ? 8 : 7 }));
      layer.on('mouseout', () => layer.setStyle({ opacity: isSelected ? 0.75 : 0.45, weight: isSelected ? 7 : 5 }));
      layer.bindTooltip(corridor.name, { direction: 'top', sticky: true });
      corridorOverviewLayers.push(layer);
    });

    if (options.fit && corridorOverviewLayers.length) {
      const group = L.featureGroup(corridorOverviewLayers);
      map.fitBounds(group.getBounds(), { padding: [60, 60] });
    }
  }

  function buildCorridorPopup(corridor) {
    const utilities = corridor.utilities || (window.US_DATA ? window.US_DATA.listUtilities(corridor.corridorId) : []);
    const projects = window.US_DATA ? window.US_DATA.listProjects().filter(p => p.corridorId === corridor.corridorId) : [];
    const alerts = window.US_DATA ? window.US_DATA.listAlerts().filter(a => a.corridorId === corridor.corridorId) : [];
    const utilityTypes = [...new Set(utilities.map(u => u.type))].map(type => type.replace('_', ' ')).join(', ') || 'No utilities recorded';

    return `
      <div>
        <div class="popup-title" style="color:#00d4aa">${esc(corridor.name)}</div>
        <div class="popup-row"><span class="label">Location</span><span class="value">${esc(corridor.location || 'Bengaluru')}</span></div>
        <div class="popup-row"><span class="label">Length</span><span class="value">${esc(corridor.lengthKm || 0)} km</span></div>
        <div class="popup-row"><span class="label">Utilities</span><span class="value">${esc(utilityTypes)}</span></div>
        <div class="popup-row"><span class="label">Projects</span><span class="value">${projects.length}</span></div>
        <div class="popup-row"><span class="label">Open alerts</span><span class="value">${alerts.length}</span></div>
        ${corridor.notes ? `<div style="margin-top:8px;font-size:0.74rem;color:rgba(255,255,255,0.62)">${esc(corridor.notes)}</div>` : ''}
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" onclick="window.openCorridor && window.openCorridor('${esc(corridor.corridorId)}', 2, 'corridors')">Open Workspace</button>
          <button class="btn btn-secondary btn-sm" onclick="window.CrudUI && window.CrudUI.viewCorridor('${esc(corridor.corridorId)}')">View Details</button>
        </div>
      </div>`;
  }

  // ── Draw Corridor ─────────────────────────────────
  function drawCorridor(corridor) {
    // Remove old corridor
    if (corridorLayer) map.removeLayer(corridorLayer);
    if (corridorAccentLayer) map.removeLayer(corridorAccentLayer);
    clearCorridorOverview();
    Object.values(utilityLayers).forEach(entry => map.removeLayer(entry.layer));
    utilityLayers = {};
    conflictMarkers.forEach(m => map.removeLayer(m));
    conflictMarkers = [];

    const route = corridor.route;
    if (!route || route.length < 2) return;

    drawAllCorridors({ selectedCorridorId: corridor.corridorId });

    // Corridor centerline (slightly transparent)
    corridorLayer = L.polyline(route, {
      color: 'rgba(255,255,255,0.15)',
      weight: 24,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    corridorLayer.bindPopup(buildCorridorPopup(corridor), { maxWidth: 320 });
    corridorLayer.on('click', () => corridorLayer.openPopup());

    // Animated drawing effect — thin teal line on top
    corridorAccentLayer = L.polyline(route, {
      color: '#00d4aa',
      weight: 2,
      opacity: 0.5,
      dashArray: '8,4',
    }).addTo(map);

    // Draw utility layers
    if (corridor.utilities) {
      corridor.utilities.forEach(util => {
        drawUtilityLayer(util, route);
      });
    }
    applyLayerVisibility();

    // Fit view
    setTimeout(() => {
      if (corridorLayer) map.fitBounds(corridorLayer.getBounds(), { padding: [60, 60] });
    }, 300);
  }

  function drawUtilityLayer(util, route) {
    if (!route || route.length < 2) return;

    const color = UTIL_COLORS[util.type] || '#ffffff';
    const weight = UTIL_WEIGHTS[util.type] || 3;

    // Offset the polyline slightly based on horizontal position
    const offsetRoute = offsetPolyline(route, util.horizontalOffsetM || 0);

    const layer = L.polyline(offsetRoute, {
      color: color,
      weight: weight,
      opacity: 0.85,
      className: `util-layer-${util.type}`,
    });

    layer.bindPopup(buildUtilPopup(util));
    layer.on('click', () => {
      Object.values(utilityLayers).forEach(entry => entry.layer.setStyle({ opacity: 0.55, weight: UTIL_WEIGHTS[entry.type] || 3 }));
      layer.setStyle({ opacity: 1, weight: weight + 3 });
      layer.openPopup();
    });

    if (!hiddenLayers.has(util.type)) {
      layer.addTo(map);
    }

    utilityLayers[util.utilityId || util.type] = { layer, type: util.type };
  }

  function offsetPolyline(route, offsetMeters) {
    // Simple geographic offset — shifts each point east/west
    const lngOffset = offsetMeters * 0.0000092; // close enough for Bengaluru latitude in this visual layer
    return route.map(([lat, lng]) => [lat, lng + lngOffset]);
  }

  function buildUtilPopup(util) {
    const color = UTIL_COLORS[util.type] || '#fff';
    const pct   = util.capacityPercent;
    const pctColor = pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#10b981';

    const specs = util.specs ? Object.entries(util.specs)
      .map(([k,v]) => `<div class="popup-row"><span class="label">${k}</span><span class="value">${v}</span></div>`)
      .join('') : '';

    return `
      <div>
        <div class="popup-title" style="color:${color}">${util.label || util.type}</div>
        <div class="popup-row"><span class="label">Depth</span><span class="value">${util.depthM}m</span></div>
        <div class="popup-row"><span class="label">Owner</span><span class="value">${util.owner || '—'}</span></div>
        <div class="popup-row"><span class="label">Status</span><span class="value" style="color:${util.status==='OPERATIONAL'?'#10b981':'#f59e0b'}">${util.status}</span></div>
        <div class="popup-row"><span class="label">Capacity</span><span class="value" style="color:${pctColor}">${pct}%</span></div>
        ${specs}
        ${util.notes ? `<div style="margin-top:8px;font-size:0.74rem;color:rgba(255,255,255,0.5);font-style:italic">${util.notes}</div>` : ''}
        <button class="btn btn-secondary btn-sm" style="margin-top:10px" onclick="window.CrudUI && window.CrudUI.viewUtility('${util.utilityId}')">View Details</button>
      </div>`;
  }

  // ── Conflict Markers ──────────────────────────────
  function addConflictMarker(latlng, conflict) {
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:28px;height:28px;background:rgba(239,68,68,0.9);
             border:2px solid #fff;border-radius:50%;display:flex;align-items:center;
             justify-content:center;font-size:14px;cursor:pointer;
             box-shadow:0 0 12px rgba(239,68,68,0.6)">⚠️</div>`,
      iconAnchor: [14, 14]
    });
    const marker = L.marker(latlng, { icon })
      .bindPopup(`<div><div class="popup-title" style="color:#ef4444">${conflict.title}</div>
        <div style="font-size:0.78rem;color:rgba(255,255,255,0.7)">${conflict.description}</div></div>`)
      .addTo(map);
    conflictMarkers.push(marker);
  }

  // ── Reserved Duct Preview ──────────────────────────
  function addDuctLayer(route, ductRecommendation, index) {
    if (!route || route.length < 2) return;
    const offset = -5 - (index * 0.8);
    const offsetRoute = offsetPolyline(route, offset);

    const layer = L.polyline(offsetRoute, {
      color: '#06b6d4',
      weight: 3,
      opacity: 0.8,
      dashArray: '10,6',
    });

    layer.bindPopup(`
      <div>
        <div class="popup-title" style="color:#06b6d4">🔵 ${ductRecommendation.label}</div>
        <div style="font-size:0.78rem;color:rgba(255,255,255,0.7)">${ductRecommendation.reason}</div>
        <div style="margin-top:8px;font-size:0.78rem;color:#10b981">Potential saving: ${ductRecommendation.estimatedSaving}</div>
      </div>`);
    layer.addTo(map);
    utilityLayers[ductRecommendation.ductId] = { layer, type: 'reserved_duct' };
  }

  // ── Fit to Corridor ───────────────────────────────
  function fitToCorridor() {
    if (corridorLayer) {
      map.fitBounds(corridorLayer.getBounds(), { padding: [60, 60] });
    }
  }

  // ── Load Bengaluru Sample Route ───────────────────
  function loadBengaluruRoute() {
    drawPoints = [
      [12.9961, 77.6837],
      [12.9978, 77.6958],
      [12.9924, 77.7055],
      [12.9879, 77.7147],
      [12.9825, 77.7281]
    ];
    renderEditableRoute(false);
    map.fitBounds(drawPolyline.getBounds(), { padding: [60, 60] });

    const status = document.getElementById('route-status');
    if (status) {
      status.style.color = 'var(--teal)';
      status.textContent = `✓ Bengaluru sample route loaded: ${drawPoints.length} waypoints · ${routeDistanceKm(drawPoints).toFixed(2)} km`;
    }
  }

  // ── Digital Twin View (Phase 6) ────────────────────
  function showDigitalTwinView(twinData) {
    const twinPanel = document.getElementById('twin-panel');
    if (twinPanel) twinPanel.classList.remove('hidden');
    renderTwinSVG(twinData);
  }

  function hideTwinView() {
    const twinPanel = document.getElementById('twin-panel');
    if (twinPanel) twinPanel.classList.add('hidden');
  }

  function renderTwinSVG(twinData) {
    const svg = document.getElementById('twin-svg');
    if (!svg || !twinData) return;

    const W = svg.parentElement.offsetWidth || 800;
    const H = svg.parentElement.offsetHeight || 500;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // Depth range: 0 to 2.5m underground
    const maxDepth = 2.5;
    const surfaceY = 80;
    const bottomY  = H - 60;
    const depthScale = (bottomY - surfaceY) / maxDepth;
    const midX = W / 2;
    const corridorHalfW = Math.min(W * 0.42, 260);

    let html = '';

    // Ground texture gradient
    html += `
      <defs>
        <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1a3a1a" stop-opacity="0.9"/>
          <stop offset="40%" stop-color="#2d2416" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#1a1208" stop-opacity="0.8"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glowStrong">
          <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>`;

    // Sky / above-ground
    html += `<rect x="0" y="0" width="${W}" height="${surfaceY}" fill="#0d1628" rx="0"/>`;

    // Road surface
    html += `<rect x="${midX - corridorHalfW}" y="${surfaceY - 14}" width="${corridorHalfW * 2}" height="14" fill="#1e1e2e" rx="0"/>`;
    html += `<rect x="${midX - corridorHalfW}" y="${surfaceY - 16}" width="${corridorHalfW * 2}" height="2" fill="#333350"/>`;

    // Road markings
    for (let i = 0; i < 5; i++) {
      const mx = midX - corridorHalfW + (i + 0.5) * (corridorHalfW * 2 / 5);
      html += `<rect x="${mx - 1}" y="${surfaceY - 10}" width="2" height="6" fill="rgba(255,255,255,0.15)"/>`;
    }

    // Ground
    html += `<rect x="${midX - corridorHalfW}" y="${surfaceY}" width="${corridorHalfW * 2}" height="${bottomY - surfaceY}" fill="url(#groundGrad)"/>`;

    // Ground borders
    html += `<line x1="${midX - corridorHalfW}" y1="${surfaceY}" x2="${midX - corridorHalfW}" y2="${bottomY}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
    html += `<line x1="${midX + corridorHalfW}" y1="${surfaceY}" x2="${midX + corridorHalfW}" y2="${bottomY}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;

    // Depth ruler
    for (let d = 0; d <= maxDepth; d += 0.5) {
      const y = surfaceY + d * depthScale;
      html += `<line x1="${midX - corridorHalfW - 18}" y1="${y}" x2="${midX - corridorHalfW - 4}" y2="${y}" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>`;
      html += `<text x="${midX - corridorHalfW - 22}" y="${y + 4}" fill="rgba(255,255,255,0.35)" font-size="10" text-anchor="end" font-family="JetBrains Mono, monospace">${d.toFixed(1)}m</text>`;
      if (d > 0) {
        html += `<line x1="${midX - corridorHalfW}" y1="${y}" x2="${midX + corridorHalfW}" y2="${y}" stroke="rgba(255,255,255,0.04)" stroke-width="1" stroke-dasharray="4,4"/>`;
      }
    }

    // Underground label
    html += `<text x="${midX}" y="${surfaceY - 26}" fill="rgba(255,255,255,0.4)" font-size="11" text-anchor="middle" font-family="Inter, sans-serif" letter-spacing="2">UNDERGROUND CROSS-SECTION · ${(twinData.corridorName || 'BENGALURU CORRIDOR').toUpperCase()}</text>`;

    // Draw elements
    const elements = twinData.elements || [];
    const utilColors = {
      electricity: '#f59e0b', water: '#3b82f6', fiber: '#a855f7',
      gas: '#ef4444', drainage: '#10b981',
      reserved_duct: '#06b6d4', expansion_zone: '#84cc16'
    };

    // Map horizontal offsets to x positions
    const xMap = {
      electricity: midX - corridorHalfW * 0.7,
      water:       midX - corridorHalfW * 0.25,
      gas:         midX + corridorHalfW * 0.1,
      drainage:    midX + corridorHalfW * 0.55,
      reserved_duct: null, // handled per element
      expansion_zone: midX + corridorHalfW * 0.75,
    };

    let ductIndex = 0;
    elements.forEach((el, i) => {
      const y = surfaceY + el.depthM * depthScale;
      const color = utilColors[el.type] || '#fff';

      let x;
      if (el.type === 'reserved_duct') {
        x = midX - corridorHalfW * 0.88 + ductIndex * 30;
        ductIndex++;
      } else {
        x = xMap[el.type] || (midX - corridorHalfW * 0.5 + i * 40);
      }

      const isReserved = el.type === 'reserved_duct' || el.type === 'expansion_zone';
      const r = isReserved ? 10 : 12;

      // Glow
      if (isReserved) {
        html += `<circle cx="${x}" cy="${y}" r="20" fill="${color}" opacity="0.08"/>`;
        html += `<circle cx="${x}" cy="${y}" r="${r + 4}" fill="${color}" opacity="0.12"/>`;
      }

      // Element circle
      html += `<circle cx="${x}" cy="${y}" r="${r}"
        fill="${isReserved ? 'none' : `${color}33`}"
        stroke="${color}"
        stroke-width="${isReserved ? '2' : '3'}"
        stroke-dasharray="${isReserved ? '5,3' : 'none'}"
        filter="url(#glow)"
        class="twin-element" data-id="${el.elementId}"
        style="cursor:pointer"
        onclick="window.Phase6.openDrawer('${el.elementId}')"/>`;

      // Inner dot for non-reserved
      if (!isReserved) {
        html += `<circle cx="${x}" cy="${y}" r="5" fill="${color}" opacity="0.8"/>`;
      } else {
        // Plus sign for reserved/empty
        html += `<text x="${x}" y="${y + 4}" fill="${color}" font-size="12" text-anchor="middle" font-weight="bold" pointer-events="none">+</text>`;
      }

      // Depth line
      html += `<line x1="${x}" y1="${surfaceY}" x2="${x}" y2="${y - r}"
        stroke="${color}" stroke-width="1" stroke-dasharray="3,3" opacity="0.3"/>`;

      // Label
      const shortLabel = el.label.length > 18 ? el.label.substring(0, 17) + '…' : el.label;
      html += `<text x="${x}" y="${y + r + 14}" fill="${color}" font-size="9.5"
        text-anchor="middle" font-family="Inter, sans-serif" opacity="0.85"
        pointer-events="none">${shortLabel}</text>`;
    });

    svg.innerHTML = html;
  }

  // ── Public API ────────────────────────────────────
  return {
    init,
    drawCorridor,
    drawUtilityLayer,
    addConflictMarker,
    addDuctLayer,
    fitToCorridor,
    loadBengaluruRoute,
    loadDemoRoute: loadBengaluruRoute,
    getDrawnRoute,
    getRouteDistanceKm: routeDistanceKm,
    setDrawnRoute,
    toggleDrawMode,
    finishDraw,
    undoRoute,
    redoRoute,
    deleteLastNode,
    clearDraw,
    showDigitalTwinView,
    hideTwinView,
    renderTwinSVG,
    drawAllCorridors,
    get map() { return map; },
    UTIL_COLORS,
  };
})();
