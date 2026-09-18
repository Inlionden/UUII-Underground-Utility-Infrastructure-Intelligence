"""
Analysis handler — deterministic conflict detection and capacity analysis.
No AI involved here: pure engineering rules (NJUG Vol 1, HSE guidance).
"""
import os, uuid, boto3
from datetime import datetime, timezone
from boto3.dynamodb.conditions import Key
from handlers.corridors import get as get_corridor

# Minimum separation requirements (metres) — NJUG Volume 1 Table 3.1
MIN_SEPARATIONS = {
    ('gas',         'electricity'): 0.50,
    ('gas',         'water'):       0.30,
    ('gas',         'fiber'):       0.25,
    ('gas',         'drainage'):    0.50,
    ('electricity', 'water'):       0.25,
    ('electricity', 'fiber'):       0.10,
    ('water',       'drainage'):    0.25,
    ('fiber',       'drainage'):    0.25,
}

CAPACITY_THRESHOLDS = {
    'HIGH':     80,  # % — action required
    'MODERATE': 60,  # % — monitor
}


def run(corridor_id: str) -> dict:
    """Run full corridor analysis: conflicts, capacity, duct recommendations."""
    corridor = get_corridor(corridor_id)
    utilities = corridor.get('utilities', [])

    conflicts          = _detect_conflicts(utilities)
    capacity_zones     = _assess_capacity(utilities)
    recommended_ducts  = _recommend_ducts(utilities, corridor)

    total_saving = sum(
        _parse_money(d.get('estimatedSaving', '£0'))
        for d in recommended_ducts
    )

    return {
        'corridorId':     corridor_id,
        'analysisId':     str(uuid.uuid4()),
        'completedAt':    datetime.now(timezone.utc).isoformat(),
        'conflicts':      conflicts,
        'capacityZones':  capacity_zones,
        'recommendedDucts': recommended_ducts,
        'summary': {
            'totalConflicts':             len(conflicts),
            'highSeverityConflicts':      sum(1 for c in conflicts if c['severity'] == 'HIGH'),
            'reservedDuctsRecommended':   len(recommended_ducts),
            'totalPotentialSaving':       f'£{total_saving:,}',
            'recommendation':             _overall_recommendation(conflicts, recommended_ducts),
        }
    }


def _detect_conflicts(utilities: list) -> list:
    """Check pairwise separation between all utilities."""
    conflicts = []
    for i, u1 in enumerate(utilities):
        for u2 in utilities[i+1:]:
            sep = _get_min_separation(u1['type'], u2['type'])
            if sep is None:
                continue
            actual = abs(u1.get('depthM', 1.0) - u2.get('depthM', 1.0))
            if actual < sep:
                conflicts.append({
                    'conflictId':     str(uuid.uuid4()),
                    'type':           'PROXIMITY',
                    'severity':       'HIGH' if actual < sep * 0.6 else 'MEDIUM',
                    'utilities':      [u1.get('utilityId',''), u2.get('utilityId','')],
                    'title':          f'{u1["type"].title()} / {u2["type"].title()} Proximity Conflict',
                    'description':    (
                        f'{u1.get("label","Utility 1")} and {u2.get("label","Utility 2")} '
                        f'are separated by only {actual:.2f}m. '
                        f'NJUG minimum separation is {sep:.2f}m.'
                    ),
                    'affectedLength': None,
                    'solution':       _suggest_solution(u1, u2, sep, actual),
                })
    return conflicts


def _get_min_separation(type1: str, type2: str) -> float | None:
    key1 = (type1, type2)
    key2 = (type2, type1)
    return MIN_SEPARATIONS.get(key1) or MIN_SEPARATIONS.get(key2)


def _suggest_solution(u1, u2, required, actual) -> str:
    needed = required - actual
    return (
        f'Increase separation by {needed:.2f}m. '
        f'Recommended: lower {u2["type"]} main by {needed:.2f}m at next planned maintenance. '
        f'No disruption to {u1["type"]} main required.'
    )


def _assess_capacity(utilities: list) -> list:
    """Assess current capacity utilisation for each utility."""
    zones = []
    for u in utilities:
        pct = u.get('capacityPercent', 0)
        if pct >= CAPACITY_THRESHOLDS['HIGH']:
            status, summary = 'HIGH', f'At {pct}% — reinforcement planning required for any new load.'
        elif pct >= CAPACITY_THRESHOLDS['MODERATE']:
            status, summary = 'MODERATE', f'At {pct}% — monitor; adequate for current load but limited headroom.'
        else:
            status, summary = 'LOW', f'At {pct}% — significant capacity available for future growth.'

        zones.append({
            'utilityId':       u.get('utilityId', ''),
            'type':            u.get('type', ''),
            'label':           u.get('label', ''),
            'capacityPercent': pct,
            'status':          status,
            'summary':         summary,
        })
    return zones


def _recommend_ducts(utilities: list, corridor: dict) -> list:
    """Recommend reserved ducts based on what's currently missing."""
    existing_types = {u['type'] for u in utilities}
    ducts = []

    # Recommend fiber ducts if no fiber exists
    if 'fiber' not in existing_types:
        ducts.append({
            'ductId':          f'rec-duct-fiber-{str(uuid.uuid4())[:8]}',
            'type':            'fiber',
            'label':           'Reserved Fiber/Comms Ducts (2 × 110mm HDPE)',
            'depthM':          0.6,
            'reason':          (
                'No fiber/comms provision currently exists. Install 2 × 110mm HDPE ducts at 0.6m '
                'during any planned works — avoids future standalone excavation cost.'
            ),
            'estimatedSaving': '£157,000',
        })

    # Recommend power duct if gas > 70%
    gas_utils = [u for u in utilities if u['type'] == 'gas']
    if not gas_utils or gas_utils[0].get('capacityPercent', 0) > 70:
        ducts.append({
            'ductId':          f'rec-duct-power-{str(uuid.uuid4())[:8]}',
            'type':            'power',
            'label':           'Reserved Power Duct (1 × 150mm HDPE)',
            'depthM':          0.9,
            'reason':          (
                'Install 150mm HDPE power duct for future EV charging / solar connection, '
                'avoiding repeated excavation.'
            ),
            'estimatedSaving': '£81,000',
        })

    return ducts


def _overall_recommendation(conflicts: list, ducts: list) -> str:
    if conflicts:
        return f'Address {len(conflicts)} conflict(s) before adding new utilities. Recommended duct installation will future-proof the corridor.'
    return 'No conflicts detected. Recommended duct installation will future-proof the corridor against upcoming projects.'


def _parse_money(s: str) -> int:
    try:
        return int(s.replace('£', '').replace(',', '').split('–')[0])
    except Exception:
        return 0
