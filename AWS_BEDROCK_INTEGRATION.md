# AWS Bedrock Integration Guide

This document explains how to connect your CFO Vision Buddy UI to AWS Bedrock.

## Overview

Your UI is already configured to make API calls. You just need to:
1. Set up a backend that connects to AWS Bedrock
2. Configure environment variables
3. Deploy and test

## Architecture

```
UI (React) → Backend API → AWS Bedrock → Response → UI
```

The UI sends requests to your backend, which:
- Authenticates with AWS using IAM credentials
- Calls AWS Bedrock API
- Returns formatted responses to the UI

## Quick Setup (Choose One)

### Option 1: Supabase Edge Function (Recommended)

**Why:** Already using Supabase, easy to deploy, serverless

**Steps:**

1. **Set up AWS IAM User:**
   ```bash
   # In AWS Console:
   # 1. IAM → Users → Create User: "bedrock-cfo-agent"
   # 2. Attach Policy: AmazonBedrockFullAccess
   # 3. Create Access Key → Save credentials
   ```

2. **Configure Supabase Secrets:**
   ```bash
   supabase secrets set AWS_ACCESS_KEY_ID=your-access-key-id
   supabase secrets set AWS_SECRET_ACCESS_KEY=your-secret-key
   supabase secrets set AWS_REGION=us-east-1
   supabase secrets set BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
   ```

3. **Deploy Function:**
   ```bash
   supabase functions deploy cfo-agent
   ```

4. **Update `.env`:**
   ```env
   VITE_BEDROCK_API_URL=https://your-project.supabase.co/functions/v1/cfo-agent
   ```

### Option 2: AWS Lambda + API Gateway

**Why:** Native AWS, better for AWS-only setups

**Steps:**

1. **Create Lambda Function:**
   - Runtime: Node.js 18.x
   - Upload code from `lambda/cfo-agent/index.js`
   - Install dependencies: `npm install @aws-sdk/client-bedrock-runtime`
   - Set environment variables:
     - `AWS_REGION=us-east-1`
     - `BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0`

2. **Attach IAM Role:**
   - Create/attach role with Bedrock permissions:
   ```json
   {
     "Effect": "Allow",
     "Action": ["bedrock:InvokeModel"],
     "Resource": "arn:aws:bedrock:*::foundation-model/*"
   }
   ```

3. **Create API Gateway:**
   - REST API → POST method → Lambda integration
   - Enable CORS
   - Deploy

4. **Update `.env`:**
   ```env
   VITE_BEDROCK_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/bedrock
   ```

## Request Model Access

Before using Bedrock, request model access:

1. Go to AWS Bedrock Console
2. Navigate to "Model access" or "Foundation models"
3. Request access for: **Anthropic Claude 3.5 Sonnet**
4. Wait for approval (usually instant)

## Environment Variables

Create/update `.env` in project root:

```env
# Supabase (if using)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Bedrock API Endpoint (choose one)
# Option 1: Supabase Edge Function
VITE_BEDROCK_API_URL=https://your-project.supabase.co/functions/v1/cfo-agent

# Option 2: AWS Lambda/API Gateway
# VITE_BEDROCK_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/bedrock
```

**Note:** If `VITE_BEDROCK_API_URL` is not set, the UI will default to:
`${VITE_SUPABASE_URL}/functions/v1/cfo-agent`

## API Request/Response Format

### Request (from UI)

The UI sends a `FormData` POST request:

```
message: string (user's text input)
files: File[] (optional uploaded files)
```

### Response (to UI)

Your backend should return JSON:

```json
{
  "response": "Text response from Bedrock",
  "visualizationData": {
    "type": "financial",
    "data": [...]
  },
  "traces": [...] // Optional: Bedrock trace format
}
```

## Testing

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Test in UI:**
   - Open CFO Agent chat
   - Send a message: "Show me my financial overview"
   - Check browser console (F12) for errors
   - Verify response appears

3. **Check Backend Logs:**
   - Supabase: `supabase functions logs cfo-agent`
   - Lambda: CloudWatch Logs

## Troubleshooting

### "AWS credentials not configured"
- **Supabase:** Check secrets are set: `supabase secrets list`
- **Lambda:** Verify IAM role has Bedrock permissions

### "Model not accessible"
- Request model access in Bedrock Console
- Check region matches (some models only in specific regions)
- Verify model ID is correct

### CORS Errors
- Ensure backend returns CORS headers
- Check `Access-Control-Allow-Origin` includes your frontend URL
- For API Gateway, enable CORS in the API settings

### 403 Forbidden
- Verify IAM user/role has `bedrock:InvokeModel` permission
- Check model ID matches requested model
- Ensure model access is approved

### 400 Bad Request
- Check request format matches Bedrock API requirements
- Verify `anthropic_version` is correct
- Check message format is valid

## Customization

### Change System Prompt

Edit the backend function (Supabase or Lambda):

```typescript
// In cfo-agent function
system: "You are a CFO Agent that helps analyze financial data..."
```

### Add File Processing

The backend currently handles file uploads. To process files:

1. Parse file content (CSV, JSON, etc.)
2. Extract relevant data
3. Include in Bedrock prompt
4. Return visualization data

### Enable Streaming

For real-time responses, use `InvokeModelWithResponseStream`:

```typescript
// Lambda example
const command = new InvokeModelWithResponseStreamCommand({...});
```

Then stream chunks to the frontend.

## Security Best Practices

1. **Never expose AWS credentials in frontend**
   - Always use backend API
   - Store credentials as environment variables/secrets

2. **Add authentication**
   - Require user login before API access
   - Use Supabase Auth or AWS Cognito

3. **Rate limiting**
   - Prevent abuse
   - Use API Gateway throttling or Supabase rate limits

4. **Input validation**
   - Sanitize user inputs
   - Validate file types and sizes

## Cost Optimization

- **Use appropriate model:** Claude 3.5 Sonnet is good balance
- **Set max_tokens:** Limit response length
- **Cache responses:** Store common queries
- **Monitor usage:** Set up CloudWatch alarms

## Next Steps

1. Choose backend option (Supabase or Lambda)
2. Set up AWS credentials and permissions
3. Request Bedrock model access
4. Deploy backend function
5. Update `.env` file
6. Test integration
7. Customize system prompt and behavior

## Support

- **AWS Bedrock Docs:** https://docs.aws.amazon.com/bedrock/
- **Supabase Functions:** https://supabase.com/docs/guides/functions
- **Lambda Docs:** https://docs.aws.amazon.com/lambda/

