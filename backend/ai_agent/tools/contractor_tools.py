"""
Contractor tools for the Strands Agent.
"""
import os, json, boto3
from strands import tool
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')


@tool
def match_contractor(project_id: str, contractor_id: str) -> str:
    """
    Compare a specific contractor's capabilities against a project's requirements.
    Returns a detailed match analysis explaining what is met and what is missing.

    Args:
        project_id:    The project to match against.
        contractor_id: The contractor to evaluate.

    Returns:
        A detailed match explanation including gaps and recommendations.
    """
    try:
        projects_table    = dynamodb.Table(os.environ['PROJECTS_TABLE'])
        contractors_table = dynamodb.Table(os.environ['CONTRACTORS_TABLE'])

        proj_resp = projects_table.get_item(
            Key={'projectId': project_id, 'sk': 'METADATA'}
        )
        project = proj_resp.get('Item', {})

        contr_resp = contractors_table.get_item(
            Key={'contractorId': contractor_id, 'sk': 'PROFILE'}
        )
        contractor = contr_resp.get('Item', {})

        if not project or not contractor:
            return json.dumps({'error': 'Project or contractor not found'})

        util_type = project.get('utilityType', 'fiber')
        name = contractor.get('name', contractor_id)

        equipment = contractor.get('equipment', [])
        if isinstance(equipment, str):
            equipment = json.loads(equipment)

        certs = contractor.get('certifications', [])
        if isinstance(certs, str):
            certs = json.loads(certs)

        gaps = contractor.get('gaps', [])
        if isinstance(gaps, str):
            gaps = json.loads(gaps)

        eq_names   = [e.get('name', '') for e in equipment]
        cert_names = [c.get('name', '') for c in certs]

        summary = (
            f"Contractor match analysis: {name} for {util_type} project {project_id}\n\n"
            f"Equipment ({len(eq_names)} items):\n"
            + '\n'.join(f"  ✓ {e}" for e in eq_names[:5])
            + f"\n\nCertifications ({len(cert_names)}):\n"
            + '\n'.join(f"  ✓ {c}" for c in cert_names)
        )

        if gaps:
            critical = [g for g in gaps if g.get('severity') == 'CRITICAL']
            if critical:
                summary += f"\n\nCritical gaps ({len(critical)}):\n"
                for g in critical:
                    summary += f"  ✗ {g.get('requirement')}: {g.get('reason')}\n"
        else:
            summary += "\n\nNo significant gaps identified."

        return summary
    except Exception as e:
        return f'Error matching contractor: {e}'


@tool
def explain_contractor_gap(contractor_name: str, requirement: str) -> str:
    """
    Explain in plain language why a specific requirement is critical
    and what options exist if a contractor cannot meet it.

    Args:
        contractor_name: Name of the contractor being assessed.
        requirement:     The specific requirement that may be unmet.

    Returns:
        Plain-language explanation of the gap and mitigation options.
    """
    explanations = {
        'hdd': (
            f'{contractor_name} does not have Horizontal Directional Drilling (HDD) capability. '
            'HDD is required to bore under roads and obstacles without open-cut excavation. '
            'Without it, all road crossings must be open-cut — which is often prohibited on primary roads. '
            'Mitigation: Sub-contract HDD specialist for crossing sections only, or exclude this contractor from projects requiring crossings.'
        ),
        'fiber': (
            f'{contractor_name} lacks City & Guilds Fiber Optic certification. '
            'Fiber splicing requires specialist certification — unspliced or poorly spliced fiber '
            'will fail OTDR testing and cause signal loss. '
            'Mitigation: Sub-contract splicing to a certified firm. Note this adds coordination risk.'
        ),
        'vacuum': (
            f'{contractor_name} does not own vacuum excavation equipment. '
            'Vacuum excavators are required for safe digging near gas mains — '
            'mechanical excavation within 3m of a gas main without Vac-Ex is an HSE violation. '
            'Mitigation: Equipment hire is widely available — check local availability before excluding contractor.'
        ),
    }

    req_lower = requirement.lower()
    for key, explanation in explanations.items():
        if key in req_lower:
            return explanation

    return (
        f'{contractor_name} does not meet the requirement: {requirement}. '
        'This gap should be assessed against the project scope to determine whether '
        'the missing capability is critical path or can be sub-contracted/hired.'
    )
