# Quick Start: Connect to AWS Bedrock

## Prerequisites

1. **AWS Account** with Bedrock access
2. **Bedrock Model Access** - Request access in AWS Bedrock Console
3. **IAM User** with Bedrock permissions

## Step-by-Step Setup

### 1. Set Up AWS IAM User

1. Go to AWS Console → IAM → Users → Create User
2. Name: `bedrock-cfo-agent`
3. Attach policy: `AmazonBedrockFullAccess` (or create custom policy)
4. Create Access Key → Save credentials

### 2. Choose Your Backend Option

#### Option A: Supabase Edge Function (Recommended)

**Deploy the function:**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Set secrets
supabase secrets set AWS_ACCESS_KEY_ID=your-key-id
supabase secrets set AWS_SECRET_ACCESS_KEY=your-secret-key
supabase secrets set AWS_REGION=us-east-1
supabase secrets set BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0

# Deploy
supabase functions deploy cfo-agent
```

**Update `.env`:**
```env
VITE_BEDROCK_API_URL=https://your-project.supabase.co/functions/v1/cfo-agent
```

#### Option B: AWS Lambda

**Create Lambda:**

1. AWS Console → Lambda → Create Function
2. Runtime: Node.js 18.x
3. Upload the code from `lambda/cfo-agent/index.js`
4. Install dependencies:
   ```bash
   cd lambda/cfo-agent
   npm install
   zip -r function.zip .
   # Upload function.zip to Lambda
   ```
5. Set environment variables in Lambda:
   - `AWS_REGION=us-east-1`
   - `BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0`
6. Attach IAM role with Bedrock permissions

**Create API Gateway:**

1. Create REST API
2. Create POST method → Lambda integration
3. Enable CORS
4. Deploy API

**Update `.env`:**
```env
VITE_BEDROCK_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/bedrock
```

### 3. Request Bedrock Model Access

1. Go to AWS Bedrock Console
2. Navigate to "Model access"
3. Request access for: `Anthropic Claude 3.5 Sonnet`
4. Wait for approval (usually instant)

### 4. Test the Integration

1. Start dev server: `npm run dev`
2. Open CFO Agent chat
3. Send a test message
4. Check browser console for errors
5. Verify response appears

## Troubleshooting

**Error: "AWS credentials not configured"**
- Check Supabase secrets are set correctly
- Verify secret names match exactly

**Error: "Model not accessible"**
- Request model access in Bedrock Console
- Check region matches your model availability

**CORS Errors:**
- Ensure backend returns CORS headers
- Check API Gateway CORS settings

**403 Forbidden:**
- Verify IAM user has Bedrock permissions
- Check model ID is correct

## Next Steps

- Customize the system prompt in the backend
- Add file processing logic
- Implement streaming responses (optional)
- Add authentication/rate limiting

