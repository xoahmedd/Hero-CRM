import {
  AlertTriangle,
  LoaderCircle,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

export function LoadingState({
  label = "Loading...",
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "flex items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500 shadow-sm",
        compact ? "gap-2 p-5" : "min-h-48 gap-3 p-10",
      ].join(" ")}
    >
      <LoaderCircle
        size={compact ? 18 : 22}
        className="animate-spin text-blue-600"
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-red-100 p-2 text-red-600">
          <AlertTriangle size={18} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-red-700">{description}</p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              <RefreshCw size={15} aria-hidden="true" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center shadow-sm sm:px-8 sm:py-12">
      {Icon && (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Icon size={23} aria-hidden="true" />
        </div>
      )}

      <h2 className={Icon ? "mt-4 font-semibold text-slate-900" : "font-semibold text-slate-900"}>
        {title}
      </h2>

      {description && (
        <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">
          {description}
        </p>
      )}

      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
