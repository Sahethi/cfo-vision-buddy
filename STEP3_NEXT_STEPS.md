# Step 3: Supabase Setup & Deployment

## ✅ Supabase CLI Installed

Now follow these steps:

### 1. Login to Supabase

Run this command and follow the prompts:

```bash
supabase login
```

This will:
- Open your browser
- Ask you to authenticate
- Save your credentials locally

### 2. Link Your Project

Link to your existing Supabase project:

```bash
supabase link --project-ref msdaegozfihbeiegwzvq
```

Your project ref is: `msdaegozfihbeiegwzvq` (from your .env file)

### 3. Set AWS Credentials as Secrets

**IMPORTANT:** You need your AWS Access Key ID and Secret Access Key from Step 1.

Run these commands (replace with your actual values):

```bash
supabase secrets set AWS_ACCESS_KEY_ID=YOUR_ACTUAL_ACCESS_KEY_ID
supabase secrets set AWS_SECRET_ACCESS_KEY=YOUR_ACTUAL_SECRET_ACCESS_KEY
supabase secrets set AWS_REGION=us-east-1
supabase secrets set BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

**Example (DO NOT use these - they are placeholders):**
```bash
supabase secrets set AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
supabase secrets set AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
supabase secrets set AWS_REGION=us-east-1
supabase secrets set BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

### 4. Deploy the Function

Deploy the CFO Agent Edge Function:

```bash
supabase functions deploy cfo-agent
```

This will:
- Upload the function code
- Return a URL like: `https://msdaegozfihbeiegwzvq.supabase.co/functions/v1/cfo-agent`

### 5. Test It!

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Open the CFO Agent chat in your browser

3. Send a test message: "Show me my financial overview"

4. Check for errors in browser console (F12)

---

## Troubleshooting

**If login fails:**
- Make sure you're logged into Supabase in your browser
- Try `supabase logout` then `supabase login` again

**If link fails:**
- Verify your project ref is correct
- Check you have access to the project

**If secrets fail:**
- Make sure you're using the correct AWS credentials
- Check for typos in the secret names

**If deploy fails:**
- Check function code exists: `ls supabase/functions/cfo-agent/`
- Verify you're in the project root directory

