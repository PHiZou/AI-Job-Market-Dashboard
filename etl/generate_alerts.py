"""
Generate alerts for anomalies in job market data.

Detects spikes (>2σ increase), drops (>30% decrease), and new skill trends.
"""

import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# Alert thresholds
SPIKE_THRESHOLD_SIGMA = 2.0  # Standard deviations
DROP_THRESHOLD_PERCENT = 30  # Percentage decrease
TREND_DAYS = 7  # Days to look back for trend analysis


def generate_alerts() -> Dict[str, Any]:
    """
    Generate alerts for anomalies and trends.
    
    Returns:
        Dictionary with success status, alert count, and error message if any.
    """
    try:
        alerts = []
        
        # Load aggregated data
        input_file = Path('data/curated/aggregates_category.parquet')
        if not input_file.exists():
            error_msg = f"Aggregated data file not found: {input_file}"
            logger.error(error_msg)
            return {'success': False, 'error': error_msg, 'count': 0}
        
        df = pd.read_parquet(input_file)
        df['posted_date'] = pd.to_datetime(df['posted_date'])
        
        logger.info("Detecting spikes in job counts...")
        spike_alerts = detect_spikes(df)
        alerts.extend(spike_alerts)
        
        logger.info("Detecting drops in job counts...")
        drop_alerts = detect_drops(df)
        alerts.extend(drop_alerts)
        
        logger.info("Detecting new skill trends...")
        skill_alerts = detect_skill_trends()
        alerts.extend(skill_alerts)
        
        # Add metadata
        for alert in alerts:
            alert['generated_at'] = datetime.now().isoformat()
            alert['id'] = f"{alert['type']}_{alert.get('category', 'unknown')}_{datetime.now().timestamp()}"
        
        # Save alerts
        output_dir = Path('data/curated')
        output_dir.mkdir(parents=True, exist_ok=True)
        output_file = output_dir / 'alerts.json'
        
        with open(output_file, 'w') as f:
            json.dump(alerts, f, indent=2, default=str)
        
        logger.info(f"Generated {len(alerts)} alerts")
        
        return {
            'success': True,
            'count': len(alerts),
            'spikes': len(spike_alerts),
            'drops': len(drop_alerts),
            'skill_trends': len(skill_alerts),
            'output_file': str(output_file)
        }
        
    except Exception as e:
        error_msg = f"Error generating alerts: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {'success': False, 'error': error_msg, 'count': 0}


def detect_spikes(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Detect spikes in job counts (>2σ increase).
    
    Args:
        df: DataFrame with job counts by date and category
    
    Returns:
        List of spike alert dictionaries
    """
    alerts = []
    
    for category in df['category_name'].unique():
        category_data = df[df['category_name'] == category].copy()
        category_data = category_data.sort_values('posted_date')
        
        if len(category_data) < 14:  # Need at least 2 weeks of data
            continue
        
        # Calculate mean and std for rolling window
        category_data['mean_7d'] = category_data['job_count'].rolling(window=7, min_periods=1).mean()
        category_data['std_7d'] = category_data['job_count'].rolling(window=7, min_periods=1).std()
        
        # Detect spikes
        category_data['z_score'] = (
            (category_data['job_count'] - category_data['mean_7d']) / 
            (category_data['std_7d'] + 1e-6)  # Avoid division by zero
        )
        
        spikes = category_data[category_data['z_score'] > SPIKE_THRESHOLD_SIGMA]
        
        for _, row in spikes.iterrows():
            alerts.append({
                'type': 'spike',
                'severity': 'high' if row['z_score'] > 3 else 'medium',
                'category': category,
                'date': str(row['posted_date'].date()),
                'job_count': int(row['job_count']),
                'expected_count': float(row['mean_7d']),
                'z_score': float(row['z_score']),
                'message': f"Spike detected: {int(row['job_count'])} jobs (expected ~{int(row['mean_7d'])})"
            })
    
    return alerts


def detect_drops(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Detect drops in job counts (>30% decrease).
    
    Args:
        df: DataFrame with job counts by date and category
    
    Returns:
        List of drop alert dictionaries
    """
    alerts = []
    
    for category in df['category_name'].unique():
        category_data = df[df['category_name'] == category].copy()
        category_data = category_data.sort_values('posted_date')
        
        if len(category_data) < 14:
            continue
        
        # Calculate rolling average
        category_data['rolling_7d'] = category_data['job_count'].rolling(window=7, min_periods=1).mean()
        
        # Calculate percentage change
        category_data['pct_change'] = (
            (category_data['job_count'] - category_data['rolling_7d']) / 
            (category_data['rolling_7d'] + 1e-6) * 100
        )
        
        drops = category_data[category_data['pct_change'] < -DROP_THRESHOLD_PERCENT]
        
        for _, row in drops.iterrows():
            alerts.append({
                'type': 'drop',
                'severity': 'high' if abs(row['pct_change']) > 50 else 'medium',
                'category': category,
                'date': str(row['posted_date'].date()),
                'job_count': int(row['job_count']),
                'expected_count': float(row['rolling_7d']),
                'pct_change': float(row['pct_change']),
                'message': f"Drop detected: {int(row['job_count'])} jobs ({row['pct_change']:.1f}% decrease)"
            })
    
    return alerts


def detect_skill_trends() -> List[Dict[str, Any]]:
    """
    Detect emerging skill trends.
    
    Returns:
        List of skill trend alert dictionaries
    """
    alerts = []
    
    try:
        # Load skill frequency data
        skill_file = Path('data/curated/skill_frequency.json')
        if not skill_file.exists():
            return alerts
        
        with open(skill_file, 'r') as f:
            skill_data = json.load(f)
        
        # Get recent date frequencies
        date_freq = skill_data.get('by_date', {})
        if not date_freq:
            return alerts
        
        # Get last 7 days and previous 7 days
        sorted_dates = sorted(date_freq.keys())
        if len(sorted_dates) < 14:
            return alerts
        
        recent_dates = sorted_dates[-7:]
        previous_dates = sorted_dates[-14:-7]
        
        # Aggregate skills for each period
        recent_skills = {}
        previous_skills = {}
        
        for date in recent_dates:
            for skill, count in date_freq[date].items():
                recent_skills[skill] = recent_skills.get(skill, 0) + count
        
        for date in previous_dates:
            for skill, count in date_freq[date].items():
                previous_skills[skill] = previous_skills.get(skill, 0) + count
        
        # Find skills with significant growth
        for skill, recent_count in recent_skills.items():
            previous_count = previous_skills.get(skill, 0)
            
            if previous_count == 0:
                continue
            
            growth_rate = ((recent_count - previous_count) / previous_count) * 100
            
            if growth_rate > 50:  # 50% growth threshold
                alerts.append({
                    'type': 'skill_trend',
                    'severity': 'medium',
                    'skill': skill,
                    'recent_count': recent_count,
                    'previous_count': previous_count,
                    'growth_rate': float(growth_rate),
                    'message': f"Emerging skill trend: {skill} (+{growth_rate:.1f}% growth)"
                })
    
    except Exception as e:
        logger.warning(f"Error detecting skill trends: {str(e)}")
    
    return alerts


if __name__ == '__main__':
    # Test alert generation
    result = generate_alerts()
    print(f"Alert generation result: {result}")

