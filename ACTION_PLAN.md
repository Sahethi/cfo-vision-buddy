# Action Plan: Connect to AWS Bedrock

Follow these steps in order:

## Step 1: Set Up AWS Account & Credentials (5 minutes)

1. **Go to AWS Console** → IAM → Users → Create User
   - Name: `bedrock-cfo-agent`
   - Attach policy: `AmazonBedrockFullAccess`
   - Create Access Key → **Save both Access Key ID and Secret Access Key**

2. **Request Bedrock Model Access:**
   - Go to AWS Bedrock Console
   - Navigate to "Model access" or "Foundation models"
   - Request access for: **Anthropic Claude 3.5 Sonnet**
   - Wait for approval (usually instant)

## Step 2: Create Environment File (2 minutes)

Create a `.env` file in your project root:

```bash
# In your terminal, from project root:
touch .env
```

Then add this content (replace with your actual values):

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Bedrock API Endpoint (will be set after deploying function)
VITE_BEDROCK_API_URL=https://your-project.supabase.co/functions/v1/cfo-agent
```

**Note:** If you don't have Supabase yet, you can skip those and just set `VITE_BEDROCK_API_URL` after deploying.

## Step 3: Install Supabase CLI (if not already installed)

```bash
npm install -g supabase
```

## Step 4: Login to Supabase

```bash
supabase login
```

## Step 5: Link Your Supabase Project

```bash
# Get your project ref from Supabase dashboard URL
# Example: https://abcdefghijklmnop.supabase.co → project ref is "abcdefghijklmnop"
supabase link --project-ref your-project-ref
```

## Step 6: Set AWS Credentials as Supabase Secrets

```bash
# Replace with your actual AWS credentials from Step 1
supabase secrets set AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
supabase secrets set AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
supabase secrets set AWS_REGION=us-east-1
supabase secrets set BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

## Step 7: Deploy the Edge Function

```bash
supabase functions deploy cfo-agent
```

This will output a URL like: `https://your-project.supabase.co/functions/v1/cfo-agent`

## Step 8: Update .env File

Update your `.env` file with the actual function URL:

```env
VITE_BEDROCK_API_URL=https://your-project.supabase.co/functions/v1/cfo-agent
```

## Step 9: Test It!

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Open the CFO Agent chat** in your browser

3. **Send a test message:** "Show me my financial overview"

4. **Check for errors:**
   - Browser console (F12)
   - Function logs: `supabase functions logs cfo-agent`

## Troubleshooting

**If you get "AWS credentials not configured":**
- Check secrets: `supabase secrets list`
- Make sure you set all 4 secrets correctly

**If you get "Model not accessible":**
- Go to Bedrock Console → Request model access
- Wait a few minutes for approval

**If you get CORS errors:**
- The function already handles CORS, but check browser console for details

## Alternative: Using AWS Lambda Instead

If you prefer AWS Lambda over Supabase:

1. Create Lambda function with code from `lambda/cfo-agent/index.js`
2. Create API Gateway endpoint
3. Set `VITE_BEDROCK_API_URL` to your API Gateway URL

See `AWS_BEDROCK_INTEGRATION.md` for Lambda setup details.

