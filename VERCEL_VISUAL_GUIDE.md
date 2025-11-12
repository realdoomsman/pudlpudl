# WHERE TO FIND ROOT DIRECTORY - VISUAL GUIDE

## When Importing a New Project

After you click "Import" on your repository, you'll see a configuration screen.

Look for this section (it's in the middle of the page):

```
┌─────────────────────────────────────────────────────────┐
│  Configure Project                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Framework Preset                                       │
│  [Next.js ▼]                                           │
│                                                         │
│  Root Directory                    [Edit]  ← CLICK HERE│
│  ./                                                     │
│                                                         │
│  Build and Output Settings                             │
│  ...                                                    │
└─────────────────────────────────────────────────────────┘
```

### Steps:
1. Click the **[Edit]** button next to "Root Directory"
2. A text box will appear
3. Type: `frontend`
4. Click outside the box or press Enter
5. Scroll down and click **Deploy**

## If You Already Have a Project

Go to your project settings:

1. Go to https://vercel.com/dashboard
2. Click on your **pudlpudl** project
3. Click **Settings** (top menu)
4. Click **General** (left sidebar)
5. Scroll down to find **Root Directory**
6. Click **Edit**
7. Type: `frontend`
8. Click **Save**
9. Go to **Deployments** tab
10. Click **Redeploy** on latest deployment

## Can't Find It?

If you still can't find "Root Directory", it might be because:

### Option A: Delete and Re-import
1. Go to your project settings
2. Scroll to bottom
3. Click **Delete Project**
4. Go to https://vercel.com/new
5. Import `pudlpudl` again
6. This time you'll see the Root Directory option

### Option B: Use Build Command Override
If Root Directory is hidden, you can override the build:

1. In project settings → **General**
2. Find **Build & Development Settings**
3. Override these:
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/.next`
   - **Install Command**: `cd frontend && npm install`

## Still Not Working?

Take a screenshot of your Vercel import/settings page and I can tell you exactly where to click!
