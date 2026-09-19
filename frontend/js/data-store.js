/**
 * UtilitySync - Bengaluru persistence store.
 * This is the real local source of truth used by the normal app in mock mode.
 */
window.US_DATA = (() => {
  const STORAGE_KEY = 'utilitysync.bengaluru.v1';
  const RESET_TOKEN_KEY = 'utilitysync.reset.token';
  const LEGACY_KEYS = ['utilitysync.devdb.v1', 'utilitysync.devdb.v2', 'utilitysync.devdb.v3', STORAGE_KEY];
  const SEED_TIME = '2026-09-19T00:00:00+05:30';
  const TODAY = '2026-09';
  const clone = value => JSON.parse(JSON.stringify(value));
  const norm = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const title = value => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
  const mLabel = value => `${Math.round(Number(value || 0)).toLocaleString('en-IN')} m`;
  const BENGALURU_BOUNDS = { minLat: 12.75, maxLat: 13.15, minLng: 77.45, maxLng: 77.85 };

  const MIN_SEPARATION_M = {
    'electricity:fiber': 0.10,
    'electricity:gas': 0.50,
    'electricity:water': 0.25,
    'fiber:gas': 0.25,
    'fiber:water': 0.10,
    'gas:water': 0.30,
    'drainage:water': 0.25,
    'drainage:fiber': 0.25,
    'drainage:electricity': 0.30
  };

  const SEED = {
    version: 1,
    corridors: [
      { corridorId: 'corr-wfd-itpl', name: 'Whitefield / ITPL Corridor', location: 'KR Puram - Hoodi - ITPL Main Road, Bengaluru', widthM: 24, status: 'ACTIVE', roadType: 'ARTERIAL', center: [12.9912, 77.7065], route: [[12.9961,77.6837],[12.9978,77.6958],[12.9924,77.7055],[12.9879,77.7147],[12.9825,77.7281]], notes: 'Technology and metro feeder corridor.' },
      { corridorId: 'corr-orr-marathahalli', name: 'Outer Ring Road / Marathahalli Tech Belt', location: 'Doddanekundi - Marathahalli - Kadubeesanahalli - Bellandur ORR', widthM: 32, status: 'ACTIVE', roadType: 'URBAN_EXPRESSWAY', center: [12.9399, 77.6934], route: [[12.9562,77.7010],[12.9507,77.6996],[12.9386,77.6956],[12.9250,77.6815]], notes: 'Congested multi-utility arterial.' },
      { corridorId: 'corr-ecity', name: 'Electronic City Utility Spine', location: 'Electronic City Phase 1 - Neeladri Road - Hosur Road link', widthM: 26, status: 'ACTIVE', roadType: 'ARTERIAL', center: [12.8396, 77.6741], route: [[12.8452,77.6604],[12.8424,77.6683],[12.8399,77.6774],[12.8330,77.6820]], notes: 'Industrial and data-centre growth corridor.' },
      { corridorId: 'corr-bellandur-sarjapur', name: 'Bellandur / Sarjapur Road Corridor', location: 'Bellandur lake edge - Iblur - Sarjapur Road', widthM: 22, status: 'ACTIVE', roadType: 'ARTERIAL', center: [12.9192, 77.6901], route: [[12.9293,77.6763],[12.9216,77.6849],[12.9145,77.6941],[12.9081,77.7042]], notes: 'Lake-buffer constraints and broadband demand.' },
      { corridorId: 'corr-central-mg-cubbon', name: 'Central Bengaluru / MG Road / Cubbon Axis', location: 'Cubbon Park - MG Road - Trinity Circle', widthM: 28, status: 'ACTIVE', roadType: 'CBD', center: [12.9769, 77.6189], route: [[12.9755,77.6050],[12.9758,77.6172],[12.9784,77.6325]], notes: 'Central corridor with completed water rehabilitation.' }
    ],
    utilities: [
      util('util-wfd-bescom-11kv','corr-wfd-itpl','electricity','BESCOM 11kV Feeder Pair','BESCOM','EXISTING',1.05,-4.2,71,{ voltage:'11kV', cableType:'XLPE armoured' }),
      util('util-wfd-bwssb-water','corr-wfd-itpl','water','BWSSB Distribution Main 300mm','BWSSB','EXISTING',1.25,-1.4,64,{ material:'Ductile iron', diameter:'300mm' }),
      util('util-wfd-fiber-completed','corr-wfd-itpl','fiber','ITPL Redundant OFC Ring','Bengaluru Fiber Grid','COMPLETED',0.75,3.6,52,{ cores:'144-core SMF', duct:'2 x 110mm HDPE' }),
      util('util-orr-gail-gas','corr-orr-marathahalli','gas','GAIL City Gas MDPE Main','GAIL Gas Bengaluru','EXISTING',0.82,-0.92,54,{ material:'MDPE', diameter:'180mm' }),
      util('util-orr-bwssb-water','corr-orr-marathahalli','water','BWSSB Water Trunk Main 450mm','BWSSB','EXISTING',0.97,-0.74,68,{ material:'MS lined', diameter:'450mm' }),
      util('util-orr-fiber-planned','corr-orr-marathahalli','fiber','ORR Smart Mobility Fiber Duct','BBMP Smart Mobility Cell','PLANNED',0.65,4.4,0,{ cores:'288-core planned', duct:'3 x 110mm HDPE' }),
      util('util-orr-drain-existing','corr-orr-marathahalli','drainage','ORR Storm Water Drain 900mm','BBMP SWD','EXISTING',1.95,5.2,59,{ material:'RCC', diameter:'900mm' }),
      util('util-ecity-bescom-inprogress','corr-ecity','electricity','BESCOM 33kV Data Centre Feeder','BESCOM','IN_PROGRESS',1.15,-3.8,46,{ voltage:'33kV', phase:'EC-PWR-02' }),
      util('util-ecity-fiber-existing','corr-ecity','fiber','Electronics City OFC Backbone','ELCITA Fiber Operations','EXISTING',0.70,2.9,63,{ cores:'96-core SMF', duct:'110mm HDPE' }),
      util('util-ecity-water-future','corr-ecity','water','Future Industrial Water Main','BWSSB','FUTURE',1.35,5.1,0,{ material:'DI proposed', diameter:'250mm' }),
      util('util-bell-fiber-existing','corr-bellandur-sarjapur','fiber','Sarjapur Broadband Duct Bank','Bengaluru Fiber Grid','EXISTING',0.68,2.6,94,{ duct:'2 x 110mm HDPE', occupiedSubducts:'15 of 16' }),
      util('util-bell-drain-existing','corr-bellandur-sarjapur','drainage','Lake Edge Storm Drain','BBMP SWD','EXISTING',1.85,-4.0,76,{ material:'RCC', diameter:'1200mm' }),
      util('util-bell-water-future','corr-bellandur-sarjapur','water','Future Reuse Water Spur','BWSSB','FUTURE',1.20,-1.2,0,{ material:'HDPE proposed', diameter:'200mm' }),
      util('util-central-water-completed','corr-central-mg-cubbon','water','MG Road Rehabilitated Water Main','BWSSB','COMPLETED',1.30,-2.1,48,{ material:'DI K9', diameter:'300mm' }),
      util('util-central-bescom-existing','corr-central-mg-cubbon','electricity','BESCOM CBD Ring Main','BESCOM','EXISTING',1.00,3.2,77,{ voltage:'11kV', cableType:'XLPE armoured' }),
      util('util-central-drain-existing','corr-central-mg-cubbon','drainage','CBD Combined Drain 750mm','BBMP SWD','EXISTING',1.75,5.4,58,{ material:'RCC', diameter:'750mm' })
    ],
    reservedAssets: [
      reserve('asset-wfd-res-fiber-2','corr-wfd-itpl','reserved_duct','Whitefield Spare OFC Duct','fiber',0.72,4.6,'Full route available for a second fiber operator.'),
      reserve('asset-ecity-res-power','corr-ecity','reserved_duct','Electronic City Reserved Power Duct','electricity',1.05,-5.0,'Reserved for a future 11kV redundancy cable.'),
      reserve('asset-bell-power-reserve','corr-bellandur-sarjapur','reserved_duct','Bellandur Future Power Reserve Duct','electricity',0.95,4.8,'Reserved for a future BESCOM feeder; not released for EV charging.'),
      reserve('asset-bell-expansion-zone','corr-bellandur-sarjapur','expansion_zone','Lake Buffer Expansion Zone','water',0.50,-5.8,'Available only after environmental clearance.'),
      reserve('asset-central-comms-reserve','corr-central-mg-cubbon','reserved_duct','MG Road Smart Poles Comms Duct','fiber',0.65,-4.7,'Available for smart-city low-voltage comms.')
    ],
    projects: [
      project('proj-wfd-fiber-ring','Whitefield Redundant Fiber Ring Completion','corr-wfd-itpl','fiber','existing_duct','READY','144-core SMF',0.72,'3m',req([{category:'cable_blowing',name:'Cable blowing unit',qty:1},{category:'fiber_testing',name:'OTDR fiber tester',qty:1}],['BBMP Road Cutting Permit','OFC Splicing Certification'],['existing_duct'],['fiber'],12,[['fiber_splicer',3],['civil',4]])),
      project('proj-orr-fiber-hdd','ORR Smart Mobility Fiber HDD Package','corr-orr-marathahalli','fiber','hdd','PLANNING','288-core SMF in 3 x 110mm ducts',0.75,'6m',req([{category:'hdd_rig',name:'HDD rig',qty:1},{category:'cable_blowing',name:'Cable blowing unit',qty:1},{category:'vacuum_excavator',name:'Vacuum excavator',qty:1}],['BBMP Road Cutting Permit','OFC Splicing Certification','HDD Operator Certification','Gas Proximity Work'],['hdd'],['fiber'],24,[['hdd_operator',2],['fiber_splicer',4],['traffic',4]]),{ assignedContractorId:'ctr-namma-civils', roadCrossings:2, constraints:'Two HDD crossings; gas-water conflict band must be potholed first.' }),
      project('proj-ecity-power-upgrade','Electronic City 33kV Feeder Civil Works','corr-ecity','electricity','open_cut','IN_PROGRESS','33kV XLPE',1.15,'3m',req([{category:'excavator',name:'Hydraulic excavator',qty:1},{category:'cable_pulling',name:'HV cable puller',qty:1}],['BESCOM Electrical Works Approval','BBMP Road Cutting Permit'],['open_cut'],['electricity'],18,[['electrician',4],['civil',6]]),{ assignedContractorId:'ctr-gridworks' }),
      project('proj-bell-sewer-relief','Bellandur Lake Edge Storm Drain Relief','corr-bellandur-sarjapur','drainage','open_cut','IN_PROGRESS','1200mm RCC',1.90,'6m',req([{category:'excavator',name:'Hydraulic excavator',qty:2},{category:'pipe_laying',name:'Pipe laying equipment',qty:1},{category:'dewatering',name:'Dewatering pump set',qty:1}],['BBMP Storm Water Drain Approval','Confined Space Entry'],['open_cut'],['drainage'],22,[['civil',10],['safety',2]]),{ assignedContractorId:'ctr-cauvery-utility', dependencies:[{dependencyId:'dep-bell-lake-buffer-noc',name:'Lake-buffer environmental NOC',status:'PENDING',requiredFor:'Deep excavation'},{dependencyId:'dep-bell-traffic-plan',name:'Sarjapur Road traffic diversion plan',status:'APPROVED',requiredFor:'Lane closure'}] }),
      project('proj-bell-ev-duct','Sarjapur Road EV Charging Duct Proposal','corr-bellandur-sarjapur','ev_charging','existing_duct','READY','150mm power duct reuse',0.95,'3m',req([{category:'cable_pulling',name:'Power cable pulling winch',qty:1}],['BESCOM Electrical Works Approval','EVSE Installation Certification'],['existing_duct'],['electricity','ev_charging'],10,[['electrician',4]]),{ requiredReservedAssetId:'asset-bell-power-reserve', constraints:'Proposal tries to consume BESCOM-reserved feeder duct for EV charging.' }),
      project('proj-central-water-rehab','MG Road Water Main Rehabilitation','corr-central-mg-cubbon','water','open_cut','COMPLETED','300mm DI K9',1.30,'completed',req([{category:'pipe_laying',name:'Pipe laying equipment',qty:1}],['BWSSB Water Works Approval','BBMP Road Cutting Permit'],['open_cut'],['water'],16,[['civil',8],['plumber',4]]),{ assignedContractorId:'ctr-cauvery-utility', completedAt:'2026-07-05T18:30:00+05:30' })
    ],
    contractors: [
      contractor('ctr-bengaluru-tunnel','Bengaluru Microtunnel & Utility Services','Peenya, Bengaluru',180,42,['hdd','microtunneling','open_cut','existing_duct'],['fiber','electricity','water','drainage'],[['civil',48,10],['hdd_operator',8,2],['fiber_splicer',10,1],['electrician',12,3],['traffic',14,4],['safety',8,2]],[
        eq('eq-bmt-hdd-01','Vermeer D24x40 HDD Rig','hdd_rig',1,'AVAILABLE'), eq('eq-bmt-hdd-02','Ditch Witch JT20 HDD Rig','hdd_rig',1,'ASSIGNED','proj-airport-utility'), eq('eq-bmt-vac-01','Vacuum Excavator 6000L','vacuum_excavator',2,'AVAILABLE'), eq('eq-bmt-blow-01','Plumettaz Cable Blowing Unit','cable_blowing',2,'AVAILABLE'), eq('eq-bmt-otdr-01','OTDR Test Kit','fiber_testing',3,'AVAILABLE'), eq('eq-bmt-exc-01','8T Hydraulic Excavator','excavator',3,'AVAILABLE')
      ],['BBMP Road Cutting Permit','OFC Splicing Certification','HDD Operator Certification','Gas Proximity Work','BESCOM Electrical Works Approval','Confined Space Entry']),
      contractor('ctr-namma-civils','Namma Civils & Roads Pvt Ltd','Hennur, Bengaluru',110,28,['open_cut','road_reinstatement'],['water','drainage','roadworks'],[['civil',38,8],['traffic',10,4],['safety',5,1],['hdd_operator',0,0],['fiber_splicer',0,0]],[eq('eq-namma-exc-01','5T Hydraulic Excavator','excavator',4,'AVAILABLE'),eq('eq-namma-comp-01','Compactor Plate Set','compaction',6,'AVAILABLE'),eq('eq-namma-tm-01','Traffic Management Vehicle','traffic_management',2,'AVAILABLE')],['BBMP Road Cutting Permit','ISO 9001 Quality']),
      contractor('ctr-techduct-fiber','TechDuct Fiber Infra LLP','Mahadevapura, Bengaluru',72,18,['existing_duct','microtrenching','open_cut'],['fiber','ev_charging'],[['civil',18,4],['fiber_splicer',9,2],['traffic',6,2],['electrician',4,1]],[eq('eq-tech-blow-01','Cable Blowing Unit','cable_blowing',2,'AVAILABLE'),eq('eq-tech-otdr-01','OTDR and Fusion Splicer Kit','fiber_testing',2,'AVAILABLE'),eq('eq-tech-micro-01','Microtrencher','microtrencher',1,'AVAILABLE')],['BBMP Road Cutting Permit','OFC Splicing Certification','EVSE Installation Certification']),
      contractor('ctr-cauvery-utility','Cauvery Utility Constructors','Mysuru Road, Bengaluru',140,64,['open_cut','pipe_bursting'],['water','drainage'],[['civil',52,24],['plumber',14,6],['safety',8,3],['traffic',10,5]],[eq('eq-cauv-exc-01','14T Excavator','excavator',3,'AVAILABLE'),eq('eq-cauv-pipe-01','Pipe Laying Boom and Bedding Set','pipe_laying',2,'AVAILABLE'),eq('eq-cauv-dewater-01','Dewatering Pump Set','dewatering',2,'AVAILABLE'),eq('eq-cauv-vac-01','Vacuum Excavator','vacuum_excavator',1,'AVAILABLE')],['BBMP Storm Water Drain Approval','BWSSB Water Works Approval','BBMP Road Cutting Permit','Confined Space Entry']),
      contractor('ctr-gridworks','GridWorks Energy Infra Pvt Ltd','Electronic City, Bengaluru',96,30,['open_cut','existing_duct'],['electricity','ev_charging'],[['civil',20,5],['electrician',18,6],['traffic',8,2],['safety',6,2]],[eq('eq-grid-cable-01','HV Cable Pulling Winch','cable_pulling',2,'AVAILABLE'),eq('eq-grid-test-01','HV Test Van','electrical_testing',1,'AVAILABLE'),eq('eq-grid-exc-01','3T Excavator','excavator',2,'AVAILABLE')],['BESCOM Electrical Works Approval','EVSE Installation Certification','BBMP Road Cutting Permit'])
    ],
    deleted: { corridors: [], utilities: [], contractors: [] },
    activity: [{ at: SEED_TIME, label: 'Bengaluru dataset loaded', detail: 'Five Bengaluru corridors with deterministic projects, contractors, alerts, and digital twin data.' }]
  };

  function util(utilityId, corridorId, type, label, owner, status, depthM, horizontalOffsetM, capacityPercent, specs) {
    return { utilityId, corridorId, assetType: 'utility', type, label, owner, status, lifecycleState: status, depthM, horizontalOffsetM, capacityPercent, installDate: status === 'FUTURE' || status === 'PLANNED' ? '' : '2026-01-15', specs, notes: '' };
  }

  function reserve(elementId, corridorId, type, label, reservedForUtility, depthM, horizontalOffsetM, availableFutureCapacity) {
    return { elementId, corridorId, type, label, owner: 'BBMP / UtilitySync reserve', depthM, horizontalOffsetM, condition: 'RESERVED', installDate: '2026-02-18', reservedForUtility, reservedFor: `${title(reservedForUtility)} capacity`, capacity: { total: null, used: 0, unit: 'm' }, specs: { material: 'HDPE', diameter: type === 'expansion_zone' ? 'zone' : '110-160mm' }, availableFutureCapacity };
  }

  function req(equipment, certifications, methods, utilityExperience, minWorkers, crewPairs) {
    return { equipment, certifications, methods, utilityExperience, minWorkers, crewTypes: crewPairs.map(([type, count]) => ({ type, count })) };
  }

  function project(projectId, name, corridorId, utilityType, installMethod, status, pipeSize, targetDepthM, timeline, requirements, extra = {}) {
    return { projectId, name, corridorId, utilityType, installMethod, status, targetDepthM, pipeSize, bends: 4, roadCrossings: 1, timeline, constraints: '', requirements, createdAt: '2026-09-08T09:00:00+05:30', ...extra };
  }

  function eq(equipmentId, name, category, count, status, assignedProjectId = '') {
    return { equipmentId, name, category, count, owned: true, status, assignedProjectId, capabilities: [category] };
  }

  function contractor(contractorId, name, location, totalWorkers, workersAssigned, methods, utilityExperience, crews, equipment, certNames) {
    return {
      contractorId, name, location, established: 2015, employees: totalWorkers, totalWorkers, workersAssigned, methods, utilityExperience,
      crewTypes: crews.map(([type, count, assigned]) => ({ type, count, assigned })),
      equipment,
      certifications: certNames.map(name => ({ name, status: 'VALID', expiry: '2027-06' })),
      currentProjectAssignments: workersAssigned ? [{ projectId: 'active-package', workersAssigned, crewsAssigned: 2, equipmentIds: [] }] : [],
      previousProjects: [`${location} utility works (2025)`],
      gaps: []
    };
  }

  function applyResetToken() {
    try {
      const token = window.US_RESET_TOKEN || 'bundled-bengaluru-v1';
      if (localStorage.getItem(RESET_TOKEN_KEY) !== token) {
        LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
        localStorage.setItem(RESET_TOKEN_KEY, token);
      }
    } catch (err) {
      console.warn('Unable to apply UtilitySync reset token', err);
    }
  }

  function routeLengthM(route = []) {
    let total = 0;
    for (let i = 1; i < route.length; i++) total += haversine(route[i - 1], route[i]);
    return Math.round(total);
  }

  function isInsideBengaluru(point) {
    const lat = Number(point && point[0]);
    const lng = Number(point && point[1]);
    return lat >= BENGALURU_BOUNDS.minLat && lat <= BENGALURU_BOUNDS.maxLat
      && lng >= BENGALURU_BOUNDS.minLng && lng <= BENGALURU_BOUNDS.maxLng;
  }

  function assertBengaluruRoute(route) {
    if (!route.every(isInsideBengaluru)) {
      throw new Error('Corridor route must stay within the Bengaluru working region');
    }
  }

  function bengaluruLocation(value) {
    const text = String(value || '').trim();
    if (!text) return 'Bengaluru, Karnataka';
    return /bengaluru|bangalore|karnataka/i.test(text) ? text : `${text}, Bengaluru`;
  }

  function haversine(a, b) {
    const R = 6371000;
    const toRad = deg => Number(deg) * Math.PI / 180;
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);
    const dLat = toRad(b[0] - a[0]);
    const dLng = toRad(b[1] - a[1]);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  function withDerived(db) {
    db.corridors.forEach(c => {
      c.createdAt = c.createdAt || '2026-09-01T09:00:00+05:30';
      c.updatedAt = c.updatedAt || SEED_TIME;
      c.lengthM = routeLengthM(c.route || []);
      c.lengthKm = Number((c.lengthM / 1000).toFixed(2));
      c.center = c.route && c.route.length ? c.route[Math.floor(c.route.length / 2)] : c.center;
    });
    db.utilities.forEach(u => {
      const c = db.corridors.find(item => item.corridorId === u.corridorId);
      if (c) {
        u.lengthM = c.lengthM;
        u.specs = { ...(u.specs || {}), routeLength: mLabel(c.lengthM) };
      }
    });
    db.reservedAssets.forEach(asset => {
      const c = db.corridors.find(item => item.corridorId === asset.corridorId);
      if (c) {
        asset.lengthM = c.lengthM;
        asset.capacity = { ...(asset.capacity || {}), total: c.lengthM };
      }
    });
    db.projects.forEach(p => {
      const c = db.corridors.find(item => item.corridorId === p.corridorId);
      if (c && !Number(p.lengthM)) p.lengthM = c.lengthM;
    });
    return db;
  }

  function buildSeed() {
    return withDerived(clone(SEED));
  }

  function read() {
    applyResetToken();
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (existing && existing.version === 1 && Array.isArray(existing.corridors)) return withDerived(existing);
    } catch (err) {
      console.warn('Failed to read UtilitySync data store', err);
    }
    const seed = buildSeed();
    write(seed);
    return seed;
  }

  function write(db) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(withDerived(db)));
  }

  function mutate(fn) {
    const db = read();
    const result = fn(db);
    write(db);
    return clone(result);
  }

  function makeId(prefix) {
    if (crypto && crypto.randomUUID) return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  function activity(db, label, detail) {
    db.activity = db.activity || [];
    db.activity.unshift({ at: new Date().toISOString(), label, detail });
    db.activity = db.activity.slice(0, 12);
  }

  function corridorWithUtilities(db, corridor) {
    const utilities = db.utilities.filter(u => u.corridorId === corridor.corridorId);
    return { ...clone(corridor), utilities: clone(utilities), utilityCount: utilities.length };
  }

  function getCorridorName(db, corridorId) {
    return (db.corridors.find(c => c.corridorId === corridorId) || {}).name || 'Unknown corridor';
  }

  function listCorridors() {
    const db = read();
    return db.corridors.map(c => corridorWithUtilities(db, c));
  }

  function getCorridor(corridorId) {
    const db = read();
    const corridor = db.corridors.find(c => c.corridorId === corridorId) || db.corridors[0];
    if (!corridor) throw new Error(`Corridor ${corridorId} not found`);
    return corridorWithUtilities(db, corridor);
  }

  function createCorridor(data) {
    if (!String(data.name || '').trim()) throw new Error('Corridor name is required');
    const route = clone(data.route || []);
    const lengthM = routeLengthM(route);
    if (route.length < 2 || lengthM <= 0) throw new Error('Draw or select a route before saving the corridor');
    assertBengaluruRoute(route);
    return mutate(db => {
      const now = new Date().toISOString();
      const corridor = { corridorId: makeId('corr'), name: String(data.name).trim(), location: bengaluruLocation(data.location), widthM: Number(data.widthM || 15), status: data.status || 'ACTIVE', roadType: data.roadType || 'ARTERIAL', notes: data.notes || '', createdAt: now, updatedAt: now, center: route[Math.floor(route.length / 2)], route, lengthM, lengthKm: Number((lengthM / 1000).toFixed(2)) };
      db.corridors.push(corridor);
      activity(db, 'Corridor created', `${corridor.name} saved with ${mLabel(lengthM)} route length.`);
      return corridorWithUtilities(db, corridor);
    });
  }

  function updateCorridor(corridorId, updates) {
    return mutate(db => {
      const corridor = db.corridors.find(c => c.corridorId === corridorId);
      if (!corridor) throw new Error('Corridor not found');
      const route = updates.route ? clone(updates.route) : corridor.route;
      const lengthM = routeLengthM(route || []);
      assertBengaluruRoute(route || []);
      Object.assign(corridor, { ...updates, location: bengaluruLocation(updates.location || corridor.location), route, lengthM, lengthKm: Number((lengthM / 1000).toFixed(2)), widthM: Number(updates.widthM || corridor.widthM), updatedAt: new Date().toISOString() });
      if (route && route.length) corridor.center = route[Math.floor(route.length / 2)];
      activity(db, 'Corridor updated', `${corridor.name} length recalculated to ${mLabel(lengthM)}.`);
      return corridorWithUtilities(db, corridor);
    });
  }

  function deleteCorridor(corridorId) {
    return mutate(db => {
      const corridor = db.corridors.find(c => c.corridorId === corridorId);
      if (!corridor) throw new Error('Corridor not found');
      db.deleted.corridors.push({ ...corridor, deletedAt: new Date().toISOString() });
      db.corridors = db.corridors.filter(c => c.corridorId !== corridorId);
      db.utilities = db.utilities.filter(u => u.corridorId !== corridorId);
      db.reservedAssets = db.reservedAssets.filter(a => a.corridorId !== corridorId);
      db.projects = db.projects.filter(p => p.corridorId !== corridorId);
      activity(db, 'Corridor deleted', corridor.name);
      return { ok: true };
    });
  }

  function listUtilities(corridorId) {
    const db = read();
    return clone(corridorId ? db.utilities.filter(u => u.corridorId === corridorId) : db.utilities);
  }

  function getUtility(utilityId) {
    const item = read().utilities.find(u => u.utilityId === utilityId);
    if (!item) throw new Error('Utility not found');
    return clone(item);
  }

  function validateUtility(data) {
    if (!data.corridorId) throw new Error('Choose a corridor');
    if (!String(data.label || '').trim()) throw new Error('Utility label is required');
    if (!(Number(data.depthM) >= 0)) throw new Error('Depth must be a valid number');
    if (!(Number(data.capacityPercent) >= 0 && Number(data.capacityPercent) <= 100)) throw new Error('Capacity must be between 0 and 100');
  }

  function createUtility(data) {
    validateUtility(data);
    return mutate(db => {
      const corridor = db.corridors.find(c => c.corridorId === data.corridorId);
      const item = { utilityId: makeId('util'), corridorId: data.corridorId, assetType: 'utility', type: data.type || 'electricity', label: String(data.label).trim(), owner: data.owner || '', status: data.status || 'PLANNED', lifecycleState: data.status || 'PLANNED', depthM: Number(data.depthM), horizontalOffsetM: Number(data.horizontalOffsetM || 0), capacityPercent: Number(data.capacityPercent || 0), lengthM: corridor ? corridor.lengthM : 0, installDate: data.installDate || '', specs: data.specs || {}, notes: data.notes || '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      db.utilities.push(item);
      activity(db, 'Utility created', `${item.label} linked to ${getCorridorName(db, item.corridorId)}.`);
      return item;
    });
  }

  function updateUtility(utilityId, updates) {
    validateUtility(updates);
    return mutate(db => {
      const item = db.utilities.find(u => u.utilityId === utilityId);
      if (!item) throw new Error('Utility not found');
      Object.assign(item, { ...updates, depthM: Number(updates.depthM), horizontalOffsetM: Number(updates.horizontalOffsetM || 0), capacityPercent: Number(updates.capacityPercent || 0), specs: updates.specs || {}, lifecycleState: updates.lifecycleState || updates.status || item.lifecycleState, updatedAt: new Date().toISOString() });
      activity(db, 'Utility updated', item.label);
      return item;
    });
  }

  function deleteUtility(utilityId) {
    return mutate(db => {
      const item = db.utilities.find(u => u.utilityId === utilityId);
      if (!item) throw new Error('Utility not found');
      db.deleted.utilities.push({ ...item, deletedAt: new Date().toISOString() });
      db.utilities = db.utilities.filter(u => u.utilityId !== utilityId);
      activity(db, 'Utility deleted', item.label);
      return { ok: true };
    });
  }

  function normalizeContractor(c) {
    return { ...c, employees: Number(c.employees || c.totalWorkers || 0), totalWorkers: Number(c.totalWorkers || c.employees || 0), workersAssigned: Number(c.workersAssigned || 0), equipment: clone(c.equipment || []), certifications: clone(c.certifications || []), crewTypes: clone(c.crewTypes || []), methods: clone(c.methods || []), utilityExperience: clone(c.utilityExperience || []), currentProjectAssignments: clone(c.currentProjectAssignments || []), previousProjects: clone(c.previousProjects || []), gaps: clone(c.gaps || []) };
  }

  function availableWorkers(c) {
    return Math.max(0, Number(c.totalWorkers || c.employees || 0) - Number(c.workersAssigned || 0));
  }

  function availableCrew(c, type) {
    const crew = (c.crewTypes || []).find(item => norm(item.type) === norm(type));
    return crew ? Math.max(0, Number(crew.count || 0) - Number(crew.assigned || 0)) : 0;
  }

  function availableEquipment(c, category) {
    return (c.equipment || []).reduce((sum, item) => {
      const match = norm(item.category) === norm(category) || (item.capabilities || []).some(cap => norm(cap) === norm(category));
      const free = String(item.status || 'AVAILABLE').toUpperCase() === 'AVAILABLE' && !item.assignedProjectId;
      return match && free ? sum + Number(item.count || 1) : sum;
    }, 0);
  }

  function certificationMet(c, name) {
    const needle = norm(name);
    return (c.certifications || []).some(cert => String(cert.status || '').toUpperCase() === 'VALID' && String(cert.expiry || '2999-12') >= TODAY && (norm(cert.name).includes(needle) || needle.includes(norm(cert.name))));
  }

  function listContractors() {
    return clone(read().contractors.map(item => {
      const c = normalizeContractor(item);
      const workloadPercent = Math.round((c.workersAssigned / Math.max(1, c.totalWorkers)) * 100);
      return { ...c, availableWorkers: availableWorkers(c), workloadPercent, matchScore: Math.max(20, 100 - workloadPercent) };
    }));
  }

  function getContractor(contractorId) {
    const item = read().contractors.find(c => c.contractorId === contractorId);
    if (!item) throw new Error('Contractor not found');
    return clone(normalizeContractor(item));
  }

  function validateContractor(data) {
    if (!String(data.name || '').trim()) throw new Error('Contractor name is required');
    if (!(Number(data.employees || data.totalWorkers || 0) >= 0)) throw new Error('Employees must be a non-negative number');
  }

  function createContractor(data) {
    validateContractor(data);
    return mutate(db => {
      const item = normalizeContractor({ ...data, contractorId: makeId('ctr'), totalWorkers: Number(data.totalWorkers || data.employees || 0) });
      db.contractors.push(item);
      activity(db, 'Contractor created', item.name);
      return item;
    });
  }

  function updateContractor(contractorId, updates) {
    validateContractor(updates);
    return mutate(db => {
      const index = db.contractors.findIndex(c => c.contractorId === contractorId);
      if (index < 0) throw new Error('Contractor not found');
      db.contractors[index] = normalizeContractor({ ...db.contractors[index], ...updates, contractorId, updatedAt: new Date().toISOString() });
      activity(db, 'Contractor updated', db.contractors[index].name);
      return db.contractors[index];
    });
  }

  function deleteContractor(contractorId) {
    return mutate(db => {
      const item = db.contractors.find(c => c.contractorId === contractorId);
      if (!item) throw new Error('Contractor not found');
      db.deleted.contractors.push({ ...item, deletedAt: new Date().toISOString() });
      db.contractors = db.contractors.filter(c => c.contractorId !== contractorId);
      activity(db, 'Contractor deleted', item.name);
      return { ok: true };
    });
  }

  function listEquipment() {
    return listContractors().flatMap(c => (c.equipment || []).map((item, index) => ({ equipmentId: item.equipmentId || `${c.contractorId}-eq-${index}`, contractorId: c.contractorId, contractorName: c.name, category: item.category || 'plant', notes: item.assignedProjectId ? `Assigned to ${item.assignedProjectId}` : '', ...item })));
  }

  function listProjects() {
    return clone(read().projects || []);
  }

  function getProject(projectId, db = read()) {
    const item = db.projects.find(p => p.projectId === projectId) || db.projects[0];
    if (!item) throw new Error('Project not found');
    return clone(item);
  }

  function createProject(data) {
    return mutate(db => {
      const corridor = db.corridors.find(c => c.corridorId === data.corridorId) || db.corridors[0];
      const item = { projectId: makeId('proj'), status: 'PLANNING', createdAt: new Date().toISOString(), ...data, corridorId: corridor.corridorId, lengthM: Number(data.lengthM || corridor.lengthM || 0) };
      db.projects.push(item);
      if (String(item.status).toUpperCase() === 'COMPLETED') applyCompletedProject(db, item);
      activity(db, 'Project created', `${title(item.utilityType)} project linked to ${corridor.name}.`);
      return item;
    });
  }

  function updateProject(projectId, updates) {
    return mutate(db => {
      const index = db.projects.findIndex(p => p.projectId === projectId);
      if (index < 0) throw new Error('Project not found');
      const previousStatus = String(db.projects[index].status || '').toUpperCase();
      const item = { ...db.projects[index], ...updates, projectId, updatedAt: new Date().toISOString() };
      db.projects[index] = item;
      if (String(item.status || '').toUpperCase() === 'COMPLETED' && previousStatus !== 'COMPLETED') {
        item.completedAt = item.completedAt || new Date().toISOString();
        applyCompletedProject(db, item);
        activity(db, 'Project completed', `${item.name || item.projectId} updated the utility inventory and digital twin.`);
      } else {
        activity(db, 'Project updated', item.name || item.projectId);
      }
      return item;
    });
  }

  function completeProject(projectId) {
    return updateProject(projectId, { status: 'COMPLETED', completedAt: new Date().toISOString() });
  }

  function applyCompletedProject(db, p) {
    if (db.utilities.some(u => u.projectId === p.projectId)) return;
    db.utilities.push({ utilityId: `util-${p.projectId}`, projectId: p.projectId, corridorId: p.corridorId, type: p.utilityType, label: `${p.name} As-Built Asset`, owner: 'Project owner', status: 'COMPLETED', lifecycleState: 'COMPLETED', depthM: Number(p.targetDepthM || 1), horizontalOffsetM: 0, capacityPercent: 0, lengthM: Number(p.lengthM || 0), installDate: p.completedAt || new Date().toISOString(), specs: { sourceProject: p.projectId, method: p.installMethod, size: p.pipeSize }, notes: 'Created by project completion flow.' });
    if (p.requiredReservedAssetId) {
      const asset = db.reservedAssets.find(a => a.elementId === p.requiredReservedAssetId);
      if (asset && asset.capacity) {
        const total = Number(asset.capacity.total || p.lengthM || 0);
        asset.capacity.used = Math.min(total, Number(p.lengthM || total || 0));
        asset.availableFutureCapacity = `${mLabel(Math.max(0, total - Number(asset.capacity.used || 0)))} remains after ${p.name || p.projectId}.`;
      }
    }
  }

  function requirementProfile(p) {
    return p.requirements || req([{ category: p.installMethod === 'hdd' ? 'hdd_rig' : 'excavator', name: p.installMethod === 'hdd' ? 'HDD rig' : 'Excavator', qty: 1 }], ['BBMP Road Cutting Permit'], [p.installMethod || 'open_cut'], [p.utilityType], 8, [['civil', 4]]);
  }

  function matchContractorForProject(contractor, project) {
    const c = normalizeContractor(contractor);
    const r = requirementProfile(project);
    const requirements = [];
    const missingRequirements = [];
    const metRequirements = [];
    const add = (name, ok, detail, partial = false) => {
      const item = { name, status: ok ? 'ok' : partial ? 'partial' : 'missing', detail };
      requirements.push(item);
      (ok ? metRequirements : missingRequirements).push(name);
    };
    (r.equipment || []).forEach(e => add(e.name || title(e.category), availableEquipment(c, e.category) >= Number(e.qty || 1), `${availableEquipment(c, e.category)} available / ${e.qty || 1} required`, availableEquipment(c, e.category) > 0));
    (r.certifications || []).forEach(name => add(name, certificationMet(c, name), certificationMet(c, name) ? 'Valid certification on file' : 'Valid certification not found'));
    (r.methods || []).forEach(method => add(`${title(method)} method capability`, (c.methods || []).map(norm).includes(norm(method)), 'Method capability check'));
    (r.utilityExperience || []).forEach(type => add(`${title(type)} utility experience`, (c.utilityExperience || []).map(norm).includes(norm(type)), 'Utility experience check'));
    add('Available workforce', availableWorkers(c) >= Number(r.minWorkers || 0), `${availableWorkers(c)} available / ${r.minWorkers || 0} required`);
    (r.crewTypes || []).forEach(crew => add(`${title(crew.type)} crew`, availableCrew(c, crew.type) >= Number(crew.count || 0), `${availableCrew(c, crew.type)} available / ${crew.count} required`, availableCrew(c, crew.type) > 0));

    const workloadPercent = Math.round((Number(c.workersAssigned || 0) / Math.max(1, Number(c.totalWorkers || c.employees || 0))) * 100);
    const workloadOk = workloadPercent <= 75;
    const eligible = !missingRequirements.length && workloadOk;
    const ratio = (actual, required) => required ? Math.max(0, Math.min(1, Number(actual || 0) / Number(required))) : 1;
    const equipmentRatio = ratio((r.equipment || []).reduce((n,e) => n + Math.min(availableEquipment(c, e.category), e.qty || 1), 0), (r.equipment || []).reduce((n,e) => n + Number(e.qty || 1), 0));
    const certRatio = ratio((r.certifications || []).filter(name => certificationMet(c, name)).length, (r.certifications || []).length);
    const methodRatio = ratio((r.methods || []).filter(method => (c.methods || []).map(norm).includes(norm(method))).length, (r.methods || []).length);
    const utilityRatio = ratio((r.utilityExperience || []).filter(type => (c.utilityExperience || []).map(norm).includes(norm(type))).length, (r.utilityExperience || []).length);
    const crewRatio = ratio((r.crewTypes || []).reduce((n,crew) => n + Math.min(availableCrew(c, crew.type), crew.count || 0), 0), (r.crewTypes || []).reduce((n,crew) => n + Number(crew.count || 0), 0));
    const workforceRatio = ratio(availableWorkers(c), Number(r.minWorkers || 0));
    const rawScore = Math.round(equipmentRatio * 27 + certRatio * 15 + utilityRatio * 15 + methodRatio * 10 + workforceRatio * 10 + crewRatio * 8 + Math.max(0, 1 - workloadPercent / 100) * 5 + 10);
    const matchScore = eligible ? Math.min(98, rawScore) : Math.min(49, rawScore);
    const verdict = eligible && matchScore >= 85 ? 'RECOMMENDED' : eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE';
    return {
      ...c,
      eligible,
      eligibilityStatus: eligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
      matchScore,
      verdict,
      verdictColor: eligible ? (matchScore >= 85 ? 'success' : 'warning') : 'danger',
      verdictIcon: eligible ? (matchScore >= 85 ? 'OK' : '!') : 'X',
      requirements,
      metRequirements,
      missingRequirements,
      workforceAvailability: { totalWorkers: c.totalWorkers, assignedWorkers: c.workersAssigned, availableWorkers: availableWorkers(c), requiredWorkers: r.minWorkers || 0 },
      equipmentAvailability: (r.equipment || []).map(e => ({ category: e.category, required: e.qty || 1, available: availableEquipment(c, e.category) })),
      workloadConstraints: { workloadPercent, status: workloadOk ? 'OK' : 'OVERLOADED', maxRecommendedPercent: 75 },
      narrative: eligible ? `${c.name} is eligible for ${project.name}. Score ${matchScore}% reflects equipment, certifications, utility experience, workforce, crews, equipment availability, and workload.` : `${c.name} is not eligible for ${project.name}: ${missingRequirements.slice(0, 4).join(', ')}. Mandatory failures are not overridden by the ${matchScore}% calculated score.`
    };
  }

  function matchContractors(projectId) {
    const db = read();
    const project = getProject(projectId, db);
    const r = requirementProfile(project);
    return {
      projectId,
      projectRequirements: [...(r.equipment || []).map(e => `${e.name} x ${e.qty || 1}`), ...(r.certifications || []), ...(r.methods || []).map(m => `${title(m)} method`), ...(r.utilityExperience || []).map(t => `${title(t)} experience`), `${r.minWorkers || 0} available workers`],
      contractors: db.contractors.map(c => matchContractorForProject(c, project)).sort((a,b) => a.eligible !== b.eligible ? (a.eligible ? -1 : 1) : b.matchScore - a.matchScore)
    };
  }

  function getConstructionPlan(projectId) {
    const db = read();
    const p = getProject(projectId, db);
    const corridor = db.corridors.find(c => c.corridorId === p.corridorId) || {};
    const r = requirementProfile(p);
    const lengthM = Number(p.lengthM || corridor.lengthM || 0);
    const weeks = Math.max(2, Math.ceil(lengthM / (p.installMethod === 'hdd' ? 650 : 450)));
    const unitCost = { hdd: 7600, microtrenching: 3900, existing_duct: 900, open_cut: 5200, pipe_bursting: 6100 }[p.installMethod] || 4800;
    const alerts = generateAlerts(db).filter(a => a.projectId === p.projectId || a.corridorId === p.corridorId);
    const blockers = (p.dependencies || []).filter(dep => !['APPROVED','COMPLETED'].includes(String(dep.status || '').toUpperCase()));
    return {
      projectId,
      generatedAt: new Date().toISOString(),
      deterministic: true,
      summary: { utilityType: title(p.utilityType), totalLength: mLabel(lengthM), installMethods: title(p.installMethod), estimatedDuration: `${weeks}-${weeks + 2} weeks`, estimatedCrew: `${r.minWorkers || 0}+ workers`, estimatedCost: `INR ${Math.round(lengthM / 1000 * unitCost * 0.92).toLocaleString('en-IN')}-${Math.round(lengthM / 1000 * unitCost * 1.18).toLocaleString('en-IN')}` },
      equipment: (r.equipment || []).map(e => ({ name: e.name || title(e.category), qty: e.qty || 1, critical: true, reason: `Required for ${title(p.installMethod)} ${title(p.utilityType)} works on ${corridor.name}.` })),
      crewRequirements: [...(r.crewTypes || []).map(c => ({ role: `${title(c.type)} crew`, count: c.count, critical: true })), { role: 'Site engineer / permit coordinator', count: 1, critical: true }],
      installationSequence: [{ step: 1, title: 'Survey and permit lock', detail: `Confirm route length from saved geometry (${mLabel(lengthM)}), GPR survey, and permits.` }, { step: 2, title: 'Utility exposure and separation checks', detail: 'Expose congested bands using trial pits or vacuum excavation before mechanical works.' }, { step: 3, title: `${title(p.installMethod)} installation`, detail: `Install ${p.pipeSize || title(p.utilityType)} along the saved corridor route.` }, { step: 4, title: 'Testing and as-built capture', detail: 'Test installed asset, capture offsets/depths, and update the digital twin.' }],
      risks: alerts.slice(0, 4).map(alert => ({ level: alert.severity, risk: alert.category, description: alert.explanation })),
      missingInformation: blockers.length ? blockers.map(dep => ({ status: 'MISSING', item: dep.name, detail: `${dep.status}: ${dep.requiredFor || 'Required before works continue'}` })) : [{ status: 'OK', item: 'Deterministic inputs', detail: 'Route length, requirements, and contractor eligibility are calculated from saved data.' }]
    };
  }

  function getDigitalTwin(corridorId) {
    const db = read();
    const corridor = db.corridors.find(c => c.corridorId === corridorId) || db.corridors[0];
    const utilities = db.utilities.filter(u => u.corridorId === corridor.corridorId);
    const reserved = db.reservedAssets.filter(a => a.corridorId === corridor.corridorId);
    const projects = db.projects.filter(p => p.corridorId === corridor.corridorId);
    const elements = [
      ...utilities.map(u => ({ elementId: `twin-${u.utilityId}`, utilityId: u.utilityId, projectId: u.projectId, type: u.type, assetType: 'utility', label: u.label, depthM: Number(u.depthM), horizontalOffsetM: Number(u.horizontalOffsetM || 0), owner: u.owner, installDate: u.installDate, lifecycleState: u.lifecycleState || u.status, condition: conditionFromStatus(u.status), capacity: { total: 100, used: Number(u.capacityPercent || 0), unit: '%' }, availableFutureCapacity: `${Math.max(0, 100 - Number(u.capacityPercent || 0))}% headroom`, specs: clone(u.specs || {}), notes: u.notes || '' })),
      ...reserved.map(asset => ({ ...clone(asset), assetType: asset.type, lifecycleState: asset.condition || 'RESERVED' }))
    ];
    const reservedCount = elements.filter(e => ['reserved_duct','expansion_zone'].includes(e.type)).length;
    const available = elements.filter(e => e.type === 'reserved_duct' && (!e.capacity || Number(e.capacity.used || 0) === 0)).length;
    return { corridorId: corridor.corridorId, corridorName: corridor.name, lastUpdated: SEED_TIME, totalElements: elements.length, futureCapacityScore: elements.length ? Math.min(100, Math.round((reservedCount / elements.length) * 55 + available * 12)) : 0, elements, projects: clone(projects), summary: { reservedDucts: elements.filter(e => e.type === 'reserved_duct').length, expansionZones: elements.filter(e => e.type === 'expansion_zone').length, allAvailable: elements.filter(e => e.type === 'reserved_duct' && (!e.capacity || Number(e.capacity.used || 0) === 0)), completedProjects: projects.filter(p => p.status === 'COMPLETED').length, routeLengthM: corridor.lengthM } };
  }

  function conditionFromStatus(status) {
    const value = String(status || '').toUpperCase();
    if (value.includes('FUTURE') || value.includes('PLANNED')) return 'PLANNED';
    if (value.includes('IN_PROGRESS')) return 'UNDER_CONSTRUCTION';
    if (value.includes('COMPLETED')) return 'NEW';
    return 'GOOD';
  }

  function separationRequirement(a, b) {
    return MIN_SEPARATION_M[[a, b].sort().join(':')];
  }

  function detectConflicts(corridor, utilities) {
    const conflicts = [];
    utilities.forEach((a, i) => utilities.slice(i + 1).forEach(b => {
      const required = separationRequirement(a.type, b.type);
      if (!required) return;
      const actual = Math.sqrt((Number(a.depthM) - Number(b.depthM)) ** 2 + (Number(a.horizontalOffsetM || 0) - Number(b.horizontalOffsetM || 0)) ** 2);
      if (actual < required) {
        conflicts.push({ conflictId: `conf-${a.utilityId}-${b.utilityId}`, type: 'PROXIMITY', severity: actual < required * 0.75 ? 'HIGH' : 'MEDIUM', utilities: [a.utilityId, b.utilityId], title: `${title(a.type)} / ${title(b.type)} separation conflict`, description: `${a.label} and ${b.label} have ${actual.toFixed(2)}m calculated separation; ${required.toFixed(2)}m is required.`, affectedLength: corridor.lengthM, actualValue: `${actual.toFixed(2)}m`, requiredValue: `${required.toFixed(2)}m`, solution: `Move one asset by at least ${(required - actual).toFixed(2)}m or redesign the works band before approval.` });
      }
    }));
    return conflicts;
  }

  function analyzeCorridor(corridorId) {
    const db = read();
    const corridor = db.corridors.find(c => c.corridorId === corridorId) || db.corridors[0];
    const utilities = db.utilities.filter(u => u.corridorId === corridor.corridorId);
    const conflicts = detectConflicts(corridor, utilities);
    const capacityZones = utilities.map(u => ({ utilityId: u.utilityId, type: u.type, label: u.label, capacityPercent: Number(u.capacityPercent || 0), status: Number(u.capacityPercent || 0) > 85 ? 'HIGH' : Number(u.capacityPercent || 0) > 65 ? 'MODERATE' : 'LOW', summary: `${Math.max(0, 100 - Number(u.capacityPercent || 0))}% available capacity remains for ${u.owner || 'the operator'}.` }));
    const recommendedDucts = db.reservedAssets.filter(a => a.corridorId === corridor.corridorId && a.type === 'reserved_duct' && Number((a.capacity || {}).used || 0) === 0).map(a => ({ ductId: a.elementId, type: a.reservedForUtility, label: a.label, depthM: a.depthM, reason: a.availableFutureCapacity, estimatedSaving: `INR ${Math.round((corridor.lengthM || 0) * 1800).toLocaleString('en-IN')}` }));
    return { corridorId: corridor.corridorId, analysisId: makeId('anal'), completedAt: new Date().toISOString(), conflicts, capacityZones, recommendedDucts, summary: { totalConflicts: conflicts.length, highSeverityConflicts: conflicts.filter(c => c.severity === 'HIGH').length, reservedDuctsRecommended: recommendedDucts.length, totalPotentialSaving: recommendedDucts.length ? `INR ${Math.round(recommendedDucts.length * (corridor.lengthM || 0) * 1800).toLocaleString('en-IN')}` : 'INR 0', recommendation: conflicts.length ? 'Resolve deterministic separation conflicts before approving new utility works.' : 'No separation conflicts found in saved utility records.' } };
  }

  function compatibleReservedUse(asset, utilityType) {
    return Boolean(asset && asset.reservedForUtility === utilityType);
  }

  function generateAlerts(db = read()) {
    const alerts = [];
    db.corridors.forEach(corridor => detectConflicts(corridor, db.utilities.filter(u => u.corridorId === corridor.corridorId)).forEach(conflict => alerts.push({ alertId: `alert-${conflict.conflictId}`, severity: conflict.severity, type: 'UTILITY_SEPARATION_CONFLICT', category: 'Utility crossing / separation conflict', corridorId: corridor.corridorId, corridor: corridor.name, projectId: corridor.corridorId === 'corr-orr-marathahalli' ? 'proj-orr-fiber-hdd' : '', project: corridor.corridorId === 'corr-orr-marathahalli' ? 'ORR Smart Mobility Fiber HDD Package' : '', affectedAsset: conflict.title, actualValue: conflict.actualValue, requiredValue: conflict.requiredValue, explanation: conflict.description, recommendedAction: conflict.solution, resolutionState: 'OPEN' })));
    db.utilities.filter(u => Number(u.capacityPercent || 0) >= 90).forEach(u => { const c = db.corridors.find(item => item.corridorId === u.corridorId) || {}; alerts.push({ alertId: `alert-capacity-${u.utilityId}`, severity: 'HIGH', type: 'CAPACITY_CONSTRAINT', category: 'Pipeline / duct capacity constraint', corridorId: u.corridorId, corridor: c.name, projectId: 'proj-bell-ev-duct', project: 'Sarjapur Road EV Charging Duct Proposal', affectedAsset: u.label, actualValue: `${u.capacityPercent}% used`, requiredValue: '<=85% used for new allocation', explanation: `${u.label} is at ${u.capacityPercent}% utilization, leaving too little headroom for additional allocation.`, recommendedAction: 'Add new duct capacity or release inactive subduct records before approving another operator.', resolutionState: 'OPEN' }); });
    db.projects.filter(p => p.assignedContractorId).forEach(p => { const c = db.contractors.find(item => item.contractorId === p.assignedContractorId); if (!c) return; const result = matchContractorForProject(c, p); if (!result.eligible) { const corridor = db.corridors.find(item => item.corridorId === p.corridorId) || {}; alerts.push({ alertId: `alert-contractor-${p.projectId}-${c.contractorId}`, severity: 'HIGH', type: 'CONTRACTOR_ELIGIBILITY_FAILURE', category: 'Contractor capability / eligibility failure', corridorId: p.corridorId, corridor: corridor.name, projectId: p.projectId, project: p.name, affectedAsset: c.name, actualValue: result.missingRequirements.slice(0, 4).join(', '), requiredValue: 'All mandatory checks met', explanation: `${c.name} fails mandatory eligibility for ${p.name}; score is capped at ${result.matchScore}%.`, recommendedAction: 'Select an eligible contractor or update underlying contractor equipment, certifications, crews, and availability.', resolutionState: 'OPEN' }); } });
    db.projects.filter(p => ['READY','IN_PROGRESS'].includes(String(p.status || '').toUpperCase())).flatMap(p => (p.dependencies || []).filter(dep => !['APPROVED','COMPLETED'].includes(String(dep.status || '').toUpperCase())).map(dep => ({ p, dep }))).forEach(({ p, dep }) => { const c = db.corridors.find(item => item.corridorId === p.corridorId) || {}; alerts.push({ alertId: `alert-dependency-${p.projectId}-${dep.dependencyId}`, severity: 'MEDIUM', type: 'CONSTRUCTION_DEPENDENCY_BLOCKER', category: 'Construction dependency blocker', corridorId: p.corridorId, corridor: c.name, projectId: p.projectId, project: p.name, affectedAsset: dep.name, actualValue: dep.status, requiredValue: 'APPROVED or COMPLETED', explanation: `${p.name} is ${p.status}, but dependency "${dep.name}" is still ${dep.status}.`, recommendedAction: `Complete ${dep.name} before continuing ${dep.requiredFor || 'the project'}.`, resolutionState: 'OPEN' }); });
    db.projects.filter(p => p.requiredReservedAssetId).forEach(p => { const asset = db.reservedAssets.find(a => a.elementId === p.requiredReservedAssetId); if (!asset || compatibleReservedUse(asset, p.utilityType)) return; const c = db.corridors.find(item => item.corridorId === p.corridorId) || {}; alerts.push({ alertId: `alert-reserved-${p.projectId}-${asset.elementId}`, severity: 'MEDIUM', type: 'RESERVED_CAPACITY_CONFLICT', category: 'Reserved / future capacity conflict', corridorId: p.corridorId, corridor: c.name, projectId: p.projectId, project: p.name, affectedAsset: asset.label, actualValue: `${title(p.utilityType)} requested`, requiredValue: `${title(asset.reservedForUtility)} reservation`, explanation: `${p.name} attempts to use ${asset.label}, but the asset is reserved for ${title(asset.reservedForUtility)}.`, recommendedAction: 'Release or redesign the reservation in the underlying asset record, or create a separate EV charging duct.', resolutionState: 'OPEN' }); });
    return alerts.slice(0, 5);
  }

  function listAlerts() {
    return clone(generateAlerts());
  }

  function simulateFutureProject(corridorId, futureUtilityType, requiredLengthM) {
    const db = read();
    const corridor = db.corridors.find(c => c.corridorId === corridorId) || db.corridors[0];
    const required = Number(requiredLengthM || corridor.lengthM || 0);
    const available = db.reservedAssets.filter(a => a.corridorId === corridor.corridorId && a.type === 'reserved_duct' && Number((a.capacity || {}).used || 0) === 0 && compatibleReservedUse(a, futureUtilityType) && Number((a.capacity || {}).total || 0) >= required);
    if (available.length) {
      const savings = Math.round(required * 1800);
      return { futureUtilityType, requiredLengthM: required, recommendation: 'USE_EXISTING_CAPACITY', title: 'Reserved Capacity Available - No New Excavation Needed', detail: `${available[0].label} can carry ${title(futureUtilityType)} for ${mLabel(required)}. Reuse requires pull/blow crew and as-built update, not a new trench.`, matchedElements: available.slice(0, 2).map(a => a.elementId), savings: { cost: { value: `INR ${savings.toLocaleString('en-IN')}`, label: 'Cost Saved' }, time: { value: `${Math.max(1, Math.round(required / 900))} Weeks`, label: 'Programme Saved' }, co2: { value: `${(required * 0.0048).toFixed(1)} tonnes`, label: 'CO2 Avoided' } } };
    }
    const zone = db.reservedAssets.find(a => a.corridorId === corridor.corridorId && a.type === 'expansion_zone');
    return { futureUtilityType, requiredLengthM: required, recommendation: zone ? 'USE_EXPANSION_ZONE' : 'NEW_INSTALLATION_REQUIRED', title: zone ? 'Use Reserved Expansion Zone' : 'New Installation Required', detail: zone ? `${zone.label} is available for a new ${title(futureUtilityType)} route, subject to its recorded constraints.` : `No compatible reserved duct exists for ${title(futureUtilityType)} on ${corridor.name}.`, matchedElements: zone ? [zone.elementId] : [], savings: null };
  }

  function getActivity() {
    return clone(read().activity || []);
  }

  function reset() {
    LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
    const seed = buildSeed();
    write(seed);
    return clone(seed);
  }

  return { read, reset, routeLengthM, listCorridors, getCorridor, createCorridor, updateCorridor, deleteCorridor, listUtilities, getUtility, createUtility, updateUtility, deleteUtility, listContractors, getContractor, createContractor, updateContractor, deleteContractor, listEquipment, getDigitalTwin, analyzeCorridor, createProject, updateProject, completeProject, listProjects, getProject, getConstructionPlan, matchContractors, listAlerts, simulateFutureProject, getActivity };
})();
