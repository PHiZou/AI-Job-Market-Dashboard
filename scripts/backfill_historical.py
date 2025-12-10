"""
Backfill historical job data for the last 90 days.

This script fetches historical data to bootstrap the system with enough data
for meaningful forecasts and trend analysis.

IMPORTANT: This is a one-time operation. Run it once to populate historical data.

Usage:
    python scripts/backfill_historical.py --days 90 --sources jsearch,usajobs
"""

import argparse
import logging
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from etl.fetch_jobs import fetch_jobs
from etl.fetch_usajobs import fetch_usajobs

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backfill.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)


def backfill_jsearch(days_ago: int, date_str: str) -> bool:
    """
    Backfill data from JSearch for a specific date.

    Note: JSearch doesn't support exact date filtering, so we use date_posted parameter
    which filters to jobs posted within the last N days from today.
    """
    try:
        logger.info(f"Backfilling JSearch for {days_ago} days ago ({date_str})...")

        # JSearch uses "days since posted" not exact dates
        # We approximate by using the days_ago value
        result = fetch_jobs(
            query="software engineer OR developer OR data scientist",
            num_pages=2,  # Keep quota reasonable
            jobs_per_page=10,
            date_posted=None  # JSearch doesn't support exact date filtering well
        )

        if result['success']:
            logger.info(f"✓ JSearch backfill successful: {result['count']} jobs")
            return True
        else:
            logger.warning(f"✗ JSearch backfill failed: {result.get('error')}")
            return False

    except Exception as e:
        logger.error(f"JSearch backfill exception for {date_str}: {str(e)}")
        return False


def backfill_usajobs(days_ago: int, date_str: str) -> bool:
    """
    Backfill data from USAJobs for a specific date range.

    USAJobs allows filtering by "posted within last N days".
    """
    try:
        logger.info(f"Backfilling USAJobs for {days_ago} days ago ({date_str})...")

        # USAJobs supports "posted within N days" filter
        # Note: USAJobs doesn't handle complex OR queries well, use simple keywords
        result = fetch_usajobs(
            keyword="software engineer",
            num_pages=3,
            results_per_page=25,
            posted_within_days=days_ago + 7  # Get a week's range
        )

        if result['success']:
            # Rename the file to use the historical date instead of today's date
            import os
            from datetime import datetime

            today = datetime.now().strftime('%Y-%m-%d')
            today_file = Path(f'data/raw/jobs_usajobs_{today}.parquet')
            historical_file = Path(f'data/raw/jobs_usajobs_{date_str}.parquet')

            if today_file.exists():
                # If historical file already exists, load both and combine
                if historical_file.exists():
                    import pandas as pd
                    df_today = pd.read_parquet(today_file)
                    df_historical = pd.read_parquet(historical_file)
                    df_combined = pd.concat([df_historical, df_today], ignore_index=True)
                    df_combined = df_combined.drop_duplicates(subset=['job_id'], keep='first')
                    df_combined.to_parquet(historical_file, index=False, engine='pyarrow')
                    os.remove(today_file)
                else:
                    # Just rename
                    os.rename(today_file, historical_file)

            logger.info(f"✓ USAJobs backfill successful: {result['count']} jobs → {historical_file}")
            return True
        else:
            logger.warning(f"✗ USAJobs backfill failed: {result.get('error')}")
            return False

    except Exception as e:
        logger.error(f"USAJobs backfill exception for {date_str}: {str(e)}")
        return False


def backfill_historical_data(
    days: int = 90,
    sources: list = ['usajobs'],  # Default to USAJobs (free, unlimited)
    delay_between_requests: float = 2.0
):
    """
    Backfill historical data for the last N days.

    Args:
        days: Number of days to backfill
        sources: List of sources to use ('jsearch', 'usajobs')
        delay_between_requests: Seconds to wait between requests
    """
    logger.info("=" * 80)
    logger.info(f"Starting historical backfill for last {days} days")
    logger.info(f"Sources: {', '.join(sources)}")
    logger.info("=" * 80)

    start_time = time.time()
    stats = {
        'total_days': days,
        'successful_days': 0,
        'failed_days': 0,
        'total_jobs': 0,
        'source_stats': {source: {'success': 0, 'failed': 0} for source in sources}
    }

    # Backfill in reverse chronological order (most recent first)
    for days_ago in range(1, days + 1):
        date = datetime.now() - timedelta(days=days_ago)
        date_str = date.strftime('%Y-%m-%d')

        logger.info("\n" + "=" * 80)
        logger.info(f"Processing day {days_ago}/{days}: {date_str}")
        logger.info("=" * 80)

        day_success = False

        # Fetch from each source
        if 'jsearch' in sources:
            if backfill_jsearch(days_ago, date_str):
                stats['source_stats']['jsearch']['success'] += 1
                day_success = True
            else:
                stats['source_stats']['jsearch']['failed'] += 1

            time.sleep(delay_between_requests)

        if 'usajobs' in sources:
            if backfill_usajobs(days_ago, date_str):
                stats['source_stats']['usajobs']['success'] += 1
                day_success = True
            else:
                stats['source_stats']['usajobs']['failed'] += 1

            time.sleep(delay_between_requests)

        if day_success:
            stats['successful_days'] += 1
        else:
            stats['failed_days'] += 1

        # Progress update every 10 days
        if days_ago % 10 == 0:
            elapsed = time.time() - start_time
            remaining = (elapsed / days_ago) * (days - days_ago)
            logger.info(f"\nProgress: {days_ago}/{days} days ({days_ago/days*100:.1f}%)")
            logger.info(f"Elapsed: {elapsed/60:.1f} min, Estimated remaining: {remaining/60:.1f} min")

    # Final summary
    total_time = time.time() - start_time

    logger.info("\n" + "=" * 80)
    logger.info("BACKFILL COMPLETE")
    logger.info("=" * 80)
    logger.info(f"Total time: {total_time/60:.1f} minutes")
    logger.info(f"Days processed: {days}")
    logger.info(f"Successful days: {stats['successful_days']}")
    logger.info(f"Failed days: {stats['failed_days']}")
    logger.info(f"Success rate: {stats['successful_days']/days*100:.1f}%")

    logger.info("\nPer-source statistics:")
    for source, source_stats in stats['source_stats'].items():
        logger.info(f"  {source}:")
        logger.info(f"    Successful: {source_stats['success']}")
        logger.info(f"    Failed: {source_stats['failed']}")

    logger.info("\nNext steps:")
    logger.info("1. Run the full ETL pipeline: python -m etl.pipeline")
    logger.info("2. Check data quality: ls -lh data/raw/")
    logger.info("3. Verify JMMI calculation works with historical data")

    logger.info("=" * 80)


def main():
    parser = argparse.ArgumentParser(
        description='Backfill historical job market data',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Backfill last 30 days from USAJobs only (free, unlimited)
  python scripts/backfill_historical.py --days 30 --sources usajobs

  # Backfill last 90 days from all sources
  python scripts/backfill_historical.py --days 90 --sources jsearch,usajobs

  # Quick test with last 7 days
  python scripts/backfill_historical.py --days 7 --sources usajobs --delay 1.0
        """
    )

    parser.add_argument(
        '--days',
        type=int,
        default=90,
        help='Number of days to backfill (default: 90)'
    )

    parser.add_argument(
        '--sources',
        type=str,
        default='usajobs',
        help='Comma-separated list of sources: jsearch,usajobs (default: usajobs)'
    )

    parser.add_argument(
        '--delay',
        type=float,
        default=2.0,
        help='Seconds to wait between requests (default: 2.0)'
    )

    args = parser.parse_args()

    # Parse sources
    sources = [s.strip() for s in args.sources.split(',')]
    valid_sources = ['jsearch', 'usajobs']

    for source in sources:
        if source not in valid_sources:
            logger.error(f"Invalid source: {source}. Valid sources: {', '.join(valid_sources)}")
            sys.exit(1)

    # Confirm before running
    logger.info("\n" + "=" * 80)
    logger.info("BACKFILL CONFIGURATION")
    logger.info("=" * 80)
    logger.info(f"Days to backfill: {args.days}")
    logger.info(f"Sources: {', '.join(sources)}")
    logger.info(f"Delay between requests: {args.delay}s")
    logger.info(f"Estimated time: {args.days * len(sources) * args.delay / 60:.1f} minutes")
    logger.info("=" * 80)

    response = input("\nProceed with backfill? (yes/no): ")
    if response.lower() != 'yes':
        logger.info("Backfill cancelled.")
        sys.exit(0)

    # Run backfill
    backfill_historical_data(
        days=args.days,
        sources=sources,
        delay_between_requests=args.delay
    )


if __name__ == '__main__':
    main()
