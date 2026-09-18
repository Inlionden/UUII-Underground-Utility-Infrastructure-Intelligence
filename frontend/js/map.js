/**
 * UtilitySync — Leaflet Map Manager
 */

window.MapManager = (() => {
  let map = null;
  let corridorLayer = null;
  let utilityLayers = {};   // { type: L.Polyline }
  let conflictMarkers = []; // L.Markers for conflicts
  let drawPoints = [];
  let drawPolyline = null;
  let drawMode = false;
  let hiddenLayers = new Set();

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
        if (hiddenLayers.has(layer)) {
          hiddenLayers.delete(layer);
          item.classList.remove('hidden-layer');
          if (utilityLayers[layer]) utilityLayers[layer].addTo(map);
        } else {
          hiddenLayers.add(layer);
          item.classList.add('hidden-layer');
          if (utilityLayers[layer]) map.removeLayer(utilityLayers[layer]);
        }
      });
    });
  }

  // ── Map Toolbar ───────────────────────────────────
  function initMapToolbar() {
    const drawBtn  = document.getElementById('tool-draw');
    const clearBtn = document.getElementById('tool-clear');
    const fitBtn   = document.getElementById('tool-fit');

    drawBtn && drawBtn.addEventListener('click', () => {
      toggleDrawMode();
    });

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
      banner && banner.classList.remove('hidden');
      map.getContainer().style.cursor = 'crosshair';
      map.on('click', onMapClick);
      map.on('dblclick', finishDraw);
    } else {
      btn && btn.classList.remove('active');
      banner && banner.classList.add('hidden');
      map.getContainer().style.cursor = '';
      map.off('click', onMapClick);
      map.off('dblclick', finishDraw);
    }
  }

  function onMapClick(e) {
    const latlng = [e.latlng.lat, e.latlng.lng];
    drawPoints.push(latlng);

    // Draw/update preview polyline
    if (drawPolyline) map.removeLayer(drawPolyline);
    drawPolyline = L.polyline(drawPoints, {
      color: '#00d4aa', weight: 3, dashArray: '6,6', opacity: 0.8
    }).addTo(map);

    const status = document.getElementById('route-status');
    if (status) status.textContent = `${drawPoints.length} waypoint${drawPoints.length !== 1 ? 's' : ''} placed — double-click to finish`;
  }

  function finishDraw(e) {
    if (drawPoints.length < 2) {
      showToast('Add at least 2 points to define a corridor route', 'warning');
      return;
    }
    // Prevent the click that also fires from dblclick adding a point
    map.off('click', onMapClick);
    toggleDrawMode();

    if (drawPolyline) {
      map.removeLayer(drawPolyline);
      drawPolyline = null;
    }

    // Solid preview
    drawPolyline = L.polyline(drawPoints, {
      color: '#00d4aa', weight: 3, opacity: 0.9
    }).addTo(map);

    map.fitBounds(drawPolyline.getBounds(), { padding: [40, 40] });

    const status = document.getElementById('route-status');
    if (status) {
      status.style.color = 'var(--teal)';
      status.textContent = `✓ Route drawn: ${drawPoints.length} waypoints`;
    }
    showToast('Corridor route drawn — click "Create Corridor" to continue', 'success');
  }

  function clearDraw() {
    drawPoints = [];
    if (drawPolyline) { map.removeLayer(drawPolyline); drawPolyline = null; }
    if (drawMode) toggleDrawMode();
  }

  function getDrawnRoute() {
    return drawPoints.length >= 2 ? [...drawPoints] : null;
  }

  // ── Draw Corridor ─────────────────────────────────
  function drawCorridor(corridor) {
    // Remove old corridor
    if (corridorLayer) map.removeLayer(corridorLayer);
    Object.values(utilityLayers).forEach(l => map.removeLayer(l));
    utilityLayers = {};
    conflictMarkers.forEach(m => map.removeLayer(m));
    conflictMarkers = [];

    const route = corridor.route;
    if (!route || route.length < 2) return;

    // Corridor centerline (slightly transparent)
    corridorLayer = L.polyline(route, {
      color: 'rgba(255,255,255,0.15)',
      weight: 24,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Animated drawing effect — thin teal line on top
    L.polyline(route, {
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
    layer.on('click', () => layer.openPopup());

    if (!hiddenLayers.has(util.type)) {
      layer.addTo(map);
    }

    utilityLayers[util.utilityId || util.type] = layer;
  }

  function offsetPolyline(route, offsetMeters) {
    // Simple geographic offset — shifts each point east/west
    const lngOffset = offsetMeters * 0.0000089; // ~1m in lng degrees at London lat
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
    utilityLayers[ductRecommendation.ductId] = layer;
  }

  // ── Fit to Corridor ───────────────────────────────
  function fitToCorridor() {
    if (corridorLayer) {
      map.fitBounds(corridorLayer.getBounds(), { padding: [60, 60] });
    }
  }

  // ── Load Demo Route ───────────────────────────────
  function loadDemoRoute() {
    drawPoints = [
      [51.4960, -0.1010],
      [51.4975, -0.1030],
      [51.4990, -0.1055],
      [51.5005, -0.1080],
      [51.5020, -0.1100],
      [51.5034, -0.1130]
    ];
    if (drawPolyline) map.removeLayer(drawPolyline);
    drawPolyline = L.polyline(drawPoints, {
      color: '#00d4aa', weight: 3, opacity: 0.9
    }).addTo(map);
    map.fitBounds(drawPolyline.getBounds(), { padding: [60, 60] });

    const status = document.getElementById('route-status');
    if (status) {
      status.style.color = 'var(--teal)';
      status.textContent = '✓ Demo route loaded: 6 waypoints (2.3km)';
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
    html += `<text x="${midX}" y="${surfaceY - 26}" fill="rgba(255,255,255,0.4)" font-size="11" text-anchor="middle" font-family="Inter, sans-serif" letter-spacing="2">UNDERGROUND CROSS-SECTION · HIGH STREET, GREENWAY</text>`;

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
    loadDemoRoute,
    getDrawnRoute,
    toggleDrawMode,
    clearDraw,
    showDigitalTwinView,
    hideTwinView,
    renderTwinSVG,
    get map() { return map; },
    UTIL_COLORS,
  };
})();
