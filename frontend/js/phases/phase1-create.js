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
