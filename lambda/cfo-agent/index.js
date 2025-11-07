// AWS Lambda function for Bedrock integration
// This is Option 2 - using AWS Lambda instead of Supabase Edge Functions

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const bedrockClient = new BedrockRuntimeClient({ 
  region: process.env.AWS_REGION || 'us-east-1' 
});

const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';

exports.handler = async (event) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Parse request body
    let body;
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (e) {
      // Handle FormData if needed
      body = event.body;
    }

    const message = body.message || '';
    const files = body.files || [];

    if (!message && (!files || files.length === 0)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Message or files required" })
      };
    }

    // Process files if any (in a real scenario, you'd parse FormData)
    let fileContents = '';
    if (files.length > 0) {
      fileContents = files.map(f => `File: ${f.name || 'uploaded file'}`).join('\n');
    }

    const userContent = fileContents 
      ? `${message}\n\nAttached files:\n${fileContents}`
      : message;

    // Prepare Bedrock request
    const bedrockRequest = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 4096,
      system: "You are a CFO Agent that helps analyze financial data. When you analyze data, provide a summary and return visualization data in JSON format when appropriate. Format visualization data as: { type: 'financial', data: [...] }",
      messages: [
        {
          role: "user",
          content: userContent
        }
      ]
    };

    // Call Bedrock
    const command = new InvokeModelCommand({
      modelId: BEDROCK_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(bedrockRequest)
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const responseText = responseBody.content?.[0]?.text || "I've processed your request.";

    // Extract visualization data if present
    let visualizationData = null;
    try {
      // Look for JSON code blocks
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        visualizationData = JSON.parse(jsonMatch[1]);
      } else {
        // Try to parse if entire response is JSON
        visualizationData = JSON.parse(responseText);
      }
    } catch (e) {
      // Not JSON, continue without visualization data
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: responseText,
        visualizationData: visualizationData
      })
    };

  } catch (error) {
    console.error('Error calling Bedrock:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};

