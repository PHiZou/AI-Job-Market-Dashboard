"""
Compute Job Market Momentum Index (JMMI).

A composite metric (0-100) that quantifies hiring market velocity across 5 dimensions:
- Posting velocity: Rate of change in job postings
- Skill velocity: Emergence of new/trending skills
- Forecast accuracy: How predictable the market is
- Market activity: Frequency of anomalies/spikes
- Company diversity: Number of unique hiring companies
"""

import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional

import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


def compute_jmmi() -> Dict[str, Any]:
    """
    Compute Job Market Momentum Index.

    Returns:
        Dictionary with success status, JMMI score, and components.
    """
    try:
        # Load required data
        trends_file = Path('data/curated/aggregates_overall.parquet')
        skills_file = Path('data/curated/skill_frequency.json')
        forecasts_file = Path('data/curated/forecasts.parquet')
        alerts_file = Path('data/curated/alerts.json')
        companies_file = Path('data/curated/company_stats.parquet')

        # Check if files exist
        missing_files = []
        for f in [trends_file, skills_file, forecasts_file, alerts_file, companies_file]:
            if not f.exists():
                missing_files.append(str(f))

        if missing_files:
            logger.warning(f"Missing files for JMMI calculation: {missing_files}")
            # Return default JMMI
            return {
                'success': True,
                'jmmi': create_default_jmmi(),
                'warning': f"Insufficient data for full JMMI calculation"
            }

        # Load data
        trends = pd.read_parquet(trends_file)
        with open(skills_file, 'r') as f:
            skills = json.load(f)
        forecasts = pd.read_parquet(forecasts_file) if forecasts_file.exists() else pd.DataFrame()
        with open(alerts_file, 'r') as f:
            alerts = json.load(f)
        companies = pd.read_parquet(companies_file)

        logger.info("Computing JMMI components...")

        # Compute each component
        posting_velocity = compute_posting_velocity(trends)
        skill_velocity = compute_skill_velocity(skills)
        forecast_accuracy = compute_forecast_accuracy(trends, forecasts)
        market_activity = compute_market_activity(alerts)
        company_diversity = compute_company_diversity(companies)

        # Weighted sum (total = 100%)
        jmmi_score = (
            posting_velocity['score'] * 0.30 +
            skill_velocity['score'] * 0.25 +
            forecast_accuracy['score'] * 0.20 +
            market_activity['score'] * 0.15 +
            company_diversity['score'] * 0.10
        )

        jmmi_data = {
            'overall_score': round(jmmi_score, 1),
            'components': {
                'posting_velocity': posting_velocity,
                'skill_velocity': skill_velocity,
                'forecast_accuracy': forecast_accuracy,
                'market_activity': market_activity,
                'company_diversity': company_diversity
            },
            'interpretation': interpret_jmmi(jmmi_score),
            'recommendation': generate_recommendation(jmmi_score, posting_velocity, skill_velocity),
            'calculated_at': datetime.now().isoformat(),
            'methodology': {
                'weights': {
                    'posting_velocity': 0.30,
                    'skill_velocity': 0.25,
                    'forecast_accuracy': 0.20,
                    'market_activity': 0.15,
                    'company_diversity': 0.10
                },
                'scale': '0-100 (higher = stronger momentum)'
            }
        }

        # Save JMMI data
        output_file = Path('data/curated/jmmi.json')
        with open(output_file, 'w') as f:
            json.dump(jmmi_data, f, indent=2)

        logger.info(f"JMMI calculated: {jmmi_score:.1f}/100 - {jmmi_data['interpretation']}")

        return {
            'success': True,
            'jmmi': jmmi_data,
            'output_file': str(output_file)
        }

    except Exception as e:
        error_msg = f"Error computing JMMI: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {'success': False, 'error': error_msg}


def compute_posting_velocity(trends: pd.DataFrame) -> Dict[str, Any]:
    """
    Compute posting velocity score (0-100).

    Measures rate of change in job postings over the last 7 days vs previous 7 days.
    """
    if len(trends) < 14:
        return {'score': 50.0, 'change_pct': 0.0, 'status': 'insufficient_data'}

    trends = trends.sort_values('posted_date')

    # Recent 7 days vs previous 7 days
    recent_7d = trends.tail(7)['job_count'].sum()
    previous_7d = trends.tail(14).head(7)['job_count'].sum()

    if previous_7d == 0:
        change_pct = 0.0
    else:
        change_pct = ((recent_7d - previous_7d) / previous_7d) * 100

    # Map to 0-100 scale
    # -50% = 0, 0% = 50, +50% = 100
    score = min(100, max(0, 50 + change_pct))

    status = 'growing' if change_pct > 10 else 'declining' if change_pct < -10 else 'stable'

    return {
        'score': round(score, 1),
        'change_pct': round(change_pct, 1),
        'recent_count': int(recent_7d),
        'previous_count': int(previous_7d),
        'status': status,
        'description': f"Job postings {'increased' if change_pct > 0 else 'decreased'} by {abs(change_pct):.1f}% over the last 7 days"
    }


def compute_skill_velocity(skills: Dict) -> Dict[str, Any]:
    """
    Compute skill velocity score (0-100).

    Measures emergence of trending skills based on week-over-week growth.
    """
    try:
        by_date = skills.get('by_date', {})

        if len(by_date) < 14:
            return {'score': 50.0, 'trending_skills': [], 'status': 'insufficient_data'}

        # Get last 7 days and previous 7 days
        sorted_dates = sorted(by_date.keys())
        recent_dates = sorted_dates[-7:]
        previous_dates = sorted_dates[-14:-7]

        # Aggregate skill counts for each period
        recent_skills = {}
        previous_skills = {}

        for date in recent_dates:
            for skill, count in by_date[date].items():
                recent_skills[skill] = recent_skills.get(skill, 0) + count

        for date in previous_dates:
            for skill, count in by_date[date].items():
                previous_skills[skill] = previous_skills.get(skill, 0) + count

        # Find trending skills (>50% growth)
        trending = []
        for skill in recent_skills:
            recent_count = recent_skills[skill]
            previous_count = previous_skills.get(skill, 0)

            if previous_count > 0:
                growth_pct = ((recent_count - previous_count) / previous_count) * 100
                if growth_pct > 50:
                    trending.append({
                        'skill': skill,
                        'growth_pct': round(growth_pct, 1),
                        'recent_count': recent_count,
                        'previous_count': previous_count
                    })

        # Sort by growth rate
        trending = sorted(trending, key=lambda x: x['growth_pct'], reverse=True)[:10]

        # Score based on number of trending skills
        # 0 trending = 30, 5 trending = 65, 10+ trending = 100
        score = min(100, 30 + len(trending) * 7)

        status = 'high_momentum' if len(trending) >= 5 else 'moderate' if len(trending) >= 2 else 'low'

        return {
            'score': round(score, 1),
            'trending_skills_count': len(trending),
            'trending_skills': trending[:5],  # Top 5 for display
            'status': status,
            'description': f"Found {len(trending)} skills with >50% growth in the last week"
        }

    except Exception as e:
        logger.warning(f"Error computing skill velocity: {e}")
        return {'score': 50.0, 'trending_skills': [], 'status': 'error'}


def compute_forecast_accuracy(trends: pd.DataFrame, forecasts: pd.DataFrame) -> Dict[str, Any]:
    """
    Compute forecast accuracy score (0-100).

    Measures how predictable the market is (lower error = higher score).
    """
    if forecasts.empty or len(trends) < 7:
        return {'score': 50.0, 'mape': None, 'status': 'insufficient_data'}

    try:
        # Convert dates
        trends['posted_date'] = pd.to_datetime(trends['posted_date'])
        forecasts['date'] = pd.to_datetime(forecasts['date'])

        # Get most recent forecast
        latest_forecast_date = forecasts['date'].max()
        latest_actual = trends[trends['posted_date'] <= latest_forecast_date]['job_count'].iloc[-1] if len(trends) > 0 else 0

        if latest_actual == 0:
            return {'score': 50.0, 'mape': None, 'status': 'no_actual_data'}

        # Find corresponding forecast
        forecast_row = forecasts[forecasts['date'] == latest_forecast_date]
        if forecast_row.empty:
            return {'score': 50.0, 'mape': None, 'status': 'no_forecast_match'}

        forecast_value = forecast_row['forecast'].iloc[0]

        # Calculate MAPE (Mean Absolute Percentage Error)
        mape = abs((latest_actual - forecast_value) / latest_actual) * 100

        # Map to 0-100 scale
        # 0% error = 100, 20% error = 50, 40%+ error = 0
        score = max(0, 100 - (mape * 2.5))

        status = 'predictable' if mape < 15 else 'moderate' if mape < 30 else 'volatile'

        return {
            'score': round(score, 1),
            'mape': round(mape, 1),
            'forecast': round(forecast_value, 0),
            'actual': int(latest_actual),
            'status': status,
            'description': f"Market forecast accuracy: {100 - mape:.1f}% (MAPE: {mape:.1f}%)"
        }

    except Exception as e:
        logger.warning(f"Error computing forecast accuracy: {e}")
        return {'score': 50.0, 'mape': None, 'status': 'error'}


def compute_market_activity(alerts: List[Dict]) -> Dict[str, Any]:
    """
    Compute market activity score (0-100).

    Measures frequency of anomalies/spikes (more activity = higher score).
    """
    try:
        # Filter for recent alerts (last 7 days)
        recent_cutoff = (datetime.now() - timedelta(days=7)).isoformat()
        recent_alerts = [a for a in alerts if a.get('generated_at', '') >= recent_cutoff]

        # Count spikes (positive momentum indicators)
        spikes = [a for a in recent_alerts if a.get('type') == 'spike']
        drops = [a for a in recent_alerts if a.get('type') == 'drop']
        skill_trends = [a for a in recent_alerts if a.get('type') == 'skill_trend']

        # Score based on spikes (drops are neutral/negative)
        # 0 spikes = 30, 3 spikes = 65, 5+ spikes = 100
        spike_score = min(100, 30 + len(spikes) * 14)

        # Penalize for drops
        drop_penalty = len(drops) * 10
        final_score = max(0, spike_score - drop_penalty)

        status = 'active' if len(spikes) >= 3 else 'moderate' if len(spikes) >= 1 else 'quiet'

        return {
            'score': round(final_score, 1),
            'total_alerts': len(recent_alerts),
            'spikes': len(spikes),
            'drops': len(drops),
            'skill_trends': len(skill_trends),
            'status': status,
            'description': f"Market activity: {len(spikes)} spikes, {len(drops)} drops in the last week"
        }

    except Exception as e:
        logger.warning(f"Error computing market activity: {e}")
        return {'score': 50.0, 'total_alerts': 0, 'status': 'error'}


def compute_company_diversity(companies: pd.DataFrame) -> Dict[str, Any]:
    """
    Compute company diversity score (0-100).

    Measures number of unique companies hiring (more = healthier market).
    """
    try:
        unique_companies = len(companies)

        # Score based on number of companies
        # 10 companies = 50, 20 = 70, 50+ = 100
        score = min(100, (unique_companies / 50) * 100)

        # Get top companies
        top_companies = companies.nlargest(5, 'job_count')[['company_name', 'job_count']].to_dict('records')

        status = 'diverse' if unique_companies >= 30 else 'moderate' if unique_companies >= 15 else 'concentrated'

        return {
            'score': round(score, 1),
            'unique_companies': unique_companies,
            'top_companies': top_companies,
            'status': status,
            'description': f"{unique_companies} unique companies actively hiring"
        }

    except Exception as e:
        logger.warning(f"Error computing company diversity: {e}")
        return {'score': 50.0, 'unique_companies': 0, 'status': 'error'}


def interpret_jmmi(score: float) -> Dict[str, str]:
    """
    Interpret JMMI score with human-readable labels.
    """
    if score >= 80:
        return {
            'label': 'Hot Market',
            'emoji': '🔥',
            'description': 'Strong momentum with high growth, emerging skills, and active hiring',
            'for_job_seekers': 'Excellent time to negotiate salary and benefits. Leverage demand.',
            'for_recruiters': 'Expect competitive hiring. Move fast on top candidates.'
        }
    elif score >= 60:
        return {
            'label': 'Growing Market',
            'emoji': '📈',
            'description': 'Positive trends with steady expansion and new opportunities',
            'for_job_seekers': 'Good time to explore opportunities. Market favors candidates.',
            'for_recruiters': 'Normal hiring cycles. Focus on employer brand.'
        }
    elif score >= 40:
        return {
            'label': 'Stable Market',
            'emoji': '➡️',
            'description': 'Moderate activity with predictable patterns',
            'for_job_seekers': 'Standard job search timeline. Focus on fit over timing.',
            'for_recruiters': 'Balanced market. Emphasize culture and growth opportunities.'
        }
    elif score >= 20:
        return {
            'label': 'Cooling Market',
            'emoji': '📉',
            'description': 'Slowing growth with fewer new opportunities',
            'for_job_seekers': 'Longer search timelines expected. Network actively.',
            'for_recruiters': 'Candidate pool expanding. Take time with decisions.'
        }
    else:
        return {
            'label': 'Cold Market',
            'emoji': '❄️',
            'description': 'Low momentum with declining opportunities',
            'for_job_seekers': 'Focus on upskilling and wait for market rebound.',
            'for_recruiters': 'Hiring freeze or highly selective. Focus on retention.'
        }


def generate_recommendation(jmmi_score: float, posting_velocity: Dict, skill_velocity: Dict) -> str:
    """
    Generate actionable recommendation based on JMMI.
    """
    if jmmi_score >= 80:
        top_skill = skill_velocity.get('trending_skills', [{}])[0].get('skill', 'high-demand skills')
        return f"Market is hot! Consider learning {top_skill} to capitalize on {posting_velocity['change_pct']:.0f}% growth in postings."
    elif jmmi_score >= 60:
        return "Market is growing steadily. Good time to explore new opportunities or negotiate raises."
    elif jmmi_score >= 40:
        return "Market is stable. Focus on differentiation through skills and networking."
    elif jmmi_score >= 20:
        return "Market is cooling. Prioritize upskilling in emerging technologies to stay competitive."
    else:
        return "Market is cold. Focus on retention, networking, and building expertise in resilient skills."


def create_default_jmmi() -> Dict[str, Any]:
    """
    Create default JMMI when insufficient data is available.
    """
    return {
        'overall_score': 50.0,
        'components': {
            'posting_velocity': {'score': 50.0, 'status': 'insufficient_data'},
            'skill_velocity': {'score': 50.0, 'status': 'insufficient_data'},
            'forecast_accuracy': {'score': 50.0, 'status': 'insufficient_data'},
            'market_activity': {'score': 50.0, 'status': 'insufficient_data'},
            'company_diversity': {'score': 50.0, 'status': 'insufficient_data'}
        },
        'interpretation': interpret_jmmi(50.0),
        'recommendation': 'Insufficient data for accurate JMMI calculation. Run the ETL pipeline to collect more data.',
        'calculated_at': datetime.now().isoformat()
    }


if __name__ == '__main__':
    # Test JMMI computation
    result = compute_jmmi()
    if result['success']:
        jmmi = result['jmmi']
        print(f"\nJMMI: {jmmi['overall_score']}/100")
        print(f"Interpretation: {jmmi['interpretation']['label']}")
        print(f"Recommendation: {jmmi['recommendation']}")
    else:
        print(f"Error: {result.get('error')}")
