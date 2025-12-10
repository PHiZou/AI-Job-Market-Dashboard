"""
Fetch job postings from JSearch API via RapidAPI.

Handles pagination, rate limiting, and retry logic with exponential backoff.
"""

import json
import logging
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

import pandas as pd
import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Sample data mode
USE_SAMPLE_DATA = os.getenv('USE_SAMPLE_DATA', 'false').lower() == 'true'

# API Configuration
RAPIDAPI_KEY = os.getenv('RAPIDAPI_KEY')
RAPIDAPI_HOST = os.getenv('RAPIDAPI_HOST', 'jsearch.p.rapidapi.com')
API_ENDPOINT = os.getenv('JSEARCH_API_ENDPOINT', 'https://jsearch.p.rapidapi.com/search')

# Rate limiting
MAX_RETRIES = 3
RETRY_DELAY = 1  # seconds
RATE_LIMIT_DELAY = 0.5  # seconds between requests


def fetch_jobs(
    query: str = "software engineer",
    num_pages: int = 10,
    jobs_per_page: int = 10,
    location: Optional[str] = None,
    date_posted: Optional[str] = None
) -> Dict[str, Any]:
    """
    Fetch job postings from JSearch API or load sample data.
    
    Args:
        query: Job search query
        num_pages: Number of pages to fetch
        jobs_per_page: Number of jobs per page
        location: Optional location filter
        date_posted: Optional date filter (e.g., "today", "3days", "week", "month")
    
    Returns:
        Dictionary with success status, count, and error message if any.
    """
    # Check for sample data mode
    if USE_SAMPLE_DATA:
        logger.info("Using sample data mode (USE_SAMPLE_DATA=true)")
        return _load_sample_data()
    
    if not RAPIDAPI_KEY:
        error_msg = "RAPIDAPI_KEY not found in environment variables"
        logger.error(error_msg)
        return {'success': False, 'error': error_msg, 'count': 0}
    
    all_jobs = []
    headers = {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
    }
    
    try:
        for page in range(1, num_pages + 1):
            logger.info(f"Fetching page {page}/{num_pages}...")
            
            params = {
                'query': query,
                'page': str(page),
                'num_pages': str(jobs_per_page)
            }
            
            if location:
                params['location'] = location
            if date_posted:
                params['date_posted'] = date_posted
            
            # Make API request with retry logic
            response = make_request_with_retry(headers, params)
            
            if not response:
                logger.warning(f"Failed to fetch page {page}, skipping...")
                continue
            
            # Parse response
            if response.status_code == 200:
                data = response.json()
                jobs = data.get('data', [])
                
                if not jobs:
                    logger.info(f"No more jobs found at page {page}, stopping pagination.")
                    break
                
                all_jobs.extend(jobs)
                logger.info(f"Fetched {len(jobs)} jobs from page {page}")
                
                # Rate limiting
                time.sleep(RATE_LIMIT_DELAY)
            else:
                logger.warning(f"API returned status {response.status_code} for page {page}")
                if response.status_code == 429:  # Rate limited
                    logger.info("Rate limited, waiting 60 seconds...")
                    time.sleep(60)
                else:
                    break
        
        if not all_jobs:
            error_msg = "No jobs fetched from API"
            logger.error(error_msg)
            return {'success': False, 'error': error_msg, 'count': 0}
        
        # Convert to DataFrame
        df = pd.DataFrame(all_jobs)
        
        # Add metadata
        df['fetched_at'] = datetime.now().isoformat()
        df['source'] = 'jsearch'
        
        # Save to Parquet
        output_dir = Path('data/raw')
        output_dir.mkdir(parents=True, exist_ok=True)
        
        today = datetime.now().strftime('%Y-%m-%d')
        output_file = output_dir / f'jobs_{today}.parquet'
        
        df.to_parquet(output_file, index=False, engine='pyarrow')
        logger.info(f"Saved {len(df)} jobs to {output_file}")
        
        return {
            'success': True,
            'count': len(df),
            'output_file': str(output_file)
        }
        
    except Exception as e:
        error_msg = f"Error fetching jobs: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {'success': False, 'error': error_msg, 'count': 0}


def make_request_with_retry(
    headers: Dict[str, str],
    params: Dict[str, str],
    max_retries: int = MAX_RETRIES
) -> Optional[requests.Response]:
    """
    Make API request with exponential backoff retry logic.
    
    Args:
        headers: Request headers
        params: Request parameters
        max_retries: Maximum number of retry attempts
    
    Returns:
        Response object or None if all retries failed
    """
    for attempt in range(max_retries):
        try:
            response = requests.get(API_ENDPOINT, headers=headers, params=params, timeout=30)
            
            if response.status_code == 200:
                return response
            elif response.status_code == 429:
                wait_time = (2 ** attempt) * RETRY_DELAY
                logger.warning(f"Rate limited, waiting {wait_time} seconds before retry...")
                time.sleep(wait_time)
            else:
                logger.warning(f"API returned status {response.status_code}")
                if attempt < max_retries - 1:
                    wait_time = (2 ** attempt) * RETRY_DELAY
                    time.sleep(wait_time)
                else:
                    return response
                    
        except requests.exceptions.RequestException as e:
            logger.warning(f"Request failed (attempt {attempt + 1}/{max_retries}): {str(e)}")
            if attempt < max_retries - 1:
                wait_time = (2 ** attempt) * RETRY_DELAY
                time.sleep(wait_time)
            else:
                logger.error("All retry attempts failed")
                return None
    
    return None


def _load_sample_data() -> Dict[str, Any]:
    """
    Load sample job data from sample_data directory.
    
    Returns:
        Dictionary with success status, count, and error message if any.
    """
    try:
        sample_file = Path('sample_data/sample_jobs_raw.json')
        
        if not sample_file.exists():
            error_msg = f"Sample data file not found: {sample_file}"
            logger.error(error_msg)
            return {'success': False, 'error': error_msg, 'count': 0}
        
        logger.info(f"Loading sample data from {sample_file}")
        
        with open(sample_file, 'r') as f:
            data = json.load(f)
        
        jobs = data.get('data', [])
        
        if not jobs:
            error_msg = "No jobs found in sample data"
            logger.error(error_msg)
            return {'success': False, 'error': error_msg, 'count': 0}
        
        # Convert to DataFrame
        df = pd.DataFrame(jobs)
        
        # Add metadata
        df['fetched_at'] = datetime.now().isoformat()
        df['source'] = 'sample_data'
        
        # Save to Parquet
        output_dir = Path('data/raw')
        output_dir.mkdir(parents=True, exist_ok=True)
        
        today = datetime.now().strftime('%Y-%m-%d')
        output_file = output_dir / f'jobs_{today}.parquet'
        
        df.to_parquet(output_file, index=False, engine='pyarrow')
        logger.info(f"Saved {len(df)} sample jobs to {output_file}")
        
        return {
            'success': True,
            'count': len(df),
            'output_file': str(output_file)
        }
        
    except Exception as e:
        error_msg = f"Error loading sample data: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {'success': False, 'error': error_msg, 'count': 0}


if __name__ == '__main__':
    # Test fetch
    result = fetch_jobs(query="software engineer", num_pages=2, jobs_per_page=10)
    print(f"Fetch result: {result}")

