"""
Fetch job postings from USAJobs API (Federal Government Jobs).

USAJobs API requires an API key (free to get) but has generous rate limits (no practical limit).
Provides federal job postings with structured data.

API Documentation: https://developer.usajobs.gov/API-Reference
Get API Key: https://developer.usajobs.gov/APIRequest/Index
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

# USAJobs API Configuration
API_BASE_URL = 'https://data.usajobs.gov/api/search'
USAJOBS_API_KEY = os.getenv('USAJOBS_API_KEY')  # Get from .env
USER_AGENT = 'ai-job-market-dashboard/1.0 (peter.hagen@example.com)'  # Required by USAJobs

# Rate limiting (be respectful even though there's no hard limit)
REQUEST_DELAY = 1.0  # seconds between requests


def fetch_usajobs(
    keyword: str = "software engineer",
    num_pages: int = 5,
    results_per_page: int = 25,  # USAJobs max is 500, but 25 is reasonable
    location: Optional[str] = None,
    posted_within_days: Optional[int] = None
) -> Dict[str, Any]:
    """
    Fetch job postings from USAJobs API.

    Args:
        keyword: Search keyword (job title, skills, etc.)
        num_pages: Number of pages to fetch
        results_per_page: Results per page (max 500)
        location: Location filter (city, state, or country code)
        posted_within_days: Filter jobs posted within last N days

    Returns:
        Dictionary with success status, count, and error message if any.
    """
    # Check for API key
    if not USAJOBS_API_KEY:
        error_msg = "USAJOBS_API_KEY not found in environment variables. Get one at: https://developer.usajobs.gov/APIRequest/Index"
        logger.error(error_msg)
        return {'success': False, 'error': error_msg, 'count': 0}

    all_jobs = []

    try:
        for page in range(1, num_pages + 1):
            logger.info(f"Fetching USAJobs page {page}/{num_pages}...")

            # Build query parameters
            params = {
                'Keyword': keyword,
                'ResultsPerPage': results_per_page,
                'Page': page
            }

            if location:
                params['LocationName'] = location

            if posted_within_days:
                params['DatePosted'] = posted_within_days

            # Build headers (Authorization-Key and User-Agent are required)
            headers = {
                'Authorization-Key': USAJOBS_API_KEY,
                'User-Agent': USER_AGENT,
                'Host': 'data.usajobs.gov'
            }

            # Make request
            response = requests.get(
                API_BASE_URL,
                params=params,
                headers=headers,
                timeout=30
            )

            if response.status_code != 200:
                logger.warning(f"USAJobs API returned status {response.status_code}")
                break

            data = response.json()

            # Extract search results
            search_result = data.get('SearchResult', {})
            jobs = search_result.get('SearchResultItems', [])

            if not jobs:
                logger.info(f"No more jobs found at page {page}, stopping pagination.")
                break

            # Normalize job data
            normalized_jobs = [normalize_usajob(job) for job in jobs]
            all_jobs.extend(normalized_jobs)

            logger.info(f"Fetched {len(jobs)} jobs from USAJobs page {page}")

            # Rate limiting
            time.sleep(REQUEST_DELAY)

        if not all_jobs:
            error_msg = "No jobs fetched from USAJobs"
            logger.error(error_msg)
            return {'success': False, 'error': error_msg, 'count': 0}

        # Convert to DataFrame
        df = pd.DataFrame(all_jobs)

        # Add metadata
        df['fetched_at'] = datetime.now().isoformat()
        df['source'] = 'usajobs'

        # Save to Parquet
        output_dir = Path('data/raw')
        output_dir.mkdir(parents=True, exist_ok=True)

        today = datetime.now().strftime('%Y-%m-%d')
        output_file = output_dir / f'jobs_usajobs_{today}.parquet'

        df.to_parquet(output_file, index=False, engine='pyarrow')
        logger.info(f"Saved {len(df)} USAJobs postings to {output_file}")

        return {
            'success': True,
            'count': len(df),
            'output_file': str(output_file),
            'source': 'usajobs'
        }

    except Exception as e:
        error_msg = f"Error fetching USAJobs: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {'success': False, 'error': error_msg, 'count': 0}


def normalize_usajob(job_data: Dict) -> Dict:
    """
    Normalize USAJobs API response to match our internal schema.

    USAJobs has a different structure than JSearch, so we map fields.
    """
    matched_job = job_data.get('MatchedObjectDescriptor', {})

    # Extract core fields
    position_title = matched_job.get('PositionTitle', '')
    organization_name = matched_job.get('OrganizationName', '')

    # Location info
    position_locations = matched_job.get('PositionLocation', [])
    if position_locations:
        location = position_locations[0]
        city = location.get('CityName', '')
        state = location.get('StateName', '')
        country = location.get('CountryCode', 'USA')
    else:
        city, state, country = '', '', 'USA'

    # Salary info
    position_remuneration = matched_job.get('PositionRemuneration', [])
    if position_remuneration:
        salary = position_remuneration[0]
        salary_min = salary.get('MinimumRange', None)
        salary_max = salary.get('MaximumRange', None)
    else:
        salary_min, salary_max = None, None

    # Job details
    job_summary = matched_job.get('UserArea', {}).get('Details', {})
    job_description = job_summary.get('JobSummary', '')

    # Qualifications
    qualifications = matched_job.get('QualificationSummary', '')
    if qualifications:
        job_description = f"{job_description}\n\nQualifications: {qualifications}"

    # Dates
    publication_start = matched_job.get('PublicationStartDate', '')
    application_close = matched_job.get('ApplicationCloseDate', '')

    # Map to our schema (compatible with JSearch format)
    normalized = {
        'job_id': matched_job.get('PositionID', ''),
        'job_title': position_title,
        'employer_name': organization_name,
        'job_description': job_description,
        'job_city': city,
        'job_state': state,
        'job_country': country,
        'job_min_salary': salary_min,
        'job_max_salary': salary_max,
        'job_salary_currency': 'USD',
        'job_posted_at_datetime_utc': publication_start,
        'job_application_deadline': application_close,
        'job_employment_type': matched_job.get('PositionSchedule', [{}])[0].get('Name', ''),
        'job_is_remote': 'remote' in position_title.lower() or 'telework' in job_description.lower(),
        'job_offer_expiration_datetime_utc': application_close,
        'job_required_experience': extract_experience_level(job_description),
        'job_required_education': extract_education_level(qualifications),
        # USAJobs specific
        'usajobs_position_offering_type': matched_job.get('PositionOfferingType', [{}])[0].get('Name', ''),
        'usajobs_department': matched_job.get('DepartmentName', ''),
        'usajobs_job_category': matched_job.get('JobCategory', [{}])[0].get('Name', ''),
        'usajobs_url': matched_job.get('PositionURI', ''),
    }

    return normalized


def extract_experience_level(text: str) -> Dict[str, Any]:
    """Extract experience level from job description."""
    text_lower = text.lower()

    if 'entry level' in text_lower or 'gs-5' in text_lower or 'gs-7' in text_lower:
        return {'minimum_years': 0, 'maximum_years': 2}
    elif 'mid level' in text_lower or 'gs-9' in text_lower or 'gs-11' in text_lower:
        return {'minimum_years': 2, 'maximum_years': 5}
    elif 'senior' in text_lower or 'gs-12' in text_lower or 'gs-13' in text_lower:
        return {'minimum_years': 5, 'maximum_years': 10}
    elif 'expert' in text_lower or 'gs-14' in text_lower or 'gs-15' in text_lower:
        return {'minimum_years': 10, 'maximum_years': None}
    else:
        return {'minimum_years': None, 'maximum_years': None}


def extract_education_level(text: str) -> Dict[str, Any]:
    """Extract education requirements from qualifications text."""
    if not text:
        return {'postgraduate_degree': False, 'professional_certification': False, 'high_school': False}

    text_lower = text.lower()

    return {
        'postgraduate_degree': 'master' in text_lower or 'phd' in text_lower or 'doctorate' in text_lower,
        'professional_certification': 'certification' in text_lower or 'certified' in text_lower,
        'high_school': 'high school' in text_lower or 'hs diploma' in text_lower
    }


if __name__ == '__main__':
    # Enable logging for testing
    logging.basicConfig(level=logging.INFO)

    # Test fetch
    # Note: USAJobs doesn't handle multiple OR operators well
    # Use simpler keywords for better results
    result = fetch_usajobs(
        keyword="software engineer",
        num_pages=5,
        results_per_page=25,
        posted_within_days=None  # Don't filter by date for now
    )
    print(f"\n{'='*60}")
    print(f"USAJobs fetch result: {result}")
    print(f"{'='*60}")
