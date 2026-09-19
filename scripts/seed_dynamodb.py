"""
UtilitySync — Seed DynamoDB Tables
Seeds all tables with deterministic Bengaluru data from data/seed/ JSON files.

Usage:
    python3 scripts/seed_dynamodb.py [--region ap-south-1]
"""
import json, os, sys, argparse, pathlib
import boto3
from decimal import Decimal

BASE_DIR = pathlib.Path(__file__).parent.parent

def decimal_encode(obj):
    """Convert floats to Decimal for DynamoDB."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: decimal_encode(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [decimal_encode(i) for i in obj]
    return obj

def seed_corridors(dynamodb, region):
    data = json.loads((BASE_DIR / 'data/seed/corridors.json').read_text())
    table_c = dynamodb.Table('utilitysync-corridors')
    table_u = dynamodb.Table('utilitysync-utilities')

    for raw_corridor in data['corridors']:
        corridor = dict(raw_corridor)
        utilities = corridor.pop('utilities', [])
        corridor_item = {
            'corridorId': corridor['corridorId'],
            'sk': 'METADATA',
            'route': json.dumps(corridor.pop('route', [])),
            **corridor
        }
        table_c.put_item(Item=decimal_encode(corridor_item))
        print(f"  ✅ Corridor: {corridor.get('name', corridor['corridorId'])}")

        for util in utilities:
            util_item = {
                'corridorId': corridor['corridorId'],
                **util
            }
            table_u.put_item(Item=decimal_encode(util_item))
            print(f"    ✅ Utility: {util.get('label', util['utilityId'])}")

def seed_projects(dynamodb, region):
    path = BASE_DIR / 'data/seed/projects.json'
    if not path.exists():
        print('  ⚠️  No data/seed/projects.json found; skipping projects.')
        return

    data = json.loads(path.read_text())
    table = dynamodb.Table('utilitysync-projects')

    for project in data.get('projects', []):
        item = {
            'projectId': project['projectId'],
            'sk': 'METADATA',
            **project,
            'requirements': json.dumps(project.get('requirements', {})),
            'dependencies': json.dumps(project.get('dependencies', [])),
        }
        table.put_item(Item=decimal_encode(item))
        print(f"  ✅ Project: {project.get('name', project['projectId'])}")

def seed_contractors(dynamodb, region):
    data = json.loads((BASE_DIR / 'data/seed/contractors.json').read_text())
    table = dynamodb.Table('utilitysync-contractors')

    for contractor in data['contractors']:
        item = {
            'contractorId': contractor['contractorId'],
            'sk': 'PROFILE',
            **contractor,
            # Serialize complex lists to JSON strings for DynamoDB
            'equipment':      json.dumps(contractor.get('equipment', [])),
            'certifications': json.dumps(contractor.get('certifications', [])),
            'crewTypes':      json.dumps(contractor.get('crewTypes', [])),
            'previousProjects': json.dumps(contractor.get('previousProjects', [])),
            'methods':        json.dumps(contractor.get('methods', [])),
            'utilityExperience': json.dumps(contractor.get('utilityExperience', [])),
            'currentProjectAssignments': json.dumps(contractor.get('currentProjectAssignments', [])),
            'gaps':           json.dumps(contractor.get('gaps', [])),
        }
        table.put_item(Item=decimal_encode(item))
        print(f"  ✅ Contractor: {contractor['name']}")

def seed_digital_twin(dynamodb, region):
    data = json.loads((BASE_DIR / 'data/seed/digital_twin.json').read_text())
    twins = data.get('digitalTwins') or [data['digitalTwin']]
    table = dynamodb.Table('utilitysync-digital-twin')

    for twin in twins:
        for element in twin['elements']:
            item = {
                'corridorId': twin['corridorId'],
                **element,
                'capacity': json.dumps(element.get('capacity', {})),
                'specs':    json.dumps(element.get('specs', {})),
            }
            table.put_item(Item=decimal_encode(item))
            print(f"  ✅ Twin element: {element['label']}")

def main():
    parser = argparse.ArgumentParser(description='Seed UtilitySync DynamoDB tables')
    parser.add_argument('--region', default='ap-south-1')
    args = parser.parse_args()

    print(f"\n🌱 Seeding UtilitySync DynamoDB tables (region: {args.region})")
    dynamodb = boto3.resource('dynamodb', region_name=args.region)

    print('\n📍 Corridors + Utilities...')
    seed_corridors(dynamodb, args.region)

    print('\n🏗️ Projects...')
    seed_projects(dynamodb, args.region)

    print('\n👷 Contractors...')
    seed_contractors(dynamodb, args.region)

    print('\n🌐 Digital Twin...')
    seed_digital_twin(dynamodb, args.region)

    print('\n✅ All tables seeded successfully!')

if __name__ == '__main__':
    main()
