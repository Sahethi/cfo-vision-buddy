import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "npm:@aws-sdk/client-bedrock-agent-runtime";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --- AWS Configuration ---
// These are read from your Supabase secrets.
const AWS_REGION = Deno.env.get("AWS_REGION");
const AWS_ACCESS_KEY_ID = Deno.env.get("AWS_ACCESS_KEY_ID");
const AWS_SECRET_ACCESS_KEY = Deno.env.get("AWS_SECRET_ACCESS_KEY");
const AWS_BEDROCK_AGENT_ID = Deno.env.get("AWS_BEDROCK_AGENT_ID");
const AWS_BEDROCK_AGENT_ALIAS_ID = Deno.env.get("AWS_BEDROCK_AGENT_ALIAS_ID");

// Check that all secrets are set
if (
  !AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY ||
  !AWS_BEDROCK_AGENT_ID || !AWS_BEDROCK_AGENT_ALIAS_ID
) {
  console.error(
    "CRITICAL ERROR: Missing one or more AWS secrets in Supabase environment.",
  );
  console.error(
    "Please set: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BEDROCK_AGENT_ID, AWS_BEDROCK_AGENT_ALIAS_ID",
  );
}

// Initialize the Bedrock AGENT client (this is the correct client)
// This client handles ALL authentication (SigV4) for you automatically.
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

  try {
    // 1. Get data from FormData (to match your React app)
    const formData = await req.formData();
    const message = formData.get("message") as string;
    const files = formData.getAll("files") as File[];

    // --- IMPORTANT FOR MEMORY ---
    // Your React app should send a 'sessionId' in the FormData
    // If it doesn't, every message will start a new conversation
    const sessionId = formData.get("sessionId") as string || crypto.randomUUID();

    if (!message && files.length === 0) {
      return new Response(
        JSON.stringify({ error: "Message or files required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // --- File Handling ---
    // This just informs the agent *about* the files.
    // The agent's Knowledge Base *cannot* read these uploaded files.
    let promptText = message;
    if (files.length > 0) {
      const fileNames = files.map((f) => f.name).join(", ");
      promptText += `\n\n[User has attached the following files: ${fileNames}]`;
    }

    // 2. Prepare the command to send to the Bedrock AGENT
    // This calls your AGENT, not a base model.
    const command = new InvokeAgentCommand({
      agentId: AWS_BEDROCK_AGENT_ID, // Uses your secret
      agentAliasId: AWS_BEDROCK_AGENT_ALIAS_ID, // Uses your secret
      sessionId: sessionId,
      inputText: promptText,
    });

    // 3. Securely call the Bedrock Agent API
    // The SDK handles all the complex signing that was failing
    const response = await client.send(command);

    // 4. Decode the streaming response
    let bedrockResponseText = "";
    const decoder = new TextDecoder();
    if (response.completion) {
      for await (const chunk of response.completion) {
        if (chunk.chunk) {
          bedrockResponseText += decoder.decode(chunk.chunk.bytes);
        }
      }
    }

    // 5. Send the final text answer back to your React app
    // This matches the response format your CFOChat.tsx is expecting
    return new Response(
      JSON.stringify({
        response: bedrockResponseText,
        visualizationData: null,
        traces: null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Error calling Bedrock Agent:", err);
    // Return a detailed error to the client to help with debugging
    return new Response(
      JSON.stringify({ error: err.message, stack: err.stack }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});