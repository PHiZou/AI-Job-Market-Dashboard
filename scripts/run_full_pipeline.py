#!/usr/bin/env python3
"""
Local end-to-end pipeline runner for testing and development.

Runs the complete ETL pipeline with enhanced logging and error reporting.
"""

import logging
import sys
import time
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables
load_dotenv()

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(levelname)8s] - %(name)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.FileHandler('etl_pipeline.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)


def run_full_pipeline():
    """Run the complete ETL pipeline end-to-end."""
    start_time = time.time()
    
    logger.info("=" * 80)
    logger.info("AI Job Market Dashboard - Full Pipeline Runner")
    logger.info(f"Started at: {datetime.now().isoformat()}")
    logger.info("=" * 80)
    
    stages = [
        ("Fetch Jobs", "etl.fetch_jobs", "fetch_jobs"),
        ("Clean Jobs", "etl.clean_jobs", "clean_jobs"),
        ("Extract Skills", "etl.nlp_skills", "extract_skills"),
        ("Cluster Jobs", "etl.nlp_clusters", "cluster_jobs"),
        ("Aggregate Counts", "etl.aggregate_counts", "aggregate_counts"),
        ("Forecast Jobs", "etl.forecast_jobs", "forecast_jobs"),
        ("Generate Alerts", "etl.generate_alerts", "generate_alerts"),
        ("Export JSON", "etl.export_json", "export_json"),
    ]
    
    results = {}
    
    for stage_name, module_name, function_name in stages:
        logger.info(f"\n{'='*80}")
        logger.info(f"Stage: {stage_name}")
        logger.info(f"{'='*80}")
        
        stage_start = time.time()
        
        try:
            # Dynamic import
            module = __import__(module_name, fromlist=[function_name])
            stage_function = getattr(module, function_name)
            
            # Execute stage
            result = stage_function()
            
            duration = time.time() - stage_start
            
            if result.get('success', False):
                logger.info(f"✓ {stage_name} completed successfully in {duration:.2f}s")
                results[stage_name] = {
                    'success': True,
                    'duration': duration,
                    'data': result
                }
            else:
                error_msg = result.get('error', 'Unknown error')
                logger.error(f"✗ {stage_name} failed: {error_msg}")
                results[stage_name] = {
                    'success': False,
                    'duration': duration,
                    'error': error_msg
                }
                logger.error("Pipeline stopped due to stage failure")
                break
                
        except ImportError as e:
            logger.error(f"✗ Failed to import {module_name}: {e}")
            results[stage_name] = {
                'success': False,
                'error': f"Import error: {str(e)}"
            }
            break
            
        except Exception as e:
            duration = time.time() - stage_start
            logger.error(f"✗ {stage_name} raised exception: {e}", exc_info=True)
            results[stage_name] = {
                'success': False,
                'duration': duration,
                'error': str(e)
            }
            break
    
    # Print summary
    total_duration = time.time() - start_time
    
    logger.info("\n" + "=" * 80)
    logger.info("PIPELINE EXECUTION SUMMARY")
    logger.info("=" * 80)
    
    for stage_name, result in results.items():
        status = "✓ PASS" if result.get('success') else "✗ FAIL"
        duration = result.get('duration', 0)
        logger.info(f"{status} - {stage_name:<25} ({duration:.2f}s)")
        if not result.get('success'):
            logger.error(f"  Error: {result.get('error', 'Unknown')}")
    
    logger.info(f"\nTotal Duration: {total_duration:.2f}s")
    
    all_success = all(r.get('success', False) for r in results.values())
    
    if all_success:
        logger.info("\n✓ Pipeline completed successfully!")
        logger.info("Check data/curated/ and public/data/ for output files")
        return 0
    else:
        logger.error("\n✗ Pipeline failed. Check logs above for details.")
        return 1


if __name__ == '__main__':
    exit_code = run_full_pipeline()
    sys.exit(exit_code)

