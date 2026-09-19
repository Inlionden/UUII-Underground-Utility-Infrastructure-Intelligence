/**
 * UtilitySync — API Client
 * Wraps all backend calls with a development persistence fallback.
 */

window.API = {
  async _call(method, path, body) {
    const cfg = window.US_CONFIG;
    if (cfg.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 120));
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
      await new Promise(r => setTimeout(r, 250));
      return window.US_DATA.createCorridor(data);
    }
    return this._call('POST', '/corridors', data);
  },

  async listCorridors() {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 100));
      const corridors = window.US_DATA.listCorridors();
      return { corridors, count: corridors.length };
    }
    return this._call('GET', '/corridors');
  },

  async getCorridor(corridorId) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 100));
      return window.US_DATA.getCorridor(corridorId);
    }
    return this._call('GET', `/corridors/${corridorId}`);
  },

  async updateCorridor(corridorId, data) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 150));
      return window.US_DATA.updateCorridor(corridorId, data);
    }
    return this._call('PUT', `/corridors/${corridorId}`, data);
  },

  async deleteCorridor(corridorId) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 120));
      return window.US_DATA.deleteCorridor(corridorId);
    }
    return this._call('DELETE', `/corridors/${corridorId}`);
  },

  async listUtilities(corridorId) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 100));
      const utilities = window.US_DATA.listUtilities(corridorId);
      return { utilities, count: utilities.length };
    }
    return this._call('GET', corridorId ? `/corridors/${corridorId}/utilities` : '/utilities');
  },

  async getUtility(utilityId) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 80));
      return window.US_DATA.getUtility(utilityId);
    }
    return this._call('GET', `/utilities/${utilityId}`);
  },

  async createUtility(corridorId, data) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 180));
      return window.US_DATA.createUtility({ ...data, corridorId });
    }
    return this._call('POST', `/corridors/${corridorId}/utilities`, data);
  },

  async updateUtility(utilityId, data) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 160));
      return window.US_DATA.updateUtility(utilityId, data);
    }
    return this._call('PUT', `/utilities/${utilityId}`, data);
  },

  async deleteUtility(utilityId) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 120));
      return window.US_DATA.deleteUtility(utilityId);
    }
    return this._call('DELETE', `/utilities/${utilityId}`);
  },

  async analyzeCoridor(corridorId) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 650));
      return window.US_DATA.analyzeCorridor(corridorId);
    }
    return this._call('POST', `/corridors/${corridorId}/analyze`);
  },

  async createProject(data) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 600));
      return window.US_DATA.createProject(data);
    }
    return this._call('POST', '/projects', data);
  },

  async updateProject(projectId, data) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 180));
      return window.US_DATA.updateProject(projectId, data);
    }
    return this._call('PUT', `/projects/${projectId}`, data);
  },

  async completeProject(projectId) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 220));
      return window.US_DATA.completeProject(projectId);
    }
    return this._call('POST', `/projects/${projectId}/complete`);
  },

  async getConstructionPlan(projectId) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 1800));
      return window.US_DATA.getConstructionPlan(projectId);
    }
    return this._call('GET', `/projects/${projectId}/construction-plan`);
  },

  async matchContractors(projectId) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 1200));
      return window.US_DATA.matchContractors(projectId);
    }
    return this._call('GET', `/contractors/match/${projectId}`);
  },

  async listContractors() {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 100));
      const contractors = window.US_DATA.listContractors();
      return { contractors, count: contractors.length };
    }
    return this._call('GET', '/contractors');
  },

  async getContractor(contractorId) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 80));
      return window.US_DATA.getContractor(contractorId);
    }
    return this._call('GET', `/contractors/${contractorId}`);
  },

  async createContractor(data) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 180));
      return window.US_DATA.createContractor(data);
    }
    return this._call('POST', '/contractors', data);
  },

  async updateContractor(contractorId, data) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 160));
      return window.US_DATA.updateContractor(contractorId, data);
    }
    return this._call('PUT', `/contractors/${contractorId}`, data);
  },

  async deleteContractor(contractorId) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 120));
      return window.US_DATA.deleteContractor(contractorId);
    }
    return this._call('DELETE', `/contractors/${contractorId}`);
  },

  async getDigitalTwin(corridorId) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 700));
      return window.US_DATA.getDigitalTwin(corridorId);
    }
    return this._call('GET', `/digital-twin/${corridorId}`);
  },

  async simulateFutureProject(corridorId, futureUtilityType, requiredLengthM) {
    if (window.US_CONFIG.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 1500));
      return window.US_DATA.simulateFutureProject(corridorId, futureUtilityType, requiredLengthM);
    }
    return this._call('POST', `/digital-twin/${corridorId}/simulate`, {
      futureUtilityType, requiredLengthM
    });
  },

  async chat(message, context) {
    if (window.US_CONFIG.USE_MOCK_API || window.US_CONFIG.AI_PROVIDER === 'local') {
      await new Promise(r => setTimeout(r, 1200 + Math.random() * 600));
      return { response: window.AI_KB.answer(message, context) };
    }
    return this._call('POST', '/agent/chat', { message, context });
  }
};
