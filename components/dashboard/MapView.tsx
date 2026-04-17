"use client";
import { useMemo, useState } from "react";
import type { Company } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

interface MapViewProps {
  companies: Company[];
}

interface Marker {
  id: string;
  label: string;
  x: number;
  y: number;
  count: number;
  company: string;
}

// Lightweight lat/lng-ish approximation for a handful of common US metros.
// This is a deliberate simplification for a stylized map — not a real projection.
const METRO_COORDS: Record<string, { x: number; y: number }> = {
  washington: { x: 620, y: 190 },
  dc: { x: 620, y: 190 },
  arlington: { x: 612, y: 192 },
  alexandria: { x: 615, y: 200 },
  virginia: { x: 600, y: 205 },
  maryland: { x: 630, y: 180 },
  "new york": { x: 680, y: 150 },
  boston: { x: 720, y: 120 },
  seattle: { x: 90, y: 90 },
  "san francisco": { x: 70, y: 230 },
  sanfrancisco: { x: 70, y: 230 },
  california: { x: 90, y: 260 },
  "los angeles": { x: 130, y: 300 },
  chicago: { x: 420, y: 170 },
  austin: { x: 380, y: 340 },
  texas: { x: 360, y: 330 },
  atlanta: { x: 550, y: 310 },
  georgia: { x: 555, y: 320 },
  florida: { x: 600, y: 400 },
  miami: { x: 620, y: 420 },
  denver: { x: 270, y: 230 },
  phoenix: { x: 200, y: 310 },
};

function locate(location: string): { x: number; y: number } | null {
  const key = location.toLowerCase();
  for (const k of Object.keys(METRO_COORDS)) {
    if (key.includes(k)) return METRO_COORDS[k];
  }
  return null;
}

export function MapView({ companies }: MapViewProps) {
  const markers = useMemo<Marker[]>(() => {
    const byLoc = new Map<string, Marker>();
    for (const c of companies) {
      if (!c.primary_location) continue;
      const coord = locate(c.primary_location);
      if (!coord) continue;
      const key = `${coord.x}:${coord.y}`;
      const existing = byLoc.get(key);
      if (existing) {
        existing.count += c.job_count;
        existing.company = existing.count > c.job_count ? existing.company : c.company_name;
      } else {
        byLoc.set(key, {
          id: key,
          label: c.primary_location,
          x: coord.x + (Math.random() - 0.5) * 6,
          y: coord.y + (Math.random() - 0.5) * 6,
          count: c.job_count,
          company: c.company_name,
        });
      }
    }
    return [...byLoc.values()];
  }, [companies]);

  const [hover, setHover] = useState<Marker | null>(null);
  const max = markers.reduce((m, x) => Math.max(m, x.count), 1);

  return (
    <Card>
      <CardHeader
        title="Geographic distribution"
        description="Approximate locations of hiring companies"
      />
      <CardBody>
        <div className="relative overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-900/60">
          <svg
            viewBox="0 0 800 480"
            className="h-72 w-full"
            role="img"
            aria-label="Stylized map of United States with hiring activity markers"
          >
            <rect
              x="0"
              y="0"
              width="800"
              height="480"
              fill="url(#mapBg)"
              opacity={0.4}
            />
            <defs>
              <radialGradient id="mapBg" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g
              stroke="currentColor"
              strokeOpacity="0.15"
              fill="none"
              className="text-slate-400 dark:text-slate-600"
            >
              <path d="M 50 420 Q 100 200 200 150 T 500 120 T 720 180 L 760 300 L 700 430 L 200 440 Z" />
            </g>
            {markers.map((m) => {
              const r = 4 + (m.count / max) * 14;
              return (
                <g
                  key={m.id}
                  onMouseEnter={() => setHover(m)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(m)}
                  onBlur={() => setHover(null)}
                  tabIndex={0}
                  className="cursor-pointer outline-none"
                >
                  <circle cx={m.x} cy={m.y} r={r + 6} fill="#6366f1" fillOpacity={0.18} />
                  <circle cx={m.x} cy={m.y} r={r} fill="#6366f1" />
                  <circle cx={m.x} cy={m.y} r={r * 0.5} fill="white" fillOpacity={0.6} />
                </g>
              );
            })}
          </svg>
          {hover ? (
            <div
              className="pointer-events-none absolute rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-lg"
              style={{
                left: `${(hover.x / 800) * 100}%`,
                top: `${(hover.y / 480) * 100}%`,
                transform: "translate(-50%, -120%)",
              }}
            >
              <div className="font-semibold">{hover.label}</div>
              <div className="text-slate-300">
                {hover.count} jobs · top: {hover.company}
              </div>
            </div>
          ) : null}
        </div>
        {markers.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            No geocoded locations found in the current dataset.
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
