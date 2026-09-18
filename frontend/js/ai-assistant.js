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
