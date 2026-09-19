"""
Corridors handler — CRUD for corridors and their utilities.
"""
import os, json, uuid, boto3, math
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

    route = body.get('route', [])
    length_m = _route_length_m(route)

    # Store corridor
    item = {
        'corridorId': corridor_id,
        'sk': 'METADATA',
        'name': name,
        'location': body.get('location', ''),
        'lengthM': length_m,
        'lengthKm': round(length_m / 1000, 2),
        'widthM': float(body.get('widthM', 15)),
        'roadType': body.get('roadType', 'ARTERIAL'),
        'notes': body.get('notes', ''),
        'route': json.dumps(route),
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
            'label': 'BESCOM 11kV Feeder',
            'depthM': 1.0, 'horizontalOffsetM': -3.5,
            'capacityPercent': 74, 'owner': 'BESCOM',
            'status': 'EXISTING',
            'specs': {'voltage': '11kV', 'cableType': 'XLPE armoured', 'diameter': '95mm'},
        },
        'water': {
            'utilityId': f'util-water-{corridor_id[:8]}',
            'type': 'water',
            'label': 'BWSSB Water Distribution Main (300mm)',
            'depthM': 0.9, 'horizontalOffsetM': -1.2,
            'capacityPercent': 61, 'owner': 'BWSSB',
            'status': 'EXISTING',
            'specs': {'material': 'Ductile Iron', 'diameter': '300mm', 'pressure': '5.5 bar'},
        },
        'gas': {
            'utilityId': f'util-gas-{corridor_id[:8]}',
            'type': 'gas',
            'label': 'GAIL Gas MDPE Main',
            'depthM': 0.75, 'horizontalOffsetM': 1.0,
            'capacityPercent': 82, 'owner': 'GAIL Gas Bengaluru',
            'status': 'EXISTING',
            'specs': {'material': 'MDPE', 'diameter': '180mm', 'pressure': '75 mbar'},
        },
        'fiber': {
            'utilityId': f'util-fiber-{corridor_id[:8]}',
            'type': 'fiber',
            'label': 'Bengaluru Fiber Duct',
            'depthM': 0.6, 'horizontalOffsetM': -5.0,
            'capacityPercent': 45, 'owner': 'Bengaluru Fiber Grid',
            'status': 'PLANNED',
            'specs': {'cores': '48-core', 'type': 'Single-mode fiber'},
        },
        'drainage': {
            'utilityId': f'util-drain-{corridor_id[:8]}',
            'type': 'drainage',
            'label': 'BBMP Storm Water Drain (600mm)',
            'depthM': 1.8, 'horizontalOffsetM': 3.2,
            'capacityPercent': 44, 'owner': 'BBMP SWD',
            'status': 'EXISTING',
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


def _route_length_m(route: list) -> int:
    total = 0
    for idx in range(1, len(route or [])):
      total += _haversine(route[idx - 1], route[idx])
    return round(total)


def _haversine(a: list, b: list) -> float:
    radius_m = 6371000
    lat1, lng1 = math.radians(float(a[0])), math.radians(float(a[1]))
    lat2, lng2 = math.radians(float(b[0])), math.radians(float(b[1]))
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    value = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    return 2 * radius_m * math.atan2(math.sqrt(value), math.sqrt(1 - value))
