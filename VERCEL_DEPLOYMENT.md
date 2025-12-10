# Vercel Deployment Guide

## Quick Deploy (Recommended)

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Go to Vercel**: https://vercel.com
   - Sign in with GitHub (recommended) or email

2. **Import Project**:
   - Click "Add New..." → "Project"
   - Click "Import Git Repository"
   - Find and select: `PHiZou/AI-Job-Market-Dashboard`
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Astro (should auto-detect)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `dist` (auto-filled)
   - **Install Command**: `npm install` (auto-filled)

4. **Environment Variables** (Optional - only if needed):
   - Usually not needed for static Astro sites
   - If you need API keys in frontend, add them here

5. **Deploy**:
   - Click "Deploy"
   - Wait ~2-3 minutes for build
   - Your site will be live at: `https://ai-job-market-dashboard-*.vercel.app`

6. **Custom Domain** (Optional):
   - Go to Project Settings → Domains
   - Add your custom domain

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (from project root)
vercel

# Deploy to production
vercel --prod
```

## Automatic Deployments

Once connected to GitHub:
- ✅ **Every push to `main`** → Auto-deploys to production
- ✅ **Pull requests** → Creates preview deployments
- ✅ **Build logs** → Available in Vercel dashboard

## Build Configuration

The project is already configured for Vercel:

- ✅ `vercel.json` - Vercel-specific settings
- ✅ `astro.config.mjs` - Optimized for Vercel
- ✅ Build output: `dist/` directory
- ✅ Static site generation (SSG)

## Post-Deployment Checklist

After deployment:

1. **Verify Dashboard Loads**:
   - Visit your Vercel URL
   - Check that charts render correctly
   - Test dark mode toggle

2. **Check Data Files**:
   - Verify `/public/data/*.json` files are accessible
   - Check browser console for any 404 errors

3. **Performance**:
   - Run Lighthouse audit
   - Check Core Web Vitals in Vercel Analytics (if enabled)

4. **GitHub Actions Integration**:
   - After GitHub Actions runs and commits new data
   - Vercel will automatically rebuild and deploy
   - No manual intervention needed!

## Troubleshooting

### Build Fails

**Error**: "Module not found" or "Import error"
- **Fix**: Make sure `node_modules` is committed (it shouldn't be - Vercel installs deps)
- **Fix**: Check `package.json` has all dependencies

**Error**: "Build command failed"
- **Fix**: Check build logs in Vercel dashboard
- **Fix**: Test build locally: `npm run build`

### Data Files Not Loading

**Issue**: JSON files return 404
- **Fix**: Ensure `public/data/*.json` files are committed to Git
- **Fix**: Check file paths in `dataLoaders.ts` match actual file locations

### Charts Not Rendering

**Issue**: Plotly charts don't show
- **Fix**: Check browser console for errors
- **Fix**: Verify Plotly is loaded (check Network tab)
- **Fix**: Ensure React components are client-side rendered

## Environment Variables (If Needed)

If you need to use API keys in the frontend (not recommended for security):

1. Go to Project Settings → Environment Variables
2. Add variables:
   - `PUBLIC_API_KEY` (prefix with `PUBLIC_` to expose to browser)
3. Access in code: `import.meta.env.PUBLIC_API_KEY`

**Note**: For this project, API keys should stay in GitHub Actions secrets, not in Vercel env vars.

## Performance Optimization

Already configured:
- ✅ Code splitting (Plotly loaded separately)
- ✅ CSS minification
- ✅ JavaScript minification (esbuild)
- ✅ Static asset caching headers
- ✅ Lazy loading for chart components

## Monitoring

- **Vercel Analytics**: Enable in Project Settings → Analytics
- **Build Logs**: Available in Deployments tab
- **Function Logs**: Not applicable (static site)

## Cost

- **Free Tier**: Perfect for this project
  - Unlimited deployments
  - 100GB bandwidth/month
  - Automatic SSL certificates
  - Custom domains supported

---

**Your Dashboard URL**: Will be provided after first deployment
**Auto-deploy**: Enabled by default (pushes to main branch)

