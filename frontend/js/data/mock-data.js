/**
 * UtilitySync — Mock Data
 * Used when USE_MOCK_API = true. Mirrors exact API response shapes.
 */
window.US_MOCK = {

  // ── POST /corridors  (create corridor response)
  createCorridor: {
    corridorId: 'corr-001',
    name: 'High Street, Greenway',
    location: 'Elephant & Castle to Waterloo, London SE1',
    lengthKm: 2.3,
    widthM: 15,
    status: 'ACTIVE',
    center: [51.4996, -0.1065],
    route: [
      [51.4960, -0.1010],
      [51.4975, -0.1030],
      [51.4990, -0.1055],
      [51.5005, -0.1080],
      [51.5020, -0.1100],
      [51.5034, -0.1130]
    ],
    utilities: [
      {
        utilityId: 'util-elec-001', type: 'electricity',
        label: 'HV Electricity Cable (11kV)',
        depthM: 1.0, horizontalOffsetM: -3.5,
        capacityPercent: 74, owner: 'UK Power Networks',
        status: 'OPERATIONAL', installDate: '2019-06-10',
        specs: { voltage: '11kV', cableType: 'XLPE armoured', diameter: '95mm', circuitLength: '2.3km' },
        notes: 'Redundant pair installed. Eastern cable at 78% load.'
      },
      {
        utilityId: 'util-water-001', type: 'water',
        label: 'Water Distribution Main (300mm)',
        depthM: 0.9, horizontalOffsetM: -1.2,
        capacityPercent: 61, owner: 'Thames Water',
        status: 'OPERATIONAL', installDate: '2011-09-22',
        specs: { material: 'Ductile Iron', diameter: '300mm', pressure: '5.5 bar', flowRate: '320 l/s' },
        notes: 'Approaching design life. Lined in 2018. Monitoring recommended by 2026.'
      },
      {
        utilityId: 'util-gas-001', type: 'gas',
        label: 'Gas Distribution Main (IP)',
        depthM: 0.75, horizontalOffsetM: 1.0,
        capacityPercent: 82, owner: 'Cadent Gas',
        status: 'OPERATIONAL', installDate: '2005-04-14',
        specs: { material: 'MDPE', diameter: '180mm', pressure: '75 mbar (IP)', type: 'Intermediate Pressure' },
        notes: 'High proximity to water main — 150mm separation. CONFLICT FLAGGED.'
      },
      {
        utilityId: 'util-drain-001', type: 'drainage',
        label: 'Combined Sewer (600mm)',
        depthM: 1.8, horizontalOffsetM: 3.2,
        capacityPercent: 44, owner: 'Thames Water',
        status: 'OPERATIONAL', installDate: '1987-01-01',
        specs: { material: 'Vitrified Clay', diameter: '600mm', type: 'Combined sewer', gradient: '1:200' },
        notes: 'Victorian era asset. Significant capacity available.'
      }
    ]
  },

  // ── POST /corridors/{id}/analyze  (analysis response)
  analyzeCorridorResult: {
    corridorId: 'corr-001',
    analysisId: 'anal-001',
    completedAt: new Date().toISOString(),
    conflicts: [
      {
        conflictId: 'conf-001',
        type: 'PROXIMITY',
        severity: 'HIGH',
        utilities: ['util-gas-001', 'util-water-001'],
        title: 'Gas / Water Proximity Conflict',
        description: 'Gas main (MDPE, 180mm, IP) and water main (DI, 300mm) are separated by only 150mm across the full 2.3km corridor length. NJUG Volume 1 (Table 3.1) requires minimum 300mm separation between gas and water mains.',
        affectedLength: 2300,
        solution: 'Recommended: Lower water main to 1.2m depth during next planned intervention. This resolves the conflict without disrupting the gas main and creates 0.45m separation. Estimated cost: £85,000–£120,000 to rebed 2.3km.'
      }
    ],
    capacityZones: [
      {
        utilityId: 'util-elec-001', type: 'electricity', label: 'HV Electricity Cable',
        capacityPercent: 74, status: 'MODERATE',
        summary: '26% headroom remaining. Eastern circuit at 78%. Adequate for current load but new connections should be assessed against peak demand.'
      },
      {
        utilityId: 'util-water-001', type: 'water', label: 'Water Main',
        capacityPercent: 61, status: 'MODERATE',
        summary: '124 l/s available (320 l/s design). Approaching end of design life — expansion of this main is not recommended. Plan replacement when gas conflict is resolved.'
      },
      {
        utilityId: 'util-gas-001', type: 'gas', label: 'Gas Main',
        capacityPercent: 82, status: 'HIGH',
        summary: '18% capacity remaining. 3m exclusion zone applies. New gas connections will require reinforcement planning with Cadent Gas.'
      },
      {
        utilityId: 'util-drain-001', type: 'drainage', label: 'Combined Sewer',
        capacityPercent: 44, status: 'LOW',
        summary: '56% available capacity. Victorian infrastructure — adequate for current needs but new connections require structural survey approval.'
      }
    ],
    recommendedDucts: [
      {
        ductId: 'rec-duct-001',
        type: 'fiber',
        label: 'Reserved Fiber/Comms Ducts (2 × 110mm HDPE)',
        depthM: 0.6,
        reason: 'Zero fiber/comms provision currently exists on this corridor. Demand from residential and commercial densification expected within 3 years. Install 2 × 110mm HDPE ducts at 0.6m depth now — cost £28,000 vs. £185,000 future standalone installation. Both ducts fully available for cable-blowing when fiber projects arrive.',
        estimatedSaving: '£157,000'
      },
      {
        ductId: 'rec-duct-002',
        type: 'power',
        label: 'Reserved Power Duct (1 × 150mm HDPE)',
        depthM: 0.9,
        reason: 'Borough EV charging strategy targets 48 on-street charge points along this corridor by 2027. Install 150mm HDPE power duct now to avoid repeated excavation. Cost £14,000 vs. £95,000 per future standalone installation.',
        estimatedSaving: '£81,000'
      }
    ],
    summary: {
      totalConflicts: 1,
      highSeverityConflicts: 1,
      reservedDuctsRecommended: 3,
      totalPotentialSaving: '£238,000',
      recommendation: 'Address gas/water proximity before any new utility additions. Recommended duct installation will future-proof the corridor against 3 known upcoming projects.'
    }
  },

  // ── POST /projects  (create project response)
  createProject: {
    projectId: 'proj-001',
    corridorId: 'corr-001',
    utilityType: 'fiber',
    lengthM: 2300,
    pipeSize: '96-core SMF',
    installMethod: 'hdd',
    bends: 12,
    roadCrossings: 3,
    targetDepthM: 0.6,
    constraints: 'No disruption permitted within 3m of gas main. Night works only on main carriageway sections.',
    status: 'PLANNED',
    createdAt: new Date().toISOString()
  },

  // ── GET /projects/{id}/construction-plan
  constructionPlan: {
    projectId: 'proj-001',
    generatedAt: new Date().toISOString(),
    summary: {
      utilityType: 'Fiber Optic (96-core Single-Mode)',
      totalLength: '2,300m',
      installMethods: 'HDD (road crossings), Open-cut (footway)',
      estimatedDuration: '6–8 weeks',
      estimatedCrew: '12–15 operatives',
      estimatedCost: '£185,000–£220,000'
    },
    equipment: [
      { name: 'Horizontal Directional Drill (Vermeer D23x30 or equivalent)', qty: 1, critical: true, reason: 'Required for 3 road crossings under carriageway (total 45m). Open-cut not permitted on primary road.' },
      { name: 'Cable Pulling / Blowing Unit (Plumettaz or similar)', qty: 1, critical: true, reason: 'Required for 96-core fiber installation through all duct sections.' },
      { name: 'Vacuum Excavator (Vac-Ex SUMO or similar)', qty: 2, critical: true, reason: 'Required for safe excavation within 3m of existing gas main (full corridor length constraint).' },
      { name: 'Hydraulic Excavator (3T or 8T)', qty: 2, critical: false, reason: 'Open-cut trenching in footway sections.' },
      { name: 'OTDR Fiber Testing Equipment', qty: 1, critical: true, reason: 'Mandatory — fiber continuity and loss testing at each joint/splice point.' },
      { name: 'Compaction Plates / Roller', qty: 2, critical: false, reason: 'Reinstatement compaction to NRSWA standards.' },
      { name: 'Traffic Management Fleet (TTRO required)', qty: 1, critical: false, reason: 'Full road/footway TM plan required; TTRO notice period 3 months on A-road sections.' }
    ],
    crewRequirements: [
      { role: 'HDD Operator (IADC certified)', count: 2, critical: true },
      { role: 'Fiber Optic Splicer (City & Guilds 3667 or equivalent)', count: 3, critical: true },
      { role: 'NRSWA-qualified Civil Operatives', count: 6, critical: true },
      { role: 'Traffic Management Operatives', count: 3, critical: false },
      { role: 'Site Supervisor / Safety Officer', count: 1, critical: true }
    ],
    installationSequence: [
      { step: 1, title: 'Pre-works and Mobilisation', detail: 'TTRO application, utility surveys (CAT & Genny + ground radar), site set-up, safety briefing, material deliveries.' },
      { step: 2, title: 'Vacuum Excavation — Trial Holes', detail: 'Expose existing gas main at 6 critical crossing points using vacuum excavation only. Confirm as-built depths before any mechanical excavation commences.' },
      { step: 3, title: 'HDD Road Crossings (3 locations)', detail: 'Directional drill 3 × primary road crossings: A3200 junction (18m), side streets (2 × 13.5m). Install 110mm HDPE pilot bore, pull back duct.' },
      { step: 4, title: 'Open-Cut Footway Sections', detail: 'Trench footway sections between crossings. Bed and lay 2 × 110mm HDPE ducts + 1 × 150mm power duct at target depths. Backfill and compact in layers.' },
      { step: 5, title: 'Duct Jointing and Sealing', detail: 'Electrofusion joint all duct sections. Pressure test assembled duct run. Install draw ropes and end caps.' },
      { step: 6, title: 'Fiber Cable Installation', detail: 'Cable blow 96-core SMF through primary duct. Pull cable through HDD sections. Establish splice points at all access chambers.' },
      { step: 7, title: 'Splicing and Testing', detail: 'Mechanical splice at all joints (max 12 locations). OTDR testing from both ends. Document all loss measurements. Acceptance criteria: <0.3dB/km.' },
      { step: 8, title: 'Reinstatement and Handover', detail: 'Full NRSWA-compliant reinstatement of all footways and crossings. As-built survey and GIS recording. Digital Twin update. Warranty period 2 years.' }
    ],
    risks: [
      { level: 'HIGH', risk: 'Gas Main Proximity', description: 'Full 2.3km corridor contains gas main within 3m. Any mechanical excavation requires daily gas survey and vacuum excavation adjacent to gas main. Breach of gas main = fatality risk + prosecution.' },
      { level: 'HIGH', risk: 'Unmapped Services', description: 'Victorian-era infrastructure likely to be incomplete in asset records. Ground radar survey essential before all trenching. Emergency gas escape procedures must be in place on site at all times.' },
      { level: 'MEDIUM', risk: 'HDD Deviation', description: 'HDD drills can deviate on congested routes. If deviation detected, pull-back and re-drill required — 2–5 day delay per crossing. Ensure drill tracking equipment operational throughout.' },
      { level: 'MEDIUM', risk: 'Traffic Impact', description: 'Night works constraint on carriageway significantly increases programme duration. Plan work windows carefully; any overrun incurs penalty clauses under typical LA contracts.' },
      { level: 'LOW', risk: 'Fiber Splice Contamination', description: 'Dust and moisture at splice points can cause high loss. All splicing must be done in clean tent environment, not open air.' }
    ],
    missingInformation: [
      { status: '❌', item: 'TTRO (Traffic Regulation Order) approval', detail: 'Not yet applied for. 3-month notice required for A-road sections. Critical path item.' },
      { status: '❌', item: 'Ground Radar Survey (GPR)', detail: 'Required before any excavation. 2–3 week lead time. Must be completed before Phase 4 works.' },
      { status: '❌', item: 'Cadent Gas permit (adjacent works)', detail: 'Formal notification to Cadent required 28 days before works within 3m of gas main.' },
      { status: '⚠️', item: 'HDD bore plan (signed off)', detail: 'HDD contractor must submit bore plan for HA approval before drilling.' },
      { status: '⚠️', item: 'Fiber route design (as-designed drawings)', detail: 'Detailed design drawings required for NRSWA noticing and contractor tender.' },
      { status: '✅', item: 'Corridor analysis', detail: 'Completed. Conflicts identified and documented.' }
    ]
  },

  // ── GET /contractors/match/{projectId}
  contractorMatch: {
    projectId: 'proj-001',
    projectRequirements: [
      'Horizontal Directional Drilling (HDD) Rig',
      'Cable Pulling / Blowing Unit (fiber)',
      'Vacuum Excavator',
      'NRSWA Streetworks Certification',
      'City & Guilds Fiber Splicing',
      'HDD Operator Certification (IADC)',
      'Gas Proximity Work Certification'
    ],
    contractors: [
      {
        contractorId: 'ctr-002',
        name: 'TerraFlow Solutions Ltd',
        location: 'Bermondsey, London',
        matchScore: 94,
        verdict: 'RECOMMENDED',
        verdictColor: 'success',
        verdictIcon: '✅',
        requirements: [
          { name: 'HDD Rig', status: 'ok',      detail: 'Vermeer D23x30 × 2 — owned' },
          { name: 'Cable Blowing Unit', status: 'ok', detail: 'Plumettaz × 1 — owned' },
          { name: 'Vacuum Excavator', status: 'ok',   detail: 'SUMO 3000 × 3 — owned' },
          { name: 'NRSWA Cert', status: 'ok',         detail: 'Valid to Feb 2027' },
          { name: 'Fiber Splicing (C&G)', status: 'ok', detail: 'City & Guilds 3667 — 6 certified splicers' },
          { name: 'HDD IADC Cert', status: 'ok',      detail: 'Valid to Jan 2026' },
          { name: 'Gas Proximity Cert', status: 'ok', detail: 'Valid to Sep 2026' }
        ],
        gaps: [
          { requirement: 'EV Charging experience', severity: 'LOW', description: 'Minor gap — standard civils work applies' }
        ],
        narrative: 'TerraFlow Solutions is the strongest match for this project. They own the HDD rigs, cable-blowing equipment, and vacuum excavators required and have 6 City & Guilds certified fiber splicers on their permanent crew. Their recent completion of the TfL Cable Route E3 (4.2km fiber, 2024) and Canary Wharf HDD crossings gives them directly relevant experience. The only minor gap is no prior EV charging duct experience, but this is standard civils work and presents no real risk.'
      },
      {
        contractorId: 'ctr-003',
        name: 'UnitedDig Services',
        location: 'Streatham, London',
        matchScore: 58,
        verdict: 'PARTIAL MATCH',
        verdictColor: 'warning',
        verdictIcon: '⚠️',
        requirements: [
          { name: 'HDD Rig', status: 'missing', detail: 'Not in fleet — must sub-contract all HDD works' },
          { name: 'Cable Blowing Unit', status: 'missing', detail: 'No fiber blowing equipment — hire required' },
          { name: 'Vacuum Excavator', status: 'missing', detail: 'Not owned — hire available locally' },
          { name: 'NRSWA Cert', status: 'ok',         detail: 'Valid to Oct 2025 — renewal imminent' },
          { name: 'Fiber Splicing (C&G)', status: 'missing', detail: 'No certified fiber splicers — must sub-contract' },
          { name: 'HDD IADC Cert', status: 'missing', detail: 'No HDD operators' },
          { name: 'Gas Proximity Cert', status: 'partial', detail: 'No specific gas proximity certification on file' }
        ],
        gaps: [
          { requirement: 'HDD Rig', severity: 'CRITICAL', description: 'Must sub-contract all 3 road crossings' },
          { requirement: 'Fiber cable blowing unit', severity: 'CRITICAL', description: 'Equipment hire or sub-contract required' },
          { requirement: 'Fiber splicing crew', severity: 'HIGH', description: 'No in-house capability' }
        ],
        narrative: 'UnitedDig has the NRSWA certification and civil crew for open-cut footway work but is missing the three most critical items: an HDD rig, cable-blowing equipment, and fiber-certified splicers. Using UnitedDig would require sub-contracting all specialist works to at least two additional parties, significantly increasing programme risk and coordination overhead. Their NRSWA renewal is also due in October 2025 — this should be confirmed before any award.'
      },
      {
        contractorId: 'ctr-001',
        name: 'BuildCore Infrastructure Ltd',
        location: 'Croydon, London',
        matchScore: 42,
        verdict: 'SIGNIFICANT GAPS',
        verdictColor: 'danger',
        verdictIcon: '❌',
        requirements: [
          { name: 'HDD Rig', status: 'missing', detail: 'Not available — critical gap' },
          { name: 'Cable Blowing Unit', status: 'missing', detail: 'No fiber equipment in fleet' },
          { name: 'Vacuum Excavator', status: 'partial', detail: 'Hired Vac-Ex available — not owned' },
          { name: 'NRSWA Cert', status: 'ok',         detail: 'Valid to Aug 2026' },
          { name: 'Fiber Splicing (C&G)', status: 'missing', detail: 'No fiber-certified personnel' },
          { name: 'HDD IADC Cert', status: 'missing', detail: 'No HDD operators in crew' },
          { name: 'Gas Proximity Cert', status: 'ok', detail: 'Valid to Nov 2025' }
        ],
        gaps: [
          { requirement: 'HDD Rig', severity: 'CRITICAL', description: 'No HDD capability whatsoever' },
          { requirement: 'Cable pulling winch (fiber-rated)', severity: 'CRITICAL', description: 'Existing drums rated to 1500kg — insufficient for fiber reel weight and pulling tension requirements' },
          { requirement: 'City & Guilds Fiber Optic Splicing', severity: 'HIGH', description: 'No certified fiber splicers on permanent crew' }
        ],
        narrative: 'BuildCore Infrastructure is not suitable as principal contractor for this project. They lack HDD capability, fiber cable-pulling equipment, and fiber-certified splicers — which together represent the core specialist works on this project. They could potentially be considered for the footway reinstatement sub-package only, where their civil crew and NRSWA qualifications are adequate. However, awarding the principal contract to BuildCore would introduce significant sub-contracting complexity and management risk.'
      }
    ]
  },

  // ── GET /digital-twin/{corridorId}
  digitalTwin: {
    corridorId: 'corr-001',
    corridorName: 'High Street, Greenway',
    lastUpdated: '2024-11-01T14:30:00Z',
    totalElements: 8,
    futureCapacityScore: 87,
    elements: [
      { elementId: 'twin-elec-001', type: 'electricity', label: 'HV Electricity Cable (11kV)', depthM: 1.0, owner: 'UK Power Networks', installDate: '2019-06-10', condition: 'GOOD', capacity: { total: 100, used: 74, unit: '%' }, availableFutureCapacity: '26% headroom on eastern circuit', notes: 'Redundant pair. Western circuit at 69%.' },
      { elementId: 'twin-water-001', type: 'water', label: 'Water Distribution Main (300mm)', depthM: 0.9, owner: 'Thames Water', installDate: '2011-09-22', condition: 'FAIR', capacity: { total: 320, used: 196, unit: 'l/s' }, availableFutureCapacity: '124 l/s available. Approaching design life — expansion not recommended.', notes: 'Lined in 2018. Monitoring recommended by 2026.' },
      { elementId: 'twin-gas-001', type: 'gas', label: 'Gas Distribution Main (IP)', depthM: 0.75, owner: 'Cadent Gas', installDate: '2005-04-14', condition: 'GOOD', capacity: { total: 100, used: 82, unit: '%' }, availableFutureCapacity: '18% capacity. 3m exclusion zone applies.', notes: 'Proximity conflict with water main flagged.' },
      { elementId: 'twin-drain-001', type: 'drainage', label: 'Combined Sewer (600mm)', depthM: 1.8, owner: 'Thames Water', installDate: '1987-01-01', condition: 'FAIR', capacity: { total: 100, used: 44, unit: '%' }, availableFutureCapacity: '56% available. Victorian asset — structural survey required for new connections.', notes: '' },
      { elementId: 'twin-duct-001', type: 'reserved_duct', label: 'Reserved Duct 1 — Comms/Fiber (110mm HDPE)', depthM: 0.6, owner: 'Greenway Council', installDate: '2023-08-15', condition: 'NEW', capacity: { total: 2300, used: 0, unit: 'm' }, availableFutureCapacity: 'FULLY AVAILABLE — 2.3km empty duct, ready for cable blowing.', notes: 'Draw rope installed. Entry/exit chambers at both ends.', highlight: true },
      { elementId: 'twin-duct-002', type: 'reserved_duct', label: 'Reserved Duct 2 — Comms/Fiber (110mm HDPE)', depthM: 0.6, owner: 'Greenway Council', installDate: '2023-08-15', condition: 'NEW', capacity: { total: 2300, used: 0, unit: 'm' }, availableFutureCapacity: 'FULLY AVAILABLE — 2.3km empty duct (redundant to Duct 1).', notes: 'Redundancy duct — second cable or separate operator.', highlight: true },
      { elementId: 'twin-duct-003', type: 'reserved_duct', label: 'Reserved Power Duct (150mm HDPE)', depthM: 0.9, owner: 'Greenway Council', installDate: '2023-08-15', condition: 'NEW', capacity: { total: 2300, used: 0, unit: 'm' }, availableFutureCapacity: 'FULLY AVAILABLE — reserved for EV charging / future power cable.', notes: 'Sized for up to 185mm² power cable.', highlight: true },
      { elementId: 'twin-exp-001', type: 'expansion_zone', label: 'Expansion Zone — North Footway', depthM: 0.5, owner: 'Greenway Council', installDate: '2023-08-15', condition: 'RESERVED', capacity: { total: 100, used: 0, unit: '%' }, availableFutureCapacity: '1.8m wide unexcavated zone in north footway. Planning condition reserves for future utility.', notes: '' }
    ]
  },

  // ── POST /digital-twin/{corridorId}/simulate
  simulateFiber: {
    futureUtilityType: 'fiber',
    requiredLengthM: 2300,
    recommendation: 'USE_EXISTING_CAPACITY',
    title: 'Reserved Capacity Available — No New Excavation Needed',
    detail: 'The Digital Twin shows 2 fully available 110mm HDPE ducts (Reserved Duct 1 and Duct 2) running the full 2.3km of this corridor, installed in August 2023. Both ducts are rated for 96-core single-mode fiber via cable blowing. Using Reserved Duct 1 for this project requires:\n\n• 1 × cable blowing unit (1 day mobilisation)\n• 1 × fiber splicing crew (4 persons, 3 days)\n• No excavation, no traffic management, no TTRO\n• No permits or utility notifications required\n\nThis is the recommended approach. Reserved Duct 2 remains available for a second operator or redundancy.',
    matchedElements: ['twin-duct-001', 'twin-duct-002'],
    savings: {
      cost: { value: '£180,000', label: 'Cost Saved' },
      time: { value: '5 Weeks', label: 'Programme Saved' },
      co2: { value: '12.4 tonnes', label: 'CO₂ Avoided' }
    }
  },

  simulateEV: {
    futureUtilityType: 'ev_charging',
    requiredLengthM: 2300,
    recommendation: 'USE_EXISTING_CAPACITY',
    title: 'Reserved Power Duct Available for EV Charging',
    detail: 'Reserved Power Duct (150mm HDPE) runs the full 2.3km corridor and is sized for up to 185mm² power cable — adequate for 48 EV charge points at 22kW each. Cable pulling is straightforward with the draw rope already installed. Requires:\n\n• Electrical connection to UK Power Networks at agreed connection point\n• Power cable installation through existing duct (1–2 days)\n• EV charge point civils at each location (separate package)',
    matchedElements: ['twin-duct-003'],
    savings: {
      cost: { value: '£81,000', label: 'Cost Saved' },
      time: { value: '3 Weeks', label: 'Programme Saved' },
      co2: { value: '7.2 tonnes', label: 'CO₂ Avoided' }
    }
  },

  simulateNewWater: {
    futureUtilityType: 'water',
    requiredLengthM: 2300,
    recommendation: 'NEW_INSTALLATION_REQUIRED',
    title: 'New Installation Required — No Suitable Reserved Capacity',
    detail: 'The existing water main is at 61% capacity and approaching design life — it should not carry additional load. The reserved ducts are sized for fiber/comms and power, not water mains. A new water main installation would require full open-cut works. However, the Expansion Zone in the north footway provides an ideal location for the new main, avoiding conflict with all existing utilities.',
    matchedElements: ['twin-exp-001'],
    savings: null
  }
};
