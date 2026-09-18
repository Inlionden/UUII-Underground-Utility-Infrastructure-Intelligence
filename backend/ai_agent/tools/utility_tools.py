"""
Utility and capacity tools for the Strands Agent.
"""
import os, json, boto3
from strands import tool
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')

DUCT_COMPATIBLE = {
    'fiber': ['reserved_duct'],
    'ev_charging': ['reserved_duct'],
    'electricity': ['reserved_duct'],
}


@tool
def plan_utility(utility_type: str, length_m: int, install_method: str) -> str:
    """
    Generate a high-level utility planning recommendation based on type,
    length, and installation method. Returns key requirements and considerations.

    Args:
        utility_type: Type of utility (fiber, electricity, water, gas, drainage).
        length_m: Length of the utility run in metres.
        install_method: Proposed installation method (open_cut, hdd, existing_duct, etc).

    Returns:
        Planning recommendations and key requirements.
    """
    method_notes = {
        'hdd':            'HDD requires certified operator (IADC), drill tracking equipment, bore plan approval from Highway Authority.',
        'open_cut':       'Open cut requires NRSWA noticing, traffic management plan, and TTRO if on A-road.',
        'existing_duct':  'Using existing duct requires confirmation duct is empty, compatible diameter, and draw rope installed.',
        'microtrenching': 'Micro-trenching limited to footway only; depth typically 200mm — check for existing services.',
    }

    depth_recs = {
        'fiber':       '0.45m (footway), 0.60m (carriageway)',
        'electricity': '0.90m (LV), 1.00m (HV)',
        'water':       '0.90m (300mm+ main), 0.75m (services)',
        'gas':         '0.60m (LP), 0.75m (IP), 1.00m (HP)',
    }

    return (
        f"Planning recommendation for {utility_type} ({length_m}m, {install_method}):\n"
        f"Target depth: {depth_recs.get(utility_type, '0.60m')}\n"
        f"Method note: {method_notes.get(install_method, 'Follow standard NJUG guidance.')}\n"
        f"Key requirement: NRSWA streetworks notice before any excavation.\n"
        f"Estimated duration: {max(2, round(length_m / 400))}–{max(3, round(length_m / 300))} weeks."
    )


@tool
def check_capacity(corridor_id: str, future_utility_type: str) -> str:
    """
    Check whether existing or reserved infrastructure in a corridor's digital twin
    can accommodate a future utility installation without new excavation.

    Args:
        corridor_id: The corridor to check.
        future_utility_type: The type of future utility to accommodate.

    Returns:
        A recommendation on whether to reuse existing capacity or plan new works.
    """
    try:
        twin_table = dynamodb.Table(os.environ['TWIN_TABLE'])
        resp = twin_table.query(
            KeyConditionExpression=Key('corridorId').eq(corridor_id)
        )
        elements = resp.get('Items', [])

        compatible_types = DUCT_COMPATIBLE.get(future_utility_type, [])
        available = [
            e for e in elements
            if e.get('type') in compatible_types
            and e.get('capacity', {}).get('used', 1) == 0
        ]

        if available:
            names = [e.get('label', e.get('elementId')) for e in available]
            return (
                f"REUSE RECOMMENDED: {len(available)} available reserved duct(s) found for {future_utility_type}:\n"
                + '\n'.join(f"  - {n}" for n in names)
                + "\nNo excavation required. Cable blowing or pulling can proceed directly."
            )
        else:
            zones = [e for e in elements if e.get('type') == 'expansion_zone']
            if zones:
                return (
                    f"NEW INSTALLATION REQUIRED for {future_utility_type}: No compatible reserved ducts available.\n"
                    f"However, {len(zones)} expansion zone(s) exist — use these to minimise conflict risk."
                )
            return (
                f"NEW INSTALLATION REQUIRED for {future_utility_type}: No reserved capacity or expansion zones available.\n"
                "Full corridor analysis recommended before planning new works."
            )
    except Exception as e:
        return f'Error checking capacity: {e}'
