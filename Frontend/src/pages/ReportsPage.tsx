import {
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  RefreshCw,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ErrorState, LoadingState } from "../components/FeedbackState";
import { getWorkspaceReport } from "../services/reportService";
import type { ProjectPerformanceItem, WorkspaceReport } from "../types/report";

const PIE_COLORS = ["#2563eb", "#0f766e", "#d97706", "#7c3aed", "#dc2626", "#64748b"];

function formatStatus(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");
}

function statusClasses(status: string) {
  switch (status.toLowerCase()) {
    case "active":
    case "completed":
    case "finished":
      return "bg-emerald-50 text-emerald-700";
    case "inprogress":
      return "bg-blue-50 text-blue-700";
    case "pending":
    case "onhold":
      return "bg-amber-50 text-amber-700";
    case "cancelled":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const [months, setMonths] = useState(6);
  const [report, setReport] = useState<WorkspaceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getWorkspaceReport(months)
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load report data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [months, refreshKey]);

  const taskStatusChart = useMemo(
    () => (report?.taskStatus ?? []).map((item, index) => ({ ...item, displayName: formatStatus(item.name), fill: PIE_COLORS[index % PIE_COLORS.length] })),
    [report]
  );

  const taskPriorityChart = useMemo(
    () => (report?.taskPriority ?? []).map((item) => ({ ...item, displayName: formatStatus(item.name) })),
    [report]
  );

  const projectStatusChart = useMemo(
    () => (report?.projectStatus ?? []).map((item) => ({ ...item, displayName: formatStatus(item.name) })),
    [report]
  );

  if (loading) return <LoadingState label="Loading workspace reports..." />;
  if (error) return <ErrorState title="Reports unavailable" description={error} onRetry={() => setRefreshKey((value) => value + 1)} />;
  if (!report) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600"><BarChart3 size={18} /> Workspace analytics</div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">CRM + Work Reports</h1>
          <p className="mt-1 text-sm text-slate-500">Departments, people, projects, tasks, follow-ups and workload.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={months} onChange={(event) => setMonths(Number(event.target.value))} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700">
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={9}>Last 9 months</option>
            <option value={12}>Last 12 months</option>
          </select>
          <button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard title="Departments" value={report.summary.totalDepartments} subtitle="Internal CRM accounts" icon={Building2} />
        <SummaryCard title="People" value={report.summary.totalPeople} subtitle="CRM contacts" icon={UserRound} />
        <SummaryCard title="Projects" value={report.summary.totalProjects} subtitle={`${report.summary.activeProjects} active`} icon={FolderKanban} />
        <SummaryCard title="Tasks" value={report.summary.totalTasks} subtitle={`${report.summary.taskCompletionRate}% complete`} icon={CheckCircle2} />
        <SummaryCard title="Open follow-ups" value={report.summary.openFollowUps} subtitle={`${report.summary.overdueFollowUps} overdue`} icon={CalendarClock} />
        <SummaryCard title="Active users" value={report.summary.totalUsers} subtitle="Workspace members" icon={Users} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-semibold text-slate-900">Workspace growth</h2>
        <p className="mt-1 text-sm text-slate-500">Records created over the selected period.</p>
        <div className="mt-5 h-[340px]">
          {report.activityTrend.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.activityTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="tasksCreated" name="Tasks" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="projectsCreated" name="Projects" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="departmentsCreated" name="Departments" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="peopleCreated" name="People" stroke="#d97706" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="followUpsCreated" name="Follow-ups" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard title="Task status" subtitle="Current task distribution.">
          {taskStatusChart.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={taskStatusChart} dataKey="count" nameKey="displayName" innerRadius={62} outerRadius={92} paddingAngle={2} />
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Task priority" subtitle="Open work by priority level.">
          {taskPriorityChart.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskPriorityChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="displayName" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" name="Tasks" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Project status" subtitle="Projects across their lifecycle.">
          {projectStatusChart.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectStatusChart} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="displayName" width={86} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" name="Projects" fill="#7c3aed" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BreakdownCard title="Department status" items={report.departmentStatus} total={report.summary.totalDepartments} />
        <BreakdownCard title="Follow-up status" items={report.followUpStatus} total={Math.max(1, report.followUpStatus.reduce((sum, item) => sum + item.count, 0))} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-5 py-5 sm:px-6">
            <h2 className="font-semibold text-slate-900">Project performance</h2>
            <p className="mt-1 text-sm text-slate-500">Projects ranked by task volume and progress.</p>
          </div>
          <div className="hidden border-t border-slate-100 bg-slate-50 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid md:grid-cols-[minmax(0,1.6fr)_0.7fr_0.65fr_0.65fr_1fr]">
            <span>Project</span><span>Tasks</span><span>Finished</span><span>Overdue</span><span>Progress</span>
          </div>
          {report.projectPerformance.length === 0 ? (
            <div className="border-t border-slate-100 px-5 py-10 text-center text-sm text-slate-500">No projects available yet.</div>
          ) : report.projectPerformance.map((project) => (
            <ProjectPerformanceRow key={project.projectId} project={project} onOpen={() => navigate(`/projects/${project.projectId}`)} />
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-5 py-5 sm:px-6">
            <h2 className="font-semibold text-slate-900">User workload</h2>
            <p className="mt-1 text-sm text-slate-500">Assigned open tasks, due soon and overdue.</p>
          </div>
          {report.userWorkload.length === 0 ? (
            <div className="border-t border-slate-100 px-5 py-10 text-center text-sm text-slate-500">No assignments yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 border-t border-slate-100">
              {report.userWorkload.map((item) => (
                <div key={item.userId} className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 font-semibold text-slate-900">{item.userName}</div>
                    <div className="text-sm font-bold text-slate-800">{item.openTasks} open</div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">{item.dueSoonTasks} due soon</span>
                    <span className={item.overdueTasks > 0 ? "rounded-full bg-red-50 px-2.5 py-1 font-medium text-red-700" : "rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600"}>{item.overdueTasks} overdue</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span>{report.summary.overdueTasks > 0 || report.summary.overdueFollowUps > 0 ? <><AlertTriangle size={14} className="mr-1 inline text-amber-600" /> Attention needed: {report.summary.overdueTasks} overdue tasks and {report.summary.overdueFollowUps} overdue follow-ups.</> : "No overdue work requiring attention."}</span>
        <span>Generated {new Date(report.generatedAt).toLocaleString()}</span>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subtitle, icon: Icon }: { title: string; value: number | string; subtitle: string; icon: typeof BarChart3 }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div><div className="mt-3 text-3xl font-bold text-slate-900">{value}</div><div className="mt-1 text-xs text-slate-500">{subtitle}</div></div>
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600"><Icon size={20} /></div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="font-semibold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p><div className="mt-4 h-[280px]">{children}</div></section>;
}

function EmptyChart() {
  return <div className="flex h-full items-center justify-center text-sm text-slate-500">No data available yet.</div>;
}

function BreakdownCard({ title, items, total }: { title: string; items: { name: string; count: number }[]; total: number }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <div className="mt-5 space-y-3">
        {items.length === 0 ? <p className="text-sm text-slate-500">No data available yet.</p> : items.map((item) => {
          const percentage = Math.round((item.count / Math.max(1, total)) * 100);
          return <div key={item.name}><div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium text-slate-700">{formatStatus(item.name)}</span><span className="text-slate-500">{item.count} · {percentage}%</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${percentage}%` }} /></div></div>;
        })}
      </div>
    </section>
  );
}

function ProjectPerformanceRow({ project, onOpen }: { project: ProjectPerformanceItem; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="grid w-full gap-3 border-t border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50 md:grid-cols-[minmax(0,1.6fr)_0.7fr_0.65fr_0.65fr_1fr] md:items-center">
      <div className="min-w-0"><p className="truncate font-semibold text-slate-900">{project.projectName}</p><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses(project.status)}`}>{formatStatus(project.status)}</span></div>
      <div><p className="text-xs text-slate-500 md:hidden">Tasks</p><p className="font-semibold text-slate-800">{project.totalTasks}</p></div>
      <div><p className="text-xs text-slate-500 md:hidden">Finished</p><p className="font-semibold text-slate-800">{project.completedTasks}</p></div>
      <div><p className="text-xs text-slate-500 md:hidden">Overdue</p><p className={project.overdueTasks > 0 ? "font-semibold text-red-600" : "font-semibold text-slate-800"}>{project.overdueTasks}</p></div>
      <div><div className="flex items-center justify-between gap-2 text-xs text-slate-500"><span>Completion</span><span>{project.completionRate}%</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, Math.max(0, project.completionRate))}%` }} /></div></div>
    </button>
  );
}
