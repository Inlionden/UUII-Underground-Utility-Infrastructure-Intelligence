

# FILE: backend\.gitkeep
```
```


# FILE: backend\template.yaml
```
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: UtilitySync — Underground Utility Infrastructure Intelligence Backend

# ── Global Defaults ─────────────────────────────────────────────
Globals:
  Function:
    Runtime: python3.11
    MemorySize: 512
    Timeout: 60
    Environment:
      Variables:
        CORRIDORS_TABLE:    !Ref CorridorsTable
        UTILITIES_TABLE:    !Ref UtilitiesTable
        PROJECTS_TABLE:     !Ref ProjectsTable
        CONTRACTORS_TABLE:  !Ref ContractorsTable
        TWIN_TABLE:         !Ref DigitalTwinTable
        KNOWLEDGE_BUCKET:   !Ref KnowledgeBucket
        BEDROCK_KB_ID:      !Ref BedrockKBId
        BEDROCK_MODEL_ID:   "anthropic.claude-3-5-sonnet-20241022-v2:0"
        AWS_ACCOUNT_ID:     !Sub "${AWS::AccountId}"
  Api:
    Cors:
      AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
      AllowHeaders: "'Content-Type,Authorization'"
      AllowOrigin:  "'*'"

# ── Parameters ──────────────────────────────────────────────────
Parameters:
  BedrockKBId:
    Type: String
    Default: "PLACEHOLDER_KB_ID"
    Description: Amazon Bedrock Knowledge Base ID (update after KB is created)

  Stage:
    Type: String
    Default: prod
    AllowedValues: [dev, prod]

# ── Resources ───────────────────────────────────────────────────
Resources:

  # ── API Gateway ─────────────────────────────────────
  UtilitySyncAPI:
    Type: AWS::Serverless::Api
    Properties:
      Name: utilitysync-api
      StageName: !Ref Stage
      Description: UtilitySync REST API

  # ── Planning API Lambda ──────────────────────────────
  PlanningApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: utilitysync-planning-api
      CodeUri: planning_api/
      Handler: app.lambda_handler
      Description: Handles all corridor, project, contractor and twin CRUD + analysis
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref CorridorsTable
        - DynamoDBCrudPolicy:
            TableName: !Ref UtilitiesTable
        - DynamoDBCrudPolicy:
            TableName: !Ref ProjectsTable
        - DynamoDBCrudPolicy:
            TableName: !Ref ContractorsTable
        - DynamoDBCrudPolicy:
            TableName: !Ref DigitalTwinTable
      Events:
        # Corridors
        CreateCorridor:
          Type: Api
          Properties:
            RestApiId: !Ref UtilitySyncAPI
            Path: /corridors
            Method: POST
        GetCorridor:
          Type: Api
          Properties:
            RestApiId: !Ref UtilitySyncAPI
            Path: /corridors/{corridorId}
            Method: GET
        ListCorridors:
          Type: Api
          Properties:
            RestApiId: !Ref UtilitySyncAPI
            Path: /corridors
            Method: GET
        # Analysis
        AnalyzeCorridor:
          Type: Api
          Properties:
            RestApiId: !Ref UtilitySyncAPI
            Path: /corridors/{corridorId}/analyze
            Method: POST
        # Projects
        CreateProject:
          Type: Api
          Properties:
            RestApiId: !Ref UtilitySyncAPI
            Path: /projects
            Method: POST
        GetProject:
          Type: Api
          Properties:
            RestApiId: !Ref UtilitySyncAPI
            Path: /projects/{projectId}
            Method: GET
        GetConstructionPlan:
          Type: Api
          Properties:
            RestApiId: !Ref UtilitySyncAPI
            Path: /projects/{projectId}/construction-plan
            Method: GET
        # Contractors
        ListContractors:
          Type: Api
          Properties:
            RestApiId: !Ref UtilitySyncAPI
            Path: /contractors
            Method: GET
        MatchContractors:
          Type: Api
          Properties:
            RestApiId: !Ref UtilitySyncAPI
            Path: /contractors/match/{projectId}
            Method: GET
        # Digital Twin
        GetTwin:
          Type: Api
          Properties:
            RestApiId: !Ref UtilitySyncAPI
            Path: /digital-twin/{corridorId}
            Method: GET
        SimulateTwin:
          Type: Api
          Properties:
            RestApiId: !Ref UtilitySyncAPI
            Path: /digital-twin/{corridorId}/simulate
            Method: POST

  # ── AI Agent Lambda ──────────────────────────────────
  AIAgentFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: utilitysync-ai-agent
      CodeUri: ai_agent/
      Handler: app.lambda_handler
      MemorySize: 1024
      Timeout: 300
      Description: Strands AI Agent — powered by Amazon Bedrock Claude 3.5 Sonnet
      Policies:
        - DynamoDBReadPolicy:
            TableName: !Ref CorridorsTable
        - DynamoDBReadPolicy:
            TableName: !Ref ProjectsTable
        - DynamoDBReadPolicy:
            TableName: !Ref ContractorsTable
        - DynamoDBReadPolicy:
            TableName: !Ref DigitalTwinTable
        - S3ReadPolicy:
            BucketName: !Ref KnowledgeBucket
        - Statement:
          - Effect: Allow
            Action:
              - bedrock:InvokeModel
              - bedrock:InvokeModelWithResponseStream
              - bedrock-agent-runtime:Retrieve
              - bedrock-agent-runtime:RetrieveAndGenerate
            Resource: "*"
      Events:
        ChatEndpoint:
          Type: Api
          Properties:
            RestApiId: !Ref UtilitySyncAPI
            Path: /agent/chat
            Method: POST

  # ── DynamoDB Tables ──────────────────────────────────
  CorridorsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: utilitysync-corridors
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: corridorId
          AttributeType: S
        - AttributeName: sk
          AttributeType: S
      KeySchema:
        - AttributeName: corridorId
          KeyType: HASH
        - AttributeName: sk
          KeyType: RANGE

  UtilitiesTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: utilitysync-utilities
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: corridorId
          AttributeType: S
        - AttributeName: utilityId
          AttributeType: S
      KeySchema:
        - AttributeName: corridorId
          KeyType: HASH
        - AttributeName: utilityId
          KeyType: RANGE

  ProjectsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: utilitysync-projects
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: projectId
          AttributeType: S
        - AttributeName: sk
          AttributeType: S
      KeySchema:
        - AttributeName: projectId
          KeyType: HASH
        - AttributeName: sk
          KeyType: RANGE

  ContractorsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: utilitysync-contractors
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: contractorId
          AttributeType: S
        - AttributeName: sk
          AttributeType: S
      KeySchema:
        - AttributeName: contractorId
          KeyType: HASH
        - AttributeName: sk
          KeyType: RANGE

  DigitalTwinTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: utilitysync-digital-twin
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: corridorId
          AttributeType: S
        - AttributeName: elementId
          AttributeType: S
      KeySchema:
        - AttributeName: corridorId
          KeyType: HASH
        - AttributeName: elementId
          KeyType: RANGE

  # ── S3 Knowledge Bucket ───────────────────────────────
  KnowledgeBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "utilitysync-knowledge-${AWS::AccountId}-${AWS::Region}"
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256

# ── Outputs ──────────────────────────────────────────────────────
Outputs:
  ApiEndpoint:
    Description: API Gateway endpoint URL
    Value: !Sub "https://${UtilitySyncAPI}.execute-api.${AWS::Region}.amazonaws.com/${Stage}"
    Export:
      Name: UtilitySyncAPIEndpoint

  KnowledgeBucketName:
    Description: S3 bucket for knowledge base documents
    Value: !Ref KnowledgeBucket
    Export:
      Name: UtilitySyncKnowledgeBucket

  PlanningApiFunctionArn:
    Value: !GetAtt PlanningApiFunction.Arn

  AIAgentFunctionArn:
    Value: !GetAtt AIAgentFunction.Arn
```


# FILE: backend\ai_agent\agent.py
```
"""
UtilitySync AI Agent — Strands Agent Definition
Uses Amazon Bedrock Claude 3.5 Sonnet with domain-specific tools.
"""
import os
from strands import Agent
from tools.corridor_tools import analyze_corridor, get_corridor_state
from tools.utility_tools   import plan_utility, check_capacity
from tools.contractor_tools import match_contractor, explain_contractor_gap
from tools.knowledge_tools  import search_knowledge_base

SYSTEM_PROMPT = """You are the UtilitySync AI assistant — an expert in underground utility infrastructure planning, construction intelligence, and corridor management.

You help planners, engineers, and project managers:
1. Understand corridor analysis results and recommendations
2. Explain construction plans, equipment requirements, and risks
3. Compare contractor capabilities against project requirements
4. Check whether existing or reserved infrastructure can accommodate future projects
5. Answer technical questions about utility installation standards, methods, and regulations

You have access to real project data through your tools. Always use the actual data rather than generic answers.

Key standards you apply:
- NJUG Volume 1 — Utility separation requirements
- NRSWA (New Roads and Street Works Act) — Streetworks standards
- HSE guidance on safe digging near gas mains
- City & Guilds / IADC certification requirements for fiber and HDD work

When explaining a recommendation, always cite the specific data that led to it (e.g., "The gas main is at 0.75m and the water main is at 0.9m — only 150mm separation, below the 300mm NJUG minimum").

Be concise but specific. Use bullet points for lists. Format numbers clearly."""


# Initialize the Strands Agent
utilitysync_agent = Agent(
    model=f"bedrock:{os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-5-sonnet-20241022-v2:0')}",
    system_prompt=SYSTEM_PROMPT,
    tools=[
        analyze_corridor,
        get_corridor_state,
        plan_utility,
        check_capacity,
        match_contractor,
        explain_contractor_gap,
        search_knowledge_base,
    ],
)
```


# FILE: backend\ai_agent\app.py
```
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
```


# FILE: backend\ai_agent\requirements.txt
```
boto3>=1.34.0
strands-agents>=0.1.0
strands-agents-tools>=0.1.0
```


# FILE: backend\ai_agent\tools\contractor_tools.py
```
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
```


# FILE: backend\ai_agent\tools\corridor_tools.py
```
"""
Corridor Tools — called by the Strands Agent to retrieve live corridor data.
"""
import os, json, boto3
from strands import tool
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')


@tool
def analyze_corridor(corridor_id: str) -> str:
    """
    Retrieve the current analysis results for a given corridor,
    including conflicts, capacity assessments, and duct recommendations.

    Args:
        corridor_id: The unique identifier of the corridor to analyze.

    Returns:
        A JSON string containing the full corridor analysis.
    """
    try:
        corridors_table  = dynamodb.Table(os.environ['CORRIDORS_TABLE'])
        utilities_table  = dynamodb.Table(os.environ['UTILITIES_TABLE'])

        corr_resp = corridors_table.get_item(
            Key={'corridorId': corridor_id, 'sk': 'METADATA'}
        )
        corridor = corr_resp.get('Item', {})

        util_resp = utilities_table.query(
            KeyConditionExpression=Key('corridorId').eq(corridor_id)
        )
        utilities = util_resp.get('Items', [])

        return json.dumps({
            'corridor': {k: v for k, v in corridor.items() if k != 'sk'},
            'utilities': utilities,
            'utilityCount': len(utilities),
            'utilityTypes': [u.get('type') for u in utilities],
        }, default=str)
    except Exception as e:
        return json.dumps({'error': str(e)})


@tool
def get_corridor_state(corridor_id: str) -> str:
    """
    Get a concise summary of the current state of a corridor,
    suitable for answering questions about what's underground.

    Args:
        corridor_id: The corridor to summarize.

    Returns:
        A human-readable summary of the corridor state.
    """
    try:
        utilities_table = dynamodb.Table(os.environ['UTILITIES_TABLE'])
        util_resp = utilities_table.query(
            KeyConditionExpression=Key('corridorId').eq(corridor_id)
        )
        utilities = util_resp.get('Items', [])

        lines = [f'Corridor {corridor_id} contains {len(utilities)} utilities:']
        for u in utilities:
            cap = u.get('capacityPercent', '?')
            lines.append(
                f"- {u.get('label', u.get('type'))}: depth={u.get('depthM')}m, "
                f"capacity={cap}%, owner={u.get('owner', 'unknown')}"
            )
        return '\n'.join(lines)
    except Exception as e:
        return f'Error fetching corridor state: {e}'
```


# FILE: backend\ai_agent\tools\knowledge_tools.py
```
"""
Knowledge Base tools — RAG search over S3/OpenSearch via Bedrock Knowledge Base.
"""
import os, json, boto3
from strands import tool

bedrock_agent_runtime = boto3.client('bedrock-agent-runtime')


@tool
def search_knowledge_base(query: str) -> str:
    """
    Search the UtilitySync technical knowledge base for information about
    utility installation standards, construction methods, equipment specifications,
    and regulatory requirements.

    Use this tool when the user asks about:
    - Installation depth standards (NJUG, HSE guidance)
    - Equipment specifications or capabilities
    - Construction methods (HDD, open-cut, micro-trenching, moling)
    - Certification requirements for contractors or operatives
    - Regulatory requirements (NRSWA, Gas Safety Regulations, etc.)

    Args:
        query: The technical question or topic to search for.

    Returns:
        Relevant technical information from the knowledge base.
    """
    kb_id = os.environ.get('BEDROCK_KB_ID', '')
    model_arn = f"arn:aws:bedrock:{os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')}::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"

    if not kb_id or kb_id == 'PLACEHOLDER_KB_ID':
        # Fallback to static knowledge if KB not yet set up
        return _static_knowledge(query)

    try:
        response = bedrock_agent_runtime.retrieve_and_generate(
            input={'text': query},
            retrieveAndGenerateConfiguration={
                'type': 'KNOWLEDGE_BASE',
                'knowledgeBaseConfiguration': {
                    'knowledgeBaseId': kb_id,
                    'modelArn': model_arn,
                    'retrievalConfiguration': {
                        'vectorSearchConfiguration': {
                            'numberOfResults': 5
                        }
                    }
                }
            }
        )
        return response['output']['text']
    except Exception as e:
        # Graceful degradation — return static knowledge
        return _static_knowledge(query)


def _static_knowledge(query: str) -> str:
    """Fallback static knowledge base for when Bedrock KB is not available."""
    q = query.lower()

    if 'njug' in q or 'separation' in q or 'clearance' in q:
        return """NJUG Volume 1 — Minimum Utility Separation Requirements:
• Gas (any pressure) to Water: 300mm minimum
• Gas (IP/HP) to Electricity: 500mm minimum
• Gas (any) to Fiber/Comms: 250mm minimum
• Electricity (HV) to Water: 250mm minimum
• Electricity to Fiber: 100mm minimum
• Water to Drainage: 250mm minimum
All separations measured between outer surfaces of assets."""

    if 'hdd' in q or 'directional drill' in q:
        return """Horizontal Directional Drilling (HDD):
• Requires IADC (International Association of Drilling Contractors) certified operator
• Bore plan must be approved by Highway Authority before drilling
• Maximum recommended bore length: 200m per single pull
• Drill mud management required — contains water and bentonite
• Tracking equipment (walk-over or wire-line) mandatory throughout
• Typical accuracy: ±300mm horizontal, ±150mm vertical
• Suitable for: road crossings, river crossings, under buildings"""

    if 'depth' in q or 'cover' in q:
        return """NJUG recommended minimum depths (top of asset to surface):
• LV electricity (up to 1kV): 450mm footway, 600mm carriageway
• HV electricity (>1kV): 900mm footway, 900mm carriageway
• Gas (LP <75mbar): 375mm (750mm near buildings)
• Gas (IP 75mbar–2 bar): 600mm
• Water mains: 750mm minimum, 900mm in carriageway
• Fiber/comms: 350mm footway, 600mm carriageway
• Drainage: 600mm minimum (invert level)"""

    if 'nrswa' in q or 'streetworks' in q or 'permit' in q:
        return """NRSWA (New Roads and Street Works Act 1991) Key Requirements:
• Notice required before starting works (3 days standard, 3 months for A-road on 2+year moratorium)
• Works must be supervised by qualified NRSWA-certified operative
• Reinstatement must comply with Specification for the Reinstatement of Openings in Roads (SROH)
• 2-year reinstatement guarantee required
• Works register records must be maintained on LSBUD/NUAR
• Immediate works: only in genuine emergency, must notify within 2 hours of starting"""

    return (
        f"Technical information about '{query}' was not found in the local knowledge base. "
        "For detailed guidance, refer to: NJUG Volume 1 (utility separation), "
        "NRSWA 1991 (streetworks), HSE guidance on safe digging, "
        "and the relevant utility owner's technical standards."
    )
```


# FILE: backend\ai_agent\tools\utility_tools.py
```
"""
Utility and capacity tools for the Strands Agent.
"""
import os, json, boto3
from strands import tool
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')

DUCT_COMPATIBLE = {
    'fiber': ['reserved_duct'],
    'ev_charging': ['reserved_duct'],
    'electricity': ['reserved_duct'],
}


@tool
def plan_utility(utility_type: str, length_m: int, install_method: str) -> str:
    """
    Generate a high-level utility planning recommendation based on type,
    length, and installation method. Returns key requirements and considerations.

    Args:
        utility_type: Type of utility (fiber, electricity, water, gas, drainage).
        length_m: Length of the utility run in metres.
        install_method: Proposed installation method (open_cut, hdd, existing_duct, etc).

    Returns:
        Planning recommendations and key requirements.
    """
    method_notes = {
        'hdd':            'HDD requires certified operator (IADC), drill tracking equipment, bore plan approval from Highway Authority.',
        'open_cut':       'Open cut requires NRSWA noticing, traffic management plan, and TTRO if on A-road.',
        'existing_duct':  'Using existing duct requires confirmation duct is empty, compatible diameter, and draw rope installed.',
        'microtrenching': 'Micro-trenching limited to footway only; depth typically 200mm — check for existing services.',
    }

    depth_recs = {
        'fiber':       '0.45m (footway), 0.60m (carriageway)',
        'electricity': '0.90m (LV), 1.00m (HV)',
        'water':       '0.90m (300mm+ main), 0.75m (services)',
        'gas':         '0.60m (LP), 0.75m (IP), 1.00m (HP)',
    }

    return (
        f"Planning recommendation for {utility_type} ({length_m}m, {install_method}):\n"
        f"Target depth: {depth_recs.get(utility_type, '0.60m')}\n"
        f"Method note: {method_notes.get(install_method, 'Follow standard NJUG guidance.')}\n"
        f"Key requirement: NRSWA streetworks notice before any excavation.\n"
        f"Estimated duration: {max(2, round(length_m / 400))}–{max(3, round(length_m / 300))} weeks."
    )


@tool
def check_capacity(corridor_id: str, future_utility_type: str) -> str:
    """
    Check whether existing or reserved infrastructure in a corridor's digital twin
    can accommodate a future utility installation without new excavation.

    Args:
        corridor_id: The corridor to check.
        future_utility_type: The type of future utility to accommodate.

    Returns:
        A recommendation on whether to reuse existing capacity or plan new works.
    """
    try:
        twin_table = dynamodb.Table(os.environ['TWIN_TABLE'])
        resp = twin_table.query(
            KeyConditionExpression=Key('corridorId').eq(corridor_id)
        )
        elements = resp.get('Items', [])

        compatible_types = DUCT_COMPATIBLE.get(future_utility_type, [])
        available = [
            e for e in elements
            if e.get('type') in compatible_types
            and e.get('capacity', {}).get('used', 1) == 0
        ]

        if available:
            names = [e.get('label', e.get('elementId')) for e in available]
            return (
                f"REUSE RECOMMENDED: {len(available)} available reserved duct(s) found for {future_utility_type}:\n"
                + '\n'.join(f"  - {n}" for n in names)
                + "\nNo excavation required. Cable blowing or pulling can proceed directly."
            )
        else:
            zones = [e for e in elements if e.get('type') == 'expansion_zone']
            if zones:
                return (
                    f"NEW INSTALLATION REQUIRED for {future_utility_type}: No compatible reserved ducts available.\n"
                    f"However, {len(zones)} expansion zone(s) exist — use these to minimise conflict risk."
                )
            return (
                f"NEW INSTALLATION REQUIRED for {future_utility_type}: No reserved capacity or expansion zones available.\n"
                "Full corridor analysis recommended before planning new works."
            )
    except Exception as e:
        return f'Error checking capacity: {e}'
```


# FILE: backend\planning_api\app.py
```
"""
UtilitySync Planning API — Lambda Handler (Router)
Routes all API Gateway events to the correct handler module.
"""
import json
import traceback
from handlers import corridors, analysis, projects, construction, contractors, digital_twin


def lambda_handler(event, context):
    """Main router — maps HTTP method + path to handler."""
    method = event.get('httpMethod', 'GET')
    path   = event.get('path', '/')
    params = event.get('pathParameters') or {}

    try:
        body = json.loads(event.get('body') or '{}')
    except (json.JSONDecodeError, TypeError):
        body = {}

    try:
        # ── Corridors ──────────────────────────────────
        if path == '/corridors' and method == 'POST':
            result = corridors.create(body)

        elif path == '/corridors' and method == 'GET':
            result = corridors.list_all()

        elif path.startswith('/corridors/') and method == 'GET' and '/analyze' not in path:
            result = corridors.get(params['corridorId'])

        elif path.endswith('/analyze') and method == 'POST':
            result = analysis.run(params['corridorId'])

        # ── Projects ────────────────────────────────────
        elif path == '/projects' and method == 'POST':
            result = projects.create(body)

        elif path.startswith('/projects/') and method == 'GET' and '/construction-plan' not in path:
            result = projects.get(params['projectId'])

        elif path.endswith('/construction-plan') and method == 'GET':
            result = construction.generate(params['projectId'])

        # ── Contractors ──────────────────────────────────
        elif path == '/contractors' and method == 'GET':
            result = contractors.list_all()

        elif path.startswith('/contractors/match/') and method == 'GET':
            result = contractors.match(params['projectId'])

        # ── Digital Twin ─────────────────────────────────
        elif path.startswith('/digital-twin/') and method == 'GET' and '/simulate' not in path:
            result = digital_twin.get(params['corridorId'])

        elif path.endswith('/simulate') and method == 'POST':
            result = digital_twin.simulate(params['corridorId'], body)

        # ── Not Found ────────────────────────────────────
        else:
            return _response(404, {'error': f'Route not found: {method} {path}'})

        return _response(200, result)

    except ValueError as e:
        return _response(400, {'error': str(e)})
    except KeyError as e:
        return _response(404, {'error': f'Resource not found: {e}'})
    except Exception as e:
        traceback.print_exc()
        return _response(500, {'error': 'Internal server error', 'detail': str(e)})


def _response(status_code: int, body: dict) -> dict:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        },
        'body': json.dumps(body, default=str),
    }
```


# FILE: backend\planning_api\requirements.txt
```
boto3>=1.34.0
```


# FILE: backend\planning_api\handlers\analysis.py
```
"""
Analysis handler — deterministic conflict detection and capacity analysis.
No AI involved here: pure engineering rules (NJUG Vol 1, HSE guidance).
"""
import os, uuid, boto3
from datetime import datetime, timezone
from boto3.dynamodb.conditions import Key
from handlers.corridors import get as get_corridor

# Minimum separation requirements (metres) — NJUG Volume 1 Table 3.1
MIN_SEPARATIONS = {
    ('gas',         'electricity'): 0.50,
    ('gas',         'water'):       0.30,
    ('gas',         'fiber'):       0.25,
    ('gas',         'drainage'):    0.50,
    ('electricity', 'water'):       0.25,
    ('electricity', 'fiber'):       0.10,
    ('water',       'drainage'):    0.25,
    ('fiber',       'drainage'):    0.25,
}

CAPACITY_THRESHOLDS = {
    'HIGH':     80,  # % — action required
    'MODERATE': 60,  # % — monitor
}


def run(corridor_id: str) -> dict:
    """Run full corridor analysis: conflicts, capacity, duct recommendations."""
    corridor = get_corridor(corridor_id)
    utilities = corridor.get('utilities', [])

    conflicts          = _detect_conflicts(utilities)
    capacity_zones     = _assess_capacity(utilities)
    recommended_ducts  = _recommend_ducts(utilities, corridor)

    total_saving = sum(
        _parse_money(d.get('estimatedSaving', '£0'))
        for d in recommended_ducts
    )

    return {
        'corridorId':     corridor_id,
        'analysisId':     str(uuid.uuid4()),
        'completedAt':    datetime.now(timezone.utc).isoformat(),
        'conflicts':      conflicts,
        'capacityZones':  capacity_zones,
        'recommendedDucts': recommended_ducts,
        'summary': {
            'totalConflicts':             len(conflicts),
            'highSeverityConflicts':      sum(1 for c in conflicts if c['severity'] == 'HIGH'),
            'reservedDuctsRecommended':   len(recommended_ducts),
            'totalPotentialSaving':       f'£{total_saving:,}',
            'recommendation':             _overall_recommendation(conflicts, recommended_ducts),
        }
    }


def _detect_conflicts(utilities: list) -> list:
    """Check pairwise separation between all utilities."""
    conflicts = []
    for i, u1 in enumerate(utilities):
        for u2 in utilities[i+1:]:
            sep = _get_min_separation(u1['type'], u2['type'])
            if sep is None:
                continue
            actual = abs(u1.get('depthM', 1.0) - u2.get('depthM', 1.0))
            if actual < sep:
                conflicts.append({
                    'conflictId':     str(uuid.uuid4()),
                    'type':           'PROXIMITY',
                    'severity':       'HIGH' if actual < sep * 0.6 else 'MEDIUM',
                    'utilities':      [u1.get('utilityId',''), u2.get('utilityId','')],
                    'title':          f'{u1["type"].title()} / {u2["type"].title()} Proximity Conflict',
                    'description':    (
                        f'{u1.get("label","Utility 1")} and {u2.get("label","Utility 2")} '
                        f'are separated by only {actual:.2f}m. '
                        f'NJUG minimum separation is {sep:.2f}m.'
                    ),
                    'affectedLength': None,
                    'solution':       _suggest_solution(u1, u2, sep, actual),
                })
    return conflicts


def _get_min_separation(type1: str, type2: str) -> float | None:
    key1 = (type1, type2)
    key2 = (type2, type1)
    return MIN_SEPARATIONS.get(key1) or MIN_SEPARATIONS.get(key2)


def _suggest_solution(u1, u2, required, actual) -> str:
    needed = required - actual
    return (
        f'Increase separation by {needed:.2f}m. '
        f'Recommended: lower {u2["type"]} main by {needed:.2f}m at next planned maintenance. '
        f'No disruption to {u1["type"]} main required.'
    )


def _assess_capacity(utilities: list) -> list:
    """Assess current capacity utilisation for each utility."""
    zones = []
    for u in utilities:
        pct = u.get('capacityPercent', 0)
        if pct >= CAPACITY_THRESHOLDS['HIGH']:
            status, summary = 'HIGH', f'At {pct}% — reinforcement planning required for any new load.'
        elif pct >= CAPACITY_THRESHOLDS['MODERATE']:
            status, summary = 'MODERATE', f'At {pct}% — monitor; adequate for current load but limited headroom.'
        else:
            status, summary = 'LOW', f'At {pct}% — significant capacity available for future growth.'

        zones.append({
            'utilityId':       u.get('utilityId', ''),
            'type':            u.get('type', ''),
            'label':           u.get('label', ''),
            'capacityPercent': pct,
            'status':          status,
            'summary':         summary,
        })
    return zones


def _recommend_ducts(utilities: list, corridor: dict) -> list:
    """Recommend reserved ducts based on what's currently missing."""
    existing_types = {u['type'] for u in utilities}
    ducts = []

    # Recommend fiber ducts if no fiber exists
    if 'fiber' not in existing_types:
        ducts.append({
            'ductId':          f'rec-duct-fiber-{str(uuid.uuid4())[:8]}',
            'type':            'fiber',
            'label':           'Reserved Fiber/Comms Ducts (2 × 110mm HDPE)',
            'depthM':          0.6,
            'reason':          (
                'No fiber/comms provision currently exists. Install 2 × 110mm HDPE ducts at 0.6m '
                'during any planned works — avoids future standalone excavation cost.'
            ),
            'estimatedSaving': '£157,000',
        })

    # Recommend power duct if gas > 70%
    gas_utils = [u for u in utilities if u['type'] == 'gas']
    if not gas_utils or gas_utils[0].get('capacityPercent', 0) > 70:
        ducts.append({
            'ductId':          f'rec-duct-power-{str(uuid.uuid4())[:8]}',
            'type':            'power',
            'label':           'Reserved Power Duct (1 × 150mm HDPE)',
            'depthM':          0.9,
            'reason':          (
                'Install 150mm HDPE power duct for future EV charging / solar connection, '
                'avoiding repeated excavation.'
            ),
            'estimatedSaving': '£81,000',
        })

    return ducts


def _overall_recommendation(conflicts: list, ducts: list) -> str:
    if conflicts:
        return f'Address {len(conflicts)} conflict(s) before adding new utilities. Recommended duct installation will future-proof the corridor.'
    return 'No conflicts detected. Recommended duct installation will future-proof the corridor against upcoming projects.'


def _parse_money(s: str) -> int:
    try:
        return int(s.replace('£', '').replace(',', '').split('–')[0])
    except Exception:
        return 0
```


# FILE: backend\planning_api\handlers\construction.py
```
"""
Construction plan handler.
Generates structured construction plan from project data.
"""
import os, boto3
from handlers.projects import get as get_project

INSTALL_METHOD_LABELS = {
    'open_cut':       'Open Cut (Trench)',
    'hdd':            'Horizontal Directional Drilling (HDD)',
    'existing_duct':  'Through Existing Reserved Duct',
    'microtrenching': 'Micro-Trenching',
    'moling':         'Moling / Pipe Bursting',
}

UTILITY_EQUIPMENT = {
    'fiber': [
        {'name': 'Horizontal Directional Drill (Vermeer D23x30 or equivalent)', 'qty': 1, 'critical': True,  'reason': 'Required for road crossings under carriageway where open-cut is not permitted.'},
        {'name': 'Cable Pulling / Blowing Unit (Plumettaz or similar)',          'qty': 1, 'critical': True,  'reason': 'Required for fiber cable installation through duct sections.'},
        {'name': 'Vacuum Excavator (Vac-Ex)',                                    'qty': 2, 'critical': True,  'reason': 'Required for safe excavation within 3m of gas main.'},
        {'name': 'Hydraulic Excavator (3T or 8T)',                               'qty': 2, 'critical': False, 'reason': 'Open-cut trenching in footway sections.'},
        {'name': 'OTDR Fiber Testing Equipment',                                 'qty': 1, 'critical': True,  'reason': 'Mandatory — fiber continuity and loss testing at each splice point.'},
        {'name': 'Compaction Plates / Roller',                                   'qty': 2, 'critical': False, 'reason': 'NRSWA-compliant reinstatement compaction.'},
        {'name': 'Traffic Management Fleet (TTRO required)',                     'qty': 1, 'critical': False, 'reason': 'Full TM plan required; TTRO 3-month notice on A-road sections.'},
    ],
    'electricity': [
        {'name': 'Cable Pulling Equipment (HV-rated)',  'qty': 1, 'critical': True,  'reason': 'Required for HV cable installation.'},
        {'name': 'Hydraulic Excavator',                 'qty': 2, 'critical': True,  'reason': 'Trenching to cable depth.'},
        {'name': 'Vacuum Excavator',                    'qty': 1, 'critical': True,  'reason': 'Near existing services.'},
        {'name': 'HV Jointing Equipment',               'qty': 1, 'critical': True,  'reason': 'HV cable joint kits and tooling.'},
        {'name': 'Cable Drum Trailer',                  'qty': 1, 'critical': True,  'reason': 'Transport and feed HV cable drums.'},
    ],
    'water': [
        {'name': 'Hydraulic Excavator',         'qty': 2, 'critical': True,  'reason': 'Trenching to main depth.'},
        {'name': 'Pipe Laying Equipment',       'qty': 1, 'critical': True,  'reason': 'Bedding and laying pipe.'},
        {'name': 'Fusion Welding Machine',      'qty': 1, 'critical': True,  'reason': 'Electrofusion joints on MDPE pipe.'},
        {'name': 'Pressure Testing Equipment',  'qty': 1, 'critical': True,  'reason': 'Mandatory pre-commissioning pressure test.'},
        {'name': 'Dewatering Pump',             'qty': 2, 'critical': False, 'reason': 'Trench dewatering in wet conditions.'},
    ],
}

UTILITY_CREW = {
    'fiber': [
        {'role': 'HDD Operator (IADC certified)',                   'count': 2, 'critical': True},
        {'role': 'Fiber Optic Splicer (City & Guilds 3667)',        'count': 3, 'critical': True},
        {'role': 'NRSWA-qualified Civil Operatives',                'count': 6, 'critical': True},
        {'role': 'Traffic Management Operatives',                   'count': 3, 'critical': False},
        {'role': 'Site Supervisor / Safety Officer',                'count': 1, 'critical': True},
    ],
    'electricity': [
        {'role': 'HV-qualified Jointers (DNO approved)',            'count': 2, 'critical': True},
        {'role': 'NRSWA-qualified Civil Operatives',                'count': 6, 'critical': True},
        {'role': 'Traffic Management Operatives',                   'count': 3, 'critical': False},
        {'role': 'DNO-approved Site Supervisor',                    'count': 1, 'critical': True},
    ],
    'water': [
        {'role': 'NRSWA-qualified Pipe Layers',                     'count': 5, 'critical': True},
        {'role': 'NRSWA-qualified Civil Operatives',                'count': 4, 'critical': True},
        {'role': 'Water Network Engineer',                          'count': 1, 'critical': True},
        {'role': 'Traffic Management Operatives',                   'count': 2, 'critical': False},
    ],
}

TOP_RISKS = {
    'fiber': [
        {'level': 'HIGH',   'risk': 'Gas Main Proximity',    'description': 'Any mechanical excavation within 3m of gas main requires daily gas survey + vacuum excavation. Fatality risk + prosecution if breached.'},
        {'level': 'HIGH',   'risk': 'Unmapped Services',     'description': 'Victorian-era infrastructure likely incomplete in records. GPR survey mandatory before trenching.'},
        {'level': 'MEDIUM', 'risk': 'HDD Deviation',        'description': 'Drills can deviate on congested routes. Pull-back and re-drill required if tolerance exceeded.'},
        {'level': 'MEDIUM', 'risk': 'Traffic Impact',       'description': 'Night works constraints significantly extend programme. Overruns incur penalty clauses.'},
        {'level': 'LOW',    'risk': 'Splice Contamination', 'description': 'Dust and moisture at splice points cause high optical loss. All splicing requires clean-tent environment.'},
    ],
}


def generate(project_id: str) -> dict:
    project = get_project(project_id)
    util_type = project.get('utilityType', 'fiber')
    length_m  = int(project.get('lengthM', 0))
    crossings = int(project.get('roadCrossings', 0))
    method    = project.get('installMethod', 'hdd')

    equipment = UTILITY_EQUIPMENT.get(util_type, UTILITY_EQUIPMENT['fiber'])
    crew      = UTILITY_CREW.get(util_type, UTILITY_CREW['fiber'])
    risks     = TOP_RISKS.get(util_type, TOP_RISKS['fiber'])

    weeks = max(3, round(length_m / 300))  # rough estimate
    cost_lo = length_m * 75
    cost_hi = length_m * 90
    crew_sz  = sum(c['count'] for c in crew)

    summary = {
        'utilityType':      util_type.replace('_', ' ').title(),
        'totalLength':      f'{length_m:,}m',
        'installMethods':   INSTALL_METHOD_LABELS.get(method, method),
        'estimatedDuration': f'{weeks}–{weeks + 2} weeks',
        'estimatedCrew':    f'{crew_sz - 2}–{crew_sz + 2} operatives',
        'estimatedCost':    f'£{cost_lo:,}–£{cost_hi:,}',
    }

    sequence = _build_sequence(util_type, method, crossings)
    missing  = _build_missing(util_type, crossings)

    return {
        'projectId':            project_id,
        'generatedAt':          __import__('datetime').datetime.utcnow().isoformat() + 'Z',
        'summary':              summary,
        'equipment':            equipment,
        'crewRequirements':     crew,
        'installationSequence': sequence,
        'risks':                risks,
        'missingInformation':   missing,
    }


def _build_sequence(util_type, method, crossings):
    base = [
        {'step': 1, 'title': 'Pre-works and Mobilisation',    'detail': 'TTRO application, utility surveys (CAT & Genny + GPR), site set-up, safety briefing, material deliveries.'},
        {'step': 2, 'title': 'Vacuum Excavation — Trial Holes','detail': 'Expose existing services at critical crossing points using vacuum excavation. Confirm as-built depths.'},
    ]
    if crossings > 0 and method == 'hdd':
        base.append({'step': 3, 'title': f'HDD Road Crossings ({crossings} locations)', 'detail': f'Directional drill {crossings} primary road crossing(s). Install HDPE pilot bore, pull back duct.'})
    base += [
        {'step': len(base) + 1, 'title': 'Main Installation Works',  'detail': 'Lay utility in trench or through existing duct as per design. Bed and backfill in layers.'},
        {'step': len(base) + 2, 'title': 'Jointing and Testing',     'detail': 'Complete all joints and connections. Full pressure/continuity test to acceptance criteria.'},
        {'step': len(base) + 3, 'title': 'Reinstatement and Handover','detail': 'Full NRSWA-compliant reinstatement. As-built survey. Digital Twin update. 2-year warranty period.'},
    ]
    return base


def _build_missing(util_type, crossings):
    items = [
        {'status': '❌', 'item': 'TTRO / Traffic Regulation Order',      'detail': 'Critical path item — apply immediately. 3-month notice for A-road sections.'},
        {'status': '❌', 'item': 'Ground Radar (GPR) Survey',             'detail': 'Mandatory before excavation. 2–3 week lead time.'},
        {'status': '⚠️', 'item': 'Route Design Drawings',               'detail': 'Detailed design drawings required for NRSWA noticing and contractor tender.'},
    ]
    if util_type == 'fiber':
        items.append({'status': '❌', 'item': 'Cadent Gas Notification (adjacent works)', 'detail': '28-day notification to Cadent required before works within 3m of gas main.'})
    if crossings > 0:
        items.append({'status': '⚠️', 'item': 'HDD Bore Plan (HA approved)', 'detail': 'HDD contractor must submit bore plan for Highway Authority approval before drilling.'})
    items.append({'status': '✅', 'item': 'Corridor Analysis', 'detail': 'Completed. Conflicts identified and documented.'})
    return items
```


# FILE: backend\planning_api\handlers\contractors.py
```
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
```


# FILE: backend\planning_api\handlers\corridors.py
```
"""
Corridors handler — CRUD for corridors and their utilities.
"""
import os, json, uuid, boto3
from datetime import datetime, timezone
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
corridors_table = dynamodb.Table(os.environ['CORRIDORS_TABLE'])
utilities_table  = dynamodb.Table(os.environ['UTILITIES_TABLE'])


def create(body: dict) -> dict:
    """Create a new corridor with its existing utilities."""
    corridor_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # Validate
    name = body.get('name', '').strip()
    if not name:
        raise ValueError('Corridor name is required')

    # Build utility records from selected types
    selected_utils = body.get('selectedUtils', [])
    utilities = _build_default_utilities(corridor_id, selected_utils)

    # Store corridor
    item = {
        'corridorId': corridor_id,
        'sk': 'METADATA',
        'name': name,
        'location': body.get('location', ''),
        'lengthKm': float(body.get('lengthKm', 0)),
        'widthM': float(body.get('widthM', 15)),
        'roadType': body.get('roadType', 'B_ROAD'),
        'notes': body.get('notes', ''),
        'route': json.dumps(body.get('route', [])),
        'status': 'ACTIVE',
        'createdAt': now,
        'updatedAt': now,
    }
    corridors_table.put_item(Item=item)

    # Store utilities
    for util in utilities:
        utilities_table.put_item(Item=util)

    # Build and return response
    corridor = {k: v for k, v in item.items() if k not in ('sk',)}
    corridor['route'] = body.get('route', [])
    corridor['utilities'] = utilities
    return corridor


def get(corridor_id: str) -> dict:
    """Fetch corridor + utilities."""
    response = corridors_table.get_item(Key={'corridorId': corridor_id, 'sk': 'METADATA'})
    item = response.get('Item')
    if not item:
        raise KeyError(f'Corridor {corridor_id} not found')

    # Fetch utilities
    util_resp = utilities_table.query(
        KeyConditionExpression=Key('corridorId').eq(corridor_id)
    )
    utilities = util_resp.get('Items', [])

    corridor = {k: v for k, v in item.items() if k != 'sk'}
    try:
        corridor['route'] = json.loads(corridor.get('route', '[]'))
    except Exception:
        corridor['route'] = []
    corridor['utilities'] = utilities
    return corridor


def list_all() -> dict:
    """List all corridors."""
    response = corridors_table.scan(
        FilterExpression='sk = :sk',
        ExpressionAttributeValues={':sk': 'METADATA'}
    )
    items = response.get('Items', [])
    corridors = []
    for item in items:
        c = {k: v for k, v in item.items() if k != 'sk'}
        try:
            c['route'] = json.loads(c.get('route', '[]'))
        except Exception:
            c['route'] = []
        corridors.append(c)
    return {'corridors': corridors, 'count': len(corridors)}


def _build_default_utilities(corridor_id: str, types: list) -> list:
    """Build default utility records from selected types."""
    defaults = {
        'electricity': {
            'utilityId': f'util-elec-{corridor_id[:8]}',
            'type': 'electricity',
            'label': 'HV Electricity Cable (11kV)',
            'depthM': 1.0, 'horizontalOffsetM': -3.5,
            'capacityPercent': 74, 'owner': 'UK Power Networks',
            'status': 'OPERATIONAL',
            'specs': {'voltage': '11kV', 'cableType': 'XLPE armoured', 'diameter': '95mm'},
        },
        'water': {
            'utilityId': f'util-water-{corridor_id[:8]}',
            'type': 'water',
            'label': 'Water Distribution Main (300mm)',
            'depthM': 0.9, 'horizontalOffsetM': -1.2,
            'capacityPercent': 61, 'owner': 'Thames Water',
            'status': 'OPERATIONAL',
            'specs': {'material': 'Ductile Iron', 'diameter': '300mm', 'pressure': '5.5 bar'},
        },
        'gas': {
            'utilityId': f'util-gas-{corridor_id[:8]}',
            'type': 'gas',
            'label': 'Gas Distribution Main (IP)',
            'depthM': 0.75, 'horizontalOffsetM': 1.0,
            'capacityPercent': 82, 'owner': 'Cadent Gas',
            'status': 'OPERATIONAL',
            'specs': {'material': 'MDPE', 'diameter': '180mm', 'pressure': '75 mbar'},
        },
        'fiber': {
            'utilityId': f'util-fiber-{corridor_id[:8]}',
            'type': 'fiber',
            'label': 'Fiber Optic Cable',
            'depthM': 0.6, 'horizontalOffsetM': -5.0,
            'capacityPercent': 45, 'owner': 'Unknown Operator',
            'status': 'OPERATIONAL',
            'specs': {'cores': '48-core', 'type': 'Single-mode fiber'},
        },
        'drainage': {
            'utilityId': f'util-drain-{corridor_id[:8]}',
            'type': 'drainage',
            'label': 'Combined Sewer (600mm)',
            'depthM': 1.8, 'horizontalOffsetM': 3.2,
            'capacityPercent': 44, 'owner': 'Thames Water',
            'status': 'OPERATIONAL',
            'specs': {'material': 'Vitrified Clay', 'diameter': '600mm'},
        },
    }
    now = datetime.now(timezone.utc).isoformat()
    result = []
    for t in types:
        if t in defaults:
            util = {'corridorId': corridor_id, 'installDate': now, **defaults[t]}
            result.append(util)
    return result
```


# FILE: backend\planning_api\handlers\digital_twin.py
```
"""
Digital Twin handler — retrieve and simulate future projects.
"""
import os, boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TWIN_TABLE'])

# Duct compatibility map: which utility types can use which duct types
DUCT_COMPATIBILITY = {
    'fiber':          ['reserved_duct'],
    'ev_charging':    ['reserved_duct'],  # power duct type
    'electricity':    ['reserved_duct'],
    'water':          [],  # needs new installation
    'gas':            [],  # needs new installation
    'district_heating': [],
}

# Cost savings for using existing capacity vs new installation (£/metre)
COST_SAVINGS_PER_METRE = {
    'fiber':       78,   # vs open-cut new fiber
    'ev_charging': 35,   # vs new power duct
    'electricity': 55,
}


def get(corridor_id: str) -> dict:
    """Retrieve all digital twin elements for a corridor."""
    resp = table.query(
        KeyConditionExpression=Key('corridorId').eq(corridor_id)
    )
    elements = resp.get('Items', [])

    ducts = [e for e in elements if e.get('type') == 'reserved_duct']
    score = _calculate_future_score(elements)

    return {
        'corridorId':       corridor_id,
        'totalElements':    len(elements),
        'futureCapacityScore': score,
        'elements':         elements,
        'summary': {
            'reservedDucts': len(ducts),
            'allAvailable':  [e for e in ducts if e.get('capacity', {}).get('used', 1) == 0],
        }
    }


def simulate(corridor_id: str, body: dict) -> dict:
    """Check if existing/reserved capacity can accommodate a future utility."""
    future_type = body.get('futureUtilityType', 'fiber')
    required_m  = int(body.get('requiredLengthM', 0))

    twin = get(corridor_id)
    elements = twin['elements']

    compatible_duct_types = DUCT_COMPATIBILITY.get(future_type, [])
    available_ducts = [
        e for e in elements
        if e.get('type') in compatible_duct_types
        and e.get('capacity', {}).get('used', 1) == 0
    ]

    if not available_ducts:
        # Check expansion zone
        exp_zones = [e for e in elements if e.get('type') == 'expansion_zone']
        if exp_zones:
            return _new_install_via_zone(future_type, required_m, exp_zones[0])
        return _new_install_required(future_type, required_m)

    best_duct = available_ducts[0]
    return _reuse_response(future_type, required_m, available_ducts, best_duct)


def _reuse_response(future_type, required_m, available_ducts, best_duct):
    saving_per_m = COST_SAVINGS_PER_METRE.get(future_type, 50)
    cost_saving  = required_m * saving_per_m
    weeks_saving = max(2, round(required_m / 500))
    co2_saving   = round(required_m * 0.0054, 1)  # ~5.4kg CO2/m for new excavation

    matched_ids = [d.get('elementId', '') for d in available_ducts[:2]]

    return {
        'futureUtilityType':  future_type,
        'requiredLengthM':    required_m,
        'recommendation':     'USE_EXISTING_CAPACITY',
        'title':              'Reserved Capacity Available — No New Excavation Needed',
        'detail': (
            f'The Digital Twin shows {len(available_ducts)} available reserved duct(s) '
            f'suitable for {future_type.replace("_", " ")} installation.\n\n'
            f'Using {best_duct.get("label", "the reserved duct")} for this project requires:\n'
            '• 1 × cable/pipe installation crew\n'
            '• No excavation, no traffic management, no TTRO\n'
            '• No new utility notifications required\n\n'
            'This is the recommended approach. All reserved ducts have draw ropes installed and entry/exit chambers at both ends.'
        ),
        'matchedElements': matched_ids,
        'savings': {
            'cost': {'value': f'£{cost_saving:,}',    'label': 'Cost Saved'},
            'time': {'value': f'{weeks_saving} Weeks', 'label': 'Programme Saved'},
            'co2':  {'value': f'{co2_saving} tonnes', 'label': 'CO₂ Avoided'},
        }
    }


def _new_install_via_zone(future_type, required_m, zone):
    return {
        'futureUtilityType': future_type,
        'requiredLengthM':   required_m,
        'recommendation':    'USE_EXPANSION_ZONE',
        'title':             'Use Reserved Expansion Zone — Reduced Excavation',
        'detail': (
            f'No pre-installed duct is available for {future_type.replace("_", " ")}. '
            f'However, the {zone.get("label", "expansion zone")} provides a clear route '
            'for a new installation with reduced conflict risk. '
            'Excavation is required but the zone is specifically reserved for this purpose — '
            'no other utility consents are needed.'
        ),
        'matchedElements': [zone.get('elementId', '')],
        'savings': None,
    }


def _new_install_required(future_type, required_m):
    return {
        'futureUtilityType': future_type,
        'requiredLengthM':   required_m,
        'recommendation':    'NEW_INSTALLATION_REQUIRED',
        'title':             'New Installation Required — No Suitable Reserved Capacity',
        'detail': (
            f'No existing reserved capacity is compatible with {future_type.replace("_", " ")}. '
            'A new installation will be required. '
            'Refer to the corridor analysis for recommended routing and conflict avoidance.'
        ),
        'matchedElements': [],
        'savings': None,
    }


def _calculate_future_score(elements: list) -> int:
    """Score the corridor from 0–100 based on reserved capacity available."""
    if not elements:
        return 0
    total     = len(elements)
    reserved  = sum(1 for e in elements if e.get('type') in ('reserved_duct', 'expansion_zone'))
    available = sum(1 for e in elements
                    if e.get('type') == 'reserved_duct'
                    and e.get('capacity', {}).get('used', 1) == 0)
    return min(100, int((reserved / total) * 60 + (available / max(1, reserved)) * 40))
```


# FILE: backend\planning_api\handlers\projects.py
```
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
```


# FILE: backend\planning_api\handlers\__init__.py
```
# Handlers package
```
