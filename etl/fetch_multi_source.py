"""
Multi-source job fetching aggregator.

Fetches jobs from multiple APIs and combines them into a unified dataset.
Handles failures gracefully - if one source fails, others continue.
"""

import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List

import pandas as pd

logger = logging.getLogger(__name__)


def fetch_from_all_sources(
    query: str = "software engineer",
    jsearch_pages: int = 5,
    usajobs_pages: int = 5
) -> Dict[str, Any]:
    """
    Fetch jobs from all available sources.

    Args:
        query: Search query
        jsearch_pages: Number of pages to fetch from JSearch
        usajobs_pages: Number of pages to fetch from USAJobs

    Returns:
        Dictionary with success status, total count, and per-source results.
    """
    results = {
        'sources': {},
        'total_jobs': 0,
        'successful_sources': 0,
        'failed_sources': 0,
        'combined_file': None
    }

    all_dataframes = []

    # Source 1: JSearch API
    try:
        logger.info("=" * 60)
        logger.info("Fetching from JSearch API...")
        logger.info("=" * 60)

        from etl.fetch_jobs import fetch_jobs
        jsearch_result = fetch_jobs(
            query=query,
            num_pages=jsearch_pages,
            jobs_per_page=10
        )

        if jsearch_result['success']:
            results['sources']['jsearch'] = {
                'success': True,
                'count': jsearch_result['count'],
                'file': jsearch_result.get('output_file')
            }
            results['successful_sources'] += 1
            results['total_jobs'] += jsearch_result['count']

            # Load the dataframe
            df = pd.read_parquet(jsearch_result['output_file'])
            all_dataframes.append(df)
        else:
            results['sources']['jsearch'] = {
                'success': False,
                'error': jsearch_result.get('error')
            }
            results['failed_sources'] += 1
            logger.warning(f"JSearch failed: {jsearch_result.get('error')}")

    except Exception as e:
        results['sources']['jsearch'] = {'success': False, 'error': str(e)}
        results['failed_sources'] += 1
        logger.error(f"JSearch exception: {str(e)}")

    # Source 2: USAJobs API
    try:
        logger.info("=" * 60)
        logger.info("Fetching from USAJobs API...")
        logger.info("=" * 60)

        from etl.fetch_usajobs import fetch_usajobs
        usajobs_result = fetch_usajobs(
            keyword=query,
            num_pages=usajobs_pages,
            results_per_page=25,
            posted_within_days=30
        )

        if usajobs_result['success']:
            results['sources']['usajobs'] = {
                'success': True,
                'count': usajobs_result['count'],
                'file': usajobs_result.get('output_file')
            }
            results['successful_sources'] += 1
            results['total_jobs'] += usajobs_result['count']

            # Load the dataframe
            df = pd.read_parquet(usajobs_result['output_file'])
            all_dataframes.append(df)
        else:
            results['sources']['usajobs'] = {
                'success': False,
                'error': usajobs_result.get('error')
            }
            results['failed_sources'] += 1
            logger.warning(f"USAJobs failed: {usajobs_result.get('error')}")

    except Exception as e:
        results['sources']['usajobs'] = {'success': False, 'error': str(e)}
        results['failed_sources'] += 1
        logger.error(f"USAJobs exception: {str(e)}")

    # Combine all successful sources
    if all_dataframes:
        logger.info("=" * 60)
        logger.info("Combining data from all sources...")
        logger.info("=" * 60)

        # Concatenate all dataframes
        combined_df = pd.concat(all_dataframes, ignore_index=True)

        # Remove duplicates based on job_id
        initial_count = len(combined_df)
        combined_df = combined_df.drop_duplicates(subset=['job_id'], keep='first')
        duplicates_removed = initial_count - len(combined_df)

        logger.info(f"Combined {initial_count} jobs from {len(all_dataframes)} sources")
        logger.info(f"Removed {duplicates_removed} duplicate jobs")
        logger.info(f"Final dataset: {len(combined_df)} unique jobs")

        # Save combined dataset
        output_dir = Path('data/raw')
        output_dir.mkdir(parents=True, exist_ok=True)

        today = datetime.now().strftime('%Y-%m-%d')
        output_file = output_dir / f'jobs_{today}.parquet'

        combined_df.to_parquet(output_file, index=False, engine='pyarrow')
        results['combined_file'] = str(output_file)

        logger.info(f"Saved combined dataset to {output_file}")

    # Summary
    logger.info("=" * 60)
    logger.info("MULTI-SOURCE FETCH SUMMARY")
    logger.info("=" * 60)
    logger.info(f"Successful sources: {results['successful_sources']}")
    logger.info(f"Failed sources: {results['failed_sources']}")
    logger.info(f"Total jobs fetched: {results['total_jobs']}")

    for source, result in results['sources'].items():
        if result['success']:
            logger.info(f"  ✓ {source}: {result['count']} jobs")
        else:
            logger.info(f"  ✗ {source}: {result.get('error', 'Unknown error')}")

    logger.info("=" * 60)

    return {
        'success': results['successful_sources'] > 0,
        'count': len(combined_df) if all_dataframes else 0,
        'sources': results['sources'],
        'total_jobs': results['total_jobs'],
        'output_file': results['combined_file']
    }


if __name__ == '__main__':
    # Enable logging for testing
    import logging
    logging.basicConfig(level=logging.INFO)

    # Test multi-source fetch
    # Note: Use simple query for USAJobs compatibility
    result = fetch_from_all_sources(
        query="software engineer",
        jsearch_pages=3,
        usajobs_pages=5
    )

    print("\n" + "=" * 60)
    print("FINAL RESULT")
    print("=" * 60)
    print(f"Success: {result['success']}")
    print(f"Total jobs: {result['count']}")
    print(f"Output file: {result.get('output_file')}")
