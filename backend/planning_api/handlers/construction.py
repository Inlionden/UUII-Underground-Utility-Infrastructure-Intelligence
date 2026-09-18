"""
Construction plan handler.
Generates structured construction plan from project data.
"""
import os, boto3
from handlers.projects import get as get_project

INSTALL_METHOD_LABELS = {
    'open_cut':       'Open Cut (Trench)',
    'hdd':            'Horizontal Directional Drilling (HDD)',
    'existing_duct':  'Through Existing Reserved Duct',
    'microtrenching': 'Micro-Trenching',
    'moling':         'Moling / Pipe Bursting',
}

UTILITY_EQUIPMENT = {
    'fiber': [
        {'name': 'Horizontal Directional Drill (Vermeer D23x30 or equivalent)', 'qty': 1, 'critical': True,  'reason': 'Required for road crossings under carriageway where open-cut is not permitted.'},
        {'name': 'Cable Pulling / Blowing Unit (Plumettaz or similar)',          'qty': 1, 'critical': True,  'reason': 'Required for fiber cable installation through duct sections.'},
        {'name': 'Vacuum Excavator (Vac-Ex)',                                    'qty': 2, 'critical': True,  'reason': 'Required for safe excavation within 3m of gas main.'},
        {'name': 'Hydraulic Excavator (3T or 8T)',                               'qty': 2, 'critical': False, 'reason': 'Open-cut trenching in footway sections.'},
        {'name': 'OTDR Fiber Testing Equipment',                                 'qty': 1, 'critical': True,  'reason': 'Mandatory — fiber continuity and loss testing at each splice point.'},
        {'name': 'Compaction Plates / Roller',                                   'qty': 2, 'critical': False, 'reason': 'NRSWA-compliant reinstatement compaction.'},
        {'name': 'Traffic Management Fleet (TTRO required)',                     'qty': 1, 'critical': False, 'reason': 'Full TM plan required; TTRO 3-month notice on A-road sections.'},
    ],
    'electricity': [
        {'name': 'Cable Pulling Equipment (HV-rated)',  'qty': 1, 'critical': True,  'reason': 'Required for HV cable installation.'},
        {'name': 'Hydraulic Excavator',                 'qty': 2, 'critical': True,  'reason': 'Trenching to cable depth.'},
        {'name': 'Vacuum Excavator',                    'qty': 1, 'critical': True,  'reason': 'Near existing services.'},
        {'name': 'HV Jointing Equipment',               'qty': 1, 'critical': True,  'reason': 'HV cable joint kits and tooling.'},
        {'name': 'Cable Drum Trailer',                  'qty': 1, 'critical': True,  'reason': 'Transport and feed HV cable drums.'},
    ],
    'water': [
        {'name': 'Hydraulic Excavator',         'qty': 2, 'critical': True,  'reason': 'Trenching to main depth.'},
        {'name': 'Pipe Laying Equipment',       'qty': 1, 'critical': True,  'reason': 'Bedding and laying pipe.'},
        {'name': 'Fusion Welding Machine',      'qty': 1, 'critical': True,  'reason': 'Electrofusion joints on MDPE pipe.'},
        {'name': 'Pressure Testing Equipment',  'qty': 1, 'critical': True,  'reason': 'Mandatory pre-commissioning pressure test.'},
        {'name': 'Dewatering Pump',             'qty': 2, 'critical': False, 'reason': 'Trench dewatering in wet conditions.'},
    ],
}

UTILITY_CREW = {
    'fiber': [
        {'role': 'HDD Operator (IADC certified)',                   'count': 2, 'critical': True},
        {'role': 'Fiber Optic Splicer (City & Guilds 3667)',        'count': 3, 'critical': True},
        {'role': 'NRSWA-qualified Civil Operatives',                'count': 6, 'critical': True},
        {'role': 'Traffic Management Operatives',                   'count': 3, 'critical': False},
        {'role': 'Site Supervisor / Safety Officer',                'count': 1, 'critical': True},
    ],
    'electricity': [
        {'role': 'HV-qualified Jointers (DNO approved)',            'count': 2, 'critical': True},
        {'role': 'NRSWA-qualified Civil Operatives',                'count': 6, 'critical': True},
        {'role': 'Traffic Management Operatives',                   'count': 3, 'critical': False},
        {'role': 'DNO-approved Site Supervisor',                    'count': 1, 'critical': True},
    ],
    'water': [
        {'role': 'NRSWA-qualified Pipe Layers',                     'count': 5, 'critical': True},
        {'role': 'NRSWA-qualified Civil Operatives',                'count': 4, 'critical': True},
        {'role': 'Water Network Engineer',                          'count': 1, 'critical': True},
        {'role': 'Traffic Management Operatives',                   'count': 2, 'critical': False},
    ],
}

TOP_RISKS = {
    'fiber': [
        {'level': 'HIGH',   'risk': 'Gas Main Proximity',    'description': 'Any mechanical excavation within 3m of gas main requires daily gas survey + vacuum excavation. Fatality risk + prosecution if breached.'},
        {'level': 'HIGH',   'risk': 'Unmapped Services',     'description': 'Victorian-era infrastructure likely incomplete in records. GPR survey mandatory before trenching.'},
        {'level': 'MEDIUM', 'risk': 'HDD Deviation',        'description': 'Drills can deviate on congested routes. Pull-back and re-drill required if tolerance exceeded.'},
        {'level': 'MEDIUM', 'risk': 'Traffic Impact',       'description': 'Night works constraints significantly extend programme. Overruns incur penalty clauses.'},
        {'level': 'LOW',    'risk': 'Splice Contamination', 'description': 'Dust and moisture at splice points cause high optical loss. All splicing requires clean-tent environment.'},
    ],
}


def generate(project_id: str) -> dict:
    project = get_project(project_id)
    util_type = project.get('utilityType', 'fiber')
    length_m  = int(project.get('lengthM', 0))
    crossings = int(project.get('roadCrossings', 0))
    method    = project.get('installMethod', 'hdd')

    equipment = UTILITY_EQUIPMENT.get(util_type, UTILITY_EQUIPMENT['fiber'])
    crew      = UTILITY_CREW.get(util_type, UTILITY_CREW['fiber'])
    risks     = TOP_RISKS.get(util_type, TOP_RISKS['fiber'])

    weeks = max(3, round(length_m / 300))  # rough estimate
    cost_lo = length_m * 75
    cost_hi = length_m * 90
    crew_sz  = sum(c['count'] for c in crew)

    summary = {
        'utilityType':      util_type.replace('_', ' ').title(),
        'totalLength':      f'{length_m:,}m',
        'installMethods':   INSTALL_METHOD_LABELS.get(method, method),
        'estimatedDuration': f'{weeks}–{weeks + 2} weeks',
        'estimatedCrew':    f'{crew_sz - 2}–{crew_sz + 2} operatives',
        'estimatedCost':    f'£{cost_lo:,}–£{cost_hi:,}',
    }

    sequence = _build_sequence(util_type, method, crossings)
    missing  = _build_missing(util_type, crossings)

    return {
        'projectId':            project_id,
        'generatedAt':          __import__('datetime').datetime.utcnow().isoformat() + 'Z',
        'summary':              summary,
        'equipment':            equipment,
        'crewRequirements':     crew,
        'installationSequence': sequence,
        'risks':                risks,
        'missingInformation':   missing,
    }


def _build_sequence(util_type, method, crossings):
    base = [
        {'step': 1, 'title': 'Pre-works and Mobilisation',    'detail': 'TTRO application, utility surveys (CAT & Genny + GPR), site set-up, safety briefing, material deliveries.'},
        {'step': 2, 'title': 'Vacuum Excavation — Trial Holes','detail': 'Expose existing services at critical crossing points using vacuum excavation. Confirm as-built depths.'},
    ]
    if crossings > 0 and method == 'hdd':
        base.append({'step': 3, 'title': f'HDD Road Crossings ({crossings} locations)', 'detail': f'Directional drill {crossings} primary road crossing(s). Install HDPE pilot bore, pull back duct.'})
    base += [
        {'step': len(base) + 1, 'title': 'Main Installation Works',  'detail': 'Lay utility in trench or through existing duct as per design. Bed and backfill in layers.'},
        {'step': len(base) + 2, 'title': 'Jointing and Testing',     'detail': 'Complete all joints and connections. Full pressure/continuity test to acceptance criteria.'},
        {'step': len(base) + 3, 'title': 'Reinstatement and Handover','detail': 'Full NRSWA-compliant reinstatement. As-built survey. Digital Twin update. 2-year warranty period.'},
    ]
    return base


def _build_missing(util_type, crossings):
    items = [
        {'status': '❌', 'item': 'TTRO / Traffic Regulation Order',      'detail': 'Critical path item — apply immediately. 3-month notice for A-road sections.'},
        {'status': '❌', 'item': 'Ground Radar (GPR) Survey',             'detail': 'Mandatory before excavation. 2–3 week lead time.'},
        {'status': '⚠️', 'item': 'Route Design Drawings',               'detail': 'Detailed design drawings required for NRSWA noticing and contractor tender.'},
    ]
    if util_type == 'fiber':
        items.append({'status': '❌', 'item': 'Cadent Gas Notification (adjacent works)', 'detail': '28-day notification to Cadent required before works within 3m of gas main.'})
    if crossings > 0:
        items.append({'status': '⚠️', 'item': 'HDD Bore Plan (HA approved)', 'detail': 'HDD contractor must submit bore plan for Highway Authority approval before drilling.'})
    items.append({'status': '✅', 'item': 'Corridor Analysis', 'detail': 'Completed. Conflicts identified and documented.'})
    return items
