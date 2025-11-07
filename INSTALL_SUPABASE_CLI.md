# Install Supabase CLI

## Fix npm Permissions (Required First)

Your npm cache has permission issues. Run this command in your terminal:

```bash
sudo chown -R $(whoami) "/Users/User/.npm"
```

Enter your password when prompted.

## Install Supabase CLI

After fixing permissions, choose one option:

### Option 1: Global Install (Recommended)

```bash
npm install -g supabase
```

### Option 2: Local Install (Alternative)

If you prefer not to install globally:

```bash
npm install supabase --save-dev
```

Then use it with: `npx supabase` instead of just `supabase`

## Verify Installation

After installing, verify it works:

```bash
supabase --version
```

You should see a version number like `1.x.x`.

## Next Steps

Once installed, we'll:
1. Login to Supabase: `supabase login`
2. Link your project: `supabase link --project-ref msdaegozfihbeiegwzvq`
3. Set AWS secrets
4. Deploy the function

