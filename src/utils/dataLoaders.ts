/**
 * Data loaders and TypeScript interfaces for job market dashboard data.
 */

// Type Definitions
export interface TrendData {
  date: string;
  category: string;
  job_count: number;
  rolling_7d: number;
  rolling_30d: number;
}

export interface ForecastData {
  date: string;
  category: string;
  forecast: number;
  forecast_lower: number;
  forecast_upper: number;
}

export interface SkillsData {
  overall: Record<string, number>;
  by_category?: Record<string, Record<string, number>>;
  by_date?: Record<string, Record<string, number>>;
}

export interface CompanyData {
  company_name: string;
  job_count: number;
  avg_salary_min?: number | null;
  avg_salary_max?: number | null;
  primary_location: string;
  primary_category: string;
}

export interface Alert {
  id: string;
  type: 'spike' | 'drop' | 'skill_trend';
  severity: 'high' | 'medium' | 'low';
  category?: string;
  skill?: string;
  date?: string;
  message: string;
  job_count?: number;
  expected_count?: number;
  z_score?: number;
  pct_change?: number;
  growth_rate?: number;
  generated_at?: string;
}

// Additional types for better type safety
export interface SkillTrend {
  skill: string;
  count: number;
  growth_rate?: number;
  trend_values?: number[]; // Historical values for sparkline
}

export interface CategoryForecast {
  category: string;
  forecasts: ForecastData[];
}

export interface JobCategoryCount {
  date: string;
  category: string;
  count: number;
}

export interface CompanyHiring {
  company_name: string;
  job_count: number;
  wow_change?: number; // Week-over-week percentage change
}

export interface AlertItem extends Alert {
  // Extended alert interface
}

export interface JMMIData {
  overall_score: number;
  components: {
    posting_velocity: {
      score: number;
      change_pct: number;
      status: string;
      description?: string;
    };
    skill_velocity: {
      score: number;
      trending_skills_count: number;
      trending_skills?: Array<{
        skill: string;
        growth_pct: number;
      }>;
      status: string;
      description?: string;
    };
    forecast_accuracy: {
      score: number;
      mape: number | null;
      status: string;
      description?: string;
    };
    market_activity: {
      score: number;
      spikes: number;
      drops: number;
      status: string;
      description?: string;
    };
    company_diversity: {
      score: number;
      unique_companies: number;
      status: string;
      description?: string;
    };
  };
  interpretation: {
    label: string;
    emoji: string;
    description: string;
    for_job_seekers: string;
    for_recruiters: string;
  };
  recommendation: string;
  calculated_at: string;
}

// Cache for data with memoization
const cache: {
  trends?: TrendData[];
  forecasts?: ForecastData[];
  skills?: SkillsData;
  companies?: CompanyData[];
  alerts?: Alert[];
  jmmi?: JMMIData;
  timestamp?: number;
  loading?: {
    trends?: Promise<TrendData[]>;
    forecasts?: Promise<ForecastData[]>;
    skills?: Promise<SkillsData>;
    companies?: Promise<CompanyData[]>;
    alerts?: Promise<Alert[]>;
    jmmi?: Promise<JMMIData>;
  };
} = {
  loading: {}
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Check if cached data is still valid.
 */
function isCacheValid(): boolean {
  if (!cache.timestamp) return false;
  return Date.now() - cache.timestamp < CACHE_DURATION;
}

/**
 * Load trends data from JSON file with memoization.
 */
export async function loadTrends(): Promise<TrendData[]> {
  // Return cached data if valid
  if (cache.trends && isCacheValid()) {
    return cache.trends;
  }

  // Return existing promise if already loading
  if (cache.loading?.trends) {
    return cache.loading.trends;
  }

  // Create new loading promise
  const loadPromise = (async () => {
    try {
      const response = await fetch('/data/trends.json');
      if (!response.ok) {
        throw new Error(`Failed to load trends: ${response.statusText}`);
      }
      const data = await response.json() as TrendData[];
      cache.trends = data;
      cache.timestamp = Date.now();
      delete cache.loading?.trends;
      return data;
    } catch (error) {
      delete cache.loading?.trends;
      console.error('Error loading trends:', error);
      throw error;
    }
  })();

  cache.loading = cache.loading || {};
  cache.loading.trends = loadPromise;
  return loadPromise;
}

/**
 * Load forecast data from JSON file with memoization.
 */
export async function loadForecasts(): Promise<ForecastData[]> {
  if (cache.forecasts && isCacheValid()) {
    return cache.forecasts;
  }

  if (cache.loading?.forecasts) {
    return cache.loading.forecasts;
  }

  const loadPromise = (async () => {
    try {
      const response = await fetch('/data/forecasts.json');
      if (!response.ok) {
        throw new Error(`Failed to load forecasts: ${response.statusText}`);
      }
      const data = await response.json() as ForecastData[];
      cache.forecasts = data;
      cache.timestamp = Date.now();
      delete cache.loading?.forecasts;
      return data;
    } catch (error) {
      delete cache.loading?.forecasts;
      console.error('Error loading forecasts:', error);
      throw error;
    }
  })();

  cache.loading = cache.loading || {};
  cache.loading.forecasts = loadPromise;
  return loadPromise;
}

/**
 * Load skills data from JSON file with memoization.
 */
export async function loadSkills(): Promise<SkillsData> {
  if (cache.skills && isCacheValid()) {
    return cache.skills;
  }

  if (cache.loading?.skills) {
    return cache.loading.skills;
  }

  const loadPromise = (async () => {
    try {
      const response = await fetch('/data/skills.json');
      if (!response.ok) {
        throw new Error(`Failed to load skills: ${response.statusText}`);
      }
      const data = await response.json() as SkillsData;
      cache.skills = data;
      cache.timestamp = Date.now();
      delete cache.loading?.skills;
      return data;
    } catch (error) {
      delete cache.loading?.skills;
      console.error('Error loading skills:', error);
      throw error;
    }
  })();

  cache.loading = cache.loading || {};
  cache.loading.skills = loadPromise;
  return loadPromise;
}

/**
 * Load company data from JSON file with memoization.
 */
export async function loadCompanies(): Promise<CompanyData[]> {
  if (cache.companies && isCacheValid()) {
    return cache.companies;
  }

  if (cache.loading?.companies) {
    return cache.loading.companies;
  }

  const loadPromise = (async () => {
    try {
      const response = await fetch('/data/companies.json');
      if (!response.ok) {
        throw new Error(`Failed to load companies: ${response.statusText}`);
      }
      const data = await response.json() as CompanyData[];
      cache.companies = data;
      cache.timestamp = Date.now();
      delete cache.loading?.companies;
      return data;
    } catch (error) {
      delete cache.loading?.companies;
      console.error('Error loading companies:', error);
      throw error;
    }
  })();

  cache.loading = cache.loading || {};
  cache.loading.companies = loadPromise;
  return loadPromise;
}

/**
 * Load alerts data from JSON file with memoization.
 */
export async function loadAlerts(): Promise<Alert[]> {
  if (cache.alerts && isCacheValid()) {
    return cache.alerts;
  }

  if (cache.loading?.alerts) {
    return cache.loading.alerts;
  }

  const loadPromise = (async () => {
    try {
      const response = await fetch('/data/alerts.json');
      if (!response.ok) {
        throw new Error(`Failed to load alerts: ${response.statusText}`);
      }
      const data = await response.json() as Alert[];
      cache.alerts = data;
      cache.timestamp = Date.now();
      delete cache.loading?.alerts;
      return data;
    } catch (error) {
      delete cache.loading?.alerts;
      console.error('Error loading alerts:', error);
      throw error;
    }
  })();

  cache.loading = cache.loading || {};
  cache.loading.alerts = loadPromise;
  return loadPromise;
}

/**
 * Load JMMI data from JSON file with memoization.
 */
export async function loadJMMI(): Promise<JMMIData | null> {
  if (cache.jmmi && isCacheValid()) {
    return cache.jmmi;
  }

  if (cache.loading?.jmmi) {
    return cache.loading.jmmi;
  }

  const loadPromise = (async () => {
    try {
      const response = await fetch('/data/jmmi.json');
      if (!response.ok) {
        console.warn('JMMI data not available yet');
        return null;
      }
      const data = await response.json() as JMMIData;
      cache.jmmi = data;
      cache.timestamp = Date.now();
      delete cache.loading?.jmmi;
      return data;
    } catch (error) {
      delete cache.loading?.jmmi;
      console.error('Error loading JMMI:', error);
      return null;
    }
  })();

  cache.loading = cache.loading || {};
  cache.loading.jmmi = loadPromise;
  return loadPromise;
}

/**
 * Load all dashboard data at once.
 */
export async function loadAllData(): Promise<{
  trends: TrendData[];
  forecasts: ForecastData[];
  skills: SkillsData;
  companies: CompanyData[];
  alerts: Alert[];
  jmmi: JMMIData | null;
}> {
  try {
    const [trends, forecasts, skills, companies, alerts, jmmi] = await Promise.all([
      loadTrends(),
      loadForecasts(),
      loadSkills(),
      loadCompanies(),
      loadAlerts(),
      loadJMMI()
    ]);

    return {
      trends,
      forecasts,
      skills,
      companies,
      alerts,
      jmmi
    };
  } catch (error) {
    console.error('Error loading all data:', error);
    throw error;
  }
}

/**
 * Extract skill trend values from by_date data for sparklines.
 * Returns last N days of frequency data for a given skill.
 */
export function extractSkillTrendValues(
  skillName: string,
  byDateData: Record<string, Record<string, number>> | undefined,
  days: number = 14
): number[] {
  if (!byDateData) return [];

  // Get all dates sorted chronologically
  const dates = Object.keys(byDateData).sort();

  // Take last N days
  const recentDates = dates.slice(-days);

  // Extract values for this skill across those dates
  const values = recentDates.map(date => {
    const skillsOnDate = byDateData[date];
    return skillsOnDate?.[skillName] || 0;
  });

  return values;
}

/**
 * Calculate real month-over-month growth rate from historical data.
 * Compares last 30 days avg vs previous 30 days avg.
 */
export function calculateRealMoMGrowth(
  skillName: string,
  byDateData: Record<string, Record<string, number>> | undefined
): number | undefined {
  if (!byDateData) return undefined;

  const dates = Object.keys(byDateData).sort();
  if (dates.length < 30) return undefined;

  // Last 30 days
  const last30Days = dates.slice(-30);
  const last30Sum = last30Days.reduce((sum, date) => {
    return sum + (byDateData[date]?.[skillName] || 0);
  }, 0);
  const last30Avg = last30Sum / 30;

  // Previous 30 days (days 31-60)
  if (dates.length < 60) return undefined;
  const prev30Days = dates.slice(-60, -30);
  const prev30Sum = prev30Days.reduce((sum, date) => {
    return sum + (byDateData[date]?.[skillName] || 0);
  }, 0);
  const prev30Avg = prev30Sum / 30;

  if (prev30Avg === 0) return undefined;

  // Calculate percentage growth
  return ((last30Avg - prev30Avg) / prev30Avg) * 100;
}

/**
 * Clear the data cache.
 */
export function clearCache(): void {
  cache.trends = undefined;
  cache.forecasts = undefined;
  cache.skills = undefined;
  cache.companies = undefined;
  cache.alerts = undefined;
  cache.jmmi = undefined;
  cache.timestamp = undefined;
}

