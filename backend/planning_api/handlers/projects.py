"""
Projects handler — CRUD for utility projects.
"""
import os, uuid, boto3
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['PROJECTS_TABLE'])


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
        'createdAt':    now,
        'updatedAt':    now,
    }
    table.put_item(Item=item)
    return {k: v for k, v in item.items() if k != 'sk'}


def get(project_id: str) -> dict:
    resp = table.get_item(Key={'projectId': project_id, 'sk': 'METADATA'})
    item = resp.get('Item')
    if not item:
        raise KeyError(f'Project {project_id} not found')
    return {k: v for k, v in item.items() if k != 'sk'}
