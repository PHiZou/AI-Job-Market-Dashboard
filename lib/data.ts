import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type {
  Alert,
  Company,
  DashboardData,
  Forecast,
  JMMI,
  SkillsData,
  TrendPoint,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJson<T>(filename: string): Promise<T> {
  const raw = await readFile(path.join(DATA_DIR, filename), "utf-8");
  return JSON.parse(raw) as T;
}

export const loadTrends = () => readJson<TrendPoint[]>("trends.json");
export const loadForecasts = () => readJson<Forecast[]>("forecasts.json");
export const loadSkills = () => readJson<SkillsData>("skills.json");
export const loadCompanies = () => readJson<Company[]>("companies.json");
export const loadAlerts = () => readJson<Alert[]>("alerts.json");
export const loadJMMI = () => readJson<JMMI>("jmmi.json");

export async function loadDashboard(): Promise<DashboardData> {
  const [trends, forecasts, skills, companies, alerts, jmmi] = await Promise.all([
    loadTrends(),
    loadForecasts(),
    loadSkills(),
    loadCompanies(),
    loadAlerts(),
    loadJMMI(),
  ]);
  return { trends, forecasts, skills, companies, alerts, jmmi };
}
