"""
Projects handler — CRUD for utility projects.
"""
import os, uuid, boto3, json
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['PROJECTS_TABLE'])
utilities_table = dynamodb.Table(os.environ['UTILITIES_TABLE'])
twin_table = dynamodb.Table(os.environ['TWIN_TABLE'])


def create(body: dict) -> dict:
    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    item = {
        'projectId':    project_id,
        'sk':           'METADATA',
        'corridorId':   body.get('corridorId', ''),
        'utilityType':  body.get('utilityType', ''),
        'lengthM':      int(body.get('lengthM', 0)),
        'pipeSize':     body.get('pipeSize', ''),
        'installMethod':body.get('installMethod', 'open_cut'),
        'bends':        int(body.get('bends', 0)),
        'roadCrossings':int(body.get('roadCrossings', 0)),
        'targetDepthM': float(body.get('targetDepthM', 0.6)),
        'constraints':  body.get('constraints', ''),
        'timeline':     body.get('timeline', '3m'),
        'status':       'PLANNED',
        'requirements': json.dumps(body.get('requirements', {})),
        'dependencies': json.dumps(body.get('dependencies', [])),
        'createdAt':    now,
        'updatedAt':    now,
    }
    table.put_item(Item=item)
    return _clean(item)


def get(project_id: str) -> dict:
    resp = table.get_item(Key={'projectId': project_id, 'sk': 'METADATA'})
    item = resp.get('Item')
    if not item:
        raise KeyError(f'Project {project_id} not found')
    return _clean(item)


def update(project_id: str, body: dict) -> dict:
    item = get(project_id)
    item.update(body)
    item['projectId'] = project_id
    item['sk'] = 'METADATA'
    item['updatedAt'] = datetime.now(timezone.utc).isoformat()
    if not isinstance(item.get('requirements'), str):
        item['requirements'] = json.dumps(item.get('requirements', {}))
    if not isinstance(item.get('dependencies'), str):
        item['dependencies'] = json.dumps(item.get('dependencies', []))
    table.put_item(Item=item)
    if str(item.get('status', '')).upper() == 'COMPLETED':
        _apply_completed_project(_clean(item))
    return _clean(item)


def complete(project_id: str) -> dict:
    return update(project_id, {
        'status': 'COMPLETED',
        'completedAt': datetime.now(timezone.utc).isoformat(),
    })


def _apply_completed_project(project: dict) -> None:
    utility_id = f"util-{project['projectId']}"
    utility = {
        'corridorId': project['corridorId'],
        'utilityId': utility_id,
        'projectId': project['projectId'],
        'type': project.get('utilityType', 'utility'),
        'label': f"{project.get('name', project['projectId'])} As-Built Asset",
        'owner': 'Project owner',
        'status': 'COMPLETED',
        'lifecycleState': 'COMPLETED',
        'depthM': float(project.get('targetDepthM') or 1),
        'horizontalOffsetM': 0,
        'capacityPercent': 0,
        'lengthM': int(project.get('lengthM') or 0),
        'installDate': project.get('completedAt'),
        'specs': {'sourceProject': project['projectId'], 'method': project.get('installMethod'), 'size': project.get('pipeSize')},
        'notes': 'Created by project completion flow.',
    }
    utilities_table.put_item(Item=utility)
    twin_table.put_item(Item={
        'corridorId': project['corridorId'],
        'elementId': f"twin-{utility_id}",
        'utilityId': utility_id,
        'projectId': project['projectId'],
        'type': project.get('utilityType', 'utility'),
        'assetType': 'utility',
        'label': utility['label'],
        'depthM': utility['depthM'],
        'horizontalOffsetM': 0,
        'owner': utility['owner'],
        'installDate': utility['installDate'],
        'lifecycleState': 'COMPLETED',
        'condition': 'NEW',
        'capacity': json.dumps({'total': 100, 'used': 0, 'unit': '%'}),
        'availableFutureCapacity': '100% headroom',
        'specs': json.dumps(utility['specs']),
        'notes': utility['notes'],
    })


def _clean(item: dict) -> dict:
    result = {k: v for k, v in item.items() if k != 'sk'}
    for field, fallback in [('requirements', {}), ('dependencies', [])]:
        if isinstance(result.get(field), str):
            try:
                result[field] = json.loads(result[field])
            except Exception:
                result[field] = fallback
    return result
