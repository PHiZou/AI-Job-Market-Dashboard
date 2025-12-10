# Quick GitHub Setup Guide

## Step 1: Create Repository on GitHub

1. Go to: **https://github.com/new**
2. Repository name: `AI-Job-Market-Dashboard`
3. Description: `AI-Driven Job Market Intelligence Dashboard - ETL pipeline, NLP processing, forecasting, and interactive analytics`
4. Choose: **Public** (recommended for portfolio) or **Private**
5. ⚠️ **DO NOT** check "Initialize with README" (we already have files)
6. Click **"Create repository"**

## Step 2: Push Your Code

After creating the repo, GitHub will show you commands. Use these instead:

```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/AI-Job-Market-Dashboard.git
git branch -M main
git push -u origin main
```

Or run the automated script:
```bash
./push_to_github.sh
```

## Step 3: Set Up GitHub Actions Secrets

After pushing, go to your repository:

1. **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"** and add:

   - **Name**: `RAPIDAPI_KEY`
     **Value**: Your RapidAPI key
  
   - **Name**: `RAPIDAPI_HOST`
     **Value**: `jsearch.p.rapidapi.com`
  
   - **Name**: `JSEARCH_API_ENDPOINT`
     **Value**: `https://jsearch.p.rapidapi.com/search`
  
   - **Name**: `OPENAI_API_KEY` (Optional)
     **Value**: Your OpenAI key (only if using LLM skill extraction)

## Step 4: Test GitHub Actions

1. Go to **Actions** tab
2. Click **"Run workflow"** → **"Run workflow"** button
3. Wait for it to complete (~2-3 minutes)
4. Check that `public/data/*.json` files are updated

## Step 5: Deploy Dashboard (Optional)

### Vercel (Recommended)
1. Go to https://vercel.com
2. Import your GitHub repository
3. Framework: Astro
4. Deploy!

### Netlify
1. Go to https://netlify.com
2. Import from Git → Select repository
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Deploy!

## Current Status

✅ Git repository initialized  
✅ Initial commit created (65 files, 16,852 lines)  
✅ `.env` file is properly ignored  
✅ Ready to push!

