# Step 1 - Remaining Tasks

## ✅ Policy Attached

Now complete these:

### 1. Create Access Keys (2 minutes)

1. **Still on your IAM user page** (same page where you added permissions)
2. Click the **"Security credentials"** tab (next to "Permissions")
3. Scroll down to **"Access keys"** section
4. Click **"Create access key"** button
5. Choose **"Application running outside AWS"** (or "Local code")
6. Click **"Next"** → **"Create access key"**
7. **IMPORTANT:** Copy and save:
   - **Access Key ID** (starts with `AKIA...`)
   - **Secret Access Key** (click "Show" to reveal it)
   
   ⚠️ **Save these securely!** You won't be able to see the secret key again.

### 2. Request Bedrock Model Access (1 minute)

1. Go to **AWS Bedrock Console**: https://console.aws.amazon.com/bedrock/
2. In the left sidebar, click **"Model access"** or **"Foundation models"**
3. Click **"Request model access"** or **"Enable model access"** button
4. Find **"Anthropic Claude 3.5 Sonnet"** in the list
5. Check the box next to it
6. Click **"Request access"** or **"Submit"**
7. Wait for approval (usually instant, but can take a few minutes)

**Verify it worked:**
- The model should show as "Access granted" or have a green checkmark
- You can test in "Playgrounds" → "Chat" if you want

---

## ✅ Ready for Step 2?

Once you have:
- ✅ Policy attached (DONE!)
- ✅ Access Key ID and Secret Access Key saved
- ✅ Bedrock model access requested

Let me know and we'll create the `.env` file!

