"""
Clean and normalize job posting data.

Normalizes job titles, company names, salaries, locations, and removes duplicates.
"""

import logging
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

import pandas as pd
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

logger = logging.getLogger(__name__)

# Initialize geocoder (with rate limiting)
geolocator = Nominatim(user_agent="ai-job-market-dashboard", timeout=10)


def clean_jobs() -> Dict[str, Any]:
    """
    Clean and normalize job data from raw Parquet files.
    
    Returns:
        Dictionary with success status, count, and error message if any.
    """
    try:
        # Find ALL raw data files (including historical backfill)
        raw_dir = Path('data/raw')
        parquet_files = list(raw_dir.glob('jobs_*.parquet'))

        if not parquet_files:
            error_msg = "No raw job data files found"
            logger.error(error_msg)
            return {'success': False, 'error': error_msg, 'count': 0}

        # Load ALL parquet files to include historical data
        logger.info(f"Loading data from {len(parquet_files)} files...")
        dfs = []
        for file in parquet_files:
            try:
                file_df = pd.read_parquet(file)
                dfs.append(file_df)
            except Exception as e:
                logger.warning(f"Could not load {file}: {e}")

        if not dfs:
            error_msg = "No valid data loaded from parquet files"
            logger.error(error_msg)
            return {'success': False, 'error': error_msg, 'count': 0}

        # Combine all dataframes
        df = pd.concat(dfs, ignore_index=True)
        logger.info(f"Loaded {len(df)} jobs from {len(dfs)} files")
        
        # Clean each column
        logger.info("Normalizing job titles...")
        df['job_title_clean'] = df.apply(lambda row: normalize_title(row.get('job_title', '')), axis=1)
        
        logger.info("Normalizing company names...")
        df['company_name_clean'] = df.apply(lambda row: normalize_company(row.get('employer_name', '')), axis=1)
        
        logger.info("Parsing and normalizing salaries...")
        df['salary_min'], df['salary_max'], df['salary_currency'] = zip(*df.apply(
            lambda row: parse_salary(row.get('job_min_salary'), row.get('job_max_salary'), row.get('job_salary_currency', 'USD')),
            axis=1
        ))
        
        logger.info("Normalizing locations...")
        df['location_clean'] = df.apply(lambda row: normalize_location(row.get('job_city', ''), row.get('job_state', ''), row.get('job_country', '')), axis=1)

        # Skip geocoding for faster pipeline (not needed for JMMI)
        logger.info("Skipping geocoding (not required for analytics)...")
        df['latitude'] = None
        df['longitude'] = None

        logger.info("Parsing job posted dates...")
        df['posted_date'] = df.apply(lambda row: parse_date(row.get('job_posted_at_datetime_utc', '')), axis=1)
        
        # Remove duplicates based on (title, company, location) tuple
        logger.info("Removing duplicates...")
        initial_count = len(df)
        df = df.drop_duplicates(
            subset=['job_title_clean', 'company_name_clean', 'location_clean'],
            keep='first'
        )
        duplicates_removed = initial_count - len(df)
        logger.info(f"Removed {duplicates_removed} duplicate jobs")

        # Ensure numeric columns are proper types (fix mixed type issues)
        logger.info("Fixing data types for Parquet compatibility...")
        # Convert all salary-related columns to numeric
        for col in ['salary_min', 'salary_max', 'job_min_salary', 'job_max_salary']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')

        # Convert all object columns to strings to avoid mixed types
        for col in df.columns:
            if df[col].dtype == 'object':
                df[col] = df[col].fillna('').astype(str)

        # Save cleaned data
        output_dir = Path('data/curated')
        output_dir.mkdir(parents=True, exist_ok=True)
        output_file = output_dir / 'jobs_clean.parquet'

        df.to_parquet(output_file, index=False, engine='pyarrow')
        logger.info(f"Saved {len(df)} cleaned jobs to {output_file}")
        
        return {
            'success': True,
            'count': len(df),
            'output_file': str(output_file),
            'duplicates_removed': duplicates_removed
        }
        
    except Exception as e:
        error_msg = f"Error cleaning jobs: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {'success': False, 'error': error_msg, 'count': 0}


def normalize_title(title: str) -> str:
    """Normalize job title."""
    if pd.isna(title) or not title:
        return ''
    
    title = str(title).strip()
    
    # Common abbreviations
    replacements = {
        r'\bSr\.\b': 'Senior',
        r'\bJr\.\b': 'Junior',
        r'\bSr\b': 'Senior',
        r'\bJr\b': 'Junior',
        r'\bSWE\b': 'Software Engineer',
        r'\bSDE\b': 'Software Development Engineer',
        r'\bSRE\b': 'Site Reliability Engineer',
        r'\bDevOps\b': 'DevOps Engineer',
        r'\bML\b': 'Machine Learning',
        r'\bAI\b': 'Artificial Intelligence',
        r'\bUI/UX\b': 'UI/UX',
    }
    
    for pattern, replacement in replacements.items():
        title = re.sub(pattern, replacement, title, flags=re.IGNORECASE)
    
    # Capitalize properly
    title = title.title()
    
    return title


def normalize_company(company: str) -> str:
    """Normalize company name."""
    if pd.isna(company) or not company:
        return ''
    
    company = str(company).strip()
    
    # Remove common suffixes and normalize
    company = re.sub(r'\s+Inc\.?$', '', company, flags=re.IGNORECASE)
    company = re.sub(r'\s+LLC\.?$', '', company, flags=re.IGNORECASE)
    company = re.sub(r'\s+Corp\.?$', '', company, flags=re.IGNORECASE)
    company = re.sub(r'\s+Ltd\.?$', '', company, flags=re.IGNORECASE)
    
    return company.strip()


def parse_salary(min_salary: Any, max_salary: Any, currency: str) -> Tuple[Optional[float], Optional[float], str]:
    """Parse and normalize salary information."""
    try:
        min_val = float(min_salary) if pd.notna(min_salary) and min_salary else None
        max_val = float(max_salary) if pd.notna(max_salary) and max_salary else None
        
        # Normalize currency
        currency = str(currency).upper() if pd.notna(currency) else 'USD'
        if currency not in ['USD', 'EUR', 'GBP', 'CAD', 'AUD']:
            currency = 'USD'
        
        return min_val, max_val, currency
    except (ValueError, TypeError):
        return None, None, 'USD'


def normalize_location(city: str, state: str, country: str) -> str:
    """Normalize location string."""
    parts = []
    
    if pd.notna(city) and city:
        parts.append(str(city).strip())
    if pd.notna(state) and state:
        parts.append(str(state).strip())
    if pd.notna(country) and country:
        parts.append(str(country).strip())
    
    location = ', '.join(parts) if parts else 'Unknown'
    
    # Normalize common variations
    location = re.sub(r'\bUSA\b', 'United States', location, flags=re.IGNORECASE)
    location = re.sub(r'\bUK\b', 'United Kingdom', location, flags=re.IGNORECASE)
    
    return location


def geocode_location(location: str) -> Tuple[Optional[float], Optional[float]]:
    """Geocode location to latitude/longitude."""
    if not location or location == 'Unknown':
        return None, None
    
    try:
        location_obj = geolocator.geocode(location, timeout=10)
        if location_obj:
            return location_obj.latitude, location_obj.longitude
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        logger.debug(f"Geocoding failed for {location}: {str(e)}")
    except Exception as e:
        logger.debug(f"Unexpected geocoding error for {location}: {str(e)}")
    
    return None, None


def parse_date(date_str: Any) -> Optional[str]:
    """Parse and normalize date string."""
    if pd.isna(date_str) or not date_str:
        return None
    
    try:
        # Try parsing various date formats
        date_str = str(date_str)
        
        # ISO format
        if 'T' in date_str:
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return dt.strftime('%Y-%m-%d')
        
        # Other formats can be added here
        
        return date_str[:10] if len(date_str) >= 10 else None
    except Exception:
        return None


if __name__ == '__main__':
    # Test cleaning
    result = clean_jobs()
    print(f"Clean result: {result}")

