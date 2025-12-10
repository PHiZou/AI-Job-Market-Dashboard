# JMMI Quick Start Guide

## Test the JMMI Feature in 5 Minutes

### Step 1: Run the ETL Pipeline

```bash
# Option A: Use sample data (fastest)
export USE_SAMPLE_DATA=true
python -m etl.pipeline

# Option B: Use real API data (requires API key)
# Make sure .env has RAPIDAPI_KEY set
python -m etl.pipeline
```

**Expected output**:
```
[Stage 8/9] Computing Job Market Momentum Index...
✓ Computed JMMI: 72.5/100
```

### Step 2: Verify JMMI Data

```bash
# Check backend file
cat data/curated/jmmi.json

# Check frontend file
cat public/data/jmmi.json
```

**Should see**:
```json
{
  "overall_score": 72.5,
  "components": { ... },
  "interpretation": {
    "label": "Growing Market",
    "emoji": "📈",
    ...
  },
  "recommendation": "Market is growing steadily..."
}
```

### Step 3: View in Dashboard

```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:4321/projects/job-market-dashboard
```

**You should see**:
1. **JMMI card at the top** with a gauge showing the score
2. **Interpretation** (e.g., "Growing Market 📈")
3. **Component breakdown** (5 horizontal bars)
4. **Recommendations** for job seekers and recruiters

### Step 4: Deploy to Production

```bash
# Commit changes
git add -A
git commit -m "feat: add Job Market Momentum Index (JMMI)"
git push origin main

# Vercel auto-deploys in ~2 minutes
# Check: https://ai-job-market-dashboard.vercel.app/projects/job-market-dashboard
```

---

## Troubleshooting

### "JMMI data not available yet"

**Cause**: ETL pipeline hasn't run yet or JMMI calculation failed

**Fix**:
```bash
# Run JMMI calculation manually
python -m etl.compute_jmmi

# Check logs
cat etl_pipeline.log | grep -i jmmi
```

### "Component has insufficient data"

**Cause**: Need at least 14 days of data for accurate JMMI

**Fix**:
- Use sample data: `export USE_SAMPLE_DATA=true`
- Or wait for more data to accumulate from daily runs
- JMMI will show default score of 50 until enough data exists

### Frontend shows loading spinner forever

**Cause**: `public/data/jmmi.json` missing

**Fix**:
```bash
# Verify file exists
ls -lh public/data/jmmi.json

# If missing, run export manually
python -m etl.export_json
```

---

## Next Steps

1. **Take screenshots** of JMMI in action for your README
2. **Update README** with JMMI feature description
3. **Practice your pitch** (see Section 11 in IMPLEMENTATION_SUMMARY.md)
4. **Add to resume**: "Designed composite analytics metric (JMMI) for job market intelligence"

---

## Questions?

- Read [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for full details
- Check `etl/compute_jmmi.py` for implementation
- Review `src/components/job-market/JMMIGauge.tsx` for visualization

---

**Happy dashboarding! 🚀**
