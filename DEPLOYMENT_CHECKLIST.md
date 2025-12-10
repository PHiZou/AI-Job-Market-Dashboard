# Deployment Checklist

## Pre-Deployment Setup

### 1. Environment Variables

Create a `.env` file with the following variables:

```env
# Required
RAPIDAPI_KEY=your_rapidapi_key_here
RAPIDAPI_HOST=jsearch.p.rapidapi.com
JSEARCH_API_ENDPOINT=https://jsearch.p.rapidapi.com/search

# Optional (for LLM skill extraction)
OPENAI_API_KEY=your_openai_key_here

# Optional (for offline development)
USE_SAMPLE_DATA=false
```

### 2. Python Environment

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Node.js Environment

```bash
# Install frontend dependencies
npm install
```

## Local Testing

### Step 1: Test with Sample Data

```bash
# Set environment variable
export USE_SAMPLE_DATA=true

# Run the pipeline
python scripts/run_full_pipeline.py

# Or run individual stages
python -m etl.pipeline
```

### Step 2: Verify Output Files

Check that the following files are created:

- `data/raw/jobs_YYYY-MM-DD.parquet`
- `data/curated/jobs_clean.parquet`
- `data/curated/aggregates_category.parquet`
- `data/curated/forecasts.parquet`
- `data/curated/alerts.json`
- `public/data/trends.json`
- `public/data/forecasts.json`
- `public/data/skills.json`
- `public/data/companies.json`
- `public/data/alerts.json`

### Step 3: Test Frontend

```bash
# Start Astro dev server
npm run dev

# Navigate to: http://localhost:4321/projects/job-market-dashboard
```

Verify:
- Charts render correctly
- Data loads without errors
- All components display properly

## GitHub Actions Setup

### 1. Repository Secrets

Add the following secrets in GitHub Settings → Secrets and variables → Actions:

- `RAPIDAPI_KEY` - Your RapidAPI key
- `RAPIDAPI_HOST` - jsearch.p.rapidapi.com (or leave as default)
- `JSEARCH_API_ENDPOINT` - https://jsearch.p.rapidapi.com/search (or leave as default)
- `OPENAI_API_KEY` - (Optional) Your OpenAI API key

### 2. Verify Workflow File

Ensure `.github/workflows/daily_etl.yml` exists and is correctly configured.

### 3. Test Workflow

1. Go to Actions tab in GitHub
2. Click "Daily ETL Pipeline"
3. Click "Run workflow" to test manually
4. Verify it completes successfully

## Production Deployment

### Checklist Before Going Live

- [ ] All environment variables are set
- [ ] Python dependencies installed (`pip install -r requirements.txt`)
- [ ] Node dependencies installed (`npm install`)
- [ ] ETL pipeline runs successfully locally
- [ ] Frontend builds without errors (`npm run build`)
- [ ] GitHub Actions workflow tested and working
- [ ] Sample data works for offline development
- [ ] All JSON files are generated in `public/data/`
- [ ] Dashboard renders correctly with real data
- [ ] Error handling works properly
- [ ] Logging is configured correctly

### Deployment Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd AI-Job-Market-Dashboard
   ```

2. **Set Up Python Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Set Up Frontend**
   ```bash
   npm install
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

5. **Run Initial ETL**
   ```bash
   python -m etl.pipeline
   # Or use sample data: USE_SAMPLE_DATA=true python -m etl.pipeline
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

7. **Build for Production**
   ```bash
   npm run build
   npm run preview  # Test production build
   ```

## Troubleshooting

### ETL Pipeline Issues

**Problem**: `RAPIDAPI_KEY not found`
- **Solution**: Set `USE_SAMPLE_DATA=true` for testing, or add `RAPIDAPI_KEY` to `.env`

**Problem**: `ModuleNotFoundError`
- **Solution**: Ensure virtual environment is activated and `pip install -r requirements.txt` completed

**Problem**: `Prophet import failed`
- **Solution**: Install Prophet: `pip install prophet` (may require system dependencies)

**Problem**: No data files created
- **Solution**: Check `data/raw/` and `data/curated/` directories exist, check logs in `etl_pipeline.log`

### Frontend Issues

**Problem**: Charts not rendering
- **Solution**: Check browser console for errors, verify JSON files exist in `public/data/`

**Problem**: `Failed to load` errors
- **Solution**: Ensure ETL pipeline has run and generated JSON files

**Problem**: TypeScript errors
- **Solution**: Run `npm install` to ensure all types are installed

### GitHub Actions Issues

**Problem**: Workflow fails on commit
- **Solution**: Check repository permissions, ensure `GITHUB_TOKEN` has write access

**Problem**: Secrets not found
- **Solution**: Verify all secrets are set in repository settings

**Problem**: Python dependencies fail to install
- **Solution**: Check `requirements.txt` for compatibility issues

## Monitoring

### Log Files

- `etl_pipeline.log` - Main ETL execution log
- `data/curated/pipeline_status.json` - Pipeline execution status

### GitHub Actions Artifacts

- ETL logs are uploaded as artifacts for each run
- Check Actions tab → Workflow run → Artifacts

## Next Steps

After successful deployment:

1. Monitor first few automated runs
2. Verify data quality in dashboard
3. Adjust forecasting parameters if needed
4. Add additional data sources (USAJobs, SerpAPI)
5. Consider migrating to S3 + Athena + Lambda architecture

## Support

For issues or questions:
1. Check logs in `etl_pipeline.log`
2. Review GitHub Actions workflow runs
3. Verify all environment variables are set
4. Test with `USE_SAMPLE_DATA=true` first

