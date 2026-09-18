import type { ReactNode } from "react";

// Shared status/priority badge configs
export const statusColors: Record<string, { bg: string; color: string }> = {
  Planning: { bg: "#dbeafe", color: "#1d4ed8" },
  Working: { bg: "#dcfce7", color: "#15803d" },
  Overdue: { bg: "#fee2e2", color: "#b91c1c" },
  Finished: { bg: "#f3f4f6", color: "#374151" },
  Submitted: { bg: "#fef9c3", color: "#854d0e" },
  Rejected: { bg: "#fce7f3", color: "#9d174d" },
  Assigned: { bg: "#dbeafe", color: "#1d4ed8" },
  Todo: { bg: "#f1f5f9", color: "#475569" },
  InProgress: { bg: "#dbeafe", color: "#1d4ed8" },
  Review: { bg: "#fef3c7", color: "#92400e" },
  Completed: { bg: "#dcfce7", color: "#15803d" },
  Cancelled: { bg: "#fee2e2", color: "#991b1b" },
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
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: c.bg, color: c.color, fontFamily: "var(--font-mono)" }}
    >
      {label}
    </span>
  );
}

export function Card({ children, className = "", style = {} }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-xl border ${className}`}
      style={{ background: "white", borderColor: "var(--color-border)", ...style }}
    >
      {children}
    </div>
  );
}

export function KpiCard({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: string }) {
  return (
    <Card style={{ padding: "22px 28px" }}>
      <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-display)" }}>
        {label}
      </div>
      <div className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)", color: accent ?? "var(--color-foreground)" }}>
        {value}
      </div>
      {sub && <div className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>{sub}</div>}
    </Card>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--color-foreground)" }}>{title}</h2>
      {action}
    </div>
  );
}

export function ProgressBar({ value, color = "#1a3896" }: { value: number; color?: string }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: "#f1f5f9" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

export function Avatar({ initials, size = 32 }: { initials: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full text-white font-semibold flex-shrink-0"
      style={{ width: size, height: size, background: "#1a3896", fontSize: size * 0.35, fontFamily: "var(--font-display)" }}
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
      className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
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
      className="px-3 py-2 rounded-lg text-sm outline-none"
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
      className="inline-flex items-center gap-2 rounded-lg font-medium transition-opacity"
      style={{
        padding: size === "sm" ? "7px 14px" : "9px 20px",
        fontSize: size === "sm" ? 12 : 13,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.6)" }}>
      <div className="rounded-2xl shadow-2xl w-full overflow-hidden" style={{ maxWidth: wide ? 680 : 480, background: "white" }}>
        <div className="flex items-center justify-between px-7 py-5 border-b" style={{ borderColor: "var(--color-border)" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--color-foreground)" }}>{title}</h3>
          <button onClick={onClose} className="text-xl" style={{ color: "var(--color-muted-foreground)" }}>×</button>
        </div>
        <div className="p-7">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16" style={{ color: "var(--color-muted-foreground)" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>◎</div>
      <div className="text-sm">{message}</div>
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
              <th key={col} className="text-left py-3 px-5" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="transition-colors hover:bg-slate-50" style={{ borderBottom: "1px solid #f8fafc" }}>
              {row.map((cell, j) => (
                <td key={j} className="py-3 px-5">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
