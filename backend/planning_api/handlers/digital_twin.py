"""
Digital Twin handler — retrieve and simulate future projects.
"""
import os, boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TWIN_TABLE'])

# Duct compatibility map: which utility types can use which duct types
DUCT_COMPATIBILITY = {
    'fiber':          ['reserved_duct'],
    'ev_charging':    ['reserved_duct'],  # power duct type
    'electricity':    ['reserved_duct'],
    'water':          [],  # needs new installation
    'gas':            [],  # needs new installation
    'district_heating': [],
}

# Cost savings for using existing capacity vs new installation (£/metre)
COST_SAVINGS_PER_METRE = {
    'fiber':       78,   # vs open-cut new fiber
    'ev_charging': 35,   # vs new power duct
    'electricity': 55,
}


def get(corridor_id: str) -> dict:
    """Retrieve all digital twin elements for a corridor."""
    resp = table.query(
        KeyConditionExpression=Key('corridorId').eq(corridor_id)
    )
    elements = resp.get('Items', [])

    ducts = [e for e in elements if e.get('type') == 'reserved_duct']
    score = _calculate_future_score(elements)

    return {
        'corridorId':       corridor_id,
        'totalElements':    len(elements),
        'futureCapacityScore': score,
        'elements':         elements,
        'summary': {
            'reservedDucts': len(ducts),
            'allAvailable':  [e for e in ducts if e.get('capacity', {}).get('used', 1) == 0],
        }
    }


def simulate(corridor_id: str, body: dict) -> dict:
    """Check if existing/reserved capacity can accommodate a future utility."""
    future_type = body.get('futureUtilityType', 'fiber')
    required_m  = int(body.get('requiredLengthM', 0))

    twin = get(corridor_id)
    elements = twin['elements']

    compatible_duct_types = DUCT_COMPATIBILITY.get(future_type, [])
    available_ducts = [
        e for e in elements
        if e.get('type') in compatible_duct_types
        and e.get('capacity', {}).get('used', 1) == 0
    ]

    if not available_ducts:
        # Check expansion zone
        exp_zones = [e for e in elements if e.get('type') == 'expansion_zone']
        if exp_zones:
            return _new_install_via_zone(future_type, required_m, exp_zones[0])
        return _new_install_required(future_type, required_m)

    best_duct = available_ducts[0]
    return _reuse_response(future_type, required_m, available_ducts, best_duct)


def _reuse_response(future_type, required_m, available_ducts, best_duct):
    saving_per_m = COST_SAVINGS_PER_METRE.get(future_type, 50)
    cost_saving  = required_m * saving_per_m
    weeks_saving = max(2, round(required_m / 500))
    co2_saving   = round(required_m * 0.0054, 1)  # ~5.4kg CO2/m for new excavation

    matched_ids = [d.get('elementId', '') for d in available_ducts[:2]]

    return {
        'futureUtilityType':  future_type,
        'requiredLengthM':    required_m,
        'recommendation':     'USE_EXISTING_CAPACITY',
        'title':              'Reserved Capacity Available — No New Excavation Needed',
        'detail': (
            f'The Digital Twin shows {len(available_ducts)} available reserved duct(s) '
            f'suitable for {future_type.replace("_", " ")} installation.\n\n'
            f'Using {best_duct.get("label", "the reserved duct")} for this project requires:\n'
            '• 1 × cable/pipe installation crew\n'
            '• No excavation, no traffic management, no TTRO\n'
            '• No new utility notifications required\n\n'
            'This is the recommended approach. All reserved ducts have draw ropes installed and entry/exit chambers at both ends.'
        ),
        'matchedElements': matched_ids,
        'savings': {
            'cost': {'value': f'£{cost_saving:,}',    'label': 'Cost Saved'},
            'time': {'value': f'{weeks_saving} Weeks', 'label': 'Programme Saved'},
            'co2':  {'value': f'{co2_saving} tonnes', 'label': 'CO₂ Avoided'},
        }
    }


def _new_install_via_zone(future_type, required_m, zone):
    return {
        'futureUtilityType': future_type,
        'requiredLengthM':   required_m,
        'recommendation':    'USE_EXPANSION_ZONE',
        'title':             'Use Reserved Expansion Zone — Reduced Excavation',
        'detail': (
            f'No pre-installed duct is available for {future_type.replace("_", " ")}. '
            f'However, the {zone.get("label", "expansion zone")} provides a clear route '
            'for a new installation with reduced conflict risk. '
            'Excavation is required but the zone is specifically reserved for this purpose — '
            'no other utility consents are needed.'
        ),
        'matchedElements': [zone.get('elementId', '')],
        'savings': None,
    }


def _new_install_required(future_type, required_m):
    return {
        'futureUtilityType': future_type,
        'requiredLengthM':   required_m,
        'recommendation':    'NEW_INSTALLATION_REQUIRED',
        'title':             'New Installation Required — No Suitable Reserved Capacity',
        'detail': (
            f'No existing reserved capacity is compatible with {future_type.replace("_", " ")}. '
            'A new installation will be required. '
            'Refer to the corridor analysis for recommended routing and conflict avoidance.'
        ),
        'matchedElements': [],
        'savings': None,
    }


def _calculate_future_score(elements: list) -> int:
    """Score the corridor from 0–100 based on reserved capacity available."""
    if not elements:
        return 0
    total     = len(elements)
    reserved  = sum(1 for e in elements if e.get('type') in ('reserved_duct', 'expansion_zone'))
    available = sum(1 for e in elements
                    if e.get('type') == 'reserved_duct'
                    and e.get('capacity', {}).get('used', 1) == 0)
    return min(100, int((reserved / total) * 60 + (available / max(1, reserved)) * 40))
