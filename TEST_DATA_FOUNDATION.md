# Test Data Foundation Upgrade

## Quick Test Commands

### 1. Test USAJobs API (2 minutes)

```bash
# Test USAJobs connection with your API key
python -m etl.fetch_usajobs

# Expected output:
# Fetching USAJobs page 1/5...
# Fetched 25 jobs from USAJobs page 1
# ✓ Saved 125 USAJobs postings to data/raw/jobs_usajobs_2025-12-10.parquet
```

### 2. Test Multi-Source Aggregation (3 minutes)

```bash
# Test both sources together
python -m etl.fetch_multi_source

# Expected output:
# ============================================================
# Fetching from JSearch API...
# ============================================================
# ✓ Fetched 30 jobs
#
# ============================================================
# Fetching from USAJobs API...
# ============================================================
# ✓ Fetched 125 jobs
#
# Combined 155 jobs from 2 sources
# Removed 5 duplicate jobs
# Final dataset: 150 unique jobs
```

### 3. Test Full Pipeline with Multi-Source (5 minutes)

```bash
# Run complete ETL pipeline
python -m etl.pipeline

# Expected output:
# [Stage 1/9] Fetching jobs from multiple sources...
#   ✓ jsearch: 30 jobs
#   ✓ usajobs: 125 jobs
# ✓ Fetched 150 jobs
#
# [Stage 2/9] Cleaning and normalizing job data...
# ✓ Cleaned 150 jobs
#
# [Stage 3/9] Extracting skills...
# ... (continues through all 9 stages)
#
# [Stage 8/9] Computing Job Market Momentum Index...
# ✓ Computed JMMI: 52.3/100
#
# ETL Pipeline Completed Successfully
```

### 4. Quick Backfill Test (2 minutes)

```bash
# Test with just last 3 days
python scripts/backfill_historical.py --days 3 --sources usajobs --delay 1.0

# When prompted, type: yes
```

### 5. Production Backfill (15 minutes - DO THIS!)

```bash
# Backfill 90 days from USAJobs
python scripts/backfill_historical.py --days 90 --sources usajobs --delay 2.0

# When prompted, type: yes
# Then go get coffee - this will take ~15 minutes
```

---

## Verification Commands

### Check Data Files

```bash
# List all raw data files
ls -lh data/raw/

# Should see:
# jobs_2025-12-10.parquet           (combined daily)
# jobs_usajobs_2025-12-10.parquet   (USAJobs only)
# jobs_2025-12-09.parquet           (backfilled)
# jobs_2025-12-08.parquet           (backfilled)
# ... (90 days of backfilled data)

# Count total jobs
python -c "import pandas as pd; from pathlib import Path; files = Path('data/raw').glob('jobs_*.parquet'); total = sum(len(pd.read_parquet(f)) for f in files); print(f'Total jobs: {total}')"
```

### Check JMMI Output

```bash
# After running pipeline, check JMMI
cat data/curated/jmmi.json | python -m json.tool

# Should see real scores now:
# {
#   "overall_score": 72.5,
#   "components": {
#     "posting_velocity": {"score": 65.2, "change_pct": 15.2},
#     ...
#   },
#   "interpretation": {
#     "label": "Growing Market",
#     "emoji": "📈"
#   }
# }
```

---

## Common Issues & Fixes

### Issue: "USAJOBS_API_KEY not found"

**Fix**: Check `.env` file has the key:
```bash
cat .env | grep USAJOBS_API_KEY
# Should show: USAJOBS_API_KEY='Fov1pNqqSAX2kjUpvl0Ue/qEW4gLydHKBCvoeFTFm3U='
```

### Issue: "USAJobs API returned status 403"

**Fix**: API key might be wrong. Test directly:
```bash
curl -H "Authorization-Key: Fov1pNqqSAX2kjUpvl0Ue/qEW4gLydHKBCvoeFTFm3U=" \
     -H "User-Agent: ai-job-market-dashboard/1.0" \
     "https://data.usajobs.gov/api/search?Keyword=software%20engineer&ResultsPerPage=1"
```

If this works, your key is valid.

### Issue: "No jobs fetched from USAJobs" or SearchResultCount: 0

**Cause**: USAJobs API doesn't handle complex OR queries well (e.g., "software engineer OR developer OR data scientist")

**Fix**: Use simpler keywords like "software engineer" instead of multiple OR operators.

**Already fixed**: Both `etl/fetch_usajobs.py` and `scripts/backfill_historical.py` now use simple keywords.

### Issue: "Multi-source import failed"

**Fix**: Make sure files exist:
```bash
ls etl/fetch_usajobs.py
ls etl/fetch_multi_source.py
```

### Issue: "JMMI still shows 50 (insufficient data)"

**Cause**: Need to run backfill first

**Fix**:
```bash
# Run backfill
python scripts/backfill_historical.py --days 90 --sources usajobs

# Then run pipeline
python -m etl.pipeline
```

---

## Success Indicators

### ✅ Multi-Source Working
- `data/raw/jobs_YYYY-MM-DD.parquet` has 150+ jobs
- Pipeline stage 1 shows: "Fetched 150 jobs" (not 30-50)

### ✅ USAJobs Integration Working
- `data/raw/jobs_usajobs_YYYY-MM-DD.parquet` exists
- Pipeline logs show: "✓ usajobs: 125 jobs"

### ✅ Backfill Successful
- 90 parquet files in `data/raw/`
- Total jobs > 10,000
- JMMI shows real scores (not 50.0)

### ✅ JMMI Now Meaningful
- Overall score is NOT 50.0
- Components show actual data (not "insufficient_data")
- Interpretation shows real label (not default)
- Recommendation is actionable

---

## What to Do After Testing

1. **If tests pass**: Run 90-day backfill overnight
2. **After backfill**: Run full pipeline
3. **Check JMMI**: Should see 60-80 score range
4. **Deploy**: Push to GitHub, Vercel auto-deploys
5. **Update README**: Mention multi-source aggregation
6. **Take screenshots**: JMMI with real data looks impressive

---

## Expected Timeline

| Step | Time | Command |
|------|------|---------|
| Test USAJobs | 2 min | `python -m etl.fetch_usajobs` |
| Test Multi-Source | 3 min | `python -m etl.fetch_multi_source` |
| Test Full Pipeline | 5 min | `python -m etl.pipeline` |
| **Run 90-Day Backfill** | **15 min** | `python scripts/backfill_historical.py --days 90 --sources usajobs` |
| Run Pipeline on Backfill | 10 min | `python -m etl.pipeline` |
| **Total** | **35 min** | **Data foundation complete!** |

---

## Next: GitHub Actions Update

Once local testing works, update `.github/workflows/daily_etl.yml`:

```yaml
- name: Run ETL pipeline
  env:
    RAPIDAPI_KEY: ${{ secrets.RAPIDAPI_KEY }}
    USAJOBS_API_KEY: ${{ secrets.USAJOBS_API_KEY }}  # Add this line
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  run: |
    python -m etl.pipeline
```

Add secret in GitHub:
1. Go to repo Settings → Secrets → Actions
2. Click "New repository secret"
3. Name: `USAJOBS_API_KEY`
4. Value: `Fov1pNqqSAX2kjUpvl0Ue/qEW4gLydHKBCvoeFTFm3U=`
5. Click "Add secret"

---

**Ready to test? Start with command #1 above!**
