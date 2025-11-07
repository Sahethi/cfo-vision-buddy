import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "npm:@aws-sdk/client-bedrock-agent-runtime";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "X-Session-Id", // Expose session ID header to frontend
};

// AWS Configuration
const AWS_REGION = Deno.env.get("AWS_REGION");
const AWS_ACCESS_KEY_ID = Deno.env.get("AWS_ACCESS_KEY_ID");
const AWS_SECRET_ACCESS_KEY = Deno.env.get("AWS_SECRET_ACCESS_KEY");
const AWS_BEDROCK_AGENT_ID = Deno.env.get("AWS_BEDROCK_AGENT_ID");
const AWS_BEDROCK_AGENT_ALIAS_ID = Deno.env.get("AWS_BEDROCK_AGENT_ALIAS_ID");

// Initialize the Bedrock Agent client
const client = new BedrockAgentRuntimeClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_ACCESS_KEY!,
  },
});

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Check for required AWS configuration
  if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_BEDROCK_AGENT_ID || !AWS_BEDROCK_AGENT_ALIAS_ID) {
    return new Response(
      JSON.stringify({
        error: "Missing AWS configuration. Please set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BEDROCK_AGENT_ID, and AWS_BEDROCK_AGENT_ALIAS_ID as Supabase secrets.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Get session ID from query parameter or create a new one
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId") || crypto.randomUUID();

    // Query the Bedrock Agent for dashboard metrics and available data types
    const prompt = `Analyze the knowledge base and provide:
1. Available financial metrics
2. Data types and categories present
3. Key financial indicators

Return a JSON object with this structure:
{
  "metrics": {
    "cashOnHand": <number or null>,
    "monthlyBurnRate": <number or null>,
    "overdueInvoices": <number or null>,
    "revenue": <number or null>,
    "expenses": <number or null>,
    "profit": <number or null>,
    "accountsReceivable": <number or null>,
    "accountsPayable": <number or null>
  },
  "dataTypes": ["transactions", "invoices", "expenses", "revenue", etc.],
  "availableCategories": ["category1", "category2", etc.],
  "timeRange": {
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD"
  }
}

Only return the JSON object, no additional text.`;

    const command = new InvokeAgentCommand({
      agentId: AWS_BEDROCK_AGENT_ID!,
      agentAliasId: AWS_BEDROCK_AGENT_ALIAS_ID!,
      sessionId: sessionId, // Use the session ID from query param or generated
      inputText: prompt,
    });

    const response = await client.send(command);

    // Decode the streaming response
    let bedrockResponseText = "";
    const decoder = new TextDecoder();
    if (response.completion) {
      for await (const chunk of response.completion) {
        if (chunk.chunk) {
          bedrockResponseText += decoder.decode(chunk.chunk.bytes);
        }
      }
    }

    // Try to parse JSON from the response
    let metrics = null;
    try {
      // Look for JSON in the response
      const jsonMatch = bedrockResponseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        metrics = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Failed to parse metrics JSON:", e);
    }

    // If we couldn't parse metrics, return default/error response
    if (!metrics) {
      return new Response(
        JSON.stringify({
          error: "Could not retrieve metrics from knowledge base",
          message: bedrockResponseText,
          sessionId: sessionId,
        }),
        {
          status: 500,
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-Session-Id": sessionId,
          },
        }
      );
    }

    // Return formatted metrics with metadata
    return new Response(
      JSON.stringify({
        metrics: {
          cashOnHand: metrics.metrics?.cashOnHand ?? metrics.cashOnHand ?? null,
          monthlyBurnRate: metrics.metrics?.monthlyBurnRate ?? metrics.monthlyBurnRate ?? null,
          overdueInvoices: metrics.metrics?.overdueInvoices ?? metrics.overdueInvoices ?? null,
          revenue: metrics.metrics?.revenue ?? metrics.revenue ?? null,
          expenses: metrics.metrics?.expenses ?? metrics.expenses ?? null,
          profit: metrics.metrics?.profit ?? metrics.profit ?? null,
          accountsReceivable: metrics.metrics?.accountsReceivable ?? metrics.accountsReceivable ?? null,
          accountsPayable: metrics.metrics?.accountsPayable ?? metrics.accountsPayable ?? null,
        },
        dataTypes: metrics.dataTypes || [],
        availableCategories: metrics.availableCategories || [],
        timeRange: metrics.timeRange || null,
        sessionId: sessionId, // Include session ID in response body
      }),
      {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-Session-Id": sessionId, // Include session ID in response headers
        },
      }
    );
  } catch (err) {
    console.error("Error fetching dashboard metrics:", err);
    // Try to get session ID from URL even in error case
    let sessionId = "unknown";
    try {
      const url = new URL(req.url);
      sessionId = url.searchParams.get("sessionId") || crypto.randomUUID();
    } catch (e) {
      // Ignore URL parsing errors
    }
    
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
        stack: err instanceof Error ? err.stack : undefined,
        sessionId: sessionId,
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-Session-Id": sessionId,
        },
      }
    );
  }
});

