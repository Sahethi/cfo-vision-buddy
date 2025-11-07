# Deploy Instructions

## Quick Deploy Steps

### 1. Login to Supabase (if not already logged in)
```bash
supabase login
```
This will open your browser to authenticate.

### 2. Link Your Project
```bash
supabase link --project-ref msdaegozfihbeiegwzvq
```

### 3. Set AWS Secrets
Replace the values with your actual AWS credentials:

```bash
supabase secrets set AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
supabase secrets set AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY
supabase secrets set AWS_REGION=us-east-1
supabase secrets set AWS_BEDROCK_AGENT_ID=YOUR_AGENT_ID
supabase secrets set AWS_BEDROCK_AGENT_ALIAS_ID=YOUR_AGENT_ALIAS_ID
```

**Note:** You need to get `AWS_BEDROCK_AGENT_ID` and `AWS_BEDROCK_AGENT_ALIAS_ID` from your AWS Bedrock Console → Agents.

### 4. Deploy the Function
```bash
supabase functions deploy cfo-agent
```

### 5. Test It
```bash
npm run dev
```

Then open your app and test the CFO Agent chat!

---

## Verify Deployment

After deploying, you can test the function directly:

```bash
curl -X POST https://msdaegozfihbeiegwzvq.supabase.co/functions/v1/cfo-agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

Or check logs:
```bash
supabase functions logs cfo-agent
```

