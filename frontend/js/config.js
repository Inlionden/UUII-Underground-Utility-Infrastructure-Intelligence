/**
 * UtilitySync — Configuration
 * Switch USE_MOCK_API to false and set API_BASE_URL after deploying the backend.
 */
window.US_CONFIG = {
  // Set to false when AWS backend is deployed
  USE_MOCK_API: true,

  // Local mode keeps deterministic algorithms, AI explanations, and agents in-browser.
  // AWS mode routes API/AI calls to the deployed Lambda + Bedrock stack.
  AI_PROVIDER: 'local',
  AGENT_PROVIDER: 'local',
  AWS_ENABLED: false,

  // API Gateway URL — update after `sam deploy`
  API_BASE_URL: 'https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/prod',

  // AWS Region — Mumbai, closest AWS region for the Bengaluru working dataset
  AWS_REGION: 'ap-south-1',

  // Default Bengaluru corridor ID
  DEFAULT_CORRIDOR_ID: 'corr-wfd-itpl',

  // Map defaults — centered on Bengaluru working dataset
  MAP_CENTER: [12.9912, 77.7065],
  MAP_ZOOM: 15,

  // Feature flags
  ENABLE_DRAW_MODE: true,
  ENABLE_STREAMING_AI: false,  // Set true when SSE streaming is ready
};
