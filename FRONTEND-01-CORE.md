

# FILE: .\frontend\index.html
```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>UtilitySync — Underground Utility Infrastructure Intelligence</title>
  <meta name="description" content="Plan shared utility corridors, reserve future capacity, build smarter, and never start a utility project from zero again." />
  <meta name="theme-color" content="#080b14" />

  <!-- Leaflet CSS -->
  <link rel="stylesheet" href="vendor/leaflet/leaflet.css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" onerror="this.onerror=null;" />

  <!-- App CSS -->
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>

<!-- ═══════════════════════════════════════════════════════
     PHASE 0 — LANDING SCREEN
═══════════════════════════════════════════════════════ -->
<div id="phase-0">
  <canvas id="particle-canvas"></canvas>
  <div class="landing-content">
    <div class="landing-logo">
      <div class="landing-logo-icon">⚡</div>
      <div class="landing-logo-text">UtilitySync</div>
    </div>
    <div class="landing-tagline">Underground Utility Infrastructure Intelligence</div>
    <p class="landing-subtitle">
      <strong>Treat every corridor as a shared asset.</strong> Plan what's underground,
      reserve capacity for the future, build smarter, and reuse what you've already built.
    </p>
    <div class="landing-cta">
      <button id="start-btn" class="btn-hero">
        Start Corridor Planning
        <span class="arrow">→</span>
      </button>
    </div>
    <div class="capabilities-row">
      <div class="cap-pill"><span class="icon">🗺️</span> Corridor Analysis</div>
      <div class="cap-pill"><span class="icon">🔧</span> Construction Intelligence</div>
      <div class="cap-pill"><span class="icon">👷</span> Contractor Readiness</div>
      <div class="cap-pill"><span class="icon">🌐</span> Digital Twin</div>
      <div class="cap-pill"><span class="icon">🤖</span> AI Assistant</div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════
     MAIN APP  (hidden until landing CTA clicked)
═══════════════════════════════════════════════════════ -->
<div id="main-app" class="hidden">

  <!-- ── Top Navigation ─────────────────────────── -->
  <nav id="top-nav">
    <a class="nav-logo" href="#" onclick="return false;">
      <div class="nav-logo-icon">⚡</div>
      <span class="nav-logo-text">UtilitySync</span>
      <span class="nav-logo-badge">Beta</span>
    </a>

    <div id="stepper"><!-- Injected by stepper.js --></div>

    <div class="nav-right">
      <button id="ai-toggle-btn" class="nav-ai-btn">
        <div class="ai-pulse"></div>
        🤖 AI Assistant
      </button>
    </div>
  </nav>

  <!-- ── App Body ───────────────────────────────── -->
  <div class="app-body">

    <!-- LEFT: Map -->
    <div id="map-section">
      <div id="map"></div>

      <!-- Map Toolbar -->
      <div id="map-toolbar">
        <button class="map-tool-btn" id="tool-draw" title="Draw corridor route">✏️</button>
        <button class="map-tool-btn" id="tool-clear" title="Clear drawing">🗑️</button>
        <button class="map-tool-btn" id="tool-fit" title="Fit corridor to view">⊡</button>
      </div>

      <!-- Layer Legend -->
      <div id="layer-legend" class="hidden">
        <div class="legend-title">Utility Layers</div>
        <div class="legend-item" data-layer="electricity">
          <div class="legend-line" style="background:var(--util-electricity)"></div>
          Electricity (11kV)
        </div>
        <div class="legend-item" data-layer="water">
          <div class="legend-line" style="background:var(--util-water)"></div>
          Water Main
        </div>
        <div class="legend-item" data-layer="fiber">
          <div class="legend-line" style="background:var(--util-fiber)"></div>
          Fiber / Comms
        </div>
        <div class="legend-item" data-layer="gas">
          <div class="legend-line" style="background:var(--util-gas)"></div>
          Gas Main
        </div>
        <div class="legend-item" data-layer="drainage">
          <div class="legend-line" style="background:var(--util-drainage)"></div>
          Drainage / Sewer
        </div>
        <div class="legend-item" data-layer="duct">
          <div class="legend-line" style="background:var(--util-duct);border-top:2px dashed var(--util-duct);background:none"></div>
          Reserved Ducts
        </div>
      </div>

      <!-- Draw Mode Banner -->
      <div id="draw-mode-banner" class="hidden">
        <div class="blink-dot"></div>
        Click on the map to draw your corridor route · Double-click to finish
      </div>

      <!-- Digital Twin Panel (overlays the map in Phase 6) -->
      <div id="twin-panel" class="hidden">
        <div id="twin-cross-section">
          <svg id="twin-svg" width="100%" height="100%" style="position:absolute;inset:0"></svg>
          <!-- Drawer for element details -->
          <div id="twin-element-drawer" class="twin-element-drawer">
            <button class="drawer-close" id="drawer-close-btn">✕</button>
            <div id="drawer-content"><!-- Filled by phase6 JS --></div>
          </div>
        </div>
        <div id="twin-controls">
          <button class="btn btn-secondary btn-sm" id="twin-back-to-map">⬆ Map View</button>
          <span style="font-size:0.75rem;color:var(--text-muted);flex:1;text-align:center">
            Underground Cross-Section · Click any element for details
          </span>
          <button class="btn btn-ghost btn-sm" id="twin-toggle-view">🗺️ Switch to Map</button>
        </div>
      </div>
    </div>

    <!-- RIGHT: Phase Panel -->
    <div id="phase-panel">

      <!-- ── Phase 1: Create Corridor ── -->
      <div id="phase-1" class="phase-pane hidden">
        <div class="phase-header">
          <div class="phase-number">Phase 1 of 6</div>
          <h2 class="phase-title">Create Corridor</h2>
          <p class="phase-desc">Tell UtilitySync about the road and its existing underground utilities.</p>
        </div>
        <div class="phase-body">
          <form id="corridor-form" novalidate>
            <div class="flex flex-col gap-3">

              <div class="form-group">
                <label class="form-label" for="road-name">Road / Corridor Name</label>
                <input id="road-name" class="form-input" type="text"
                       placeholder="e.g. High Street, Greenway" value="High Street, Greenway" />
              </div>

              <div class="form-group">
                <label class="form-label" for="location">Location</label>
                <input id="location" class="form-input" type="text"
                       placeholder="Borough, City" value="Elephant & Castle to Waterloo, London SE1" />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="length-km">Length (km)</label>
                  <input id="length-km" class="form-input" type="number"
                         min="0.1" step="0.1" value="2.3" placeholder="2.3" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="width-m">Width (m)</label>
                  <input id="width-m" class="form-input" type="number"
                         min="3" max="50" value="15" placeholder="15" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="road-type">Road Classification</label>
                <select id="road-type" class="form-select">
                  <option value="A_ROAD">A Road (Primary)</option>
                  <option value="B_ROAD" selected>B Road (Secondary)</option>
                  <option value="LOCAL">Local Road</option>
                  <option value="PEDESTRIAN">Pedestrian / Footway</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Existing Utilities</label>
                <p class="form-hint" style="margin-bottom:8px">Select all that currently exist in this corridor</p>
                <div class="checkbox-group" id="utility-checkboxes">
                  <label class="checkbox-pill" data-util="electricity" style="--c:var(--util-electricity)">
                    <input type="checkbox" value="electricity" checked />
                    <div class="dot"></div> ⚡ Electricity
                  </label>
                  <label class="checkbox-pill" data-util="water" style="--c:var(--util-water)">
                    <input type="checkbox" value="water" checked />
                    <div class="dot"></div> 💧 Water
                  </label>
                  <label class="checkbox-pill" data-util="fiber" style="--c:var(--util-fiber)">
                    <input type="checkbox" value="fiber" />
                    <div class="dot"></div> 🔮 Fiber
                  </label>
                  <label class="checkbox-pill" data-util="gas" style="--c:var(--util-gas)">
                    <input type="checkbox" value="gas" checked />
                    <div class="dot"></div> 🔥 Gas
                  </label>
                  <label class="checkbox-pill" data-util="drainage" style="--c:var(--util-drainage)">
                    <input type="checkbox" value="drainage" checked />
                    <div class="dot"></div> 🌊 Drainage
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Route Selection</label>
                <p class="form-hint" style="margin-bottom:8px">
                  Use the map to draw the corridor route, or load the demo corridor.
                </p>
                <div style="display:flex;gap:8px">
                  <button type="button" id="btn-draw-route" class="btn btn-secondary btn-sm flex-1">
                    ✏️ Draw on Map
                  </button>
                  <button type="button" id="btn-load-demo" class="btn btn-ghost btn-sm">
                    🗺️ Load Demo
                  </button>
                </div>
                <div id="route-status" style="margin-top:6px;font-size:0.75rem;color:var(--text-muted)">
                  No route drawn
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="corridor-notes">Additional Notes</label>
                <textarea id="corridor-notes" class="form-textarea"
                          placeholder="Known constraints, heritage restrictions, traffic sensitivity..."></textarea>
              </div>

            </div>
          </form>
        </div>
        <div class="phase-footer">
          <button id="btn-create-corridor" class="btn btn-primary btn-full">
            Create Corridor & Visualize →
          </button>
        </div>
      </div>

      <!-- ── Phase 2: Analyze Corridor ── -->
      <div id="phase-2" class="phase-pane hidden">
        <div class="phase-header">
          <div class="phase-number">Phase 2 of 6</div>
          <h2 class="phase-title">Analyze Corridor</h2>
          <p class="phase-desc">Review existing utilities and run a conflict and capacity analysis.</p>
        </div>
        <div class="phase-body" id="phase2-body">

          <!-- Utility Summary (before analysis) -->
          <div id="utility-summary">
            <div class="card-title" style="margin-bottom:10px">Existing Utilities</div>
            <div id="utility-list"><!-- Filled by phase2 JS --></div>
            <div class="divider"></div>
            <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.6">
              Click any utility in the list or on the map to view its details.
              Toggle layers using the map legend.
            </p>
          </div>

          <!-- Analysis Loading State -->
          <div id="analysis-loading" class="hidden" style="padding:24px 0">
            <div style="text-align:center;margin-bottom:16px">
              <div class="spinner" style="margin:0 auto 12px;width:32px;height:32px;border-width:3px"></div>
              <div style="font-weight:600;margin-bottom:4px">Analyzing Corridor...</div>
              <div style="font-size:0.8rem;color:var(--text-muted)" id="analysis-step-label">Checking utility separations</div>
            </div>
            <div class="loading-bar">
              <div class="loading-bar-fill" id="analysis-progress" style="width:0%"></div>
            </div>
          </div>

          <!-- Analysis Results -->
          <div id="analysis-results" class="hidden">

            <div class="analysis-section">
              <div class="analysis-section-title">
                <span>⚠️</span> Conflicts Detected
                <span id="conflict-count" class="badge badge-danger" style="margin-left:auto">0</span>
              </div>
              <div id="conflict-list"><!-- Filled by JS --></div>
            </div>

            <div class="analysis-section">
              <div class="analysis-section-title">
                <span>📊</span> Capacity Overview
              </div>
              <div id="capacity-list"><!-- Filled by JS --></div>
            </div>

            <div class="analysis-section">
              <div class="analysis-section-title">
                <span style="color:var(--util-duct)">🔵</span>
                Recommended Reserved Ducts
              </div>
              <div id="duct-recommendations"><!-- Filled by JS --></div>
            </div>

          </div>
        </div>
        <div class="phase-footer" id="phase2-footer">
          <button id="btn-analyze" class="btn btn-primary btn-full">
            🔍 Analyze Corridor
          </button>
          <button id="btn-go-plan" class="btn btn-secondary btn-full hidden" style="margin-top:8px">
            Plan New Utility →
          </button>
        </div>
      </div>

      <!-- ── Phase 3: Plan New Utility ── -->
      <div id="phase-3" class="phase-pane hidden">
        <div class="phase-header">
          <div class="phase-number">Phase 3 of 6</div>
          <h2 class="phase-title">Plan New Utility</h2>
          <p class="phase-desc">Specify the utility you want to add to this corridor.</p>
        </div>
        <div class="phase-body">
          <form id="utility-form" novalidate>
            <div class="flex flex-col gap-3">

              <div class="form-group">
                <label class="form-label" for="util-type">Utility Type</label>
                <select id="util-type" class="form-select">
                  <option value="fiber" selected>🔮 Fiber Optic Cable</option>
                  <option value="electricity">⚡ Electricity Cable</option>
                  <option value="water">💧 Water Main</option>
                  <option value="gas">🔥 Gas Main</option>
                  <option value="drainage">🌊 Drainage / Sewer</option>
                  <option value="ev_charging">🔌 EV Charging Duct</option>
                  <option value="district_heating">♨️ District Heating</option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="util-length">Length (m)</label>
                  <input id="util-length" class="form-input" type="number"
                         min="10" value="2300" placeholder="2300" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="util-size">Cable/Pipe Size</label>
                  <input id="util-size" class="form-input" type="text"
                         value="96-core SMF" placeholder="e.g. 96-core, 300mm" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="install-method">Installation Method</label>
                <select id="install-method" class="form-select">
                  <option value="open_cut">Open Cut (Trench)</option>
                  <option value="hdd" selected>Horizontal Directional Drilling (HDD)</option>
                  <option value="existing_duct">Through Existing Duct</option>
                  <option value="microtrenching">Micro-Trenching</option>
                  <option value="moling">Moling / Pipe Bursting</option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="num-bends">Number of Bends</label>
                  <input id="num-bends" class="form-input" type="number"
                         min="0" value="12" placeholder="0" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="road-crossings">Road Crossings</label>
                  <input id="road-crossings" class="form-input" type="number"
                         min="0" value="3" placeholder="0" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="target-depth">Target Depth (m)</label>
                <input id="target-depth" class="form-input" type="number"
                       min="0.3" step="0.1" value="0.6" placeholder="0.6" />
              </div>

              <div class="form-group">
                <label class="form-label" for="util-constraints">Project Constraints</label>
                <textarea id="util-constraints" class="form-textarea"
                          placeholder="e.g. No disruption to gas main zone, works during night hours only, heritage area restrictions...">No disruption permitted within 3m of gas main. Night works only on main carriageway sections.</textarea>
              </div>

              <div class="form-group">
                <label class="form-label" for="project-timeline">Target Timeline</label>
                <select id="project-timeline" class="form-select">
                  <option value="asap">As Soon As Possible</option>
                  <option value="3m" selected>Within 3 months</option>
                  <option value="6m">Within 6 months</option>
                  <option value="12m">Within 12 months</option>
                </select>
              </div>

            </div>
          </form>
        </div>
        <div class="phase-footer">
          <button id="btn-generate-plan" class="btn btn-primary btn-full">
            🤖 Generate Construction Plan →
          </button>
        </div>
      </div>

      <!-- ── Phase 4: Construction Plan ── -->
      <div id="phase-4" class="phase-pane hidden">
        <div class="phase-header">
          <div class="phase-number">Phase 4 of 6</div>
          <h2 class="phase-title">Construction Plan</h2>
          <p class="phase-desc">AI-generated plan covering equipment, crew, sequence, risks and readiness.</p>
        </div>
        <div class="phase-body">

          <!-- Loading -->
          <div id="plan-loading" style="padding:32px 0;text-align:center">
            <div class="spinner" style="margin:0 auto 16px;width:36px;height:36px;border-width:3px"></div>
            <div style="font-weight:600;margin-bottom:4px">Generating Construction Plan</div>
            <div style="font-size:0.78rem;color:var(--text-muted)" id="plan-step-label">Analyzing project requirements...</div>
          </div>

          <!-- Plan Content -->
          <div id="plan-content" class="hidden">

            <!-- Project Summary -->
            <div class="card" style="margin-bottom:14px">
              <div class="card-title" style="margin-bottom:10px">Project Summary</div>
              <div id="plan-summary"><!-- Filled by JS --></div>
            </div>

            <!-- Accordion Sections -->
            <div id="plan-sections"><!-- Filled by JS --></div>

          </div>
        </div>
        <div class="phase-footer" id="phase4-footer">
          <button id="btn-check-contractors" class="btn btn-primary btn-full hidden">
            👷 Check Contractor Readiness →
          </button>
        </div>
      </div>

      <!-- ── Phase 5: Contractor Readiness ── -->
      <div id="phase-5" class="phase-pane hidden">
        <div class="phase-header">
          <div class="phase-number">Phase 5 of 6</div>
          <h2 class="phase-title">Contractor Readiness</h2>
          <p class="phase-desc">See exactly which contractors can execute this project and why.</p>
        </div>
        <div class="phase-body">
          <div id="contractor-loading" style="padding:32px 0;text-align:center">
            <div class="spinner" style="margin:0 auto 16px;width:36px;height:36px;border-width:3px"></div>
            <div style="font-weight:600;margin-bottom:4px">Matching Contractors</div>
            <div style="font-size:0.78rem;color:var(--text-muted)">Comparing project requirements against capabilities...</div>
          </div>
          <div id="contractor-list" class="hidden"><!-- Filled by JS --></div>
        </div>
        <div class="phase-footer">
          <button id="btn-open-twin" class="btn btn-primary btn-full hidden">
            🌐 Open Digital Twin →
          </button>
        </div>
      </div>

      <!-- ── Phase 6: Digital Twin ── -->
      <div id="phase-6" class="phase-pane hidden">
        <div class="phase-header">
          <div class="phase-number">Phase 6 of 6</div>
          <h2 class="phase-title">Digital Twin</h2>
          <p class="phase-desc">Live record of what's underground. Simulate future projects to check reusability.</p>
        </div>
        <div class="phase-body">

          <!-- Twin Stats -->
          <div id="twin-stats" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">
            <div class="card" style="padding:12px;text-align:center">
              <div style="font-size:1.4rem;font-weight:800;font-family:var(--font-mono);color:var(--teal)" id="twin-stat-elements">8</div>
              <div style="font-size:0.7rem;color:var(--text-muted)">Elements</div>
            </div>
            <div class="card" style="padding:12px;text-align:center">
              <div style="font-size:1.4rem;font-weight:800;font-family:var(--font-mono);color:var(--util-duct)" id="twin-stat-ducts">3</div>
              <div style="font-size:0.7rem;color:var(--text-muted)">Reserved Ducts</div>
            </div>
            <div class="card" style="padding:12px;text-align:center">
              <div style="font-size:1.4rem;font-weight:800;font-family:var(--font-mono);color:var(--success)" id="twin-stat-score">87</div>
              <div style="font-size:0.7rem;color:var(--text-muted)">Future Score</div>
            </div>
          </div>

          <!-- Twin Element List -->
          <div class="card-title" style="margin-bottom:10px">All Elements</div>
          <div id="twin-element-list"><!-- Filled by JS --></div>

          <div class="divider"></div>

          <!-- Future Project Simulation -->
          <div class="analysis-section-title" style="margin-bottom:12px">
            <span>🚀</span> Simulate Future Project
          </div>
          <div class="card" style="padding:14px">
            <div class="flex flex-col gap-3">
              <div class="form-group">
                <label class="form-label" for="sim-util-type">Future Utility Type</label>
                <select id="sim-util-type" class="form-select">
                  <option value="fiber" selected>🔮 Fiber / Broadband</option>
                  <option value="electricity">⚡ New Power Circuit</option>
                  <option value="ev_charging">🔌 EV Charging</option>
                  <option value="district_heating">♨️ District Heating</option>
                  <option value="water">💧 New Water Main</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="sim-length">Required Length (m)</label>
                <input id="sim-length" class="form-input" type="number" value="2300" />
              </div>
              <button id="btn-simulate" class="btn btn-primary btn-full">
                🤖 Check Existing Capacity
              </button>
            </div>
          </div>

          <!-- Simulation Result -->
          <div id="sim-result" class="hidden"></div>

        </div>
        <div class="phase-footer">
          <div style="font-size:0.75rem;color:var(--text-muted);text-align:center">
            ✅ Full corridor planning workflow complete. This twin will be used for all future projects on this corridor.
          </div>
        </div>
      </div>

    </div><!-- /phase-panel -->
  </div><!-- /app-body -->
</div><!-- /main-app -->

<!-- ═══════════════════════════════════════════════════════
     AI ASSISTANT PANEL
═══════════════════════════════════════════════════════ -->
<div id="ai-assistant">
  <div class="ai-header">
    <div class="ai-avatar">🤖</div>
    <div class="ai-header-info">
      <div class="ai-header-name">UtilitySync AI</div>
      <div class="ai-header-sub">
        <div class="ai-pulse" style="width:6px;height:6px"></div>
        Powered by Amazon Bedrock · Claude 3.5 Sonnet
      </div>
    </div>
    <button class="ai-header-close" id="ai-close-btn">✕</button>
  </div>
  <div id="ai-messages" class="ai-messages">
    <!-- Messages injected by JS -->
  </div>
  <div id="ai-suggestions" class="ai-suggestions">
    <!-- Suggestions injected by JS -->
  </div>
  <div class="ai-input-row">
    <input id="ai-input" type="text"
           placeholder="Ask about the corridor, plan, or contractor..." />
    <button id="ai-send-btn">→</button>
  </div>
</div>

<!-- Toast Container -->
<div id="toast-container"></div>

<!-- ═══════════════════════════════════════════════════════
     SCRIPTS — load order matters
═══════════════════════════════════════════════════════ -->
<script src="vendor/leaflet/leaflet.js"></script>
<script>
  if (typeof L === 'undefined') {
    document.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"><\/script>');
  }
</script>

<script src="js/config.js"></script>
<script src="js/data/mock-data.js"></script>
<script src="js/app.js"></script>
<script src="js/map.js"></script>
<script src="js/api.js"></script>
<script src="js/phases/phase0-landing.js"></script>
<script src="js/phases/phase1-create.js"></script>
<script src="js/phases/phase2-analyze.js"></script>
<script src="js/phases/phase3-utility.js"></script>
<script src="js/phases/phase4-construction.js"></script>
<script src="js/phases/phase5-contractor.js"></script>
<script src="js/phases/phase6-digital-twin.js"></script>
<script src="js/ai-assistant.js"></script>

</body>
</html>
```


# FILE: .\frontend\css\style.css
```
/* =====================================================
   UtilitySync — Complete Design System
   Underground Utility Infrastructure Intelligence
   ===================================================== */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

/* ── CSS Variables ─────────────────────────────────── */
:root {
  /* Backgrounds */
  --bg-primary:   #080b14;
  --bg-secondary: #0d1321;
  --surface:      #111827;
  --surface-2:    #1a2035;
  --surface-3:    #232b42;

  /* Borders */
  --border:        rgba(255,255,255,0.07);
  --border-hover:  rgba(255,255,255,0.14);
  --border-active: rgba(0,212,170,0.45);

  /* Accent */
  --teal:           #00d4aa;
  --blue:           #2563eb;
  --gradient:       linear-gradient(135deg, #00d4aa 0%, #2563eb 100%);
  --gradient-subtle:linear-gradient(135deg, rgba(0,212,170,0.15) 0%, rgba(37,99,235,0.15) 100%);

  /* Utility Colors */
  --util-electricity: #f59e0b;
  --util-water:       #3b82f6;
  --util-fiber:       #a855f7;
  --util-gas:         #ef4444;
  --util-drainage:    #10b981;
  --util-duct:        #06b6d4;
  --util-expansion:   #84cc16;

  /* Status */
  --success: #10b981;
  --warning: #f59e0b;
  --danger:  #ef4444;
  --info:    #3b82f6;

  /* Text */
  --text-primary:   rgba(255,255,255,0.95);
  --text-secondary: rgba(255,255,255,0.60);
  --text-muted:     rgba(255,255,255,0.35);

  /* Layout */
  --nav-height:    60px;
  --panel-width:   440px;
  --radius-sm:     8px;
  --radius:        12px;
  --radius-lg:     16px;
  --radius-xl:     24px;

  /* Shadows */
  --shadow:      0 4px 24px rgba(0,0,0,0.5);
  --shadow-lg:   0 8px 48px rgba(0,0,0,0.7);
  --glow-teal:   0 0 24px rgba(0,212,170,0.25);
  --glow-blue:   0 0 24px rgba(37,99,235,0.25);

  /* Transitions */
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --t:    0.25s var(--ease);
  --t-lg: 0.4s  var(--ease);

  /* Font */
  --font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

/* ── Reset ─────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 15px; scroll-behavior: smooth; }
body {
  font-family: var(--font);
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  overflow: hidden;
  height: 100vh;
  width: 100vw;
}
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--surface); }
::-webkit-scrollbar-thumb { background: var(--surface-3); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--teal); }
a { color: var(--teal); text-decoration: none; }
img, svg { display: block; max-width: 100%; }
button { font-family: var(--font); cursor: pointer; border: none; outline: none; }
input, select, textarea { font-family: var(--font); }

/* ── Utilities ─────────────────────────────────────── */
.hidden   { display: none !important; }
.flex     { display: flex; }
.flex-col { display: flex; flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-1 { gap: 6px; }
.gap-2 { gap: 12px; }
.gap-3 { gap: 18px; }
.gap-4 { gap: 24px; }
.text-sm   { font-size: 0.8rem; }
.text-xs   { font-size: 0.7rem; }
.text-muted { color: var(--text-secondary); }
.w-full { width: 100%; }
.mt-1 { margin-top: 6px; }
.mt-2 { margin-top: 12px; }
.mt-3 { margin-top: 18px; }
.mt-4 { margin-top: 24px; }
.fade-in { animation: fadeIn 0.4s var(--ease) both; }
.slide-up { animation: slideUp 0.4s var(--ease) both; }

@keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp  { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideIn  { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
@keyframes pulseGlow{ 0%,100% { box-shadow: 0 0 8px rgba(0,212,170,0.3); } 50% { box-shadow: 0 0 24px rgba(0,212,170,0.7); } }
@keyframes spin     { to { transform: rotate(360deg); } }
@keyframes draw     { from { stroke-dashoffset: 1000; } to { stroke-dashoffset: 0; } }
@keyframes blink    { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
@keyframes scanPulse{
  0%   { transform: translateY(-100%); opacity: 0; }
  10%  { opacity: 0.6; }
  90%  { opacity: 0.6; }
  100% { transform: translateY(100%); opacity: 0; }
}

/* ── Typography ────────────────────────────────────── */
h1 { font-size: 2.6rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1.15; }
h2 { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; }
h3 { font-size: 1.1rem; font-weight: 600; }
h4 { font-size: 0.9rem;  font-weight: 600; }
p  { color: var(--text-secondary); }

.gradient-text {
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── Buttons ───────────────────────────────────────── */
.btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 20px; border-radius: var(--radius-sm);
  font-size: 0.875rem; font-weight: 600;
  transition: all var(--t); white-space: nowrap;
}
.btn-primary {
  background: var(--gradient);
  color: #fff;
  box-shadow: 0 4px 16px rgba(0,212,170,0.3);
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(0,212,170,0.45);
}
.btn-secondary {
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-primary);
}
.btn-secondary:hover {
  border-color: var(--teal);
  background: var(--surface-3);
}
.btn-ghost {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
}
.btn-ghost:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}
.btn-danger {
  background: rgba(239,68,68,0.15);
  border: 1px solid rgba(239,68,68,0.3);
  color: var(--danger);
}
.btn-hero {
  display: inline-flex; align-items: center; gap: 16px;
  padding: 18px 44px;
  background: var(--gradient);
  color: #fff;
  border-radius: 50px;
  font-size: 1.1rem; font-weight: 700;
  box-shadow: 0 8px 40px rgba(0,212,170,0.4);
  transition: all var(--t-lg);
  border: none; cursor: pointer;
}
.btn-hero:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 16px 60px rgba(0,212,170,0.55);
}
.btn-hero .arrow {
  font-size: 1.3rem;
  transition: transform var(--t);
}
.btn-hero:hover .arrow { transform: translateX(6px); }
.btn-sm { padding: 6px 14px; font-size: 0.8rem; }
.btn-full { width: 100%; justify-content: center; }
.btn-icon {
  width: 36px; height: 36px; padding: 0;
  justify-content: center; border-radius: var(--radius-sm);
  font-size: 1rem;
}

/* ── Cards ─────────────────────────────────────────── */
.card {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  transition: border-color var(--t);
}
.card:hover { border-color: var(--border-hover); }
.card-glass {
  background: rgba(26,32,53,0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.card-glow {
  border-color: var(--border-active);
  box-shadow: var(--glow-teal);
}
.card-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}
.card-title {
  font-size: 0.85rem; font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: 0.08em;
}

/* ── Forms ─────────────────────────────────────────── */
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label {
  font-size: 0.8rem; font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: 0.06em;
}
.form-input, .form-select, .form-textarea {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: border-color var(--t), box-shadow var(--t);
  width: 100%;
}
.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--teal);
  box-shadow: 0 0 0 3px rgba(0,212,170,0.12);
}
.form-input::placeholder { color: var(--text-muted); }
.form-select {
  appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23ffffff60' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 36px;
}
.form-select option { background: var(--surface-2); }
.form-textarea { resize: vertical; min-height: 80px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-hint { font-size: 0.75rem; color: var(--text-muted); }

/* Checkboxes */
.checkbox-group { display: flex; flex-wrap: wrap; gap: 8px; }
.checkbox-pill {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  border: 1px solid var(--border);
  border-radius: 50px;
  cursor: pointer;
  transition: all var(--t);
  font-size: 0.8rem; font-weight: 500;
  user-select: none;
}
.checkbox-pill:hover { border-color: var(--border-hover); }
.checkbox-pill.active {
  border-color: transparent;
  color: #fff;
}
.checkbox-pill input { display: none; }
.checkbox-pill .dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: currentColor;
}

/* Range */
.form-range { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; background: var(--surface-3); border-radius: 2px; outline: none; }
.form-range::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: var(--teal); border-radius: 50%; cursor: pointer; box-shadow: 0 0 8px rgba(0,212,170,0.4); }

/* ── Badges / Tags ─────────────────────────────────── */
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 50px;
  font-size: 0.7rem; font-weight: 600; letter-spacing: 0.04em;
}
.badge-electricity { background: rgba(245,158,11,0.15); color: var(--util-electricity); border: 1px solid rgba(245,158,11,0.25); }
.badge-water       { background: rgba(59,130,246,0.15); color: var(--util-water);       border: 1px solid rgba(59,130,246,0.25); }
.badge-fiber       { background: rgba(168,85,247,0.15); color: var(--util-fiber);       border: 1px solid rgba(168,85,247,0.25); }
.badge-gas         { background: rgba(239,68,68,0.15);  color: var(--util-gas);         border: 1px solid rgba(239,68,68,0.25); }
.badge-drainage    { background: rgba(16,185,129,0.15); color: var(--util-drainage);    border: 1px solid rgba(16,185,129,0.25); }
.badge-duct        { background: rgba(6,182,212,0.15);  color: var(--util-duct);        border: 1px solid rgba(6,182,212,0.25); }
.badge-success     { background: rgba(16,185,129,0.15); color: var(--success);          border: 1px solid rgba(16,185,129,0.25); }
.badge-warning     { background: rgba(245,158,11,0.15); color: var(--warning);          border: 1px solid rgba(245,158,11,0.25); }
.badge-danger      { background: rgba(239,68,68,0.15);  color: var(--danger);           border: 1px solid rgba(239,68,68,0.25); }

/* ── Utility Dot ───────────────────────────────────── */
.util-dot {
  width: 10px; height: 10px; border-radius: 50%;
  flex-shrink: 0;
}
.util-dot-electricity { background: var(--util-electricity); box-shadow: 0 0 6px var(--util-electricity); }
.util-dot-water       { background: var(--util-water);       box-shadow: 0 0 6px var(--util-water); }
.util-dot-fiber       { background: var(--util-fiber);       box-shadow: 0 0 6px var(--util-fiber); }
.util-dot-gas         { background: var(--util-gas);         box-shadow: 0 0 6px var(--util-gas); }
.util-dot-drainage    { background: var(--util-drainage);    box-shadow: 0 0 6px var(--util-drainage); }
.util-dot-duct        { background: var(--util-duct);        box-shadow: 0 0 6px var(--util-duct); box-shadow: 0 0 8px var(--util-duct); animation: pulseGlow 2s infinite; }

/* ── Loading ───────────────────────────────────────── */
.spinner {
  width: 20px; height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--teal);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}
.loading-bar {
  height: 3px; background: var(--surface-3); border-radius: 2px; overflow: hidden;
}
.loading-bar-fill {
  height: 100%; background: var(--gradient);
  border-radius: 2px;
  transition: width 0.4s var(--ease);
}
.skeleton {
  background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
@keyframes shimmer { to { background-position: -200% 0; } }

/* ── Progress Bar ──────────────────────────────────── */
.progress-bar {
  height: 6px; background: var(--surface-3);
  border-radius: 3px; overflow: hidden;
}
.progress-fill {
  height: 100%; border-radius: 3px;
  transition: width 1s var(--ease);
}

/* ── Divider ───────────────────────────────────────── */
.divider {
  height: 1px; background: var(--border); margin: 16px 0;
}

/* ─────────────────────────────────────────────────── */
/* ── PHASE 0 — LANDING ────────────────────────────── */
/* ─────────────────────────────────────────────────── */
#phase-0 {
  position: fixed; inset: 0; z-index: 100;
  background: var(--bg-primary);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  transition: opacity 0.6s var(--ease), transform 0.6s var(--ease);
}
#phase-0.exit {
  opacity: 0;
  transform: scale(0.97);
  pointer-events: none;
}
#particle-canvas {
  position: absolute; inset: 0;
  pointer-events: none;
}
.landing-content {
  position: relative; z-index: 1;
  text-align: center;
  max-width: 720px;
  padding: 40px 24px;
  animation: fadeIn 1s var(--ease) 0.2s both;
}
.landing-logo {
  display: flex; align-items: center; justify-content: center; gap: 14px;
  margin-bottom: 32px;
}
.landing-logo-icon {
  width: 64px; height: 64px;
  background: var(--gradient);
  border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem;
  box-shadow: 0 8px 32px rgba(0,212,170,0.4);
}
.landing-logo-text {
  font-size: 2.8rem; font-weight: 900;
  letter-spacing: -0.04em;
  background: var(--gradient);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.landing-tagline {
  font-size: 1.1rem; font-weight: 500;
  color: var(--text-secondary);
  letter-spacing: 0.1em; text-transform: uppercase;
  margin-bottom: 20px;
}
.landing-subtitle {
  font-size: 1.2rem;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 48px;
  max-width: 560px; margin-left: auto; margin-right: auto;
}
.landing-subtitle strong { color: var(--text-primary); }
.landing-cta { margin-bottom: 64px; }
.capabilities-row {
  display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;
}
.cap-pill {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  border-radius: 50px;
  font-size: 0.78rem; font-weight: 500;
  color: var(--text-muted);
  transition: all var(--t);
}
.cap-pill .icon { font-size: 1rem; opacity: 0.6; }
.cap-pill.unlocked {
  color: var(--text-secondary);
  border-color: var(--border-hover);
}

/* ─────────────────────────────────────────────────── */
/* ── TOP NAV ─────────────────────────────────────── */
/* ─────────────────────────────────────────────────── */
#top-nav {
  position: fixed; top: 0; left: 0; right: 0;
  height: var(--nav-height); z-index: 50;
  background: rgba(8,11,20,0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px; gap: 16px;
}
.nav-logo {
  display: flex; align-items: center; gap: 10px;
  text-decoration: none; flex-shrink: 0;
}
.nav-logo-icon {
  width: 32px; height: 32px;
  background: var(--gradient);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem;
}
.nav-logo-text {
  font-size: 1.05rem; font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}
.nav-logo-badge {
  font-size: 0.6rem; font-weight: 700;
  background: var(--gradient);
  color: #fff; padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase; letter-spacing: 0.05em;
}

/* Stepper */
#stepper {
  display: flex; align-items: center; gap: 4px;
  overflow-x: auto; flex: 1; padding: 0 8px;
}
#stepper::-webkit-scrollbar { display: none; }
.step-item {
  display: flex; align-items: center; gap: 4px;
  cursor: pointer; white-space: nowrap;
  padding: 6px 10px; border-radius: 6px;
  transition: all var(--t);
  flex-shrink: 0;
}
.step-item:hover:not(.locked) { background: var(--surface); }
.step-num {
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.7rem; font-weight: 700;
  border: 2px solid var(--border);
  color: var(--text-muted);
  transition: all var(--t);
  flex-shrink: 0;
}
.step-label {
  font-size: 0.75rem; font-weight: 500;
  color: var(--text-muted);
  transition: color var(--t);
}
.step-item.completed .step-num {
  background: var(--success); border-color: var(--success);
  color: #fff;
}
.step-item.completed .step-label { color: var(--text-secondary); }
.step-item.active .step-num {
  background: var(--gradient); border-color: transparent;
  color: #fff; box-shadow: 0 0 12px rgba(0,212,170,0.4);
}
.step-item.active .step-label { color: var(--text-primary); font-weight: 600; }
.step-item.locked { cursor: default; }
.step-connector {
  width: 16px; height: 1px;
  background: var(--border); flex-shrink: 0;
}
.step-connector.done { background: var(--success); }

/* Nav right */
.nav-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.nav-ai-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 14px;
  background: rgba(0,212,170,0.1);
  border: 1px solid rgba(0,212,170,0.25);
  border-radius: 8px;
  color: var(--teal);
  font-size: 0.8rem; font-weight: 600;
  cursor: pointer;
  transition: all var(--t);
}
.nav-ai-btn:hover {
  background: rgba(0,212,170,0.18);
  border-color: rgba(0,212,170,0.45);
  box-shadow: var(--glow-teal);
}
.ai-pulse {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--teal);
  animation: pulseGlow 1.5s infinite;
}

/* ─────────────────────────────────────────────────── */
/* ── MAIN LAYOUT ─────────────────────────────────── */
/* ─────────────────────────────────────────────────── */
#main-app {
  position: fixed; inset: 0;
  padding-top: var(--nav-height);
  display: flex; flex-direction: column;
}
.app-body {
  flex: 1; display: flex; overflow: hidden;
}

/* ── Map Section ─────────────────────────────────── */
#map-section {
  flex: 1; position: relative;
  overflow: hidden;
}
#map {
  width: 100%; height: 100%;
  background: var(--bg-secondary);
}
/* Override Leaflet defaults */
.leaflet-container { background: var(--bg-secondary); }
.leaflet-tile { filter: brightness(0.85) saturate(0.9); }
.leaflet-control-zoom {
  border: 1px solid var(--border) !important;
  border-radius: var(--radius-sm) !important;
  overflow: hidden;
}
.leaflet-control-zoom a {
  background: var(--surface-2) !important;
  color: var(--text-primary) !important;
  border: none !important;
  line-height: 28px !important;
  width: 28px !important; height: 28px !important;
}
.leaflet-control-zoom a:hover { background: var(--surface-3) !important; color: var(--teal) !important; }
.leaflet-popup-content-wrapper {
  background: var(--surface-2) !important;
  border: 1px solid var(--border) !important;
  border-radius: var(--radius) !important;
  box-shadow: var(--shadow-lg) !important;
  color: var(--text-primary) !important;
}
.leaflet-popup-tip { background: var(--surface-2) !important; }
.leaflet-popup-content { margin: 16px 18px !important; min-width: 220px; }
.popup-title { font-size: 0.85rem; font-weight: 700; margin-bottom: 10px; }
.popup-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid var(--border); font-size: 0.77rem; }
.popup-row:last-child { border-bottom: none; }
.popup-row .label { color: var(--text-muted); }
.popup-row .value { font-weight: 600; }

/* Map Toolbar */
#map-toolbar {
  position: absolute; top: 12px; left: 12px; z-index: 400;
  display: flex; flex-direction: column; gap: 6px;
}
.map-tool-btn {
  width: 36px; height: 36px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem; cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--t);
  box-shadow: var(--shadow);
}
.map-tool-btn:hover { border-color: var(--teal); color: var(--teal); }
.map-tool-btn.active { background: rgba(0,212,170,0.15); border-color: var(--teal); color: var(--teal); }

/* Layer Legend */
#layer-legend {
  position: absolute; top: 12px; right: 12px; z-index: 400;
  background: rgba(17,24,39,0.9);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 14px;
  min-width: 180px;
  box-shadow: var(--shadow);
}
.legend-title {
  font-size: 0.7rem; font-weight: 700;
  color: var(--text-muted); text-transform: uppercase;
  letter-spacing: 0.08em; margin-bottom: 10px;
}
.legend-item {
  display: flex; align-items: center; gap: 10px;
  padding: 5px 0;
  cursor: pointer;
  border-radius: 4px;
  transition: all var(--t);
  font-size: 0.78rem; color: var(--text-secondary);
}
.legend-item:hover { color: var(--text-primary); }
.legend-item.hidden-layer { opacity: 0.4; }
.legend-line {
  width: 24px; height: 3px; border-radius: 2px; flex-shrink: 0;
}

/* Draw Mode Banner */
#draw-mode-banner {
  position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
  z-index: 400;
  background: rgba(0,212,170,0.15);
  border: 1px solid rgba(0,212,170,0.4);
  border-radius: 50px;
  padding: 10px 24px;
  display: flex; align-items: center; gap: 10px;
  font-size: 0.82rem; font-weight: 600; color: var(--teal);
  box-shadow: var(--glow-teal);
  animation: fadeIn 0.3s ease;
}
#draw-mode-banner .blink-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--teal);
  animation: blink 1s infinite;
}

/* ── Digital Twin Cross Section ─────────────────────── */
#twin-panel {
  position: absolute; inset: 0; z-index: 300;
  background: var(--bg-primary);
  display: flex; flex-direction: column;
  overflow: hidden;
}
#twin-cross-section {
  flex: 1; position: relative; overflow: hidden;
  background: linear-gradient(180deg, #0a1628 0%, #080b14 100%);
}
#twin-controls {
  height: 48px; padding: 0 16px;
  background: var(--surface);
  border-top: 1px solid var(--border);
  display: flex; align-items: center; gap: 12px;
}

/* ── Phase Panel ─────────────────────────────────── */
#phase-panel {
  width: var(--panel-width);
  flex-shrink: 0;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border);
  display: flex; flex-direction: column;
  overflow: hidden;
}
.phase-pane {
  display: flex; flex-direction: column;
  height: 100%;
  animation: slideIn 0.35s var(--ease) both;
}
.phase-header {
  padding: 20px 20px 0;
  flex-shrink: 0;
}
.phase-number {
  font-size: 0.7rem; font-weight: 700;
  color: var(--teal); text-transform: uppercase;
  letter-spacing: 0.1em; margin-bottom: 4px;
}
.phase-title { font-size: 1.3rem; font-weight: 800; margin-bottom: 4px; }
.phase-desc  { font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; }
.phase-body {
  flex: 1; overflow-y: auto;
  padding: 16px 20px;
}
.phase-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
  background: var(--bg-secondary);
}

/* ── Analysis Cards ─────────────────────────────── */
.analysis-section { margin-bottom: 18px; }
.analysis-section-title {
  font-size: 0.72rem; font-weight: 700;
  color: var(--text-muted); text-transform: uppercase;
  letter-spacing: 0.1em; margin-bottom: 10px;
  display: flex; align-items: center; gap: 6px;
}
.conflict-card {
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: var(--radius);
  padding: 14px;
  margin-bottom: 8px;
}
.conflict-header {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 8px;
}
.conflict-icon { font-size: 1.1rem; }
.conflict-title { font-size: 0.85rem; font-weight: 700; }
.conflict-body { font-size: 0.78rem; color: var(--text-secondary); line-height: 1.5; }
.conflict-solution {
  margin-top: 8px;
  padding: 8px 10px;
  background: rgba(16,185,129,0.08);
  border-radius: var(--radius-sm);
  border-left: 2px solid var(--success);
  font-size: 0.77rem; color: var(--success);
}
.capacity-card {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
  margin-bottom: 8px;
}
.capacity-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.capacity-label  { font-size: 0.82rem; font-weight: 600; flex: 1; }
.capacity-pct    { font-size: 0.8rem; font-weight: 700; font-family: var(--font-mono); }
.duct-card {
  background: rgba(6,182,212,0.07);
  border: 1px solid rgba(6,182,212,0.25);
  border-radius: var(--radius);
  padding: 14px;
  margin-bottom: 8px;
  animation: pulseGlow 3s infinite;
}
.duct-card-header {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 6px;
}
.duct-icon { font-size: 1.1rem; }
.duct-title { font-size: 0.85rem; font-weight: 700; color: var(--util-duct); }
.duct-body { font-size: 0.78rem; color: var(--text-secondary); line-height: 1.5; }

/* ── Construction Plan Cards ─────────────────────── */
.plan-section { margin-bottom: 16px; }
.plan-section-header {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all var(--t);
  user-select: none;
}
.plan-section-header:hover { border-color: var(--border-hover); }
.plan-section-header.open { border-color: var(--teal); border-radius: var(--radius) var(--radius) 0 0; }
.plan-icon { font-size: 1.2rem; width: 28px; text-align: center; }
.plan-section-label { font-size: 0.875rem; font-weight: 600; flex: 1; }
.plan-chevron { color: var(--text-muted); transition: transform var(--t); }
.plan-section-header.open .plan-chevron { transform: rotate(180deg); color: var(--teal); }
.plan-section-body {
  background: var(--surface);
  border: 1px solid var(--teal);
  border-top: none;
  border-radius: 0 0 var(--radius) var(--radius);
  padding: 14px;
  display: none;
}
.plan-section-body.open { display: block; animation: fadeIn 0.2s ease; }
.plan-list { list-style: none; }
.plan-list li {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 6px 0; border-bottom: 1px solid var(--border);
  font-size: 0.82rem; color: var(--text-secondary);
}
.plan-list li:last-child { border-bottom: none; }
.plan-list li::before {
  content: '▸'; color: var(--teal);
  flex-shrink: 0; margin-top: 1px;
}
.risk-item {
  display: flex; gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  margin-bottom: 6px;
  font-size: 0.82rem;
}
.risk-high   { background: rgba(239,68,68,0.08);  border-left: 3px solid var(--danger); }
.risk-medium { background: rgba(245,158,11,0.08); border-left: 3px solid var(--warning); }
.risk-low    { background: rgba(16,185,129,0.08); border-left: 3px solid var(--success); }
.risk-level  { font-weight: 700; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; }
.risk-text   { color: var(--text-secondary); }
.missing-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 0; border-bottom: 1px solid var(--border);
  font-size: 0.82rem;
}
.missing-item:last-child { border-bottom: none; }
.missing-icon { font-size: 0.9rem; flex-shrink: 0; }

/* ── Contractor Cards ─────────────────────────────── */
.contractor-card {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 18px;
  margin-bottom: 12px;
  transition: all var(--t);
  cursor: default;
}
.contractor-card:hover { border-color: var(--border-hover); }
.contractor-card.best-match {
  border-color: rgba(16,185,129,0.4);
  background: rgba(16,185,129,0.05);
}
.contractor-header {
  display: flex; align-items: flex-start; gap: 14px;
  margin-bottom: 14px;
}
.match-ring {
  width: 60px; height: 60px; flex-shrink: 0;
  position: relative;
}
.match-ring svg { transform: rotate(-90deg); }
.match-ring-bg { fill: none; stroke: var(--surface-3); stroke-width: 5; }
.match-ring-fill { fill: none; stroke-width: 5; stroke-linecap: round; transition: stroke-dasharray 1.5s var(--ease); }
.match-score {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 800; font-family: var(--font-mono);
}
.contractor-info { flex: 1; }
.contractor-name { font-size: 0.95rem; font-weight: 700; margin-bottom: 2px; }
.contractor-sub  { font-size: 0.75rem; color: var(--text-muted); }
.contractor-verdict {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.78rem; font-weight: 600; margin-top: 6px;
}
.req-list { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
.req-item {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.78rem; padding: 5px 0;
}
.req-icon { font-size: 0.9rem; flex-shrink: 0; }
.req-name { flex: 1; color: var(--text-secondary); }
.req-status { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
.req-ok      { color: var(--success); }
.req-missing { color: var(--danger); }
.req-partial { color: var(--warning); }
.contractor-narrative {
  padding: 10px 12px;
  background: rgba(0,0,0,0.2);
  border-radius: var(--radius-sm);
  border-left: 2px solid var(--border-active);
  font-size: 0.77rem; color: var(--text-secondary);
  line-height: 1.6;
  font-style: italic;
}

/* ── Digital Twin ────────────────────────────────── */
.twin-element-drawer {
  position: absolute; right: 0; top: 0; bottom: 0;
  width: 300px; z-index: 10;
  background: rgba(13,19,33,0.95);
  backdrop-filter: blur(16px);
  border-left: 1px solid var(--border);
  transform: translateX(100%);
  transition: transform var(--t-lg);
  overflow-y: auto;
  padding: 16px;
}
.twin-element-drawer.open { transform: translateX(0); }
.drawer-close {
  position: absolute; top: 12px; right: 12px;
  width: 28px; height: 28px;
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: 50%; cursor: pointer; font-size: 0.8rem;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-secondary);
  transition: all var(--t);
}
.drawer-close:hover { color: var(--text-primary); border-color: var(--border-hover); }
.drawer-type-badge { margin-bottom: 10px; }
.drawer-title { font-size: 1rem; font-weight: 700; margin-bottom: 14px; }
.drawer-stat {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; border-bottom: 1px solid var(--border);
  font-size: 0.8rem;
}
.drawer-stat:last-child { border-bottom: none; }
.drawer-stat .label { color: var(--text-muted); }
.drawer-stat .value { font-weight: 600; font-family: var(--font-mono); font-size: 0.78rem; }
.capacity-indicator {
  margin-top: 14px;
  padding: 12px;
  background: rgba(0,0,0,0.2);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}
.capacity-label-row {
  display: flex; justify-content: space-between;
  font-size: 0.75rem; margin-bottom: 6px;
}

/* Simulation Panel */
.sim-panel {
  margin-top: 16px;
  padding: 14px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.sim-result {
  padding: 14px;
  background: rgba(0,212,170,0.08);
  border: 1px solid rgba(0,212,170,0.3);
  border-radius: var(--radius);
  margin-top: 12px;
  animation: slideUp 0.4s ease;
}
.sim-result-icon { font-size: 2rem; text-align: center; margin-bottom: 8px; }
.sim-result-title { font-size: 0.9rem; font-weight: 700; color: var(--teal); text-align: center; margin-bottom: 8px; }
.sim-result-body { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.6; }
.sim-saving {
  display: flex; justify-content: space-around;
  margin-top: 12px; padding-top: 12px;
  border-top: 1px solid var(--border);
}
.sim-saving-item { text-align: center; }
.sim-saving-value { font-size: 1.2rem; font-weight: 800; font-family: var(--font-mono); }
.sim-saving-value.money  { color: var(--success); }
.sim-saving-value.time   { color: var(--teal); }
.sim-saving-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }

/* ── AI Assistant ────────────────────────────────── */
#ai-assistant {
  position: fixed; bottom: 0; right: 24px; z-index: 200;
  width: 380px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-bottom: none;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  box-shadow: var(--shadow-lg);
  display: flex; flex-direction: column;
  transform: translateY(100%);
  transition: transform 0.4s var(--ease);
  max-height: calc(100vh - var(--nav-height) - 20px);
}
#ai-assistant.open { transform: translateY(0); }
.ai-header {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.ai-avatar {
  width: 36px; height: 36px;
  background: var(--gradient);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem; flex-shrink: 0;
}
.ai-header-info { flex: 1; }
.ai-header-name { font-size: 0.9rem; font-weight: 700; }
.ai-header-sub  { font-size: 0.72rem; color: var(--text-muted); display: flex; align-items: center; gap: 5px; }
.ai-header-close {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--surface-2); border: 1px solid var(--border);
  cursor: pointer; font-size: 0.85rem;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-secondary); transition: all var(--t);
}
.ai-header-close:hover { color: var(--text-primary); }
.ai-messages {
  flex: 1; overflow-y: auto;
  padding: 14px 16px;
  display: flex; flex-direction: column; gap: 12px;
  min-height: 200px; max-height: 360px;
}
.ai-msg { display: flex; gap: 10px; animation: fadeIn 0.3s ease; }
.ai-msg-avatar {
  width: 28px; height: 28px;
  background: var(--gradient);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; flex-shrink: 0; margin-top: 2px;
}
.ai-msg-user-avatar {
  width: 28px; height: 28px;
  background: var(--surface-3);
  border: 1px solid var(--border);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; flex-shrink: 0; margin-top: 2px;
}
.ai-msg-bubble {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 0 var(--radius) var(--radius) var(--radius);
  padding: 10px 13px;
  font-size: 0.82rem; color: var(--text-secondary);
  line-height: 1.6; flex: 1;
}
.ai-msg.user .ai-msg-bubble {
  background: rgba(0,212,170,0.08);
  border-color: rgba(0,212,170,0.2);
  color: var(--text-primary);
  border-radius: var(--radius) 0 var(--radius) var(--radius);
}
.ai-msg.user { flex-direction: row-reverse; }
.ai-typing {
  display: flex; gap: 4px; align-items: center;
  padding: 4px 0;
}
.ai-typing span {
  width: 6px; height: 6px; background: var(--teal);
  border-radius: 50%;
  animation: blink 1.2s infinite;
}
.ai-typing span:nth-child(2) { animation-delay: 0.2s; }
.ai-typing span:nth-child(3) { animation-delay: 0.4s; }
.ai-suggestions {
  padding: 0 16px 8px;
  display: flex; flex-wrap: wrap; gap: 6px;
}
.ai-suggestion {
  padding: 5px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 50px;
  font-size: 0.75rem; color: var(--text-secondary);
  cursor: pointer; transition: all var(--t);
}
.ai-suggestion:hover { border-color: var(--teal); color: var(--teal); }
.ai-input-row {
  display: flex; gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
#ai-input {
  flex: 1; background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 9px 13px;
  color: var(--text-primary); font-size: 0.82rem;
  outline: none; transition: border-color var(--t);
}
#ai-input:focus { border-color: var(--teal); }
#ai-input::placeholder { color: var(--text-muted); }
#ai-send-btn {
  padding: 9px 16px;
  background: var(--gradient);
  color: #fff; border-radius: var(--radius-sm);
  font-size: 0.8rem; font-weight: 600;
  transition: all var(--t);
}
#ai-send-btn:hover { opacity: 0.9; transform: translateY(-1px); }

/* ── Notifications / Toast ───────────────────────── */
#toast-container {
  position: fixed; top: calc(var(--nav-height) + 12px);
  right: 16px; z-index: 9999;
  display: flex; flex-direction: column; gap: 8px;
  pointer-events: none;
}
.toast {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 16px;
  display: flex; align-items: center; gap: 10px;
  min-width: 280px;
  box-shadow: var(--shadow-lg);
  animation: slideIn 0.3s ease;
  pointer-events: all;
  font-size: 0.82rem;
}
.toast.success { border-color: rgba(16,185,129,0.4); }
.toast.warning { border-color: rgba(245,158,11,0.4); }
.toast.error   { border-color: rgba(239,68,68,0.4); }
.toast-icon { font-size: 1.1rem; flex-shrink: 0; }

/* ── Misc Helpers ────────────────────────────────── */
.info-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; border-bottom: 1px solid var(--border);
  font-size: 0.82rem;
}
.info-row:last-child { border-bottom: none; }
.info-label { color: var(--text-muted); }
.info-value { font-weight: 600; text-align: right; }

.section-divider {
  display: flex; align-items: center; gap: 10px;
  color: var(--text-muted); font-size: 0.72rem;
  text-transform: uppercase; letter-spacing: 0.08em;
  margin: 16px 0;
}
.section-divider::before, .section-divider::after {
  content: ''; flex: 1; height: 1px; background: var(--border);
}

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 40px 20px;
  color: var(--text-muted); text-align: center;
}
.empty-state .icon { font-size: 2.5rem; opacity: 0.5; }
.empty-state p { font-size: 0.82rem; }

/* ── Responsive ─────────────────────────────────── */
@media (max-width: 900px) {
  :root { --panel-width: 100vw; }
  .app-body { flex-direction: column; }
  #map-section { height: 45vh; }
  #phase-panel { width: 100%; height: 55vh; }
}
```


# FILE: .\frontend\js\ai-assistant.js
```
/**
 * UtilitySync — AI Assistant
 * Floating chat panel backed by Amazon Bedrock (or mock KB in demo mode).
 */

// ── Local Knowledge Base (Mock Mode) ─────────────────
window.AI_KB = {
  answer(message, context) {
    const q = message.toLowerCase();
    const phase = context ? context.currentPhase : 0;

    // ── Corridor / Layout questions
    if (q.includes('why') && (q.includes('corridor') || q.includes('recommend') || q.includes('layout'))) {
      return `The High Street, Greenway corridor layout recommendation was driven by three factors from the analysis:

**1. Conflict Resolution**: The gas main (MDPE, 180mm) and water main (DI, 300mm) are currently only 150mm apart — below the 300mm NJUG minimum separation. The recommended layout lowers the water main to 1.2m depth, resolving this without disturbing the gas main.

**2. Capacity Reservation**: The corridor currently has no fiber/comms provision. With residential and commercial densification forecast in this area, installing 2 × 110mm HDPE reserved ducts now (£28K) avoids a future standalone installation cost of £185K+.

**3. Future-Proofing for EV**: The Borough's EV charging strategy targets 48 charge points on this road by 2027. A 150mm reserved power duct was recommended to serve these without repeated excavation.

The combined duct investment of £42,000 saves an estimated £238,000 in future standalone project costs.`;
    }

    // ── Equipment / Contractor A questions
    if ((q.includes('equipment') || q.includes('missing')) && (q.includes('buildcore') || q.includes('contractor a') || q.includes('a missing'))) {
      return `BuildCore Infrastructure is missing two critical items for this project:

**1. Horizontal Directional Drilling (HDD) Rig** — Required for the 3 road crossings under the primary carriageway (total 45m). Open-cut is not permitted on A-road sections. BuildCore has no HDD capability at all; all three crossings would need to be fully sub-contracted.

**2. Cable Pulling / Blowing Unit (fiber-rated)** — Required for 96-core fiber installation through the ducted sections. Their existing cable drums are rated to 1,500kg, which is insufficient for the fiber reel weight and the pulling tension needed for a 2.3km cable run.

They also have no City & Guilds certified fiber splicers.

BuildCore could feasibly be used for the footway reinstatement sub-package only, where their NRSWA-qualified civil crew is adequate. However, they should not be awarded the principal contract for this project.`;
    }

    // ── TerraFlow / best contractor questions
    if (q.includes('terraflow') || q.includes('contractor b') || q.includes('best contractor') || q.includes('recommended contractor')) {
      return `TerraFlow Solutions is the recommended contractor with a 94% match score. Here's why:

**Equipment Match**: They own 2 × HDD rigs (Vermeer D23x30), cable-blowing units, 3 × vacuum excavators, and OTDR fiber testing equipment — all owned, not hired.

**Crew Capability**: 6 City & Guilds 3667-certified fiber splicers on their permanent crew, plus 4 IADC-certified HDD operators.

**Relevant Experience**: They completed TfL Cable Route E3 (4.2km fiber) in 2024 and the Canary Wharf HDD river crossings in 2023 — directly comparable to this project's scope.

**Risk Profile**: Their only minor gap is no prior EV charging duct experience, but this is standard civils work presenting no real delivery risk.

The only recommendation is to confirm their NRSWA renewal is progressing and get a confirmed programme before award.`;
    }

    // ── Capacity reuse / fiber questions
    if (q.includes('reuse') || (q.includes('fiber') && q.includes('existing')) || q.includes('duct') || q.includes('reserved capacity')) {
      return `Yes — the Digital Twin shows 2 × 110mm HDPE reserved ducts (Duct 1 and Duct 2) running the full 2.3km corridor, installed in August 2023 and currently completely empty.

**To install fiber using existing reserved capacity:**
- Cable-blowing unit (1 day mobilisation)
- Fiber splicing crew (4 persons, approximately 3 working days)
- No excavation required
- No TTRO, no traffic management, no utility notifications
- No permits required

**Cost: ~£45,000** vs. **£225,000** for a full new installation.
**Programme: ~1 week** vs. **6–8 weeks** for new works.

Reserved Duct 2 remains available for a second operator or as a redundancy path. The reserved power duct (150mm HDPE) is also fully available for EV charging infrastructure when required.`;
    }

    // ── Risk questions
    if (q.includes('risk') || q.includes('danger') || q.includes('safe')) {
      return `The top construction risks for this project are:

**1. HIGH — Gas Main Proximity**: The full 2.3km corridor requires working within 3m of the Cadent Gas intermediate-pressure main. All excavation near the gas main must use vacuum excavation only (no mechanical excavation). Daily gas surveys are mandatory. Emergency gas escape procedures must be in place on site at all times.

**2. HIGH — Unmapped Services**: The corridor contains Victorian-era infrastructure with incomplete asset records. Ground Radar (GPR) survey is mandatory before any trenching begins — estimated 2–3 week lead time.

**3. MEDIUM — HDD Deviation**: Directional drills can deviate on congested sub-surface routes. Bore tracking equipment must be operational throughout all HDD operations. Deviation beyond tolerance requires pull-back and re-drilling (2–5 day delay per crossing).

**4. MEDIUM — Traffic Impact**: Night works constraints on the carriageway significantly extend the construction programme. Any overrun of permitted work windows typically incurs penalty clauses under LA contracts.`;
    }

    // ── TTRO / permits
    if (q.includes('ttro') || q.includes('permit') || q.includes('missing information')) {
      return `There are 3 critical missing items before construction can begin:

**1. TTRO (Traffic Regulation Order)** — A-road sections require a 3-month notice period. This is the critical path item — you need to apply immediately if you want to hit the 3-month programme target.

**2. Ground Radar (GPR) Survey** — Mandatory before any excavation. 2–3 week lead time. Cannot be skipped given the gas main proximity requirement.

**3. Cadent Gas Notification** — Formal 28-day notification to Cadent is required before any works within 3m of their gas main. Given the full corridor is within 3m, this covers the entire project.

The HDD bore plan and fiber route design drawings are also outstanding but can run in parallel with the above.`;
    }

    // ── Digital twin questions
    if (q.includes('twin') || q.includes('digital') || q.includes('record')) {
      return `The Digital Twin for High Street, Greenway contains 8 recorded elements:

- 4 active utility assets (electricity, water, gas, drainage)
- 3 reserved ducts (2 × fiber/comms 110mm HDPE, 1 × power 150mm HDPE)
- 1 expansion zone in the north footway

The twin was built from the corridor analysis conducted today and reflects the as-found condition of the corridor. The Future Capacity Score of **87/100** reflects the high reusability of the reserved ducts.

**Key value**: When the next utility project arrives on this corridor, the planner opens the Digital Twin first to check available capacity before designing any new installation. In today's simulation, the fiber project required £0 in excavation costs because of the reserved ducts installed in 2023.

The twin should be updated after every project with as-built survey data — this is how the corridor asset value compounds over time.`;
    }

    // ── What is UtilitySync
    if (q.includes('what is') || q.includes('utilitysync') || q.includes('how does') || q.includes('explain the system')) {
      return `UtilitySync is an AI-powered underground utility corridor intelligence platform built on AWS.

**Core Idea**: Instead of treating every utility project as an isolated excavation, UtilitySync treats each underground corridor as a continuously managed shared infrastructure asset.

**The five-step workflow:**
1. **Plan** — Create the corridor, map what already exists
2. **Reserve** — Analyze conflicts and reserve future capacity (ducts, zones)
3. **Build** — Generate a construction plan, check contractor readiness
4. **Record** — Maintain a live Digital Twin of what was built
5. **Reuse** — When the next project arrives, check the twin first

**AWS Services used**: Amazon Bedrock (Claude 3.5 Sonnet) for AI reasoning, Strands Agents SDK for the AI agent, Lambda for backend logic, DynamoDB for structured data, S3 + OpenSearch for the technical knowledge base, and Amplify for hosting.`;
    }

    // ── EV / future projects
    if (q.includes('ev') || q.includes('charging') || q.includes('electric vehicle')) {
      return `The Digital Twin shows a **Reserved Power Duct (150mm HDPE)** running the full 2.3km corridor, installed in August 2023. This duct was specifically dimensioned for future EV charging infrastructure.

**Capacity**: The 150mm duct can accommodate up to 185mm² power cable — sufficient for 48 × 22kW on-street EV charge points as targeted in the Borough's EV strategy.

**What's needed to activate it**:
1. UK Power Networks connection agreement (DNO engagement required)
2. Power cable installation through the existing duct (1–2 days)
3. EV charge point civils at each location (separate package)

**No excavation along the corridor is required** — the duct is already in place. Only the final civil works at each charge point location need to be excavated.

Estimated saving vs. installing the power duct standalone: **£81,000**.`;
    }

    // ── Phase-specific defaults
    const phaseDefaults = {
      1: 'I can help you set up your corridor. Try asking: "What information do I need to create a corridor?" or "How do I draw the corridor route on the map?"',
      2: 'The corridor analysis checks for utility conflicts, available capacity, and opportunities to reserve future capacity. Click "Analyze Corridor" to run the full analysis and I\'ll explain what I find.',
      3: 'I\'m ready to help you plan the new utility. Try: "What installation method should I use for fiber?" or "How deep should I lay the cable?"',
      4: 'The construction plan covers everything needed to build the project. Try: "What are the top risks?" or "What permits do I need before construction?"',
      5: 'I can explain why each contractor was rated the way they were. Try: "Why is TerraFlow recommended?" or "What is BuildCore missing?"',
      6: 'The Digital Twin records the full corridor. Try: "Can I reuse existing capacity for fiber?" or "What reserved ducts are available?"',
    };

    // Generic fallback
    return phaseDefaults[phase] || `I'm the UtilitySync AI assistant, powered by Amazon Bedrock. I can answer questions about the corridor analysis, construction plan, contractor recommendations, and the digital twin. What would you like to know?`;
  }
};

// ── Suggestions per phase ────────────────────────────
const PHASE_SUGGESTIONS = {
  1: ['How do I draw the corridor route?', 'What utilities should I include?'],
  2: ['Why is there a conflict?', 'Why reserve ducts now?'],
  3: ['What depth should fiber be laid?', 'Which install method is best?'],
  4: ['What are the top risks?', 'What permits do I need?', 'What equipment is missing from Contractor A?'],
  5: ['Why is TerraFlow recommended?', 'What is BuildCore Infrastructure missing?', 'Can UnitedDig do this project?'],
  6: ['Can I reuse existing capacity for fiber?', 'What are the reserved ducts for?', 'How much would a new EV duct cost?'],
};

// ── AI Assistant UI ──────────────────────────────────
(function() {

  let isOpen = false;

  function init() {
    const toggleBtn = document.getElementById('ai-toggle-btn');
    const closeBtn  = document.getElementById('ai-close-btn');
    const sendBtn   = document.getElementById('ai-send-btn');
    const input     = document.getElementById('ai-input');
    const panel     = document.getElementById('ai-assistant');

    toggleBtn && toggleBtn.addEventListener('click', () => togglePanel());
    closeBtn  && closeBtn.addEventListener('click',  () => togglePanel(false));
    sendBtn   && sendBtn.addEventListener('click',   sendMessage);
    input     && input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
  }

  function togglePanel(forceState) {
    const panel = document.getElementById('ai-assistant');
    isOpen = forceState !== undefined ? forceState : !isOpen;
    isOpen ? panel.classList.add('open') : panel.classList.remove('open');
  }

  async function sendMessage() {
    const input = document.getElementById('ai-input');
    const msg   = input ? input.value.trim() : '';
    if (!msg) return;

    input.value = '';
    appendMessage('user', msg);
    showTyping();

    const context = {
      currentPhase: AppState.currentPhase,
      corridorId:   AppState.corridor ? AppState.corridor.corridorId : null,
      projectId:    AppState.project  ? AppState.project.projectId  : null,
    };

    try {
      const res = await API.chat(msg, context);
      hideTyping();
      appendMessage('ai', res.response);
      updateSuggestions();
    } catch (err) {
      hideTyping();
      appendMessage('ai', 'Sorry, I couldn\'t process that request. Please try again.');
    }
  }

  function appendMessage(role, text) {
    const container = document.getElementById('ai-messages');
    if (!container) return;

    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    const div = document.createElement('div');
    div.className = `ai-msg ${role}`;
    if (role === 'ai') {
      div.innerHTML = `
        <div class="ai-msg-avatar">🤖</div>
        <div class="ai-msg-bubble">${formatted}</div>`;
    } else {
      div.innerHTML = `
        <div class="ai-msg-bubble">${formatted}</div>
        <div class="ai-msg-user-avatar">👤</div>`;
    }
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  let typingEl = null;
  function showTyping() {
    const container = document.getElementById('ai-messages');
    if (!container) return;
    typingEl = document.createElement('div');
    typingEl.className = 'ai-msg';
    typingEl.innerHTML = `
      <div class="ai-msg-avatar">🤖</div>
      <div class="ai-msg-bubble">
        <div class="ai-typing">
          <span></span><span></span><span></span>
        </div>
      </div>`;
    container.appendChild(typingEl);
    container.scrollTop = container.scrollHeight;
  }

  function hideTyping() {
    typingEl && typingEl.remove();
    typingEl = null;
  }

  function updateSuggestions() {
    setAISuggestions(AppState.currentPhase);
  }

  window.setAISuggestions = function(phase) {
    const container = document.getElementById('ai-suggestions');
    if (!container) return;
    const suggestions = PHASE_SUGGESTIONS[phase] || [];
    container.innerHTML = suggestions.map(s => `
      <div class="ai-suggestion" onclick="document.getElementById('ai-input').value='${s}';document.getElementById('ai-send-btn').click()">
        ${s}
      </div>`).join('');
  };

  window.initAIWelcome = function() {
    appendMessage('ai', 'Hi! I\'m the UtilitySync AI, powered by **Amazon Bedrock**. I can explain corridor recommendations, answer questions about construction plans, and help you understand contractor match results.\n\nTry asking: *"Why did you recommend this corridor layout?"* or click a suggestion below.');
    updateSuggestions();
    // Auto-open after a brief delay for wow factor
    setTimeout(() => togglePanel(true), 800);
  };

  document.addEventListener('DOMContentLoaded', init);

})();
```


# FILE: .\frontend\js\api.js
```
/**
 * UtilitySync — API Client
 * Wraps all backend calls with mock fallback.
 */

window.API = {
  async _call(method, path, body) {
    const cfg = window.US_CONFIG;
    if (cfg.USE_MOCK_API) {
      // Simulate network latency for realism
      await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
      return null; // Mock callers bypass this and return mock data directly
    }
    const url = `${cfg.API_BASE_URL}${path}`;
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  async createCorridor(data) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 800));
      const mock = { ...window.US_MOCK.createCorridor };
      mock.name = data.name || mock.name;
      mock.location = data.location || mock.location;
      mock.lengthKm = data.lengthKm || mock.lengthKm;
      mock.widthM = data.widthM || mock.widthM;
      if (data.route && data.route.length > 1) mock.route = data.route;
      return mock;
    }
    return this._call('POST', '/corridors', data);
  },

  async analyzeCoridor(corridorId) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 2200)); // Simulate analysis time
      return { ...window.US_MOCK.analyzeCorridorResult };
    }
    return this._call('POST', `/corridors/${corridorId}/analyze`);
  },

  async createProject(data) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 600));
      return { ...window.US_MOCK.createProject, ...data };
    }
    return this._call('POST', '/projects', data);
  },

  async getConstructionPlan(projectId) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 1800));
      return { ...window.US_MOCK.constructionPlan };
    }
    return this._call('GET', `/projects/${projectId}/construction-plan`);
  },

  async matchContractors(projectId) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 1200));
      return { ...window.US_MOCK.contractorMatch };
    }
    return this._call('GET', `/contractors/match/${projectId}`);
  },

  async getDigitalTwin(corridorId) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 700));
      return { ...window.US_MOCK.digitalTwin };
    }
    return this._call('GET', `/digital-twin/${corridorId}`);
  },

  async simulateFutureProject(corridorId, futureUtilityType, requiredLengthM) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 1500));
      const simMap = {
        fiber: window.US_MOCK.simulateFiber,
        ev_charging: window.US_MOCK.simulateEV,
        water: window.US_MOCK.simulateNewWater,
      };
      return simMap[futureUtilityType] || window.US_MOCK.simulateFiber;
    }
    return this._call('POST', `/digital-twin/${corridorId}/simulate`, {
      futureUtilityType, requiredLengthM
    });
  },

  async chat(message, context) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 1200 + Math.random() * 600));
      return { response: window.AI_KB.answer(message, context) };
    }
    return this._call('POST', '/agent/chat', { message, context });
  }
};
```


# FILE: .\frontend\js\app.js
```
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
```


# FILE: .\frontend\js\config.js
```
/**
 * UtilitySync — Configuration
 * Switch USE_MOCK_API to false and set API_BASE_URL after deploying the backend.
 */
window.US_CONFIG = {
  // Set to false when AWS backend is deployed
  USE_MOCK_API: true,

  // API Gateway URL — update after `sam deploy`
  API_BASE_URL: 'https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod',

  // AWS Region
  AWS_REGION: 'us-east-1',

  // Demo corridor ID (used when loading demo data)
  DEMO_CORRIDOR_ID: 'corr-001',

  // Map defaults — centered on demo corridor (London SE1)
  MAP_CENTER: [51.4996, -0.1065],
  MAP_ZOOM: 15,

  // Feature flags
  ENABLE_DRAW_MODE: true,
  ENABLE_STREAMING_AI: false,  // Set true when SSE streaming is ready
};
```


# FILE: .\frontend\js\map.js
```
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
```
