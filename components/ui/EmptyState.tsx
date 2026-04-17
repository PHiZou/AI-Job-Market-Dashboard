import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center dark:border-slate-700">
      <div className="text-slate-400 dark:text-slate-500">
        {icon ?? <Inbox className="h-8 w-8" aria-hidden="true" />}
      </div>
      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{title}</div>
      {description ? (
        <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
