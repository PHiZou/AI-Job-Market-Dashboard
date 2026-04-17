# AI Job Market Intelligence Dashboard

A full-stack portfolio piece that surfaces hiring signals from aggregated job postings: volume trends, trending skills, active employers, anomalies, and 30-day forecasts — all in a modern, accessible interface.

This is v2 — a full rewrite of the original Astro + Python ETL project on Next.js 15 and React 19. The legacy ETL pipeline has been replaced with static fixture data so the app can be explored and extended without API keys or scheduled jobs.

## Stack

- **Next.js 15** — App Router, React Server Components, Route Handlers
- **React 19** + **TypeScript 5**
- **Tailwind v4** — CSS-first configuration, class-based dark mode
- **Recharts** — SSR-friendly, composable charts
- **next-themes** — system-aware dark mode
- **lucide-react** — icons

## Features

- Composite **Job Market Momentum Index** with five weighted components
- **30-day forecast** with confidence interval
- **Hiring volume** with 7-day / 30-day rolling average toggle
- **Skills leaderboard** — sparklines, pinning, growth sort
- **Company leaderboard** — salary ranges, search, multi-sort
- **Alerts** — spikes, drops, skill trends with severity + expandable details
- **Geographic map** — stylized US map with hover tooltips
- **Global search** (`⌘K` / `Ctrl+K`) across skills, companies, categories, alerts
- **Persistent preferences** — filter state stored in localStorage
- **Public JSON API** — every dataset served under `/api/*`
- **Dark mode** — respects system preference, persists user override
- **Responsive** — mobile, tablet, desktop layouts

## Quick start

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

## Scripts

| Command            | What it does                      |
| ------------------ | --------------------------------- |
| `npm run dev`      | Start the Next dev server         |
| `npm run build`    | Build the production bundle       |
| `npm start`        | Start the production server       |
| `npm run lint`     | Run ESLint                        |
| `npm run typecheck`| TypeScript `--noEmit`             |

## Project layout

```
app/                Next.js App Router routes
  api/              JSON route handlers (trends, skills, companies, ...)
  about/            About page
  layout.tsx        Root layout + ThemeProvider
  page.tsx          Main dashboard (server component)
components/
  dashboard/        Feature components (charts, gauge, leaderboards, ...)
  ui/               Shared primitives (Card, Button, Input, Tabs, ...)
  GlobalSearch.tsx  ⌘K search across all datasets
  Navbar.tsx
  ThemeProvider.tsx
  ThemeToggle.tsx
data/               JSON fixtures (server-side)
lib/
  data.ts           Server-only loaders
  types.ts          Domain types
  formatters.ts     Number, date, currency, relative-time helpers
  usePrefs.ts       localStorage-backed preferences hook
  cn.ts             clsx + tailwind-merge
public/data/        JSON fixtures (also served as static assets)
```

## API

All endpoints return JSON with `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`.

| Endpoint            | Description                                     |
| ------------------- | ----------------------------------------------- |
| `GET /api/trends`   | Daily hiring volume by category                 |
| `GET /api/skills`   | Overall skill frequency map                     |
| `GET /api/companies`| Top hiring companies with salary ranges         |
| `GET /api/forecasts`| 30-day forecasts with confidence intervals      |
| `GET /api/alerts`   | Detected spikes, drops, skill trends            |
| `GET /api/jmmi`     | Job Market Momentum Index                       |
| `GET /api/search?q=`| Global search across all datasets               |

## Data

Fixture data lives in `data/*.json` and is also mirrored to `public/data/*.json` so it can be fetched directly by bots or static clients. To plug in a real pipeline, replace the loaders in `lib/data.ts` — no component changes required as long as the TypeScript types are honored.

## Deployment

Works out of the box on Vercel. `vercel.json` pins the framework preset; no additional configuration is required.

## License

MIT
