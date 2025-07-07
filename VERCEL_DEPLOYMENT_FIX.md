# Vercel Deployment Fix Guide

## Issue
The Vercel deployment is not showing the latest changes because the project is configured to deploy from the repository root instead of the `aep-blueprint` subdirectory where the Next.js application actually lives.

## Solution Steps

### 1. Update Vercel Project Settings

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Find and click on the `aep-blueprint` project
3. Navigate to the **Settings** tab
4. Go to **General** → **Build & Development Settings**
5. Find the **Root Directory** setting
6. Click **Edit** next to Root Directory
7. Change it from `.` (or empty) to `aep-blueprint`
8. Click **Save**

### 2. Trigger a New Deployment

After updating the root directory setting, you need to trigger a new deployment:

**Option A: Through Vercel Dashboard**
1. Go to the **Deployments** tab in your project
2. Find the latest deployment
3. Click the three dots menu (⋮)
4. Select **Redeploy**

**Option B: Through Git (Recommended)**
```bash
# Make a small change to trigger deployment
echo " " >> aep-blueprint/README.md
git add aep-blueprint/README.md
git commit -m "chore: trigger deployment with correct root directory"
git push origin main
```

### 3. Verify the Deployment

1. Wait for the deployment to complete (usually 1-2 minutes)
2. Visit https://aep-blueprint.vercel.app
3. You should now see:
   - Navigation bar at the top with links to Blueprint, Admin, and Import Data
   - The main blueprint interface after logging in
   - Navigate to `/admin` to see the JSON management features

## Why This Happened

Your repository structure is:
```
carbonrobotics-exploration/
├── index.html              # Original HTML version
├── supabaseClient.js       # Original version files
├── aep-blueprint/          # Next.js application (this is what should deploy)
│   ├── package.json
│   ├── src/
│   └── ...
```

Vercel was trying to deploy from the root directory, which contains the old HTML version, instead of the `aep-blueprint` subdirectory that contains the actual Next.js application.

## Alternative: Create vercel.json

If the above doesn't work, create a `vercel.json` file in the repository root:

```json
{
  "builds": [
    {
      "src": "aep-blueprint/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/aep-blueprint/$1"
    }
  ]
}
```

## Verification Checklist

- [ ] Root Directory setting updated to `aep-blueprint`
- [ ] New deployment triggered
- [ ] Navigation bar visible at top of page
- [ ] Can navigate between Blueprint, Admin, and Import Data pages
- [ ] JSON Data Management section visible in Admin page
- [ ] Toast notifications working when copying JSON

## Additional Notes

- The environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY) should already be configured in Vercel
- The deployment will use the same Supabase instance as before
- All authentication and data will remain intact