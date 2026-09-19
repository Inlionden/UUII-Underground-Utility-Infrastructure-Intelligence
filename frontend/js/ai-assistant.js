/**
 * UtilitySync assistant panel.
 * In local mode this only explains deterministic UtilitySync results.
 */
window.US_AGENTS = {
  infrastructureAnalysis(projectId) {
    const project = window.US_DATA.getProject(projectId);
    const corridor = window.US_DATA.getCorridor(project.corridorId);
    const analysis = window.US_DATA.analyzeCorridor(corridor.corridorId);
    const twin = window.US_DATA.getDigitalTwin(corridor.corridorId);
    const alerts = window.US_DATA.listAlerts().filter(a => a.projectId === project.projectId || a.corridorId === corridor.corridorId);
    return `**Infrastructure Analysis Agent**\nProject: ${project.name}\nCorridor: ${corridor.name}\nRoute length: ${corridor.lengthM.toLocaleString('en-IN')} m\nConflicts: ${analysis.conflicts.length}\nTwin assets: ${twin.totalElements}\n\n${alerts.length ? alerts.map(a => `- ${a.category}: ${a.explanation}`).join('\n') : '- No blocking deterministic alerts for this project/corridor.'}`;
  },

  contractor(projectId) {
    const result = window.US_DATA.matchContractors(projectId);
    return `**Contractor Agent**\nRequirements checked: ${result.projectRequirements.join(', ')}\n\n${result.contractors.slice(0, 5).map(c => `- ${c.name}: ${c.verdict} (${c.matchScore}%). ${c.missingRequirements.length ? `Missing ${c.missingRequirements.join(', ')}` : 'All mandatory checks met'}. Workers ${c.workforceAvailability.availableWorkers}/${c.workforceAvailability.requiredWorkers}.`).join('\n')}`;
  },

  resolution() {
    const alert = window.US_DATA.listAlerts()[0];
    if (!alert) return '**Resolution Agent**\nNo active alert is available to resolve.';
    return `**Resolution Agent**\nAlert: ${alert.category}\nCondition: ${alert.explanation}\nRecommended data change: ${alert.recommendedAction}\n\nI will not modify the record without confirmation. After the underlying route, depth, capacity, dependency, reservation, or contractor data changes, rerun analysis and the alert will disappear only if the deterministic condition is valid.`;
  }
};

window.AI_KB = {
  answer(message, context = {}) {
    const q = String(message || '').toLowerCase();
    const phase = context.currentPhase || 0;
    const db = window.US_DATA.read();
    const corridor = context.corridorId
      ? window.US_DATA.getCorridor(context.corridorId)
      : window.US_DATA.getCorridor(window.US_CONFIG.DEFAULT_CORRIDOR_ID);
    const project = context.projectId
      ? window.US_DATA.getProject(context.projectId)
      : window.US_DATA.listProjects().find(p => p.corridorId === corridor.corridorId) || window.US_DATA.listProjects()[0];
    const alerts = window.US_DATA.listAlerts();

    if (q.includes('agent') && (q.includes('contractor') || q.includes('find available'))) {
      return window.US_AGENTS.contractor((project || {}).projectId);
    }

    if (q.includes('agent') && (q.includes('resolve') || q.includes('fix'))) {
      return window.US_AGENTS.resolution();
    }

    if (q.includes('agent') || q.includes('cannot proceed') || q.includes('why is this project blocked') || q.includes('blocked')) {
      return window.US_AGENTS.infrastructureAnalysis((project || {}).projectId);
    }

    if ((q.includes('fix') || q.includes('resolve') || q.includes('how can i')) && alerts.length) {
      const selected = alerts.find(a => context.projectId && a.projectId === context.projectId) || alerts[0];
      return `**Alert Resolution Assistant**\n${selected.category}: ${selected.explanation}\n\nActual: ${selected.actualValue}\nRequired: ${selected.requiredValue}\n\nPossible data changes:\n- ${selected.recommendedAction}\n- Update the underlying asset/project/contractor record, then rerun analysis.\n- The alert state is not manually dismissed; it disappears only when the deterministic rule is satisfied.`;
    }

    if (q.includes('alert') || q.includes('risk') || q.includes('conflict')) {
      if (!alerts.length) return 'No active deterministic alerts are currently generated from the saved data.';
      return alerts.map(a => `**${a.severity} - ${a.category}**\n${a.corridor}${a.project ? ` / ${a.project}` : ''}: ${a.explanation}\nActual: ${a.actualValue}. Required: ${a.requiredValue}.\nAction: ${a.recommendedAction}`).join('\n\n');
    }

    if (q.includes('contractor') || q.includes('eligible') || q.includes('score') || q.includes('missing')) {
      const result = window.US_DATA.matchContractors((project || {}).projectId);
      return result.contractors.slice(0, 4).map(c => `**${c.name}: ${c.verdict} (${c.matchScore}%)**\n${c.narrative}\nMissing: ${c.missingRequirements.length ? c.missingRequirements.join(', ') : 'none'}.\nWorkers: ${c.workforceAvailability.availableWorkers} available / ${c.workforceAvailability.requiredWorkers} required.`).join('\n\n');
    }

    if (q.includes('plan') || q.includes('sequence') || q.includes('installation') || q.includes('dependencies')) {
      const plan = window.US_DATA.getConstructionPlan((project || {}).projectId);
      return `**Project Planning Assistant**\n${project.name}\nLength: ${plan.summary.totalLength}\nMethod: ${plan.summary.installMethods}\nDuration: ${plan.summary.estimatedDuration}\nCost: ${plan.summary.estimatedCost}\n\nSequence:\n${plan.installationSequence.map(step => `${step.step}. ${step.title} - ${step.detail}`).join('\n')}\n\nPlanner checks:\n${plan.missingInformation.map(item => `- ${item.item}: ${item.detail}`).join('\n')}`;
    }

    if (q.includes('length') || q.includes('route') || q.includes('distance')) {
      return `The saved route geometry for **${corridor.name}** is the source of truth. Its length is **${corridor.lengthM.toLocaleString('en-IN')} m (${corridor.lengthKm} km)**, calculated from the route coordinates. Project length, construction plan length, costs, and digital twin simulations use that value.`;
    }

    if (q.includes('twin') || q.includes('capacity') || q.includes('duct') || q.includes('reuse')) {
      const twin = window.US_DATA.getDigitalTwin(corridor.corridorId);
      const available = (twin.summary.allAvailable || []).map(a => a.label).join(', ') || 'none';
      return `The digital twin for **${twin.corridorName}** has ${twin.totalElements} elements, ${twin.summary.reservedDucts} reserved duct(s), and ${twin.summary.expansionZones} expansion zone(s). Available reusable capacity: ${available}. Completed projects are represented in the same twin path as existing and planned assets.`;
    }

    if (q.includes('corridor') || q.includes('bengaluru') || q.includes('dataset')) {
      const combos = db.corridors.map(c => {
        const utilities = db.utilities.filter(u => u.corridorId === c.corridorId).map(u => `${u.type}:${u.status}`).join(', ');
        return `**${c.name}** - ${utilities}`;
      }).join('\n');
      return `UtilitySync is loaded with ${db.corridors.length} Bengaluru corridors and ${db.projects.length} projects. Utility combinations vary by corridor:\n${combos}`;
    }

    if (q.includes('knowledge') || q.includes('rag') || q.includes('standard') || q.includes('method')) {
      return '**Knowledge/RAG Assistant**\nLocal mode can explain the bundled knowledge documents for utility installation standards, trenchless methods, and contractor equipment. AWS mode can connect the same question path to S3, OpenSearch, and Bedrock Knowledge Base when `AI_PROVIDER=aws` and `AWS_ENABLED=true`.';
    }

    const defaults = {
      1: 'Draw or load a Bengaluru route first. The app calculates corridor length from that route and saves it with the corridor.',
      2: 'Analysis is deterministic: it checks separation rules, capacity thresholds, and reserved capacity from the saved utility records.',
      3: 'Project length is read from the selected corridor geometry, then used for requirements, plan duration, cost, and digital twin simulation.',
      4: 'The construction plan is deterministic: equipment, crews, costs, sequence, and risks are derived from saved project and alert data.',
      5: 'Contractor matching applies mandatory eligibility first. A high score cannot override missing equipment, certification, method, experience, workforce, crews, or available equipment.',
      6: 'The digital twin is the existing UtilitySync twin representation. Completed projects become as-built assets, and reserved/future capacity stays visible.'
    };
    return defaults[phase] || 'Ask about Bengaluru corridors, alerts, route length, contractor eligibility, construction planning, local agents, knowledge/RAG, or digital twin capacity. I will explain the deterministic records and rule outputs.';
  }
};

const PHASE_SUGGESTIONS = {
  1: ['How is route length calculated?', 'What is in the Bengaluru dataset?'],
  2: ['Show active alerts', 'Why is there a conflict?'],
  3: ['Which length is used?', 'What requirements will this project create?'],
  4: ['What are the top risks?', 'What deterministic inputs drive the plan?'],
  5: ['Which contractors are eligible?', 'What mandatory checks failed?'],
  6: ['What capacity can I reuse?', 'How does a completed project update the twin?'],
};

(function() {
  let isOpen = false;

  function init() {
    const toggleBtn = document.getElementById('ai-toggle-btn');
    const closeBtn  = document.getElementById('ai-close-btn');
    const sendBtn   = document.getElementById('ai-send-btn');
    const input     = document.getElementById('ai-input');

    toggleBtn && toggleBtn.addEventListener('click', () => togglePanel());
    closeBtn  && closeBtn.addEventListener('click', () => togglePanel(false));
    sendBtn   && sendBtn.addEventListener('click', sendMessage);
    input     && input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  function togglePanel(forceState) {
    const panel = document.getElementById('ai-assistant');
    isOpen = forceState !== undefined ? forceState : !isOpen;
    panel && panel.classList.toggle('open', isOpen);
  }

  async function sendMessage() {
    const input = document.getElementById('ai-input');
    const msg = input ? input.value.trim() : '';
    if (!msg) return;

    input.value = '';
    appendMessage('user', msg);
    showTyping();

    const context = {
      currentPhase: AppState.currentPhase,
      corridorId: AppState.corridor ? AppState.corridor.corridorId : null,
      projectId: AppState.project ? AppState.project.projectId : null,
    };

    try {
      const res = await API.chat(msg, context);
      hideTyping();
      appendMessage('ai', res.response);
      updateSuggestions();
    } catch (err) {
      hideTyping();
      appendMessage('ai', 'Sorry, I could not process that request. Please try again.');
    }
  }

  function appendMessage(role, text) {
    const container = document.getElementById('ai-messages');
    if (!container) return;

    const formatted = String(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    const div = document.createElement('div');
    div.className = `ai-msg ${role}`;
    div.innerHTML = role === 'ai'
      ? `<div class="ai-msg-avatar">AI</div><div class="ai-msg-bubble">${formatted}</div>`
      : `<div class="ai-msg-bubble">${formatted}</div><div class="ai-msg-user-avatar">You</div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  let typingEl = null;
  function showTyping() {
    const container = document.getElementById('ai-messages');
    if (!container) return;
    typingEl = document.createElement('div');
    typingEl.className = 'ai-msg';
    typingEl.innerHTML = '<div class="ai-msg-avatar">AI</div><div class="ai-msg-bubble"><div class="ai-typing"><span></span><span></span><span></span></div></div>';
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

  window.initAIWelcome = function(options = {}) {
    const container = document.getElementById('ai-messages');
    if (container && container.children.length === 0) {
      appendMessage('ai', 'Hi. I can explain the deterministic Bengaluru corridor data, alerts, contractor eligibility, construction plans, and digital twin capacity. I do not seed data or make rule decisions.');
    }
    updateSuggestions();
    if (options.open !== false) setTimeout(() => togglePanel(true), 120);
  };

  window.openAIAssistant = function() {
    window.initAIWelcome({ open: false });
    togglePanel(true);
  };

  document.addEventListener('DOMContentLoaded', init);
})();
