export type AlertType = "spike" | "drop" | "skill_trend";
export type AlertSeverity = "high" | "medium" | "low";

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  category: string;
  date: string;
  job_count: number;
  expected_count?: number;
  z_score?: number;
  pct_change?: number;
  message: string;
  generated_at: string;
}

export interface Company {
  company_name: string;
  job_count: number;
  avg_salary_min: number;
  avg_salary_max: number;
  primary_location: string;
  primary_category: string;
}

export interface Forecast {
  date: string;
  category: string;
  forecast: number;
  forecast_lower: number;
  forecast_upper: number;
}

export interface TrendPoint {
  date: string;
  category: string;
  job_count: number;
  rolling_7d: number;
  rolling_30d: number;
}

export interface SkillTrendEntry {
  skill: string;
  growth_pct: number;
  recent_count: number;
  previous_count: number;
}

export interface JMMIComponent {
  score: number;
  status: string;
  description: string;
}

export interface PostingVelocity extends JMMIComponent {
  change_pct: number;
  recent_count: number;
  previous_count: number;
}

export interface SkillVelocity extends JMMIComponent {
  trending_skills_count: number;
  trending_skills: SkillTrendEntry[];
}

export interface ForecastAccuracy extends JMMIComponent {
  mape: number;
  forecast: number;
  actual: number;
}

export interface MarketActivity extends JMMIComponent {
  total_alerts: number;
  spikes: number;
  drops: number;
  skill_trends: number;
}

export interface CompanyDiversity extends JMMIComponent {
  unique_companies: number;
  top_companies: Array<{ company_name: string; job_count: number }>;
}

export interface JMMI {
  overall_score: number;
  components: {
    posting_velocity: PostingVelocity;
    skill_velocity: SkillVelocity;
    forecast_accuracy: ForecastAccuracy;
    market_activity: MarketActivity;
    company_diversity: CompanyDiversity;
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
  methodology?: {
    weights: Record<string, number>;
    scale: string;
  };
}

export interface SkillsData {
  overall: Record<string, number>;
  by_category?: Record<string, Record<string, number>>;
  by_date?: Record<string, Record<string, number>>;
}

export interface DashboardData {
  trends: TrendPoint[];
  forecasts: Forecast[];
  skills: SkillsData;
  companies: Company[];
  alerts: Alert[];
  jmmi: JMMI;
}
