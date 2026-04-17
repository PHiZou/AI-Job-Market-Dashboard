import Link from "next/link";
import { Activity } from "lucide-react";
import type { DashboardData } from "@/lib/types";
import { GlobalSearch } from "./GlobalSearch";
import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
  data?: DashboardData;
}

export function Navbar({ data }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100"
        >
          <Activity className="h-5 w-5 text-indigo-500" aria-hidden="true" />
          <span className="hidden sm:inline">Job Market Intelligence</span>
          <span className="sm:hidden">JMI</span>
        </Link>
        <nav className="hidden items-center gap-4 text-sm text-slate-600 dark:text-slate-400 md:flex">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-100">
            Dashboard
          </Link>
          <Link href="/about" className="hover:text-slate-900 dark:hover:text-slate-100">
            About
          </Link>
          <a
            href="/api/jmmi"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-900 dark:hover:text-slate-100"
          >
            API
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {data ? <GlobalSearch data={data} /> : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
