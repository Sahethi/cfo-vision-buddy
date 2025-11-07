# AWS Bedrock Integration Guide

This guide explains how to connect your UI to AWS Bedrock for the CFO Agent functionality.

## Option 1: Using Supabase Edge Functions (Recommended for this project)

### Step 1: Set up AWS Credentials

1. **Create an IAM User in AWS:**
   - Go to AWS Console → IAM → Users → Create User
   - Name: `bedrock-cfo-agent`
   - Attach policy: `AmazonBedrockFullAccess` (or create a custom policy with only `bedrock:InvokeModel`)

2. **Create Access Keys:**
   - Go to the user → Security credentials → Create access key
   - Save the Access Key ID and Secret Access Key

### Step 2: Configure Supabase Secrets

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link your project:**
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Set secrets:**
   ```bash
   supabase secrets set AWS_ACCESS_KEY_ID=your-access-key-id
   supabase secrets set AWS_SECRET_ACCESS_KEY=your-secret-access-key
   supabase secrets set AWS_REGION=us-east-1
   supabase secrets set BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
   ```

### Step 3: Deploy the Edge Function

```bash
supabase functions deploy cfo-agent
```

### Step 4: Update Environment Variables

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_BEDROCK_API_URL=https://your-project.supabase.co/functions/v1/cfo-agent
```

**Note:** The Supabase Edge Function example above uses a simplified approach. For production, you'll need to implement proper AWS Signature V4 signing. Consider using the AWS SDK for Deno or a signing library.

---

## Option 2: Using AWS Lambda + API Gateway

### Step 1: Create Lambda Function

1. **Create a new Lambda function:**
   - Runtime: Node.js 18.x or later
   - Handler: `index.handler`

2. **Attach IAM Role with Bedrock permissions:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "bedrock:InvokeModel",
           "bedrock:InvokeModelWithResponseStream"
         ],
         "Resource": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
       }
     ]
   }
   ```

### Step 2: Lambda Function Code

Create `lambda/index.js`:

```javascript
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const bedrockClient = new BedrockRuntimeClient({ 
  region: process.env.AWS_REGION || 'us-east-1' 
});

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
    const body = JSON.parse(event.body);
    const message = body.message || '';
    const files = body.files || [];

    // Process files if any
    let fileContents = '';
    if (files.length > 0) {
      fileContents = files.map(f => `File: ${f.name}`).join('\n');
    }

    const userContent = fileContents 
      ? `${message}\n\nAttached files:\n${fileContents}`
      : message;

    // Prepare Bedrock request
    const bedrockRequest = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 4096,
      system: "You are a CFO Agent that helps analyze financial data. When you analyze data, provide a summary and return visualization data in JSON format when appropriate.",
      messages: [
        {
          role: "user",
          content: userContent
        }
      ]
    };

    // Call Bedrock
    const command = new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
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
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        visualizationData = JSON.parse(jsonMatch[1]);
      }
    } catch (e) {
      // Not JSON
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
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Unknown error'
      })
    };
  }
};
```

### Step 3: Deploy Lambda

```bash
cd lambda
npm install @aws-sdk/client-bedrock-runtime
zip -r function.zip .
# Upload to Lambda via AWS Console or CLI
```

### Step 4: Create API Gateway

1. Create REST API in API Gateway
2. Create POST method pointing to your Lambda
3. Enable CORS
4. Deploy API

### Step 5: Update Environment Variables

```env
VITE_BEDROCK_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/bedrock
```

---

## Option 3: Using AWS SDK for Deno (Better for Supabase)

For a more robust Supabase Edge Function, you can use the AWS SDK for Deno:

```typescript
// supabase/functions/cfo-agent/index.ts
import { S3Client } from "https://deno.land/x/aws_sdk@v3.0.0/client-s3/mod.ts";
// Note: Check for Bedrock SDK availability for Deno
// Or use direct HTTP calls with proper AWS Signature V4

// For now, use a library like: https://deno.land/x/aws_sign_v4
```

---

## Testing the Integration

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Test in the UI:**
   - Open the CFO Agent chat
   - Send a message
   - Check browser console for any errors
   - Verify the API call is being made to your endpoint

3. **Check Backend Logs:**
   - Supabase: `supabase functions logs cfo-agent`
   - Lambda: Check CloudWatch Logs

---

## Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Ensure your backend returns proper CORS headers
   - Check that `Access-Control-Allow-Origin` includes your frontend URL

2. **AWS Credentials:**
   - Verify credentials are set correctly
   - Check IAM permissions for Bedrock

3. **Model Access:**
   - Ensure the Bedrock model is available in your region
   - Request model access in AWS Bedrock console if needed

4. **Signature Errors:**
   - If using Supabase, ensure AWS Signature V4 is implemented correctly
   - Consider using AWS SDK for Lambda instead

---

## Next Steps

1. Choose your backend option (Supabase Edge Function or Lambda)
2. Set up AWS credentials and permissions
3. Deploy your backend function
4. Update environment variables in your `.env` file
5. Test the integration

For production, consider:
- Adding authentication
- Implementing rate limiting
- Adding error retry logic
- Setting up monitoring and logging

