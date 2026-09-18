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
