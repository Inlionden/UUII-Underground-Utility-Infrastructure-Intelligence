"""
UtilitySync Planning API — Lambda Handler (Router)
Routes all API Gateway events to the correct handler module.
"""
import json
import traceback
from handlers import corridors, analysis, projects, construction, contractors, digital_twin


def lambda_handler(event, context):
    """Main router — maps HTTP method + path to handler."""
    method = event.get('httpMethod', 'GET')
    path   = event.get('path', '/')
    params = event.get('pathParameters') or {}

    try:
        body = json.loads(event.get('body') or '{}')
    except (json.JSONDecodeError, TypeError):
        body = {}

    try:
        # ── Corridors ──────────────────────────────────
        if path == '/corridors' and method == 'POST':
            result = corridors.create(body)

        elif path == '/corridors' and method == 'GET':
            result = corridors.list_all()

        elif path.startswith('/corridors/') and method == 'GET' and '/analyze' not in path:
            result = corridors.get(params['corridorId'])

        elif path.endswith('/analyze') and method == 'POST':
            result = analysis.run(params['corridorId'])

        # ── Projects ────────────────────────────────────
        elif path == '/projects' and method == 'POST':
            result = projects.create(body)

        elif path.startswith('/projects/') and method == 'GET' and '/construction-plan' not in path:
            result = projects.get(params['projectId'])

        elif path.startswith('/projects/') and method == 'PUT':
            result = projects.update(params['projectId'], body)

        elif path.endswith('/complete') and method == 'POST':
            result = projects.complete(params['projectId'])

        elif path.endswith('/construction-plan') and method == 'GET':
            result = construction.generate(params['projectId'])

        # ── Contractors ──────────────────────────────────
        elif path == '/contractors' and method == 'GET':
            result = contractors.list_all()

        elif path.startswith('/contractors/match/') and method == 'GET':
            result = contractors.match(params['projectId'])

        # ── Digital Twin ─────────────────────────────────
        elif path.startswith('/digital-twin/') and method == 'GET' and '/simulate' not in path:
            result = digital_twin.get(params['corridorId'])

        elif path.endswith('/simulate') and method == 'POST':
            result = digital_twin.simulate(params['corridorId'], body)

        # ── Not Found ────────────────────────────────────
        else:
            return _response(404, {'error': f'Route not found: {method} {path}'})

        return _response(200, result)

    except ValueError as e:
        return _response(400, {'error': str(e)})
    except KeyError as e:
        return _response(404, {'error': f'Resource not found: {e}'})
    except Exception as e:
        traceback.print_exc()
        return _response(500, {'error': 'Internal server error', 'detail': str(e)})


def _response(status_code: int, body: dict) -> dict:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        },
        'body': json.dumps(body, default=str),
    }
