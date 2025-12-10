"""
Main ETL pipeline orchestrator for AI Job Market Intelligence Dashboard.

Coordinates all ETL steps sequentially with error handling and logging.
"""

import logging
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('etl_pipeline.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)


def run_pipeline() -> Dict[str, Any]:
    """
    Execute the complete ETL pipeline.
    
    Returns:
        Dictionary with execution status and timing information.
    """
    start_time = time.time()
    execution_status = {
        'start_time': datetime.now().isoformat(),
        'stages': {},
        'success': False,
        'error': None
    }
    
    try:
        logger.info("=" * 80)
        logger.info("Starting ETL Pipeline")
        logger.info("=" * 80)
        
        # Stage 1: Fetch jobs from multiple sources
        logger.info("\n[Stage 1/9] Fetching jobs from multiple sources...")
        stage_start = time.time()

        # Import multi-source fetcher (falls back to single source if unavailable)
        try:
            from etl.fetch_multi_source import fetch_from_all_sources
            fetch_result = fetch_from_all_sources(
                query="software engineer",  # Simple query for USAJobs compatibility
                jsearch_pages=3,  # Reduced to conserve quota
                usajobs_pages=5   # USAJobs is free, so we can fetch more
            )
        except ImportError:
            # Fallback to single source (backward compatibility)
            logger.warning("Multi-source fetcher not available, using JSearch only")
            from etl.fetch_jobs import fetch_jobs
            fetch_result = fetch_jobs(num_pages=5, jobs_per_page=10)

        execution_status['stages']['fetch'] = {
            'success': fetch_result['success'],
            'duration': time.time() - stage_start,
            'jobs_fetched': fetch_result.get('count', 0)
        }

        # If fetch fails, check for existing data from today
        if not fetch_result['success']:
            logger.warning("Fetch failed, checking for existing data files...")
            today = datetime.now().strftime('%Y-%m-%d')
            existing_file = Path(f'data/raw/jobs_{today}.parquet')

            if existing_file.exists():
                logger.info(f"✓ Using existing data file: {existing_file}")
                import pandas as pd
                df = pd.read_parquet(existing_file)
                fetch_result = {
                    'success': True,
                    'count': len(df),
                    'output_file': str(existing_file),
                    'from_cache': True
                }
                execution_status['stages']['fetch']['success'] = True
                execution_status['stages']['fetch']['jobs_fetched'] = len(df)
                execution_status['stages']['fetch']['from_cache'] = True
            else:
                raise Exception(f"Fetch stage failed and no cached data available: {fetch_result.get('error')}")

        logger.info(f"✓ Fetched {fetch_result.get('count', 0)} jobs{' (from cache)' if fetch_result.get('from_cache') else ''}")
        
        # Stage 2: Clean jobs
        logger.info("\n[Stage 2/8] Cleaning and normalizing job data...")
        stage_start = time.time()
        from etl.clean_jobs import clean_jobs
        clean_result = clean_jobs()
        execution_status['stages']['clean'] = {
            'success': clean_result['success'],
            'duration': time.time() - stage_start,
            'jobs_cleaned': clean_result.get('count', 0)
        }
        if not clean_result['success']:
            raise Exception(f"Clean stage failed: {clean_result.get('error')}")
        logger.info(f"✓ Cleaned {clean_result.get('count', 0)} jobs")
        
        # Stage 3: Extract skills
        logger.info("\n[Stage 3/8] Extracting skills from job descriptions...")
        stage_start = time.time()
        from etl.nlp_skills import extract_skills
        skills_result = extract_skills()
        execution_status['stages']['skills'] = {
            'success': skills_result['success'],
            'duration': time.time() - stage_start,
            'jobs_processed': skills_result.get('count', 0)
        }
        if not skills_result['success']:
            raise Exception(f"Skills extraction failed: {skills_result.get('error')}")
        logger.info(f"✓ Extracted skills for {skills_result.get('count', 0)} jobs")
        
        # Stage 4: Cluster jobs
        logger.info("\n[Stage 4/8] Clustering jobs into categories...")
        stage_start = time.time()
        from etl.nlp_clusters import cluster_jobs
        cluster_result = cluster_jobs()
        execution_status['stages']['clusters'] = {
            'success': cluster_result['success'],
            'duration': time.time() - stage_start,
            'categories': cluster_result.get('categories', 0)
        }
        if not cluster_result['success']:
            raise Exception(f"Clustering failed: {cluster_result.get('error')}")
        logger.info(f"✓ Created {cluster_result.get('categories', 0)} job categories")
        
        # Stage 5: Aggregate counts
        logger.info("\n[Stage 5/8] Aggregating job counts and time-series features...")
        stage_start = time.time()
        from etl.aggregate_counts import aggregate_counts
        aggregate_result = aggregate_counts()
        execution_status['stages']['aggregate'] = {
            'success': aggregate_result['success'],
            'duration': time.time() - stage_start
        }
        if not aggregate_result['success']:
            raise Exception(f"Aggregation failed: {aggregate_result.get('error')}")
        logger.info("✓ Aggregated job counts")
        
        # Stage 6: Forecast
        logger.info("\n[Stage 6/8] Generating hiring volume forecasts...")
        stage_start = time.time()
        from etl.forecast_jobs import forecast_jobs
        forecast_result = forecast_jobs()
        execution_status['stages']['forecast'] = {
            'success': forecast_result['success'],
            'duration': time.time() - stage_start,
            'forecast_days': forecast_result.get('forecast_days', 30)
        }
        if not forecast_result['success']:
            raise Exception(f"Forecasting failed: {forecast_result.get('error')}")
        logger.info(f"✓ Generated {forecast_result.get('forecast_days', 30)}-day forecasts")
        
        # Stage 7: Generate alerts
        logger.info("\n[Stage 7/9] Generating alerts for anomalies...")
        stage_start = time.time()
        from etl.generate_alerts import generate_alerts
        alerts_result = generate_alerts()
        execution_status['stages']['alerts'] = {
            'success': alerts_result['success'],
            'duration': time.time() - stage_start,
            'alerts_generated': alerts_result.get('count', 0)
        }
        if not alerts_result['success']:
            raise Exception(f"Alert generation failed: {alerts_result.get('error')}")
        logger.info(f"✓ Generated {alerts_result.get('count', 0)} alerts")

        # Stage 8: Compute JMMI
        logger.info("\n[Stage 8/9] Computing Job Market Momentum Index...")
        stage_start = time.time()
        from etl.compute_jmmi import compute_jmmi
        jmmi_result = compute_jmmi()
        execution_status['stages']['jmmi'] = {
            'success': jmmi_result['success'],
            'duration': time.time() - stage_start,
            'jmmi_score': jmmi_result.get('jmmi', {}).get('overall_score', 0)
        }
        if not jmmi_result['success']:
            raise Exception(f"JMMI computation failed: {jmmi_result.get('error')}")
        jmmi_score = jmmi_result.get('jmmi', {}).get('overall_score', 0)
        logger.info(f"✓ Computed JMMI: {jmmi_score}/100")

        # Stage 9: Export to JSON
        logger.info("\n[Stage 9/9] Exporting data to JSON for frontend...")
        stage_start = time.time()
        from etl.export_json import export_json
        export_result = export_json()
        execution_status['stages']['export'] = {
            'success': export_result['success'],
            'duration': time.time() - stage_start,
            'files_created': export_result.get('files_created', 0)
        }
        if not export_result['success']:
            raise Exception(f"Export failed: {export_result.get('error')}")
        logger.info(f"✓ Exported {export_result.get('files_created', 0)} JSON files")
        
        # Pipeline completed successfully
        execution_status['success'] = True
        execution_status['total_duration'] = time.time() - start_time
        
        logger.info("\n" + "=" * 80)
        logger.info("ETL Pipeline Completed Successfully")
        logger.info(f"Total execution time: {execution_status['total_duration']:.2f} seconds")
        logger.info("=" * 80)
        
    except Exception as e:
        execution_status['success'] = False
        execution_status['error'] = str(e)
        execution_status['total_duration'] = time.time() - start_time
        
        logger.error("\n" + "=" * 80)
        logger.error("ETL Pipeline Failed")
        logger.error(f"Error: {str(e)}")
        logger.error(f"Failed after {execution_status['total_duration']:.2f} seconds")
        logger.error("=" * 80)
        
        # Save error status
        error_file = Path('data/curated/pipeline_status.json')
        error_file.parent.mkdir(parents=True, exist_ok=True)
        import json
        with open(error_file, 'w') as f:
            json.dump(execution_status, f, indent=2)
        
        sys.exit(1)
    
    # Save execution status
    status_file = Path('data/curated/pipeline_status.json')
    status_file.parent.mkdir(parents=True, exist_ok=True)
    import json
    with open(status_file, 'w') as f:
        json.dump(execution_status, f, indent=2)
    
    return execution_status


if __name__ == '__main__':
    run_pipeline()

