# Vercel Deployment Setup

## Configuration Steps

Since this is a monorepo with the Next.js app in the `frontend/` directory, you need to configure the Root Directory in your Vercel project settings:

### 1. In Vercel Dashboard

1. Go to your project settings
2. Navigate to **General** → **Root Directory**
3. Click **Edit** 
4. Set Root Directory to: `frontend`
5. Click **Save**

### 2. Build Settings (Auto-detected)

Once the root directory is set, Vercel will automatically detect:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 3. Environment Variables (Optional)

Add these in **Settings** → **Environment Variables**:
- `NEXT_PUBLIC_RPC_URL`: Your Solana RPC endpoint (e.g., `https://api.mainnet-beta.solana.com`)
- `NEXT_PUBLIC_API_URL`: Your backend API URL (optional, leave empty for frontend-only)

### 4. Deploy

After configuring the root directory, trigger a new deployment:
- Push to `main` branch, or
- Click **Redeploy** in the Vercel dashboard

## Troubleshooting

### "No Next.js version detected"
- Ensure Root Directory is set to `frontend` in project settings
- Verify `frontend/package.json` has `next` in dependencies

### Build fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `frontend/package.json`
- Test build locally: `cd frontend && npm run build`

## Local Development

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000
