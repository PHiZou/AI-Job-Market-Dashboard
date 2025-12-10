# Pre-Push Checklist

## Before Pushing to GitHub

### ✅ Security Check
- [x] `.env` is in `.gitignore` (contains API keys - should NEVER be committed)
- [x] `.venv/` and `venv/` are in `.gitignore`
- [x] `node_modules/` is in `.gitignore`
- [x] Large data files (`*.parquet`) are in `.gitignore`

### ✅ Configuration
- [x] API usage reduced to 5 pages per run (~35 API calls/week)
- [x] GitHub Actions workflow configured
- [x] README updated with API usage notes

### ✅ Required GitHub Secrets (Set these after pushing)
After pushing to GitHub, go to **Settings → Secrets and variables → Actions** and add:

1. `RAPIDAPI_KEY` - Your RapidAPI key
2. `RAPIDAPI_HOST` - `jsearch.p.rapidapi.com` (or leave default)
3. `JSEARCH_API_ENDPOINT` - `https://jsearch.p.rapidapi.com/search` (or leave default)
4. `OPENAI_API_KEY` - (Optional) Only if using LLM skill extraction

### ✅ Optional: Reduce API Usage Further

**Option 1: Use Sample Data**
- Add secret: `USE_SAMPLE_DATA=true`
- This bypasses all API calls

**Option 2: Run Weekly Instead of Daily**
- Edit `.github/workflows/daily_etl.yml`
- Change `cron: '0 6 * * *'` to `cron: '0 6 * * 0'` (every Sunday)

**Option 3: Reduce Pages Per Run**
- Edit `etl/pipeline.py` line 56
- Change `num_pages=5` to `num_pages=3` (or lower)

### ✅ Files to Commit
- All source code (`etl/`, `src/`, `config/`)
- Configuration files (`package.json`, `requirements.txt`, `astro.config.mjs`)
- GitHub Actions workflow (`.github/workflows/`)
- Sample data (`sample_data/`)
- JSON data files (`public/data/*.json`) - these are small and needed for the dashboard
- Documentation (`README.md`, `DEPLOYMENT_CHECKLIST.md`)

### ✅ Files NOT Committed (in .gitignore)
- `.env` (API keys)
- `.venv/`, `venv/` (Python virtual environment)
- `node_modules/` (Node dependencies)
- `data/raw/*.parquet` (large raw data files)
- `data/curated/*.parquet` (large processed data files)
- `*.log` (log files)
- `.astro/`, `dist/` (build artifacts)

## Quick Push Commands

```bash
# Initialize git (if not already done)
git init

# Add all files (respects .gitignore)
git add .

# Check what will be committed (verify no .env or secrets)
git status

# Commit
git commit -m "Initial commit: AI Job Market Intelligence Dashboard"

# Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/yourusername/AI-Job-Market-Dashboard.git

# Push
git push -u origin main
```

## After Pushing

1. **Set GitHub Secrets**: Go to repo Settings → Secrets → Actions
2. **Test GitHub Actions**: Go to Actions tab → Run workflow manually
3. **Verify Dashboard**: After first run, check that `public/data/*.json` files are committed
4. **Deploy**: Connect to Vercel/Netlify for live demo

## Current API Usage

- **Per Run**: 5 API calls (5 pages × 10 jobs/page = ~50 jobs)
- **Daily**: 5 calls/day
- **Weekly**: ~35 calls/week
- **Monthly**: ~150 calls/month

Most RapidAPI free plans allow 100-500 calls/month, so you should be safe!

