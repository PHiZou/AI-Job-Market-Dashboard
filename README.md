# AI-Driven Job Market Intelligence Dashboard

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Available-brightgreen)](https://your-demo-url.vercel.app) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Live Demo**: [View Dashboard]([https://your-demo-url.vercel.app](https://ai-job-market-dashboard.vercel.app/projects/job-market-dashboard)) | [About Page](https://your-demo-url.vercel.app/projects/job-market-dashboard/about)

A production-style system that ingests job postings daily, processes them with NLP/AI, generates hiring forecasts, and displays insights in an interactive Astro dashboard.

## Portfolio Showcase

This project demonstrates expertise in:

- **Full-Stack Data Engineering**: End-to-end ETL pipeline with data cleaning, transformation, and storage
- **Machine Learning & NLP**: Skill extraction, semantic embeddings, K-means clustering, and Prophet time-series forecasting
- **Modern Web Development**: Astro + React + TypeScript with responsive design and dark mode
- **Production Systems**: Automated GitHub Actions workflows, error handling, and deployment
- **Data Visualization**: Interactive charts with Plotly.js and D3.js for geographic visualization

### Key Features

- **Actionable Insights**: "Learn Python: +25% growth" recommendations
- **Real-Time Analytics**: Daily-updated job market trends and forecasts
- **Professional UI**: Card-based layout with consistent design system
- **Data Quality Indicators**: Confidence levels, freshness timestamps, and source attribution
- **Responsive Design**: Optimized for mobile, tablet, and desktop

### Screenshots

> _Add screenshots here after deployment_
> 
> - Dashboard Overview
> - Hiring Volume Trends Chart
> - Skills Leaderboard with Learn Badges
> - Company Insights with Hiring Trends

## Architecture Overview

```
┌─────────────────┐
│  JSearch API    │
│  (RapidAPI)     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                    ETL Pipeline                         │
│  Fetch → Clean → NLP → Cluster → Aggregate → Forecast│
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              Data Storage                                │
│  Parquet (raw/curated) + JSON (public/data)            │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              GitHub Actions                              │
│  Daily ETL → Convert → Commit → Push                   │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              Astro Frontend                             │
│  Interactive Dashboard with Charts & Visualizations    │
└─────────────────────────────────────────────────────────┘
```

## Features

- **Daily Job Ingestion**: Automated fetching from JSearch API via RapidAPI
- **Data Cleaning & Normalization**: Standardizes titles, companies, salaries, locations
- **NLP Processing**: 
  - Skill extraction (regex + keyword matching + optional LLM)
  - Job category classification (embeddings + clustering)
- **Time-Series Analysis**: Daily aggregations with rolling averages
- **Forecasting**: Prophet-based 30-day hiring volume predictions
- **Anomaly Detection**: Automatic alerts for spikes, drops, and trends
- **Interactive Dashboard**: Real-time visualizations with Plotly/D3.js

## Project Structure

```
AI-Job-Market-Dashboard/
├── .github/workflows/     # GitHub Actions for daily ETL
├── config/                # Configuration files
│   ├── skills_master.csv
│   └── categories_mapping.yml
├── data/
│   ├── raw/              # Raw job data (Parquet)
│   └── curated/           # Processed data (Parquet + JSON)
├── etl/                   # ETL pipeline modules
│   ├── pipeline.py        # Main orchestrator
│   ├── fetch_jobs.py
│   ├── clean_jobs.py
│   ├── nlp_skills.py
│   ├── nlp_clusters.py
│   ├── aggregate_counts.py
│   ├── forecast_jobs.py
│   ├── generate_alerts.py
│   └── export_json.py
├── src/
│   ├── pages/             # Astro pages
│   ├── components/        # React components
│   └── utils/             # Data loaders
├── public/data/           # JSON files for frontend
└── requirements.txt       # Python dependencies
```

## Quick Start

### Using Sample Data (Recommended for Testing)

```bash
# Set environment variable
export USE_SAMPLE_DATA=true

# Run the pipeline
python scripts/run_full_pipeline.py

# Start frontend
npm run dev
```

### Using Real API Data

```bash
# Set up .env file with your API keys
cp .env.example .env
# Edit .env with your RAPIDAPI_KEY

# Run the pipeline
python scripts/run_full_pipeline.py

# Start frontend
npm run dev
```

## Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 18+
- RapidAPI account with JSearch API access
- (Optional) OpenAI API key for LLM-based skill extraction

### 1. Clone Repository

```bash
git clone <repository-url>
cd AI-Job-Market-Dashboard
```

### 2. Python Environment Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Note: If VS Code/Cursor Python extension shows venv creation errors,
# you can ignore them and install dependencies manually using the command above.
# The project doesn't need to be installed as a package - just install dependencies.
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
RAPIDAPI_KEY=your_rapidapi_key_here
RAPIDAPI_HOST=jsearch.p.rapidapi.com
JSEARCH_API_ENDPOINT=https://jsearch.p.rapidapi.com/search
OPENAI_API_KEY=your_openai_key_here  # Optional
USE_SAMPLE_DATA=false  # Set to 'true' to use sample data instead of API calls
```

**API Usage Note**: The pipeline fetches 5 pages (5 API calls) per run by default. With daily GitHub Actions, this equals ~35 API calls per week. Adjust `num_pages` in `etl/pipeline.py` if you need to reduce usage further.

### 4. Frontend Setup

```bash
# Install Node dependencies
npm install

# Start development server
npm run dev
```

### 5. Run ETL Pipeline Locally

```bash
# Run complete pipeline
python -m etl.pipeline

# Or run individual stages
python -m etl.fetch_jobs
python -m etl.clean_jobs
# ... etc
```

## Usage

### Running the ETL Pipeline

The ETL pipeline can be run manually or automatically via GitHub Actions:

**Manual Execution:**
```bash
python -m etl.pipeline
```

**GitHub Actions:**
- Runs automatically at 6 AM UTC daily
- Can be triggered manually via GitHub Actions UI
- Commits updated data files to the repository

### Accessing the Dashboard

1. Start the Astro dev server: `npm run dev`
2. Navigate to: `http://localhost:4321/projects/job-market-dashboard`
3. The dashboard will load data from `public/data/*.json`

### Dashboard Components

- **Hiring Volume Trends**: Line chart showing job counts over time by category
- **30-Day Forecast**: Prophet forecast with confidence intervals
- **Skills Leaderboard**: Top skills by frequency with category filtering
- **Company Leaderboard**: Top companies by hiring volume, sortable
- **Alerts Panel**: Real-time alerts for anomalies and trends

## Data Flow

1. **Ingestion**: `fetch_jobs.py` → `data/raw/jobs_YYYY-MM-DD.parquet`
2. **Cleaning**: `clean_jobs.py` → `data/curated/jobs_clean.parquet`
3. **NLP**: `nlp_skills.py` + `nlp_clusters.py` → adds skills and categories
4. **Aggregation**: `aggregate_counts.py` → `data/curated/aggregates_*.parquet`
5. **Forecasting**: `forecast_jobs.py` → `data/curated/forecasts.parquet`
6. **Alerts**: `generate_alerts.py` → `data/curated/alerts.json`
7. **Export**: `export_json.py` → `public/data/*.json`

## Configuration

### Skills Master List (`config/skills_master.csv`)

Add or modify skills with their aliases:
```csv
skill_name,category,aliases
Python,Programming Language,py|python3|python2
```

### Category Mapping (`config/categories_mapping.yml`)

Map cluster IDs to human-readable category names:
```yaml
cluster_0: "Software Engineering"
cluster_1: "Data Science & Analytics"
```

## GitHub Actions Setup

1. Add repository secrets (Settings → Secrets and variables → Actions):
   - `RAPIDAPI_KEY` (required for live data)
   - `RAPIDAPI_HOST` (default: `jsearch.p.rapidapi.com`)
   - `JSEARCH_API_ENDPOINT` (default: `https://jsearch.p.rapidapi.com/search`)
   - `OPENAI_API_KEY` (optional - for LLM skill extraction)

2. The workflow will:
   - Run daily at 6 AM UTC (or manually via "Run workflow")
   - Execute the ETL pipeline (5 API calls per run = ~35/week)
   - Commit updated data files to the repository
   - Push changes automatically

3. **To reduce API usage**:
   - Change schedule to weekly: Edit `.github/workflows/daily_etl.yml` and change `cron: '0 6 * * *'` to `cron: '0 6 * * 0'` (every Sunday)
   - Or set `USE_SAMPLE_DATA=true` as a secret to use sample data instead

## Development

### Adding New ETL Stages

1. Create new module in `etl/`
2. Implement main function returning `{'success': bool, ...}`
3. Add stage to `etl/pipeline.py`

### Extending Frontend Components

1. Add new component in `src/components/job-market/`
2. Import and use in `src/pages/projects/job-market-dashboard/index.astro`
3. Update data loaders if needed

## Troubleshooting

### ETL Pipeline Fails

- Check API keys in `.env`
- Review logs in `etl_pipeline.log`
- Verify data files exist in `data/raw/`

### Frontend Not Loading Data

- Ensure JSON files exist in `public/data/`
- Check browser console for fetch errors
- Verify file paths in `dataLoaders.ts`

### GitHub Actions Not Running

- Check workflow file syntax
- Verify repository secrets are set
- Review Actions logs for errors

## Technology Stack

- **Backend**: Python 3.11, Pandas, Prophet, Sentence-Transformers
- **Frontend**: Astro, React, TypeScript, Plotly.js, D3.js
- **Data Storage**: Parquet (backend), JSON (frontend)
- **Automation**: GitHub Actions
- **APIs**: JSearch (RapidAPI), OpenAI (optional)

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Testing with Sample Data

For offline development and testing, you can use sample data:

```bash
export USE_SAMPLE_DATA=true
python scripts/run_full_pipeline.py
```

This bypasses API calls and uses sample data from `sample_data/sample_jobs_raw.json`.

## Roadmap

- [ ] Add more data sources (USAJobs, SerpAPI)
- [ ] Implement S3 + Athena + Lambda architecture
- [ ] Add user authentication and saved searches
- [ ] Enhance map visualization with Leaflet/Mapbox
- [ ] Add email notifications for alerts
- [ ] Implement advanced ML models for forecasting

## Deployment

### Quick Deploy to Vercel

1. **Push to GitHub**: Ensure your repository is on GitHub
2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Astro and configure build settings
3. **Set Environment Variables** (if needed for ETL):
   - `RAPIDAPI_KEY` (optional - dashboard works with static data)
   - `OPENAI_API_KEY` (optional)
4. **Deploy**: Click "Deploy" - your dashboard will be live in minutes!

### Manual Deployment

```bash
# Build the static site
npm run build

# Preview locally
npm run preview

# Deploy dist/ folder to your hosting provider
# (Vercel, Netlify, GitHub Pages, etc.)
```

### Deployment Checklist

- [ ] Run ETL pipeline to generate initial data (`public/data/*.json`)
- [ ] Commit data files to repository
- [ ] Push to GitHub
- [ ] Connect to Vercel/Netlify
- [ ] Verify dashboard loads correctly
- [ ] Test dark mode toggle
- [ ] Verify all charts render
- [ ] Test mobile responsiveness
- [ ] Update README with live demo URL

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for detailed deployment instructions.

