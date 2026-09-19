#!/bin/bash
# UtilitySync — Deploy Script
# Usage: ./scripts/deploy.sh [region] [stage]
#
# Prerequisites:
#   - AWS CLI configured with credentials
#   - AWS SAM CLI installed (pip install aws-sam-cli)
#   - Python 3.11+

set -e

REGION="${1:-ap-south-1}"
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
