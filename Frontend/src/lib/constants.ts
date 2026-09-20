export const CUSTOMER_STATUSES = ["Lead", "Active", "Inactive"] as const;

export const PROJECT_STATUSES = [
  "Planning",
  "Active",
  "OnHold",
  "Completed",
  "Cancelled",
] as const;

export const TASK_STATUSES = [
  "Todo",
  "InProgress",
  "Pending",
  "Finished",
] as const;

export const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

export const STATUS_STYLES: Record<string, string> = {
  Lead: "bg-sky-50 text-sky-700 border-sky-200",
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Inactive: "bg-slate-100 text-slate-600 border-slate-200",
  Planning: "bg-indigo-50 text-indigo-700 border-indigo-200",
  OnHold: "bg-amber-50 text-amber-700 border-amber-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  Todo: "bg-slate-100 text-slate-700 border-slate-200",
  InProgress: "bg-blue-50 text-blue-700 border-blue-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Finished: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Review: "bg-violet-50 text-violet-700 border-violet-200",
  Low: "bg-slate-100 text-slate-600 border-slate-200",
  Medium: "bg-blue-50 text-blue-700 border-blue-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Urgent: "bg-rose-50 text-rose-700 border-rose-200",
};

export function statusClass(value: string) {
  return STATUS_STYLES[value] ?? "bg-slate-100 text-slate-600 border-slate-200";
}
