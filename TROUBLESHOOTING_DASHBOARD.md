# Troubleshooting Dashboard Metrics

If you see "Failed to fetch metrics" error, check the following:

## 1. Deploy the Function

Make sure the `dashboard-metrics` function is deployed:

```bash
supabase functions deploy dashboard-metrics
```

## 2. Check AWS Secrets

Verify all required secrets are set:

```bash
supabase secrets list
```

You should see:
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_BEDROCK_AGENT_ID`
- `AWS_BEDROCK_AGENT_ALIAS_ID`

If any are missing, set them:

```bash
supabase secrets set AWS_REGION=us-east-1
supabase secrets set AWS_ACCESS_KEY_ID=your-key
supabase secrets set AWS_SECRET_ACCESS_KEY=your-secret
supabase secrets set AWS_BEDROCK_AGENT_ID=your-agent-id
supabase secrets set AWS_BEDROCK_AGENT_ALIAS_ID=your-alias-id
```

## 3. Check Function Logs

View the function logs to see what's happening:

```bash
supabase functions logs dashboard-metrics
```

## 4. Test the Function Directly

Test the function endpoint:

```bash
curl -X GET "https://your-project.supabase.co/functions/v1/dashboard-metrics" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"
```

## 5. Verify Bedrock Agent Configuration

- Make sure your Bedrock Agent is configured correctly
- Verify the Agent ID and Alias ID are correct
- Ensure the Agent has access to your S3 knowledge base

## 6. Check Browser Console

Open browser DevTools (F12) and check the Console tab for detailed error messages.

## Common Issues

**Error: "Missing AWS configuration"**
- Solution: Set all required AWS secrets (see step 2)

**Error: "Could not retrieve metrics from knowledge base"**
- Solution: Check that your Bedrock Agent can access the knowledge base
- Verify your S3 bucket has the correct data
- Check Bedrock Agent logs in AWS Console

**Error: 401 Unauthorized**
- Solution: Make sure `verify_jwt = false` is set in `supabase/config.toml` for the function

**Error: Function not found (404)**
- Solution: Deploy the function (see step 1)

