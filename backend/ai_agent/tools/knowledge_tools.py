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
