"""
Aggregate job counts and generate time-series features.

Groups by date, category, location and computes rolling averages and skill frequencies.
"""

import logging
from collections import Counter
from pathlib import Path
from typing import Dict, List, Any

import pandas as pd
import yaml

logger = logging.getLogger(__name__)


def aggregate_counts() -> Dict[str, Any]:
    """
    Aggregate job counts and generate time-series features.
    
    Returns:
        Dictionary with success status and error message if any.
    """
    try:
        # Load clustered jobs
        input_file = Path('data/curated/jobs_clean.parquet')
        if not input_file.exists():
            error_msg = f"Cleaned jobs file not found: {input_file}"
            logger.error(error_msg)
            return {'success': False, 'error': error_msg}
        
        df = pd.read_parquet(input_file)
        logger.info(f"Loaded {len(df)} jobs for aggregation")
        
        # Load category mapping
        with open('config/categories_mapping.yml', 'r') as f:
            category_mapping = yaml.safe_load(f)
        
        # Map cluster IDs to category names
        df['category_name'] = df['category'].map(category_mapping).fillna('Unknown')
        
        # Ensure posted_date is datetime
        df['posted_date'] = pd.to_datetime(df['posted_date'], errors='coerce')
        df = df[df['posted_date'].notna()]  # Remove jobs without valid dates
        
        logger.info("Aggregating job counts by date, category, and location...")
        
        # Aggregate by date and category
        daily_category_counts = df.groupby(['posted_date', 'category_name']).size().reset_index(name='job_count')
        
        # Aggregate by date and location
        daily_location_counts = df.groupby(['posted_date', 'location_clean']).size().reset_index(name='job_count')
        
        # Aggregate by date only (overall)
        daily_overall_counts = df.groupby('posted_date').size().reset_index(name='job_count')
        daily_overall_counts['category_name'] = 'All'
        
        # Calculate rolling averages
        logger.info("Calculating rolling averages...")
        daily_category_counts = add_rolling_averages(daily_category_counts, 'category_name')
        daily_location_counts = add_rolling_averages(daily_location_counts, 'location_clean')
        daily_overall_counts = add_rolling_averages(daily_overall_counts, 'category_name')
        
        # Skill frequency analysis
        logger.info("Computing skill frequency matrices...")
        skill_frequency = compute_skill_frequency(df)
        
        # Company hiring volume
        logger.info("Computing company hiring statistics...")
        company_stats = compute_company_stats(df)
        
        # Save aggregated data
        output_dir = Path('data/curated')
        output_dir.mkdir(parents=True, exist_ok=True)
        
        daily_category_counts.to_parquet(output_dir / 'aggregates_category.parquet', index=False)
        daily_location_counts.to_parquet(output_dir / 'aggregates_location.parquet', index=False)
        daily_overall_counts.to_parquet(output_dir / 'aggregates_overall.parquet', index=False)
        
        # Save skill frequency as JSON for easier access
        import json
        with open(output_dir / 'skill_frequency.json', 'w') as f:
            json.dump(skill_frequency, f, indent=2)
        
        # Save company stats
        company_stats.to_parquet(output_dir / 'company_stats.parquet', index=False)
        
        logger.info("Saved aggregated data files")
        
        return {
            'success': True,
            'date_range': {
                'start': str(daily_overall_counts['posted_date'].min()),
                'end': str(daily_overall_counts['posted_date'].max())
            },
            'total_days': len(daily_overall_counts),
            'categories': df['category_name'].nunique(),
            'unique_skills': len(skill_frequency)
        }
        
    except Exception as e:
        error_msg = f"Error aggregating counts: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {'success': False, 'error': error_msg}


def add_rolling_averages(df: pd.DataFrame, group_col: str) -> pd.DataFrame:
    """
    Add rolling averages to aggregated data.
    
    Args:
        df: DataFrame with date and count columns
        group_col: Column to group by for rolling averages
    
    Returns:
        DataFrame with rolling average columns added
    """
    df = df.sort_values(['posted_date', group_col])
    
    # Calculate rolling averages per group
    df['rolling_7d'] = df.groupby(group_col)['job_count'].transform(
        lambda x: x.rolling(window=7, min_periods=1).mean()
    )
    df['rolling_30d'] = df.groupby(group_col)['job_count'].transform(
        lambda x: x.rolling(window=30, min_periods=1).mean()
    )
    
    return df


def compute_skill_frequency(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Compute skill frequency statistics.
    
    Args:
        df: DataFrame with skills column
    
    Returns:
        Dictionary with skill frequency data
    """
    all_skills = []
    skill_by_category = {}
    skill_by_date = {}
    
    # Collect all skills
    import numpy as np
    for _, row in df.iterrows():
        skills = row.get('skills')
        if skills is not None and not (isinstance(skills, float) and pd.isna(skills)):
            skills_list = []
            # Handle numpy arrays (from parquet) first
            if isinstance(skills, np.ndarray):
                skills_list = [str(s) for s in skills if s]
            elif isinstance(skills, (list, tuple)):
                skills_list = [str(s) for s in skills if s]
            elif not (isinstance(skills, float) and pd.isna(skills)):
                # Handle scalar values
                skills_list = [str(skills)]
            
            if skills_list:
                all_skills.extend(skills_list)
                
                # Track by category
                category = row.get('category_name', 'Unknown')
                if category not in skill_by_category:
                    skill_by_category[category] = []
                skill_by_category[category].extend(skills_list)
                
                # Track by date
                date_str = str(row.get('posted_date', ''))[:10]
                if date_str not in skill_by_date:
                    skill_by_date[date_str] = []
                skill_by_date[date_str].extend(skills_list)
    
    # Overall frequency
    skill_counter = Counter(all_skills)
    top_skills = {skill: count for skill, count in skill_counter.most_common(100)}
    
    # Frequency by category
    category_freq = {}
    for category, skills_list in skill_by_category.items():
        category_counter = Counter(skills_list)
        category_freq[category] = {
            skill: count for skill, count in category_counter.most_common(20)
        }
    
    # Frequency by date (last 30 days)
    recent_dates = sorted(skill_by_date.keys())[-30:]
    date_freq = {}
    for date_str in recent_dates:
        date_counter = Counter(skill_by_date[date_str])
        date_freq[date_str] = {
            skill: count for skill, count in date_counter.most_common(10)
        }
    
    return {
        'overall': top_skills,
        'by_category': category_freq,
        'by_date': date_freq
    }


def compute_company_stats(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute company hiring statistics.
    
    Args:
        df: DataFrame with company information
    
    Returns:
        DataFrame with company statistics
    """
    company_stats = df.groupby('company_name_clean').agg({
        'job_title_clean': 'count',
        'salary_min': 'mean',
        'salary_max': 'mean',
        'location_clean': lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else 'Unknown',
        'category_name': lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else 'Unknown',
        'posted_date': ['min', 'max']
    }).reset_index()
    
    company_stats.columns = [
        'company_name',
        'job_count',
        'avg_salary_min',
        'avg_salary_max',
        'primary_location',
        'primary_category',
        'first_posted',
        'last_posted'
    ]
    
    company_stats = company_stats.sort_values('job_count', ascending=False)
    
    return company_stats


if __name__ == '__main__':
    # Test aggregation
    result = aggregate_counts()
    print(f"Aggregation result: {result}")

