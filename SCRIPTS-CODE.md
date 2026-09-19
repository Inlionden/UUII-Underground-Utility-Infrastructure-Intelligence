

# FILE: scripts\.gitkeep
```
```


# FILE: scripts\deploy.sh
```
#!/bin/bash
# UtilitySync — Deploy Script
# Usage: ./scripts/deploy.sh [region] [stage]
#
# Prerequisites:
#   - AWS CLI configured with credentials
#   - AWS SAM CLI installed (pip install aws-sam-cli)
#   - Python 3.11+

set -e

REGION="${1:-us-east-1}"
STAGE="${2:-prod}"
STACK_NAME="utilitysync-backend"
S3_BUCKET="utilitysync-sam-artifacts-$(aws sts get-caller-identity --query Account --output text)"

echo "=========================================="
echo "  UtilitySync Deployment"
echo "  Region: $REGION | Stage: $STAGE"
echo "=========================================="

# ── Step 1: Create SAM artifacts bucket if needed
echo ""
echo "1. Ensuring SAM artifacts bucket..."
aws s3 mb "s3://$S3_BUCKET" --region "$REGION" 2>/dev/null || true

# ── Step 2: SAM Build
echo ""
echo "2. Building Lambda packages..."
cd "$(dirname "$0")/.."
sam build --template-file backend/template.yaml --build-dir .aws-sam/build

# ── Step 3: SAM Deploy
echo ""
echo "3. Deploying to AWS CloudFormation..."
sam deploy \
  --template-file .aws-sam/build/template.yaml \
  --stack-name "$STACK_NAME" \
  --s3-bucket "$S3_BUCKET" \
  --region "$REGION" \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides Stage="$STAGE" \
  --no-confirm-changeset \
  --resolve-s3

# ── Step 4: Get outputs
echo ""
echo "4. Getting deployment outputs..."
API_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

KB_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`KnowledgeBucketName`].OutputValue' \
  --output text)

echo ""
echo "✅ Backend deployed successfully!"
echo ""
echo "  API Endpoint: $API_URL"
echo "  Knowledge Bucket: $KB_BUCKET"

# ── Step 5: Seed DynamoDB
echo ""
echo "5. Seeding DynamoDB with demo data..."
python3 scripts/seed_dynamodb.py --region "$REGION"

# ── Step 6: Upload knowledge base docs to S3
echo ""
echo "6. Uploading knowledge base documents to S3..."
aws s3 sync data/knowledge_base/ "s3://$KB_BUCKET/docs/" --region "$REGION"
echo "   ✅ Knowledge documents uploaded"

# ── Step 7: Update frontend config
echo ""
echo "7. Update frontend config:"
echo "   Open frontend/js/config.js and set:"
echo "   USE_MOCK_API: false"
echo "   API_BASE_URL: '$API_URL'"

echo ""
echo "=========================================="
echo "  UtilitySync Backend Ready!"
echo "  Next: Set up Bedrock Knowledge Base"
echo "  Run: python3 scripts/setup_knowledge_base.py --region $REGION --bucket $KB_BUCKET"
echo "=========================================="
```


# FILE: scripts\seed_dynamodb.py
```
"""
UtilitySync — Seed DynamoDB Tables
Seeds all tables with demo data from data/seed/ JSON files.

Usage:
    python3 scripts/seed_dynamodb.py [--region us-east-1]
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

    for corridor in data['corridors']:
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
            'gaps':           json.dumps(contractor.get('gaps', [])),
        }
        table.put_item(Item=decimal_encode(item))
        print(f"  ✅ Contractor: {contractor['name']}")

def seed_digital_twin(dynamodb, region):
    data = json.loads((BASE_DIR / 'data/seed/digital_twin.json').read_text())
    twin = data['digitalTwin']
    table = dynamodb.Table('utilitysync-digital-twin')

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
    parser.add_argument('--region', default='us-east-1')
    args = parser.parse_args()

    print(f"\n🌱 Seeding UtilitySync DynamoDB tables (region: {args.region})")
    dynamodb = boto3.resource('dynamodb', region_name=args.region)

    print('\n📍 Corridors + Utilities...')
    seed_corridors(dynamodb, args.region)

    print('\n👷 Contractors...')
    seed_contractors(dynamodb, args.region)

    print('\n🌐 Digital Twin...')
    seed_digital_twin(dynamodb, args.region)

    print('\n✅ All tables seeded successfully!')

if __name__ == '__main__':
    main()
```


# FILE: scripts\setup_knowledge_base.py
```
"""
UtilitySync — Bedrock Knowledge Base Setup
Creates the Knowledge Base pointing to the S3 bucket and OpenSearch Serverless.

Usage:
    python3 scripts/setup_knowledge_base.py --region us-east-1 --bucket BUCKET_NAME

After running, copy the Knowledge Base ID into:
  1. backend/template.yaml → BedrockKBId parameter default value
  2. backend/ai_agent/tools/knowledge_tools.py → BEDROCK_KB_ID env var
"""
import boto3, json, time, argparse

EMBEDDING_MODEL_ARN = (
    "arn:aws:bedrock:{region}::foundation-model/amazon.titan-embed-text-v2:0"
)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--region', default='us-east-1')
    parser.add_argument('--bucket', required=True)
    args = parser.parse_args()

    region = args.region
    bucket = args.bucket

    bedrock_agent = boto3.client('bedrock-agent', region_name=region)
    iam  = boto3.client('iam',  region_name=region)
    aoss = boto3.client('opensearchserverless', region_name=region)

    account_id = boto3.client('sts').get_caller_identity()['Account']

    print(f"\n🧠 Setting up UtilitySync Bedrock Knowledge Base")
    print(f"   Region: {region} | Account: {account_id} | Bucket: {bucket}")

    # ── Step 1: Create IAM role for Bedrock Knowledge Base
    print("\n1. Creating IAM role for Bedrock KB...")
    role_name = 'UtilitySyncBedrockKBRole'
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "bedrock.amazonaws.com"},
            "Action": "sts:AssumeRole",
            "Condition": {
                "StringEquals": {"aws:SourceAccount": account_id}
            }
        }]
    }
    try:
        role = iam.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy),
            Description='Role for UtilitySync Bedrock Knowledge Base'
        )
        role_arn = role['Role']['Arn']
        print(f"   Created role: {role_arn}")
    except iam.exceptions.EntityAlreadyExistsException:
        role_arn = iam.get_role(RoleName=role_name)['Role']['Arn']
        print(f"   Using existing role: {role_arn}")

    # Attach S3 and Bedrock permissions
    iam.put_role_policy(
        RoleName=role_name,
        PolicyName='UtilitySyncKBPermissions',
        PolicyDocument=json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": ["s3:GetObject", "s3:ListBucket"],
                    "Resource": [f"arn:aws:s3:::{bucket}", f"arn:aws:s3:::{bucket}/*"]
                },
                {
                    "Effect": "Allow",
                    "Action": ["bedrock:InvokeModel"],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": ["aoss:APIAccessAll"],
                    "Resource": "*"
                }
            ]
        })
    )

    # Brief pause for IAM propagation
    print("   Waiting for IAM role to propagate...")
    time.sleep(10)

    # ── Step 2: Create OpenSearch Serverless Collection
    print("\n2. Creating OpenSearch Serverless collection...")
    collection_name = 'utilitysync-kb'
    try:
        # Create encryption policy
        aoss.create_security_policy(
            name=f'{collection_name}-enc',
            type='encryption',
            policy=json.dumps({
                "Rules": [{"ResourceType": "collection", "Resource": [f"collection/{collection_name}"]}],
                "AWSOwnedKey": True
            })
        )
        # Create network policy (public for demo)
        aoss.create_security_policy(
            name=f'{collection_name}-net',
            type='network',
            policy=json.dumps([{
                "Rules": [
                    {"ResourceType": "collection", "Resource": [f"collection/{collection_name}"]},
                    {"ResourceType": "dashboard",  "Resource": [f"collection/{collection_name}"]}
                ],
                "AllowFromPublic": True
            }])
        )
        # Create data access policy
        aoss.create_access_policy(
            name=f'{collection_name}-data',
            type='data',
            policy=json.dumps([{
                "Rules": [
                    {
                        "ResourceType": "collection",
                        "Resource": [f"collection/{collection_name}"],
                        "Permission": ["aoss:*"]
                    },
                    {
                        "ResourceType": "index",
                        "Resource": [f"index/{collection_name}/*"],
                        "Permission": ["aoss:*"]
                    }
                ],
                "Principal": [role_arn, f"arn:aws:iam::{account_id}:root"]
            }])
        )
        # Create collection
        coll_resp = aoss.create_collection(
            name=collection_name,
            type='VECTORSEARCH',
            description='UtilitySync knowledge base vector store'
        )
        collection_id  = coll_resp['createCollectionDetail']['id']
        collection_arn = coll_resp['createCollectionDetail']['arn']
        print(f"   Collection creating: {collection_id}")

        # Wait for collection to be ACTIVE
        print("   Waiting for collection to become active (this takes 2-5 minutes)...")
        while True:
            status = aoss.batch_get_collection(ids=[collection_id])
            s = status['collectionDetails'][0]['status']
            print(f"   Status: {s}")
            if s == 'ACTIVE':
                endpoint = status['collectionDetails'][0]['collectionEndpoint']
                break
            elif s in ('FAILED', 'DELETING'):
                raise Exception(f'Collection failed: {status}')
            time.sleep(30)

    except aoss.exceptions.ConflictException:
        print("   Collection already exists, fetching endpoint...")
        status = aoss.batch_get_collection(names=[collection_name])
        endpoint = status['collectionDetails'][0]['collectionEndpoint']
        collection_arn = status['collectionDetails'][0]['arn']

    print(f"   Collection endpoint: {endpoint}")

    # ── Step 3: Create Bedrock Knowledge Base
    print("\n3. Creating Bedrock Knowledge Base...")
    kb_resp = bedrock_agent.create_knowledge_base(
        name='utilitysync-knowledge-base',
        description='Technical knowledge base for UtilitySync: utility standards, construction methods, equipment, regulations',
        roleArn=role_arn,
        knowledgeBaseConfiguration={
            'type': 'VECTOR',
            'vectorKnowledgeBaseConfiguration': {
                'embeddingModelArn': EMBEDDING_MODEL_ARN.format(region=region)
            }
        },
        storageConfiguration={
            'type': 'OPENSEARCH_SERVERLESS',
            'opensearchServerlessConfiguration': {
                'collectionArn': collection_arn,
                'vectorIndexName': 'utilitysync-index',
                'fieldMapping': {
                    'vectorField': 'bedrock-knowledge-base-default-vector',
                    'textField':   'AMAZON_BEDROCK_TEXT_CHUNK',
                    'metadataField':'AMAZON_BEDROCK_METADATA'
                }
            }
        }
    )
    kb_id = kb_resp['knowledgeBase']['knowledgeBaseId']
    print(f"   Knowledge Base ID: {kb_id}")

    # ── Step 4: Add S3 data source
    print("\n4. Adding S3 data source...")
    ds_resp = bedrock_agent.create_data_source(
        knowledgeBaseId=kb_id,
        name='utilitysync-docs',
        description='Utility installation standards and construction guides',
        dataSourceConfiguration={
            'type': 'S3',
            's3Configuration': {
                'bucketArn':          f'arn:aws:s3:::{bucket}',
                'inclusionPrefixes':  ['docs/']
            }
        },
        vectorIngestionConfiguration={
            'chunkingConfiguration': {
                'chunkingStrategy': 'FIXED_SIZE',
                'fixedSizeChunkingConfiguration': {
                    'maxTokens':         512,
                    'overlapPercentage': 20
                }
            }
        }
    )
    data_source_id = ds_resp['dataSource']['dataSourceId']
    print(f"   Data Source ID: {data_source_id}")

    # ── Step 5: Start ingestion
    print("\n5. Starting knowledge base ingestion sync...")
    bedrock_agent.start_ingestion_job(
        knowledgeBaseId=kb_id,
        dataSourceId=data_source_id
    )
    print("   Ingestion started — this may take a few minutes")

    # ── Done
    print(f"""
══════════════════════════════════════════════
  Bedrock Knowledge Base Setup Complete!
  Knowledge Base ID: {kb_id}

  Next steps:
  1. Update backend/template.yaml:
     BedrockKBId default: "{kb_id}"
  
  2. Re-deploy the backend:
     ./scripts/deploy.sh {region}

  3. The AI Agent will now search the knowledge
     base for technical questions via RAG.
══════════════════════════════════════════════
""")

if __name__ == '__main__':
    main()
```
