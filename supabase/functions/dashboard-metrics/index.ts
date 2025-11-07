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

    // Comprehensive prompt to extract all financial data and insights
    const prompt = `You are analyzing a financial knowledge base. Extract ALL available financial data and return ONLY a JSON object with this exact structure:

{
  "metrics": {
    "cashOnHand": <current cash balance or null>,
    "monthlyBurnRate": <average monthly expenses or null>,
    "overdueInvoices": <total amount of overdue invoices or null>,
    "revenue": <total revenue/income or null>,
    "expenses": <total expenses or null>,
    "profit": <revenue minus expenses or null>,
    "accountsReceivable": <total AR or null>,
    "accountsPayable": <total AP or null>
  },
  "statistics": {
    "totalTransactions": <total number of transactions or null>,
    "averageTransactionSize": <average transaction amount or null>,
    "largestTransaction": <largest single transaction amount or null>,
    "transactionCount": <number of transactions or null>,
    "invoiceCount": <number of invoices or null>,
    "expenseCount": <number of expense records or null>
  },
  "topEntities": {
    "topVendors": [{"name": "<vendor name>", "amount": <total amount>}, ...],
    "topCustomers": [{"name": "<customer name>", "amount": <total amount>}, ...],
    "topCategories": [{"name": "<category>", "amount": <total amount>, "percentage": <percentage>}, ...]
  },
  "dataTypes": ["transactions", "invoices", "expenses", "revenue", "payments", etc.],
  "availableCategories": ["category1", "category2", etc.],
  "timeRange": {
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD"
  },
  "financialHealth": {
    "profitMargin": <profit/revenue * 100 or null>,
    "expenseRatio": <expenses/revenue * 100 or null>,
    "cashRunway": <cashOnHand/monthlyBurnRate in months or null>,
    "arTurnover": <revenue/accountsReceivable or null>
  }
}

CRITICAL INSTRUCTIONS:
1. Search through ALL documents, transactions, invoices, expenses, payments, and financial records
2. Calculate all metrics by aggregating relevant data
3. For topEntities: Extract top 5 vendors, customers, and categories by total amount
4. For statistics: Count all transactions, calculate averages, find largest transaction
5. For financialHealth: Calculate ratios and health indicators
6. If any data is missing, use null for metrics or empty arrays for lists
7. Return ONLY the JSON object, no markdown, no explanations, no code blocks`;

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
    let metrics: any = null;
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

    // Extract and calculate metrics
    const extractedMetrics = {
      cashOnHand: metrics.metrics?.cashOnHand ?? metrics.cashOnHand ?? null,
      monthlyBurnRate: metrics.metrics?.monthlyBurnRate ?? metrics.monthlyBurnRate ?? null,
      overdueInvoices: metrics.metrics?.overdueInvoices ?? metrics.overdueInvoices ?? null,
      revenue: metrics.metrics?.revenue ?? metrics.revenue ?? null,
      expenses: metrics.metrics?.expenses ?? metrics.expenses ?? null,
      profit: metrics.metrics?.profit ?? (metrics.metrics?.revenue && metrics.metrics?.expenses 
        ? metrics.metrics.revenue - metrics.metrics.expenses 
        : (metrics.revenue && metrics.expenses ? metrics.revenue - metrics.expenses : null)),
      accountsReceivable: metrics.metrics?.accountsReceivable ?? metrics.accountsReceivable ?? null,
      accountsPayable: metrics.metrics?.accountsPayable ?? metrics.accountsPayable ?? null,
    };

    // Calculate financial health indicators
    const financialHealth = metrics.financialHealth || {};
    if (!financialHealth.profitMargin && extractedMetrics.revenue && extractedMetrics.profit !== null) {
      financialHealth.profitMargin = extractedMetrics.revenue > 0 
        ? (extractedMetrics.profit / extractedMetrics.revenue) * 100 
        : null;
    }
    if (!financialHealth.expenseRatio && extractedMetrics.revenue && extractedMetrics.expenses) {
      financialHealth.expenseRatio = extractedMetrics.revenue > 0 
        ? (extractedMetrics.expenses / extractedMetrics.revenue) * 100 
        : null;
    }
    if (!financialHealth.cashRunway && extractedMetrics.cashOnHand && extractedMetrics.monthlyBurnRate) {
      financialHealth.cashRunway = extractedMetrics.monthlyBurnRate > 0 
        ? extractedMetrics.cashOnHand / extractedMetrics.monthlyBurnRate 
        : null;
    }

    // Return formatted metrics with comprehensive data
    return new Response(
      JSON.stringify({
        metrics: extractedMetrics,
        statistics: metrics.statistics || {},
        topEntities: metrics.topEntities || {
          topVendors: [],
          topCustomers: [],
          topCategories: []
        },
        financialHealth: financialHealth,
        dataTypes: metrics.dataTypes || [],
        availableCategories: metrics.availableCategories || [],
        timeRange: metrics.timeRange || null,
        sessionId: sessionId,
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

