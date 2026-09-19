"""
UtilitySync AI Agent Lambda Handler
Routes chat requests to the Strands Agent.
"""
import json, os

AI_PROVIDER = os.environ.get('AI_PROVIDER', 'aws').lower()
AWS_ENABLED = os.environ.get('AWS_ENABLED', 'true').lower() == 'true'

if AI_PROVIDER == 'aws' and AWS_ENABLED:
    from agent import utilitysync_agent
else:
    utilitysync_agent = None


def lambda_handler(event, context):
    """Handle /agent/chat POST requests."""
    try:
        body = json.loads(event.get('body') or '{}')
        message = body.get('message', '').strip()
        ctx     = body.get('context', {})

        if not message:
            return _response(400, {'error': 'message is required'})

        context_str = _build_context(ctx)
        full_prompt = f"{context_str}\n\nUser question: {message}"

        if utilitysync_agent:
            result = utilitysync_agent(full_prompt)
            response_text = str(result)
        else:
            response_text = _local_response(message, ctx)

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


def _local_response(message: str, ctx: dict) -> str:
    phase = ctx.get('currentPhase')
    corridor_id = ctx.get('corridorId', 'the selected corridor')
    project_id = ctx.get('projectId', 'the selected project')
    q = message.lower()
    if 'contractor' in q:
        return (
            f'Local Contractor Agent: use the deterministic contractor matching endpoint for project {project_id}. '
            'It checks equipment, certifications, methods, utility experience, workforce, crew availability, equipment availability, and workload before assigning a score.'
        )
    if 'fix' in q or 'resolve' in q:
        return (
            'Local Resolution Agent: change the underlying route, utility depth/offset, capacity, dependency, reserved asset, or contractor record, then rerun analysis. '
            'Alerts are not manually dismissed.'
        )
    if 'knowledge' in q or 'rag' in q:
        return (
            'Local Knowledge Assistant: use the bundled knowledge documents. AWS mode can route the same capability through S3, OpenSearch, and Bedrock Knowledge Base.'
        )
    return (
        f'Local Infrastructure Analysis Agent: inspect project {project_id}, corridor {corridor_id}, deterministic analysis, alerts, and digital twin state. '
        f'Current phase: {phase}. AWS/Bedrock is not required for deterministic operations.'
    )


def _response(status: int, body: dict) -> dict:
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        'body': json.dumps(body, default=str),
    }
