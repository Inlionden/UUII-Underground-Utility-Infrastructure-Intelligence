"""
Corridors handler — CRUD for corridors and their utilities.
"""
import os, json, uuid, boto3
from datetime import datetime, timezone
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
corridors_table = dynamodb.Table(os.environ['CORRIDORS_TABLE'])
utilities_table  = dynamodb.Table(os.environ['UTILITIES_TABLE'])


def create(body: dict) -> dict:
    """Create a new corridor with its existing utilities."""
    corridor_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # Validate
    name = body.get('name', '').strip()
    if not name:
        raise ValueError('Corridor name is required')

    # Build utility records from selected types
    selected_utils = body.get('selectedUtils', [])
    utilities = _build_default_utilities(corridor_id, selected_utils)

    # Store corridor
    item = {
        'corridorId': corridor_id,
        'sk': 'METADATA',
        'name': name,
        'location': body.get('location', ''),
        'lengthKm': float(body.get('lengthKm', 0)),
        'widthM': float(body.get('widthM', 15)),
        'roadType': body.get('roadType', 'B_ROAD'),
        'notes': body.get('notes', ''),
        'route': json.dumps(body.get('route', [])),
        'status': 'ACTIVE',
        'createdAt': now,
        'updatedAt': now,
    }
    corridors_table.put_item(Item=item)

    # Store utilities
    for util in utilities:
        utilities_table.put_item(Item=util)

    # Build and return response
    corridor = {k: v for k, v in item.items() if k not in ('sk',)}
    corridor['route'] = body.get('route', [])
    corridor['utilities'] = utilities
    return corridor


def get(corridor_id: str) -> dict:
    """Fetch corridor + utilities."""
    response = corridors_table.get_item(Key={'corridorId': corridor_id, 'sk': 'METADATA'})
    item = response.get('Item')
    if not item:
        raise KeyError(f'Corridor {corridor_id} not found')

    # Fetch utilities
    util_resp = utilities_table.query(
        KeyConditionExpression=Key('corridorId').eq(corridor_id)
    )
    utilities = util_resp.get('Items', [])

    corridor = {k: v for k, v in item.items() if k != 'sk'}
    try:
        corridor['route'] = json.loads(corridor.get('route', '[]'))
    except Exception:
        corridor['route'] = []
    corridor['utilities'] = utilities
    return corridor


def list_all() -> dict:
    """List all corridors."""
    response = corridors_table.scan(
        FilterExpression='sk = :sk',
        ExpressionAttributeValues={':sk': 'METADATA'}
    )
    items = response.get('Items', [])
    corridors = []
    for item in items:
        c = {k: v for k, v in item.items() if k != 'sk'}
        try:
            c['route'] = json.loads(c.get('route', '[]'))
        except Exception:
            c['route'] = []
        corridors.append(c)
    return {'corridors': corridors, 'count': len(corridors)}


def _build_default_utilities(corridor_id: str, types: list) -> list:
    """Build default utility records from selected types."""
    defaults = {
        'electricity': {
            'utilityId': f'util-elec-{corridor_id[:8]}',
            'type': 'electricity',
            'label': 'HV Electricity Cable (11kV)',
            'depthM': 1.0, 'horizontalOffsetM': -3.5,
            'capacityPercent': 74, 'owner': 'UK Power Networks',
            'status': 'OPERATIONAL',
            'specs': {'voltage': '11kV', 'cableType': 'XLPE armoured', 'diameter': '95mm'},
        },
        'water': {
            'utilityId': f'util-water-{corridor_id[:8]}',
            'type': 'water',
            'label': 'Water Distribution Main (300mm)',
            'depthM': 0.9, 'horizontalOffsetM': -1.2,
            'capacityPercent': 61, 'owner': 'Thames Water',
            'status': 'OPERATIONAL',
            'specs': {'material': 'Ductile Iron', 'diameter': '300mm', 'pressure': '5.5 bar'},
        },
        'gas': {
            'utilityId': f'util-gas-{corridor_id[:8]}',
            'type': 'gas',
            'label': 'Gas Distribution Main (IP)',
            'depthM': 0.75, 'horizontalOffsetM': 1.0,
            'capacityPercent': 82, 'owner': 'Cadent Gas',
            'status': 'OPERATIONAL',
            'specs': {'material': 'MDPE', 'diameter': '180mm', 'pressure': '75 mbar'},
        },
        'fiber': {
            'utilityId': f'util-fiber-{corridor_id[:8]}',
            'type': 'fiber',
            'label': 'Fiber Optic Cable',
            'depthM': 0.6, 'horizontalOffsetM': -5.0,
            'capacityPercent': 45, 'owner': 'Unknown Operator',
            'status': 'OPERATIONAL',
            'specs': {'cores': '48-core', 'type': 'Single-mode fiber'},
        },
        'drainage': {
            'utilityId': f'util-drain-{corridor_id[:8]}',
            'type': 'drainage',
            'label': 'Combined Sewer (600mm)',
            'depthM': 1.8, 'horizontalOffsetM': 3.2,
            'capacityPercent': 44, 'owner': 'Thames Water',
            'status': 'OPERATIONAL',
            'specs': {'material': 'Vitrified Clay', 'diameter': '600mm'},
        },
    }
    now = datetime.now(timezone.utc).isoformat()
    result = []
    for t in types:
        if t in defaults:
            util = {'corridorId': corridor_id, 'installDate': now, **defaults[t]}
            result.append(util)
    return result
