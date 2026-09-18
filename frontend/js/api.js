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
