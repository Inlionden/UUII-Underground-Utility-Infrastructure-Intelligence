/**
 * UtilitySync — Configuration
 * Switch USE_MOCK_API to false and set API_BASE_URL after deploying the backend.
 */
window.US_CONFIG = {
  // Set to false when AWS backend is deployed
  USE_MOCK_API: true,

  // API Gateway URL — update after `sam deploy`
  API_BASE_URL: 'https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod',

  // AWS Region
  AWS_REGION: 'us-east-1',

  // Demo corridor ID (used when loading demo data)
  DEMO_CORRIDOR_ID: 'corr-001',

  // Map defaults — centered on demo corridor (London SE1)
  MAP_CENTER: [51.4996, -0.1065],
  MAP_ZOOM: 15,

  // Feature flags
  ENABLE_DRAW_MODE: true,
  ENABLE_STREAMING_AI: false,  // Set true when SSE streaming is ready
};
