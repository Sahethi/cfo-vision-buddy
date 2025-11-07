# Step 1 Verification Checklist

## ✅ IAM User Created

Now complete these sub-steps:

### 1.1 Attach Bedrock Policy

1. Go to AWS Console → IAM → Users
2. Click on your IAM user (the one you just created)
3. Click "Add permissions" or "Permissions" tab
4. Click "Attach policies directly"
5. Search for: `AmazonBedrockFullAccess`
6. Check the box and click "Add permissions"

**Alternative (More Secure):** Create a custom policy with only what you need:
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
      "Resource": "arn:aws:bedrock:*::foundation-model/*"
    }
  ]
}
```

### 1.2 Create Access Keys

1. Still in your IAM user page
2. Go to "Security credentials" tab
3. Scroll to "Access keys" section
4. Click "Create access key"
5. Choose "Application running outside AWS" (or "Local code")
6. Click "Next" → "Create access key"
7. **IMPORTANT:** Copy both:
   - **Access Key ID** (starts with `AKIA...`)
   - **Secret Access Key** (click "Show" to reveal)
   
   ⚠️ **Save these securely!** You won't be able to see the secret key again.

### 1.3 Request Bedrock Model Access

1. Go to AWS Bedrock Console: https://console.aws.amazon.com/bedrock/
2. In the left sidebar, click "Model access" or "Foundation models"
3. Click "Request model access" or "Enable model access"
4. Find **"Anthropic Claude 3.5 Sonnet"** in the list
5. Check the box and click "Request access" or "Submit"
6. Wait for approval (usually instant, but can take a few minutes)

**Verify access:**
- The model should show as "Access granted" or have a green checkmark
- You can also go to "Playgrounds" → "Chat" to test if the model is available

---

## ✅ Ready for Step 2?

Once you have:
- ✅ IAM user with Bedrock policy attached
- ✅ Access Key ID and Secret Access Key saved
- ✅ Bedrock model access requested and approved

You're ready to move to Step 2 (creating the .env file)!

