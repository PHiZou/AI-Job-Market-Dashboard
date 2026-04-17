"use client";
import { useCallback, useEffect, useState } from "react";

export interface DashboardPrefs {
  rollingWindow: "7d" | "30d";
  forecastCategory: string;
  alertsTab: "all" | "spike" | "drop" | "skill_trend";
  pinnedSkills: string[];
}

const DEFAULT_PREFS: DashboardPrefs = {
  rollingWindow: "7d",
  forecastCategory: "All",
  alertsTab: "all",
  pinnedSkills: [],
};

const STORAGE_KEY = "jmd:prefs:v1";

function readPrefs(): DashboardPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<DashboardPrefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function usePrefs() {
  const [prefs, setPrefs] = useState<DashboardPrefs>(DEFAULT_PREFS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPrefs(readPrefs());
    setHydrated(true);
  }, []);

  const update = useCallback((patch: Partial<DashboardPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota/availability errors
      }
      return next;
    });
  }, []);

  const togglePinnedSkill = useCallback(
    (skill: string) => {
      setPrefs((prev) => {
        const set = new Set(prev.pinnedSkills);
        if (set.has(skill)) set.delete(skill);
        else set.add(skill);
        const next = { ...prev, pinnedSkills: [...set] };
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [],
  );

  return { prefs, update, togglePinnedSkill, hydrated };
}
