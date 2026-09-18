"""
Contractors handler — list and match contractors against project requirements.
"""
import os, json, boto3
from boto3.dynamodb.conditions import Key
from handlers.projects import get as get_project

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['CONTRACTORS_TABLE'])

# Project requirement profiles per utility type
REQUIREMENTS_BY_TYPE = {
    'fiber': [
        'Horizontal Directional Drilling (HDD) Rig',
        'Cable Pulling / Blowing Unit (fiber)',
        'Vacuum Excavator',
        'NRSWA Streetworks Certification',
        'City & Guilds Fiber Splicing',
        'HDD Operator Certification (IADC)',
        'Gas Proximity Work Certification',
    ],
    'electricity': [
        'HV Cable Pulling Equipment',
        'HV Jointing Capability',
        'Vacuum Excavator',
        'NRSWA Streetworks Certification',
        'DNO Approved HV Jointers',
        'Gas Proximity Work Certification',
    ],
    'water': [
        'Hydraulic Excavator',
        'Pipe Laying Equipment',
        'Fusion Welding Machine',
        'NRSWA Streetworks Certification',
        'Water Fitting Regulations Compliance',
    ],
}


def list_all() -> dict:
    """List all contractor profiles."""
    resp = table.scan(
        FilterExpression='sk = :sk',
        ExpressionAttributeValues={':sk': 'PROFILE'}
    )
    items = resp.get('Items', [])
    contractors = []
    for item in items:
        c = {k: v for k, v in item.items() if k != 'sk'}
        # Parse JSON fields stored as strings
        for field in ['equipment', 'certifications', 'crewTypes']:
            if isinstance(c.get(field), str):
                try:
                    c[field] = json.loads(c[field])
                except Exception:
                    c[field] = []
        contractors.append(c)
    return {'contractors': contractors, 'count': len(contractors)}


def match(project_id: str) -> dict:
    """Compare project requirements against all contractor capabilities."""
    project = get_project(project_id)
    util_type = project.get('utilityType', 'fiber')
    requirements = REQUIREMENTS_BY_TYPE.get(util_type, REQUIREMENTS_BY_TYPE['fiber'])

    contractor_data = list_all()['contractors']
    matched = []

    for c in contractor_data:
        equipment_names = [e.get('name', '') for e in (c.get('equipment') or [])]
        cert_names      = [cert.get('name', '') for cert in (c.get('certifications') or [])]
        all_caps        = ' '.join(equipment_names + cert_names).lower()

        req_results = []
        met_count = 0
        for req in requirements:
            keywords = req.lower().split()
            is_met   = all(kw in all_caps for kw in keywords[:2])
            status   = 'ok' if is_met else 'missing'
            if is_met:
                met_count += 1
            req_results.append({
                'name':   req,
                'status': status,
                'detail': 'Available' if is_met else 'Not found in contractor profile',
            })

        score = round((met_count / len(requirements)) * 100) if requirements else 0

        if score >= 90:
            verdict, v_color, v_icon = 'RECOMMENDED', 'success', '✅'
        elif score >= 60:
            verdict, v_color, v_icon = 'PARTIAL MATCH', 'warning', '⚠️'
        else:
            verdict, v_color, v_icon = 'SIGNIFICANT GAPS', 'danger', '❌'

        matched.append({
            **{k: v for k, v in c.items() if k not in ('equipment','certifications','crewTypes','previousProjects','gaps')},
            'matchScore':   score,
            'verdict':      verdict,
            'verdictColor': v_color,
            'verdictIcon':  v_icon,
            'requirements': req_results,
            'gaps':         c.get('gaps', []),
            'narrative':    _generate_narrative(c, req_results, score),
        })

    matched.sort(key=lambda x: x['matchScore'], reverse=True)

    return {
        'projectId':            project_id,
        'projectRequirements':  requirements,
        'contractors':          matched,
    }


def _generate_narrative(contractor: dict, req_results: list, score: int) -> str:
    name  = contractor.get('name', 'This contractor')
    gaps  = [r for r in req_results if r['status'] == 'missing']
    meets = [r for r in req_results if r['status'] == 'ok']

    if score >= 90:
        return (
            f'{name} is the strongest match for this project. '
            f'They meet {len(meets)} of {len(req_results)} requirements with owned equipment and certified crew. '
            'Recommended as principal contractor.'
        )
    elif score >= 60:
        gap_names = ', '.join(g['name'] for g in gaps[:2])
        return (
            f'{name} meets most requirements but is missing: {gap_names}. '
            'Sub-contracting these elements would add coordination risk and cost. '
            'Suitable if missing items can be hired or sub-contracted.'
        )
    else:
        gap_names = ', '.join(g['name'] for g in gaps[:3])
        return (
            f'{name} is not suitable as principal contractor. '
            f'Critical gaps: {gap_names}. '
            'Significant sub-contracting complexity would be required. '
            'Consider for a specialist sub-package only.'
        )
