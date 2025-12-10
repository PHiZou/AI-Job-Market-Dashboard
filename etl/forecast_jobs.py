"""
Generate hiring volume forecasts using Prophet time-series forecasting.

Forecasts 30 days ahead per category with confidence intervals.
"""

import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional

import pandas as pd
from prophet import Prophet

logger = logging.getLogger(__name__)

FORECAST_DAYS = 30


def forecast_jobs() -> Dict[str, Any]:
    """
    Generate hiring volume forecasts for each category.
    
    Returns:
        Dictionary with success status, forecast days, and error message if any.
    """
    try:
        # Load aggregated data
        input_file = Path('data/curated/aggregates_category.parquet')
        if not input_file.exists():
            error_msg = f"Aggregated data file not found: {input_file}"
            logger.error(error_msg)
            return {'success': False, 'error': error_msg, 'forecast_days': 0}
        
        df = pd.read_parquet(input_file)
        logger.info(f"Loaded aggregated data with {len(df)} records")
        
        # Ensure posted_date is datetime
        df['posted_date'] = pd.to_datetime(df['posted_date'])
        
        # Get unique categories
        categories = df['category_name'].unique()
        logger.info(f"Forecasting for {len(categories)} categories")
        
        forecasts = []
        
        for category in categories:
            logger.info(f"Forecasting for category: {category}")
            
            category_data = df[df['category_name'] == category].copy()
            category_data = category_data.sort_values('posted_date')
            
            # Guard for small datasets
            if len(category_data) < 10:  # Need at least 10 days of data for reliable forecast
                logger.warning(f"Insufficient data for {category} ({len(category_data)} records), need at least 10. Skipping...")
                continue
            
            # Check for valid job counts
            if category_data['job_count'].sum() == 0:
                logger.warning(f"No job counts for {category}, skipping...")
                continue
            
            # Prepare data for Prophet (requires 'ds' and 'y' columns)
            prophet_df = pd.DataFrame({
                'ds': category_data['posted_date'],
                'y': category_data['job_count']
            })
            
            # Generate forecast
            forecast_result = generate_prophet_forecast(prophet_df, category)
            
            if forecast_result is not None:
                forecasts.append(forecast_result)
        
        if not forecasts:
            # For small datasets (like sample data), this is expected
            logger.warning("No forecasts generated - insufficient data points per category")
            logger.info("This is normal for small datasets. Forecasts require at least 10 data points per category.")
            # Create empty forecast file so pipeline can continue
            output_dir = Path('data/curated')
            output_dir.mkdir(parents=True, exist_ok=True)
            output_file = output_dir / 'forecasts.parquet'
            empty_df = pd.DataFrame(columns=['date', 'category_name', 'forecast', 'forecast_lower', 'forecast_upper'])
            empty_df.to_parquet(output_file, index=False, engine='pyarrow')
            logger.info(f"Created empty forecast file: {output_file}")
            return {
                'success': True,
                'forecast_days': 0,
                'categories_forecasted': 0,
                'output_file': str(output_file),
                'warning': 'No forecasts generated due to insufficient data'
            }
        
        # Combine all forecasts
        forecast_df = pd.concat(forecasts, ignore_index=True)
        
        # Save forecasts
        output_dir = Path('data/curated')
        output_dir.mkdir(parents=True, exist_ok=True)
        output_file = output_dir / 'forecasts.parquet'
        
        forecast_df.to_parquet(output_file, index=False, engine='pyarrow')
        logger.info(f"Saved forecasts to {output_file}")
        
        return {
            'success': True,
            'forecast_days': FORECAST_DAYS,
            'categories_forecasted': len(forecasts),
            'output_file': str(output_file)
        }
        
    except Exception as e:
        error_msg = f"Error generating forecasts: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {'success': False, 'error': error_msg, 'forecast_days': 0}


def generate_prophet_forecast(
    df: pd.DataFrame,
    category: str
) -> Optional[pd.DataFrame]:
    """
    Generate Prophet forecast for a single category.
    
    Args:
        df: DataFrame with 'ds' (date) and 'y' (value) columns
        category: Category name
    
    Returns:
        DataFrame with forecast results or None if failed
    """
    try:
        # Validate input data
        if df.empty:
            logger.warning(f"Empty dataframe for {category}")
            return None
        
        if 'ds' not in df.columns or 'y' not in df.columns:
            logger.error(f"Missing required columns 'ds' or 'y' for {category}")
            return None
        
        # Ensure 'ds' is datetime
        df['ds'] = pd.to_datetime(df['ds'])
        
        # Remove any invalid values
        df = df.dropna(subset=['ds', 'y'])
        
        if len(df) < 7:
            logger.warning(f"Insufficient valid data points for {category} ({len(df)} records)")
            return None
        
        # Initialize Prophet model with conservative settings
        model = Prophet(
            daily_seasonality=False,
            weekly_seasonality=True,
            yearly_seasonality=False,
            changepoint_prior_scale=0.05,
            interval_width=0.95  # 95% confidence interval
        )
        
        # Fit model
        model.fit(df)
        
        # Create future dataframe
        future = model.make_future_dataframe(periods=FORECAST_DAYS)
        
        # Generate forecast
        forecast = model.predict(future)
        
        # Extract forecast period only
        last_date = df['ds'].max()
        forecast_period = forecast[forecast['ds'] > last_date].copy()
        
        if forecast_period.empty:
            logger.warning(f"No forecast period generated for {category}")
            return None
        
        # Ensure forecast values are non-negative
        forecast_period['yhat'] = forecast_period['yhat'].clip(lower=0)
        forecast_period['yhat_lower'] = forecast_period['yhat_lower'].clip(lower=0)
        forecast_period['yhat_upper'] = forecast_period['yhat_upper'].clip(lower=0)
        
        # Prepare output
        forecast_period['category_name'] = category
        forecast_period = forecast_period[[
            'ds', 'category_name', 'yhat', 'yhat_lower', 'yhat_upper'
        ]].rename(columns={
            'ds': 'date',
            'yhat': 'forecast',
            'yhat_lower': 'forecast_lower',
            'yhat_upper': 'forecast_upper'
        })
        
        # Convert date to string for JSON serialization
        forecast_period['date'] = forecast_period['date'].dt.strftime('%Y-%m-%d')
        
        return forecast_period
        
    except ImportError as e:
        logger.error(f"Prophet import failed: {e}. Install with: pip install prophet")
        return None
    except Exception as e:
        logger.error(f"Forecast failed for {category}: {str(e)}", exc_info=True)
        return None


if __name__ == '__main__':
    # Test forecasting
    result = forecast_jobs()
    print(f"Forecast result: {result}")

