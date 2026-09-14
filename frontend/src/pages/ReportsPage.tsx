import { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line,
} from "recharts";
import { REPORTS_DATA } from "../data/mock";
import { reportsApi } from "../api/services";
import { Badge, Card, KpiCard, ProgressBar, Select } from "../components/ui";

const PIE_COLORS = ["#1a3896", "#4a8220", "#4a8220", "#d97706", "#dc2626"];

export default function ReportsPage() {
  const [months, setMonths] = useState("6");
  const [d, setD] = useState<any>(REPORTS_DATA);

  useEffect(() => {
    reportsApi.getSummaryReports()
      .then((data) => { if (data) setD(data); })
      .catch(() => {});
  }, []);


  return (
    <div className="space-y-6">
      {/* Time window selector */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          Generated {new Date(d.generatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
        <Select
          value={months}
          onChange={setMonths}
          options={[
            { value: "3", label: "Last 3 months" },
            { value: "6", label: "Last 6 months" },
            { value: "12", label: "Last 12 months" },
          ]}
        />
      </div>

      {/* Executive Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Customers" value={d.summary.totalCustomers} />
        <KpiCard label="Total Projects" value={d.summary.totalProjects} />
        <KpiCard label="Active Projects" value={d.summary.activeProjects} accent="#3b82f6" />
        <KpiCard label="Task Completion" value={`${d.summary.taskCompletionRate}%`} accent="#22c55e" sub={`${d.summary.completedTasks}/${d.summary.totalTasks} tasks`} />
        <KpiCard label="Total Tasks" value={d.summary.totalTasks} />
        <KpiCard label="Completed Tasks" value={d.summary.completedTasks} accent="#22c55e" />
        <KpiCard label="Pending Tasks" value={d.summary.pendingTasks} accent="#f59e0b" />
        <KpiCard label="Overdue Tasks" value={d.summary.overdueTasks} accent="#ef4444" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Task Status Donut */}
        <Card style={{ padding: 24 }}>
          <h3 className="font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>Task Status Breakdown</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={d.taskStatus} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="count" paddingAngle={2}>
                  {d.taskStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {d.taskStatus.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Project Status Donut */}
        <Card style={{ padding: 24 }}>
          <h3 className="font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>Project Status Breakdown</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={d.projectStatus} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="count" paddingAngle={2}>
                  {d.projectStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {d.projectStatus.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Task Priority Bar */}
        <Card style={{ padding: 24 }}>
          <h3 className="font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>Task Priority Breakdown</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={d.taskPriority} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <Tooltip />
              <Bar dataKey="count" fill="#1a3896" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Customer Status Bar */}
        <Card style={{ padding: 24 }}>
          <h3 className="font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>Customer Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={d.customerStatus} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <Tooltip />
              <Bar dataKey="count" fill="#4a8220" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Activity Trend */}
      <Card style={{ padding: 24 }}>
        <h3 className="font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>Monthly Activity Trend</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={d.activityTrend} margin={{ top: 0, right: 16, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
            <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="tasksCreated" stroke="#1a3896" strokeWidth={2} dot={{ r: 3 }} name="Tasks Created" />
            <Line type="monotone" dataKey="projectsCreated" stroke="#4a8220" strokeWidth={2} dot={{ r: 3 }} name="Projects Created" />
            <Line type="monotone" dataKey="customersCreated" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Customers Created" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Project Performance Leaderboard */}
      <Card style={{ padding: 24 }}>
        <h3 className="font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>Project Performance Leaderboard</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Project", "Status", "Total Tasks", "Completed", "Overdue", "Completion Rate"].map((col) => (
                  <th key={col} className="text-left py-3 px-5" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.projectPerformance.map((p) => (
                <tr key={p.projectId} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td className="py-3 px-5 font-medium" style={{ color: "var(--color-foreground)" }}>{p.projectName}</td>
                  <td className="py-3 px-5"><Badge label={p.status} /></td>
                  <td className="py-3 px-5" style={{ fontFamily: "var(--font-mono)" }}>{p.totalTasks}</td>
                  <td className="py-3 px-5" style={{ fontFamily: "var(--font-mono)", color: "#22c55e" }}>{p.completedTasks}</td>
                  <td className="py-3 px-5" style={{ fontFamily: "var(--font-mono)", color: p.overdueTasks > 0 ? "#ef4444" : "inherit" }}>{p.overdueTasks}</td>
                  <td className="py-3 px-5" style={{ minWidth: 160 }}>
                    <div className="flex items-center gap-2">
                      <div style={{ flex: 1 }}>
                        <ProgressBar value={p.completionRate} color={p.completionRate === 100 ? "#22c55e" : "#1a3896"} />
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-muted-foreground)", width: 36 }}>{p.completionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
