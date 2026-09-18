"""
UtilitySync AI Agent Lambda Handler
Routes chat requests to the Strands Agent.
"""
import json
from agent import utilitysync_agent


def lambda_handler(event, context):
    """Handle /agent/chat POST requests."""
    try:
        body = json.loads(event.get('body') or '{}')
        message = body.get('message', '').strip()
        ctx     = body.get('context', {})

        if not message:
            return _response(400, {'error': 'message is required'})

        # Build context string for the agent
        context_str = _build_context(ctx)
        full_prompt = f"{context_str}\n\nUser question: {message}"

        result = utilitysync_agent(full_prompt)
        response_text = str(result)

        return _response(200, {'response': response_text, 'message': message})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return _response(500, {'error': 'Agent error', 'detail': str(e)})


def _build_context(ctx: dict) -> str:
    parts = ['[UtilitySync Context]']
    if ctx.get('currentPhase'):
        phases = {1:'Create Corridor', 2:'Analyze Corridor', 3:'Plan Utility',
                  4:'Construction Plan', 5:'Contractor Readiness', 6:'Digital Twin'}
        parts.append(f"Current phase: Phase {ctx['currentPhase']} — {phases.get(ctx['currentPhase'], '')}")
    if ctx.get('corridorId'):
        parts.append(f"Active corridor ID: {ctx['corridorId']}")
    if ctx.get('projectId'):
        parts.append(f"Active project ID: {ctx['projectId']}")
    return '\n'.join(parts)


def _response(status: int, body: dict) -> dict:
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        'body': json.dumps(body, default=str),
    }
