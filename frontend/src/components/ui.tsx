import type { ReactNode } from "react";

// Shared status/priority badge configs
export const statusColors: Record<string, { bg: string; color: string }> = {
  "In Progress": { bg: "#dbeafe", color: "#1d4ed8" },
  InProgress: { bg: "#dbeafe", color: "#1d4ed8" },
  Finished: { bg: "#dcfce7", color: "#15803d" },
  Cancelled: { bg: "#fee2e2", color: "#991b1b" },
  Canceled: { bg: "#fee2e2", color: "#991b1b" },
  Planning: { bg: "#dbeafe", color: "#1d4ed8" },
  Working: { bg: "#dbeafe", color: "#1d4ed8" },
  Overdue: { bg: "#fee2e2", color: "#b91c1c" },
  Submitted: { bg: "#fef9c3", color: "#854d0e" },
  Rejected: { bg: "#fce7f3", color: "#9d174d" },
  Assigned: { bg: "#dbeafe", color: "#1d4ed8" },
  Todo: { bg: "#f1f5f9", color: "#475569" },
  Review: { bg: "#fef3c7", color: "#92400e" },
  Completed: { bg: "#dcfce7", color: "#15803d" },
  Lead: { bg: "#fef9c3", color: "#854d0e" },
  Active: { bg: "#dcfce7", color: "#15803d" },
  Inactive: { bg: "#f1f5f9", color: "#6b7280" },
  Archived: { bg: "#f3e8ff", color: "#7c3aed" },
};

export const priorityColors: Record<string, { bg: string; color: string }> = {
  Low: { bg: "#dcfce7", color: "#15803d" },
  Medium: { bg: "#fef9c3", color: "#92400e" },
  High: { bg: "#fee2e2", color: "#b91c1c" },
  Urgent: { bg: "#f3e8ff", color: "#7c3aed" },
};

export function Badge({ label, type = "status" }: { label: string; type?: "status" | "priority" }) {
  const colors = type === "priority" ? priorityColors[label] : statusColors[label];
  const c = colors ?? { bg: "#f1f5f9", color: "#475569" };
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-normal tracking-normal"
      style={{ background: c.bg, color: c.color, fontFamily: "var(--font-mono)", fontWeight: 400 }}
    >
      {label}
    </span>
  );
}

export function Card({ children, className = "", style = {} }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-2xl border shadow-xs ${className}`}
      style={{ background: "white", borderColor: "var(--color-border)", ...style }}
    >
      {children}
    </div>
  );
}

export function KpiCard({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: string }) {
  return (
    <Card style={{ padding: "24px 28px" }}>
      <div className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-display)" }}>
        {label}
      </div>
      <div className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)", color: accent ?? "var(--color-foreground)" }}>
        {value}
      </div>
      {sub && <div className="text-xs mt-2" style={{ color: "var(--color-muted-foreground)" }}>{sub}</div>}
    </Card>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--color-foreground)" }}>{title}</h2>
      {action}
    </div>
  );
}

export function ProgressBar({ value, color = "#1a3896" }: { value: number; color?: string }) {
  const safeValue = Math.min(Math.max(Number(value) || 0, 0), 100);
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: 7, background: "#f1f5f9" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${safeValue}%`, background: color }} />
    </div>
  );
}

export function Avatar({ initials, size = 34 }: { initials: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full text-white font-semibold flex-shrink-0"
      style={{ width: size, height: size, background: "#1a3896", fontSize: size * 0.36, fontFamily: "var(--font-display)" }}
    >
      {initials}
    </div>
  );
}

export function Input({ placeholder, value, onChange, type = "text", style = {} }: { placeholder?: string; value: string; onChange: (v: string) => void; type?: string; style?: React.CSSProperties }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:border-[#1a3896] focus:ring-1 focus:ring-[#1a3896]"
      style={{
        border: "1px solid var(--color-border)",
        background: "white",
        color: "var(--color-foreground)",
        fontFamily: "var(--font-body)",
        ...style,
      }}
    />
  );
}

export function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer focus:border-[#1a3896] focus:ring-1 focus:ring-[#1a3896]"
      style={{ border: "1px solid var(--color-border)", background: "white", color: "var(--color-foreground)", fontFamily: "var(--font-body)" }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function Button({ children, onClick, variant = "primary", size = "md", disabled = false, style = {} }: { children: ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "danger" | "ghost"; size?: "sm" | "md"; disabled?: boolean; style?: React.CSSProperties }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: "#1a3896", color: "white" },
    secondary: { background: "#f1f5f9", color: "#475569", border: "1px solid var(--color-border)" },
    danger: { background: "#fee2e2", color: "#b91c1c" },
    ghost: { background: "transparent", color: "#475569" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-xl font-normal transition-all shadow-xs hover:opacity-90 active:scale-[0.98]"
      style={{
        padding: size === "sm" ? "8px 18px" : "11px 24px",
        fontSize: size === "sm" ? 13 : 14,
        fontWeight: 450,
        fontFamily: "var(--font-display)",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...styles[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(15,23,42,0.6)" }}>
      <div className="rounded-2xl shadow-2xl w-full overflow-hidden" style={{ maxWidth: wide ? 680 : 480, background: "white" }}>
        <div className="flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: "var(--color-border)" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--color-foreground)" }}>{title}</h3>
          <button onClick={onClose} className="text-2xl hover:opacity-75 transition-opacity" style={{ color: "var(--color-muted-foreground)" }}>×</button>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20" style={{ color: "var(--color-muted-foreground)" }}>
      <div style={{ fontSize: 44, marginBottom: 16 }}>◎</div>
      <div className="text-sm font-medium">{message}</div>
    </div>
  );
}

export function Table({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
            {columns.map((col) => (
              <th key={col} className="text-left py-4 px-6" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="transition-colors hover:bg-slate-50" style={{ borderBottom: "1px solid #f8fafc" }}>
              {row.map((cell, j) => (
                <td key={j} className="py-4 px-6">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return "";
  // Ensure UTC interpretation if timezone offset or Z is missing
  const hasTimezone = dateStr.endsWith("Z") || /[+-]\d{2}(:\d{2})?$/.test(dateStr);
  const normalizedStr = hasTimezone ? dateStr : `${dateStr}Z`;
  const timestamp = new Date(normalizedStr).getTime();
  if (isNaN(timestamp)) return "";

  const diffMs = Date.now() - timestamp;
  if (diffMs < 60000) return "Just now";

  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;

  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  return `${Math.floor(months / 12)}y ago`;
}

