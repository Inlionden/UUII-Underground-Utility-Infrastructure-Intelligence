"""
Contractors handler — list and match contractors against project requirements.
"""
import os, json, boto3
from boto3.dynamodb.conditions import Key
from handlers.projects import get as get_project

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['CONTRACTORS_TABLE'])

DEFAULT_REQUIREMENTS = {
    'fiber': {
        'equipment': [{'category': 'hdd_rig', 'name': 'HDD rig', 'qty': 1}, {'category': 'cable_blowing', 'name': 'Cable blowing unit', 'qty': 1}],
        'certifications': ['BBMP Road Cutting Permit', 'OFC Splicing Certification'],
        'methods': ['hdd'],
        'utilityExperience': ['fiber'],
        'minWorkers': 12,
        'crewTypes': [{'type': 'fiber_splicer', 'count': 3}, {'type': 'civil', 'count': 4}],
    },
    'electricity': {
        'equipment': [{'category': 'cable_pulling', 'name': 'HV cable puller', 'qty': 1}],
        'certifications': ['BESCOM Electrical Works Approval', 'BBMP Road Cutting Permit'],
        'methods': ['open_cut'],
        'utilityExperience': ['electricity'],
        'minWorkers': 12,
        'crewTypes': [{'type': 'electrician', 'count': 4}, {'type': 'civil', 'count': 4}],
    },
    'water': {
        'equipment': [{'category': 'pipe_laying', 'name': 'Pipe laying equipment', 'qty': 1}],
        'certifications': ['BWSSB Water Works Approval', 'BBMP Road Cutting Permit'],
        'methods': ['open_cut'],
        'utilityExperience': ['water'],
        'minWorkers': 10,
        'crewTypes': [{'type': 'civil', 'count': 6}],
    },
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
        for field in ['equipment', 'certifications', 'crewTypes', 'methods', 'utilityExperience', 'currentProjectAssignments', 'previousProjects', 'gaps']:
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
    requirements = _requirements(project)

    contractor_data = list_all()['contractors']
    matched = [_match_one(c, project, requirements) for c in contractor_data]
    matched.sort(key=lambda x: (not x['eligible'], -x['matchScore']))

    return {
        'projectId':            project_id,
        'projectRequirements':  _requirement_labels(requirements),
        'contractors':          matched,
    }


def _requirements(project: dict) -> dict:
    req = project.get('requirements') or {}
    if isinstance(req, str):
        try:
            req = json.loads(req)
        except Exception:
            req = {}
    return req or DEFAULT_REQUIREMENTS.get(project.get('utilityType', 'fiber'), DEFAULT_REQUIREMENTS['fiber'])


def _norm(value):
    return ''.join(ch if ch.isalnum() else ' ' for ch in str(value or '').lower()).strip()


def _available_workers(c):
    return max(0, int(c.get('totalWorkers') or c.get('employees') or 0) - int(c.get('workersAssigned') or 0))


def _available_crew(c, crew_type):
    for crew in c.get('crewTypes') or []:
        if _norm(crew.get('type')) == _norm(crew_type):
            return max(0, int(crew.get('count') or 0) - int(crew.get('assigned') or 0))
    return 0


def _available_equipment(c, category):
    count = 0
    for item in c.get('equipment') or []:
        caps = item.get('capabilities') or [item.get('category')]
        matches = _norm(item.get('category')) == _norm(category) or any(_norm(cap) == _norm(category) for cap in caps)
        free = str(item.get('status', 'AVAILABLE')).upper() == 'AVAILABLE' and not item.get('assignedProjectId')
        if matches and free:
            count += int(item.get('count') or 1)
    return count


def _cert_met(c, cert_name):
    needle = _norm(cert_name)
    for cert in c.get('certifications') or []:
        hay = _norm(cert.get('name'))
        if str(cert.get('status', '')).upper() == 'VALID' and (needle in hay or hay in needle):
            return True
    return False


def _ratio(actual, required):
    return 1 if not required else max(0, min(1, actual / required))


def _match_one(c, project, req):
    requirements = []
    missing = []
    met = []

    def add(name, ok, detail, partial=False):
        status = 'ok' if ok else 'partial' if partial else 'missing'
        requirements.append({'name': name, 'status': status, 'detail': detail})
        (met if ok else missing).append(name)

    for equipment in req.get('equipment', []):
        available = _available_equipment(c, equipment.get('category'))
        required = int(equipment.get('qty') or 1)
        add(equipment.get('name') or equipment.get('category'), available >= required, f'{available} available / {required} required', available > 0)

    for cert in req.get('certifications', []):
        add(cert, _cert_met(c, cert), 'Valid certification on file' if _cert_met(c, cert) else 'Valid certification not found')

    methods = [_norm(m) for m in c.get('methods') or []]
    for method in req.get('methods', []):
        add(f'{method} method capability', _norm(method) in methods, 'Method capability check')

    utility_exp = [_norm(t) for t in c.get('utilityExperience') or []]
    for util_type in req.get('utilityExperience', []):
        add(f'{util_type} utility experience', _norm(util_type) in utility_exp, 'Utility experience check')

    min_workers = int(req.get('minWorkers') or 0)
    add('Available workforce', _available_workers(c) >= min_workers, f'{_available_workers(c)} available / {min_workers} required')

    for crew in req.get('crewTypes', []):
        available = _available_crew(c, crew.get('type'))
        required = int(crew.get('count') or 0)
        add(f'{crew.get("type")} crew', available >= required, f'{available} available / {required} required', available > 0)

    workload = round((int(c.get('workersAssigned') or 0) / max(1, int(c.get('totalWorkers') or c.get('employees') or 0))) * 100)
    workload_ok = workload <= 75
    eligible = not missing and workload_ok

    equipment_score = _ratio(sum(min(_available_equipment(c, e.get('category')), int(e.get('qty') or 1)) for e in req.get('equipment', [])), sum(int(e.get('qty') or 1) for e in req.get('equipment', [])))
    cert_score = _ratio(sum(1 for cert in req.get('certifications', []) if _cert_met(c, cert)), len(req.get('certifications', [])))
    method_score = _ratio(sum(1 for method in req.get('methods', []) if _norm(method) in methods), len(req.get('methods', [])))
    exp_score = _ratio(sum(1 for util_type in req.get('utilityExperience', []) if _norm(util_type) in utility_exp), len(req.get('utilityExperience', [])))
    workforce_score = _ratio(_available_workers(c), min_workers)
    raw_score = round(equipment_score * 30 + cert_score * 20 + method_score * 15 + exp_score * 15 + workforce_score * 15 + max(0, 1 - workload / 100) * 5)
    score = min(98, raw_score) if eligible else min(49, raw_score)
    verdict = 'RECOMMENDED' if eligible and score >= 85 else 'ELIGIBLE' if eligible else 'NOT ELIGIBLE'

    return {
        **{k: v for k, v in c.items() if k not in ('previousProjects', 'gaps')},
        'eligible': eligible,
        'eligibilityStatus': 'ELIGIBLE' if eligible else 'NOT_ELIGIBLE',
        'matchScore': score,
        'verdict': verdict,
        'verdictColor': 'success' if eligible and score >= 85 else 'warning' if eligible else 'danger',
        'verdictIcon': 'OK' if eligible else 'X',
        'requirements': requirements,
        'metRequirements': met,
        'missingRequirements': missing,
        'workforceAvailability': {'totalWorkers': int(c.get('totalWorkers') or c.get('employees') or 0), 'assignedWorkers': int(c.get('workersAssigned') or 0), 'availableWorkers': _available_workers(c), 'requiredWorkers': min_workers},
        'equipmentAvailability': [{'category': e.get('category'), 'required': int(e.get('qty') or 1), 'available': _available_equipment(c, e.get('category'))} for e in req.get('equipment', [])],
        'workloadConstraints': {'workloadPercent': workload, 'status': 'OK' if workload_ok else 'OVERLOADED', 'maxRecommendedPercent': 75},
        'narrative': _narrative(c, project, missing, eligible, score),
    }


def _requirement_labels(req):
    return [f"{e.get('name', e.get('category'))} x {e.get('qty', 1)}" for e in req.get('equipment', [])] + list(req.get('certifications', [])) + [f'{m} method' for m in req.get('methods', [])] + [f'{t} experience' for t in req.get('utilityExperience', [])] + [f"{req.get('minWorkers', 0)} available workers"]


def _narrative(c, project, missing, eligible, score):
    if eligible:
        return f"{c.get('name')} is eligible for {project.get('name', project.get('projectId'))}. Score {score}% is calculated from equipment, certifications, experience, workforce, available equipment, and workload."
    return f"{c.get('name')} is not eligible for {project.get('name', project.get('projectId'))}: {', '.join(missing[:4])}. Mandatory failures are not overridden by the {score}% calculated score."
