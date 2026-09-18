"""
Corridor Tools — called by the Strands Agent to retrieve live corridor data.
"""
import os, json, boto3
from strands import tool
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')


@tool
def analyze_corridor(corridor_id: str) -> str:
    """
    Retrieve the current analysis results for a given corridor,
    including conflicts, capacity assessments, and duct recommendations.

    Args:
        corridor_id: The unique identifier of the corridor to analyze.

    Returns:
        A JSON string containing the full corridor analysis.
    """
    try:
        corridors_table  = dynamodb.Table(os.environ['CORRIDORS_TABLE'])
        utilities_table  = dynamodb.Table(os.environ['UTILITIES_TABLE'])

        corr_resp = corridors_table.get_item(
            Key={'corridorId': corridor_id, 'sk': 'METADATA'}
        )
        corridor = corr_resp.get('Item', {})

        util_resp = utilities_table.query(
            KeyConditionExpression=Key('corridorId').eq(corridor_id)
        )
        utilities = util_resp.get('Items', [])

        return json.dumps({
            'corridor': {k: v for k, v in corridor.items() if k != 'sk'},
            'utilities': utilities,
            'utilityCount': len(utilities),
            'utilityTypes': [u.get('type') for u in utilities],
        }, default=str)
    except Exception as e:
        return json.dumps({'error': str(e)})


@tool
def get_corridor_state(corridor_id: str) -> str:
    """
    Get a concise summary of the current state of a corridor,
    suitable for answering questions about what's underground.

    Args:
        corridor_id: The corridor to summarize.

    Returns:
        A human-readable summary of the corridor state.
    """
    try:
        utilities_table = dynamodb.Table(os.environ['UTILITIES_TABLE'])
        util_resp = utilities_table.query(
            KeyConditionExpression=Key('corridorId').eq(corridor_id)
        )
        utilities = util_resp.get('Items', [])

        lines = [f'Corridor {corridor_id} contains {len(utilities)} utilities:']
        for u in utilities:
            cap = u.get('capacityPercent', '?')
            lines.append(
                f"- {u.get('label', u.get('type'))}: depth={u.get('depthM')}m, "
                f"capacity={cap}%, owner={u.get('owner', 'unknown')}"
            )
        return '\n'.join(lines)
    except Exception as e:
        return f'Error fetching corridor state: {e}'
