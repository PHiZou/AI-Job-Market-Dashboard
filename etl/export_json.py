"""
Export curated data to JSON format for frontend consumption.

Converts Parquet files to optimized JSON files.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List

import pandas as pd

logger = logging.getLogger(__name__)


def export_json() -> Dict[str, Any]:
    """
    Export all curated data to JSON files for frontend.
    
    Returns:
        Dictionary with success status, files created count, and error message if any.
    """
    files_created = []
    
    try:
        output_dir = Path('public/data')
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Export trends data
        logger.info("Exporting trends data...")
        if export_trends(output_dir):
            files_created.append('trends.json')
        
        # Export forecasts
        logger.info("Exporting forecast data...")
        if export_forecasts(output_dir):
            files_created.append('forecasts.json')
        
        # Export skills data
        logger.info("Exporting skills data...")
        if export_skills(output_dir):
            files_created.append('skills.json')
        
        # Export company data
        logger.info("Exporting company data...")
        if export_companies(output_dir):
            files_created.append('companies.json')
        
        # Export alerts
        logger.info("Exporting alerts data...")
        if export_alerts(output_dir):
            files_created.append('alerts.json')
        
        logger.info(f"Exported {len(files_created)} JSON files")
        
        return {
            'success': True,
            'files_created': len(files_created),
            'files': files_created
        }
        
    except Exception as e:
        error_msg = f"Error exporting JSON: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {'success': False, 'error': error_msg, 'files_created': 0}


def export_trends(output_dir: Path) -> bool:
    """Export hiring trends data."""
    try:
        input_file = Path('data/curated/aggregates_category.parquet')
        if not input_file.exists():
            logger.warning("Trends data not found, skipping...")
            return False
        
        df = pd.read_parquet(input_file)
        df['posted_date'] = pd.to_datetime(df['posted_date'], errors='coerce')
        # Convert to string format, handling NaT
        df['posted_date'] = df['posted_date'].apply(
            lambda x: x.strftime('%Y-%m-%d') if pd.notna(x) else None
        )
        df = df.dropna(subset=['posted_date'])  # Remove rows with invalid dates
        
        # Convert to JSON-friendly format
        trends_data = []
        for _, row in df.iterrows():
            trends_data.append({
                'date': row['posted_date'],
                'category': row['category_name'],
                'job_count': int(row['job_count']),
                'rolling_7d': float(row.get('rolling_7d', 0)),
                'rolling_30d': float(row.get('rolling_30d', 0))
            })
        
        output_file = output_dir / 'trends.json'
        with open(output_file, 'w') as f:
            json.dump(trends_data, f, indent=2)
        
        logger.info(f"Exported {len(trends_data)} trend records")
        return True
        
    except Exception as e:
        logger.error(f"Error exporting trends: {str(e)}")
        return False


def export_forecasts(output_dir: Path) -> bool:
    """Export forecast data."""
    try:
        input_file = Path('data/curated/forecasts.parquet')
        if not input_file.exists():
            logger.warning("Forecast data not found, skipping...")
            return False
        
        df = pd.read_parquet(input_file)
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        # Convert to string format, handling NaT
        df['date'] = df['date'].apply(
            lambda x: x.strftime('%Y-%m-%d') if pd.notna(x) else None
        )
        df = df.dropna(subset=['date'])  # Remove rows with invalid dates
        
        # Convert to JSON-friendly format
        forecasts_data = []
        for _, row in df.iterrows():
            forecasts_data.append({
                'date': row['date'],
                'category': row['category_name'],
                'forecast': float(row['forecast']),
                'forecast_lower': float(row['forecast_lower']),
                'forecast_upper': float(row['forecast_upper'])
            })
        
        output_file = output_dir / 'forecasts.json'
        with open(output_file, 'w') as f:
            json.dump(forecasts_data, f, indent=2)
        
        logger.info(f"Exported {len(forecasts_data)} forecast records")
        return True
        
    except Exception as e:
        logger.error(f"Error exporting forecasts: {str(e)}")
        return False


def export_skills(output_dir: Path) -> bool:
    """Export skills frequency data."""
    try:
        input_file = Path('data/curated/skill_frequency.json')
        if not input_file.exists():
            logger.warning("Skills data not found, skipping...")
            return False
        
        with open(input_file, 'r') as f:
            skills_data = json.load(f)
        
        output_file = output_dir / 'skills.json'
        with open(output_file, 'w') as f:
            json.dump(skills_data, f, indent=2)
        
        logger.info("Exported skills frequency data")
        return True
        
    except Exception as e:
        logger.error(f"Error exporting skills: {str(e)}")
        return False


def export_companies(output_dir: Path) -> bool:
    """Export company statistics."""
    try:
        input_file = Path('data/curated/company_stats.parquet')
        if not input_file.exists():
            logger.warning("Company data not found, skipping...")
            return False
        
        df = pd.read_parquet(input_file)
        
        # Convert to JSON-friendly format (limit to top 100)
        df_top = df.head(100)
        
        companies_data = []
        for _, row in df_top.iterrows():
            companies_data.append({
                'company_name': row['company_name'],
                'job_count': int(row['job_count']),
                'avg_salary_min': float(row['avg_salary_min']) if pd.notna(row['avg_salary_min']) else None,
                'avg_salary_max': float(row['avg_salary_max']) if pd.notna(row['avg_salary_max']) else None,
                'primary_location': row['primary_location'],
                'primary_category': row['primary_category']
            })
        
        output_file = output_dir / 'companies.json'
        with open(output_file, 'w') as f:
            json.dump(companies_data, f, indent=2)
        
        logger.info(f"Exported {len(companies_data)} company records")
        return True
        
    except Exception as e:
        logger.error(f"Error exporting companies: {str(e)}")
        return False


def export_alerts(output_dir: Path) -> bool:
    """Export alerts data."""
    try:
        input_file = Path('data/curated/alerts.json')
        if not input_file.exists():
            logger.warning("Alerts data not found, skipping...")
            return False
        
        with open(input_file, 'r') as f:
            alerts_data = json.load(f)
        
        # Sort by date (most recent first)
        alerts_data.sort(key=lambda x: x.get('date', ''), reverse=True)
        
        # Limit to most recent 50 alerts
        alerts_data = alerts_data[:50]
        
        output_file = output_dir / 'alerts.json'
        with open(output_file, 'w') as f:
            json.dump(alerts_data, f, indent=2)
        
        logger.info(f"Exported {len(alerts_data)} alerts")
        return True
        
    except Exception as e:
        logger.error(f"Error exporting alerts: {str(e)}")
        return False


if __name__ == '__main__':
    # Test export
    result = export_json()
    print(f"Export result: {result}")

