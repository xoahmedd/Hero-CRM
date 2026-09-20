import {
  AlertCircle,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FolderKanban,
  RefreshCw,
  UserRound,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";
import { ErrorState, LoadingState } from "../components/FeedbackState";

interface DashboardFollowUpItem {
  id: number;
  title: string;
  type: string;
  dueAt: string;
  ownerName: string;
  targetLabel: string | null;
}

interface DashboardActivityItem {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  description: string | null;
  userName: string;
  createdAt: string;
}

interface DashboardData {
  totalDepartments: number;
  totalPeople: number;
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  totalUsers: number;
  openFollowUps: number;
  overdueFollowUps: number;
  dueTodayFollowUps: number;
  taskCompletionRate: number;
  upcomingFollowUps: DashboardFollowUpItem[];
  recentActivities: DashboardActivityItem[];
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      const response = await api.get<DashboardData>("/Dashboard");
      setData(response.data);
    } catch {
      setError("Unable to load dashboard data. Check that the backend is running and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const stats = useMemo(() => [
    { title: "Departments", value: data?.totalDepartments ?? 0, icon: Building2, path: "/departments" },
    { title: "People", value: data?.totalPeople ?? 0, icon: UserRound, path: "/people" },
    { title: "Projects", value: data?.totalProjects ?? 0, icon: FolderKanban, path: "/projects" },
    { title: "Open follow-ups", value: data?.openFollowUps ?? 0, icon: CalendarClock, path: "/follow-ups" },
  ], [data]);

  if (loading) return <LoadingState label="Loading dashboard..." />;
  if (error) return <ErrorState title="Dashboard unavailable" description={error} onRetry={() => void loadDashboard()} />;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">CRM + Work overview</h1>
          <p className="mt-1 text-sm text-slate-500">People, projects, tasks and follow-ups in one workspace.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadDashboard(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.title}
              type="button"
              onClick={() => navigate(stat.path)}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-500">{stat.title}</span>
                <span className="rounded-xl bg-blue-50 p-2.5 text-blue-600"><Icon size={19} /></span>
              </div>
              <div className="mt-4 text-3xl font-bold text-slate-900">{stat.value}</div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">Work progress</h2>
              <p className="mt-1 text-sm text-slate-500">Current task health across all projects.</p>
            </div>
            <button type="button" onClick={() => navigate("/reports")} className="text-sm font-semibold text-blue-600 hover:text-blue-700">Open reports</button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Total tasks" value={data?.totalTasks ?? 0} icon={CheckCircle2} />
            <Metric label="Finished" value={data?.completedTasks ?? 0} icon={CheckCircle2} />
            <Metric label="Open" value={data?.pendingTasks ?? 0} icon={Clock3} />
            <Metric label="Overdue" value={data?.overdueTasks ?? 0} icon={AlertCircle} danger={(data?.overdueTasks ?? 0) > 0} />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Task completion</span>
              <span className="font-semibold text-slate-900">{data?.taskCompletionRate ?? 0}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, data?.taskCompletionRate ?? 0)}%` }} />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <SmallStat label="Active projects" value={data?.activeProjects ?? 0} />
            <SmallStat label="Active users" value={data?.totalUsers ?? 0} />
            <SmallStat label="Follow-ups due today" value={data?.dueTodayFollowUps ?? 0} />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">Follow-up attention</h2>
              <p className="mt-1 text-sm text-slate-500">CRM actions that need a response.</p>
            </div>
            <CalendarClock size={20} className="text-blue-600" />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-amber-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Due today</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{data?.dueTodayFollowUps ?? 0}</div>
            </div>
            <div className="rounded-xl bg-red-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-red-700">Overdue</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{data?.overdueFollowUps ?? 0}</div>
            </div>
          </div>

          <button type="button" onClick={() => navigate("/follow-ups")} className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            Open follow-ups
          </button>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-slate-900">Upcoming follow-ups</h2>
            <p className="mt-1 text-sm text-slate-500">Next scheduled CRM actions.</p>
          </div>
          {(data?.upcomingFollowUps.length ?? 0) === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">No upcoming follow-ups.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data?.upcomingFollowUps.map((item) => (
                <button key={item.id} type="button" onClick={() => navigate(`/follow-ups?focus=${item.id}`)} className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-slate-50 sm:px-6">
                  <span className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-600"><CalendarClock size={16} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-slate-900">{item.title}</span>
                    <span className="mt-1 block text-xs text-slate-500">{item.type} · {item.targetLabel || "CRM"} · owner: {item.ownerName}</span>
                    <span className="mt-1 block text-xs font-medium text-slate-600">{formatDate(item.dueAt)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-slate-900">Recent activity</h2>
            <p className="mt-1 text-sm text-slate-500">Latest CRM and work-management changes.</p>
          </div>
          {(data?.recentActivities.length ?? 0) === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">No activity recorded yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data?.recentActivities.map((activity) => (
                <div key={activity.id} className="px-5 py-4 sm:px-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900">{activity.action}</div>
                      <div className="mt-1 text-sm text-slate-500">{activity.description || `${activity.entityType} #${activity.entityId}`}</div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-slate-400">
                      <div>{activity.userName}</div>
                      <div className="mt-1">{formatDate(activity.createdAt)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, icon: Icon, danger = false }: { label: string; value: number; icon: typeof Users; danger?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <Icon size={16} className={danger ? "text-red-500" : "text-blue-600"} />
      </div>
      <div className={danger ? "mt-2 text-2xl font-bold text-red-600" : "mt-2 text-2xl font-bold text-slate-900"}>{value}</div>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-bold text-slate-900">{value}</div>
    </div>
  );
}
