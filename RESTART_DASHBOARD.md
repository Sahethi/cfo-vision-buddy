# How to See the New Dashboard

## Quick Steps

### 1. Deploy the Updated Dashboard Metrics Function

The backend function needs to be deployed to Supabase:

```bash
# Make sure you're linked to your Supabase project
supabase link --project-ref msdaegozfihbeiegwzvq

# Deploy the updated dashboard-metrics function
supabase functions deploy dashboard-metrics
```

### 2. Restart the Development Server

If your dev server is already running:
- **Option A:** Stop it (Ctrl+C) and restart:
  ```bash
  npm run dev
  ```

- **Option B:** If it's running with hot reload, just refresh your browser (Cmd+R or Ctrl+R)

### 3. Clear Browser Cache (Optional but Recommended)

To ensure you see all the new changes:
- **Chrome/Edge:** Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows) for hard refresh
- **Or:** Open DevTools (F12) → Right-click refresh button → "Empty Cache and Hard Reload"

### 4. Check the Dashboard

1. Open your browser to `http://localhost:8081` (or whatever port Vite is using)
2. Navigate to the Dashboard view
3. You should now see:
   - Enhanced KPI cards (Cash Flow, Profit, Revenue, Expenses, etc.)
   - **Statistics & Health** card with transaction stats and financial health indicators
   - **Top Entities & Data** card with top categories, vendors, and data types
   - Improved visual design with icons and badges

## Troubleshooting

**If you see old data:**
- Clear browser localStorage: Open DevTools → Application → Local Storage → Clear
- Hard refresh the page (Cmd+Shift+R)

**If metrics aren't loading:**
- Check browser console (F12) for errors
- Verify the function is deployed: `supabase functions list`
- Check function logs: `supabase functions logs dashboard-metrics`

**If you see "No metrics available":**
- Make sure your AWS Bedrock knowledge base has financial data
- Check that AWS credentials are set: `supabase secrets list`

