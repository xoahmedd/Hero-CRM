import { useState, useEffect, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { projectsApi, tasksApi, usersApi, dashboardApi } from "../api/services";
import { Project, Task, User } from "../types";
import { Badge, Card, KpiCard, ProgressBar, SectionHeader, Table, Select } from "../components/ui";

const PROJECT_STATUS_COLORS: Record<string, string> = {
  "In Progress": "#1a3896",
  Finished: "#22c55e",
  Cancelled: "#94a3b8",
};

const TASK_STATUS_COLORS: Record<string, string> = {
  "In Progress": "#1a3896",
  "Assigned": "#1a3896",
  "In Review": "#8b5cf6",
  "Review": "#8b5cf6",
  Completed: "#22c55e",
  Cancelled: "#94a3b8",
};

function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  if (totalCount === 0 || totalPages <= 1) return null;
  const start = (currentPage - 1) * pageSize;
  const end = Math.min(start + pageSize, totalCount);

  function getPageNumbers(current: number, total: number) {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (current <= 3) {
      pages.push(1, 2, 3, 4, "...", total);
    } else if (current >= total - 2) {
      pages.push(1, "...", total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, "...", current - 1, current, current + 1, "...", total);
    }
    return pages;
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
      <span>
        {start + 1}–{end} of {totalCount}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 min-w-8 px-2.5 rounded-lg bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed font-semibold border border-slate-200 transition-colors cursor-pointer text-xs"
          title="Previous page"
        >
          ‹
        </button>
        {getPageNumbers(currentPage, totalPages).map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 select-none text-xs">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(Number(p))}
              className={`min-w-8 h-8 px-2.5 rounded-lg font-medium border text-xs transition-colors cursor-pointer ${
                p === currentPage
                  ? "bg-[#1a3896] text-white border-[#1a3896] font-bold shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 min-w-8 px-2.5 rounded-lg bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed font-semibold border border-slate-200 transition-colors cursor-pointer text-xs"
          title="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [timeFilter, setTimeFilter] = useState("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Pagination states
  const [workloadPage, setWorkloadPage] = useState(1);
  const [overdueProjPage, setOverdueProjPage] = useState(1);
  const [overdueTaskPage, setOverdueTaskPage] = useState(1);
  const [allProjectsPage, setAllProjectsPage] = useState(1);

  const WORKLOAD_PAGE_SIZE = 6;
  const OVERDUE_PROJ_PAGE_SIZE = 5;
  const OVERDUE_TASK_PAGE_SIZE = 5;
  const ALL_PROJ_PAGE_SIZE = 6;

  useEffect(() => {
    projectsApi
      .getProjects()
      .then((data) => setProjects(data || []))
      .catch(() => {});

    tasksApi
      .getTasks()
      .then((data) => setTasks(data || []))
      .catch(() => {});

    usersApi
      .getUsers()
      .then((data) => setUsers(data || []))
      .catch(() => {});

    dashboardApi
      .getAdminDashboard()
      .catch(() => {});
  }, []);

  // Reset pagination on filter change
  useEffect(() => {
    setWorkloadPage(1);
    setOverdueProjPage(1);
    setOverdueTaskPage(1);
    setAllProjectsPage(1);
  }, [timeFilter]);

  // Compute cutoff date from timeFilter
  const cutoffDate = useMemo(() => {
    if (timeFilter === "all") return null;
    const months = parseInt(timeFilter, 10);
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date;
  }, [timeFilter]);

  // Filter projects by creation date (or startDate)
  const filteredProjects = useMemo(() => {
    if (!cutoffDate) return projects;
    return projects.filter((p) => {
      const dStr = p.createdAt || p.startDate;
      if (!dStr) return true;
      return new Date(dStr) >= cutoffDate;
    });
  }, [projects, cutoffDate]);

  // Filter tasks by creation date
  const filteredTasks = useMemo(() => {
    if (!cutoffDate) return tasks;
    return tasks.filter((t) => {
      if (!t.createdAt) return true;
      return new Date(t.createdAt) >= cutoffDate;
    });
  }, [tasks, cutoffDate]);

  // Project KPIs
  const totalProjects = filteredProjects.length;
  const inProgressProjects = filteredProjects.filter((p) => p.status === "In Progress").length;
  const finishedProjects = filteredProjects.filter((p) => p.status === "Finished").length;
  const overdueProjects = filteredProjects.filter((p) => {
    if (p.status === "Finished" || p.status === "Cancelled") return false;
    return Boolean(p.isOverdue) || (Boolean(p.dueDate) && new Date(p.dueDate) < new Date());
  }).length;

  // Task KPIs
  const totalTasks = filteredTasks.length;
  const inProgressTasks = filteredTasks.filter(
    (t) => t.status === "In Progress" || t.status === "Assigned"
  ).length;
  const inReviewTasks = filteredTasks.filter(
    (t) => t.status === "Review" || t.status === "In Review"
  ).length;
  const finishedTasks = filteredTasks.filter((t) => t.status === "Completed").length;
  const overdueTasks = filteredTasks.filter((t) => {
    if (t.status === "Completed" || t.status === "Cancelled") return false;
    return Boolean(t.isOverdue) || (Boolean(t.dueDate) && new Date(t.dueDate) < new Date());
  }).length;

  // Project Status Breakdown Data
  const projectStatusData = useMemo(() => {
    const statuses = ["In Progress", "Finished", "Cancelled"];
    return statuses.map((st) => ({
      name: st,
      count: filteredProjects.filter((p) => p.status === st).length,
      color: PROJECT_STATUS_COLORS[st] || "#94a3b8",
    }));
  }, [filteredProjects]);

  // Task Status Breakdown Data (Pending removed as requested)
  const taskStatusData = useMemo(() => {
    const statuses = ["In Progress", "In Review", "Completed", "Cancelled"];
    return statuses.map((st) => ({
      name: st,
      count: filteredTasks.filter((t) => {
        if (st === "In Progress") return t.status === "In Progress" || t.status === "Assigned";
        if (st === "In Review") return t.status === "In Review" || t.status === "Review";
        return t.status === st;
      }).length,
      color: TASK_STATUS_COLORS[st] || "#94a3b8",
    }));
  }, [filteredTasks]);

  // Developer / User Workloads
  const userWorkloads = useMemo(() => {
    return users.map((u) => {
      const activeProjCount = filteredProjects.filter(
        (p) => (p.ownerId === u.id || p.memberIds?.includes(u.id)) && p.status === "In Progress"
      ).length;

      const activeTaskCount = filteredTasks.filter(
        (t) =>
          t.assignees?.some((a) => a.id === u.id) &&
          t.status !== "Completed" &&
          t.status !== "Cancelled"
      ).length;

      return {
        id: u.id,
        name: u.fullName,
        role: u.role,
        activeProjects: activeProjCount,
        activeTasks: activeTaskCount,
      };
    });
  }, [users, filteredProjects, filteredTasks]);

  // Overdue Projects List
  const overdueProjectsList = useMemo(() => {
    const items: Project[] = [];
    filteredProjects.forEach((p) => {
      if (p.status === "Finished" || p.status === "Cancelled") return;
      const isOver = Boolean(p.isOverdue) || (Boolean(p.dueDate) && new Date(p.dueDate) < new Date());
      if (isOver) items.push(p);
    });

    return items.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [filteredProjects]);

  // Overdue Tasks List
  const overdueTasksList = useMemo(() => {
    const items: Task[] = [];
    filteredTasks.forEach((t) => {
      if (t.status === "Completed" || t.status === "Cancelled") return;
      const isOver = Boolean(t.isOverdue) || (Boolean(t.dueDate) && new Date(t.dueDate) < new Date());
      if (isOver) items.push(t);
    });

    return items.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [filteredTasks]);

  // All Projects ordered by creation date (newest first)
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [filteredProjects]);

  // Paginated Data
  const clampedAllProjectsPage = Math.min(
    allProjectsPage,
    Math.max(1, Math.ceil(sortedProjects.length / ALL_PROJ_PAGE_SIZE))
  );
  const paginatedAllProjects = useMemo(() => {
    const start = (clampedAllProjectsPage - 1) * ALL_PROJ_PAGE_SIZE;
    return sortedProjects.slice(start, start + ALL_PROJ_PAGE_SIZE);
  }, [sortedProjects, clampedAllProjectsPage]);

  const clampedWorkloadPage = Math.min(
    workloadPage,
    Math.max(1, Math.ceil(userWorkloads.length / WORKLOAD_PAGE_SIZE))
  );
  const paginatedWorkloads = useMemo(() => {
    const start = (clampedWorkloadPage - 1) * WORKLOAD_PAGE_SIZE;
    return userWorkloads.slice(start, start + WORKLOAD_PAGE_SIZE);
  }, [userWorkloads, clampedWorkloadPage]);

  const clampedOverdueProjPage = Math.min(
    overdueProjPage,
    Math.max(1, Math.ceil(overdueProjectsList.length / OVERDUE_PROJ_PAGE_SIZE))
  );
  const paginatedOverdueProjects = useMemo(() => {
    const start = (clampedOverdueProjPage - 1) * OVERDUE_PROJ_PAGE_SIZE;
    return overdueProjectsList.slice(start, start + OVERDUE_PROJ_PAGE_SIZE);
  }, [overdueProjectsList, clampedOverdueProjPage]);

  const clampedOverdueTaskPage = Math.min(
    overdueTaskPage,
    Math.max(1, Math.ceil(overdueTasksList.length / OVERDUE_TASK_PAGE_SIZE))
  );
  const paginatedOverdueTasks = useMemo(() => {
    const start = (clampedOverdueTaskPage - 1) * OVERDUE_TASK_PAGE_SIZE;
    return overdueTasksList.slice(start, start + OVERDUE_TASK_PAGE_SIZE);
  }, [overdueTasksList, clampedOverdueTaskPage]);

  // Monthly Activity Trend Data
  const monthlyActivityData = useMemo(() => {
    const now = new Date();
    let monthCount = 6;
    if (timeFilter === "1") monthCount = 2;
    else if (timeFilter === "3") monthCount = 3;
    else if (timeFilter === "6") monthCount = 6;
    else if (timeFilter === "12") monthCount = 12;
    else if (timeFilter === "all") {
      let earliest = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      projects.forEach((p) => {
        if (p.createdAt && new Date(p.createdAt) < earliest) earliest = new Date(p.createdAt);
      });
      tasks.forEach((t) => {
        if (t.createdAt && new Date(t.createdAt) < earliest) earliest = new Date(t.createdAt);
      });
      const diffMonths = (now.getFullYear() - earliest.getFullYear()) * 12 + (now.getMonth() - earliest.getMonth()) + 1;
      monthCount = Math.max(3, Math.min(diffMonths, 36));
    }

    const points: Array<{ label: string; year: number; month: number; tasksCreated: number; projectsCreated: number }> = [];
    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      points.push({ label, year, month, tasksCreated: 0, projectsCreated: 0 });
    }

    filteredProjects.forEach((p) => {
      const dStr = p.createdAt || p.startDate;
      if (!dStr) return;
      const d = new Date(dStr);
      const pt = points.find((pt) => pt.year === d.getFullYear() && pt.month === d.getMonth());
      if (pt) pt.projectsCreated += 1;
    });

    filteredTasks.forEach((t) => {
      if (!t.createdAt) return;
      const d = new Date(t.createdAt);
      const pt = points.find((pt) => pt.year === d.getFullYear() && pt.month === d.getMonth());
      if (pt) pt.tasksCreated += 1;
    });

    return points;
  }, [timeFilter, projects, tasks, filteredProjects, filteredTasks]);

  return (
    <div className="space-y-8">
      {/* Top filter bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold tracking-wide" style={{ color: "var(--color-muted-foreground)" }}>
          Overview Analytics
        </div>
        <div className="w-56">
          <Select
            value={timeFilter}
            onChange={setTimeFilter}
            options={[
              { value: "all", label: "All time" },
              { value: "1", label: "Previous month" },
              { value: "3", label: "Previous 3 months" },
              { value: "6", label: "Previous 6 months" },
              { value: "12", label: "Previous year" },
            ]}
          />
        </div>
      </div>

      {/* Row 1: Projects KPIs */}
      <div>
        <div
          className="text-xs font-semibold uppercase tracking-widest mb-3.5"
          style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-display)" }}
        >
          Projects
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <KpiCard label="Total Projects" value={totalProjects} />
          <KpiCard label="In Progress" value={inProgressProjects} accent="#1a3896" />
          <KpiCard label="Finished" value={finishedProjects} accent="#22c55e" />
          <KpiCard label="Overdue" value={overdueProjects} accent="#ef4444" />
        </div>
      </div>

      {/* Row 2: Tasks KPIs */}
      <div>
        <div
          className="text-xs font-semibold uppercase tracking-widest mb-3.5"
          style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-display)" }}
        >
          Tasks
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
          <KpiCard label="Total Tasks" value={totalTasks} />
          <KpiCard label="In Progress (Assigned)" value={inProgressTasks} accent="#1a3896" />
          <KpiCard label="In Review" value={inReviewTasks} accent="#8b5cf6" />
          <KpiCard label="Finished" value={finishedTasks} accent="#22c55e" />
          <KpiCard label="Overdue" value={overdueTasks} accent="#ef4444" />
        </div>
      </div>

      {/* Row 3: Status Breakdown Donuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Status Breakdown */}
        <Card style={{ padding: "24px 28px" }}>
          <h3 className="font-semibold text-base mb-5" style={{ fontFamily: "var(--font-display)" }}>
            Project Status Breakdown
          </h3>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={68}
                  dataKey="count"
                  paddingAngle={3}
                >
                  {projectStatusData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {projectStatusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Task Status Breakdown */}
        <Card style={{ padding: "24px 28px" }}>
          <h3 className="font-semibold text-base mb-5" style={{ fontFamily: "var(--font-display)" }}>
            Task Status Breakdown
          </h3>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={68}
                  dataKey="count"
                  paddingAngle={3}
                >
                  {taskStatusData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {taskStatusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Row 4: All Projects (placed before Developer Workloads, with detailed task metrics & pagination) */}
      <Card>
        <div className="px-7 pt-6 pb-4">
          <SectionHeader title="All Projects" />
        </div>
        <Table
          columns={[
            "Project",
            "Department",
            "Priority",
            "Status",
            "Total Tasks",
            "In Progress (Assigned)",
            "In Review",
            "Completed",
            "Overdue",
            "Progress",
          ]}
          rows={paginatedAllProjects.map((p) => {
            const pTasks = (timeFilter === "all" ? tasks : filteredTasks).filter((t) => t.projectId === p.id);
            const pTotalTasks = pTasks.length;
            const pInProgress = pTasks.filter((t) => t.status === "In Progress" || t.status === "Assigned").length;
            const pInReview = pTasks.filter((t) => t.status === "In Review" || t.status === "Review").length;
            const pCompleted = pTasks.filter((t) => t.status === "Completed").length;
            const pOverdue = pTasks.filter(
              (t) =>
                t.status !== "Completed" &&
                t.status !== "Cancelled" &&
                (Boolean(t.isOverdue) || Boolean(t.dueDate && new Date(t.dueDate) < new Date()))
            ).length;

            return [
              <span key="name" className="font-medium" style={{ color: "var(--color-foreground)" }}>
                {p.name}
              </span>,
              <span key="dept" className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                {p.requestingDepartment || "—"}
              </span>,
              <Badge key="pri" label={p.priority} type="priority" />,
              <Badge key="st" label={p.status} />,
              <span key="total" className="font-semibold text-center block" style={{ fontFamily: "var(--font-mono)" }}>
                {pTotalTasks}
              </span>,
              <span
                key="prog_tasks"
                className="font-semibold text-center block"
                style={{ fontFamily: "var(--font-mono)", color: "#1a3896" }}
              >
                {pInProgress}
              </span>,
              <span
                key="rev"
                className="font-semibold text-center block"
                style={{ fontFamily: "var(--font-mono)", color: "#8b5cf6" }}
              >
                {pInReview}
              </span>,
              <span
                key="comp"
                className="font-semibold text-center block"
                style={{ fontFamily: "var(--font-mono)", color: "#22c55e" }}
              >
                {pCompleted}
              </span>,
              <span
                key="over"
                className="font-semibold text-center block"
                style={{ fontFamily: "var(--font-mono)", color: pOverdue > 0 ? "#ef4444" : "inherit" }}
              >
                {pOverdue}
              </span>,
              <div key="prog" style={{ width: 120 }}>
                <ProgressBar value={p.progress} color={p.status === "Finished" ? "#22c55e" : "#1a3896"} />
                <span
                  className="text-xs mt-1 inline-block"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}
                >
                  {p.progress}%
                </span>
              </div>,
            ];
          })}
        />
        <Pagination
          currentPage={clampedAllProjectsPage}
          totalPages={Math.ceil(sortedProjects.length / ALL_PROJ_PAGE_SIZE)}
          totalCount={sortedProjects.length}
          pageSize={ALL_PROJ_PAGE_SIZE}
          onPageChange={setAllProjectsPage}
        />
      </Card>

      {/* Row 5: Developer Workloads (Paginated) */}
      <Card>
        <div className="px-7 pt-6 pb-4">
          <SectionHeader title="Developer Workloads" />
        </div>
        <Table
          columns={["User", "Projects", "Tasks"]}
          rows={paginatedWorkloads.map((u) => [
            <div key={u.id} className="flex items-center gap-2.5">
              <span className="font-medium" style={{ color: "var(--color-foreground)" }}>
                {u.name}
              </span>
              <span
                className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                style={{
                  background: u.role === "Admin" ? "#eff6ff" : "#f1f5f9",
                  color: u.role === "Admin" ? "#1d4ed8" : "#475569",
                  border: u.role === "Admin" ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                }}
              >
                {u.role}
              </span>
            </div>,
            <span key="proj" className="font-semibold" style={{ fontFamily: "var(--font-mono)", color: "#1a3896" }}>
              {u.activeProjects}
            </span>,
            <span key="task" className="font-semibold" style={{ fontFamily: "var(--font-mono)", color: "#4a8220" }}>
              {u.activeTasks}
            </span>,
          ])}
        />
        <Pagination
          currentPage={clampedWorkloadPage}
          totalPages={Math.ceil(userWorkloads.length / WORKLOAD_PAGE_SIZE)}
          totalCount={userWorkloads.length}
          pageSize={WORKLOAD_PAGE_SIZE}
          onPageChange={setWorkloadPage}
        />
      </Card>

      {/* Row 6: Overdue Projects & Overdue Tasks (Separated, Side-by-Side, Paginated) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overdue Projects */}
        <Card>
          <div className="px-7 pt-6 pb-4 flex items-center justify-between">
            <SectionHeader title="Overdue Projects" />
            {overdueProjectsList.length > 0 && (
              <span
                className="text-xs px-3 py-1 rounded-full font-semibold"
                style={{ background: "#fee2e2", color: "#b91c1c" }}
              >
                ⚠ {overdueProjectsList.length} overdue
              </span>
            )}
          </div>
          {overdueProjectsList.length === 0 ? (
            <div className="px-7 py-10 text-center text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              All clear — no overdue projects in this period.
            </div>
          ) : (
            <>
              <Table
                columns={["Project", "Due Date"]}
                rows={paginatedOverdueProjects.map((p) => [
                  <span key={p.id} className="text-sm font-medium line-clamp-1" style={{ color: "var(--color-foreground)" }}>
                    {p.name}
                  </span>,
                  <span
                    key="due"
                    className="text-xs font-semibold"
                    style={{ fontFamily: "var(--font-mono)", color: "#ef4444" }}
                  >
                    {p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "Overdue"}
                  </span>,
                ])}
              />
              <Pagination
                currentPage={clampedOverdueProjPage}
                totalPages={Math.ceil(overdueProjectsList.length / OVERDUE_PROJ_PAGE_SIZE)}
                totalCount={overdueProjectsList.length}
                pageSize={OVERDUE_PROJ_PAGE_SIZE}
                onPageChange={setOverdueProjPage}
              />
            </>
          )}
        </Card>

        {/* Overdue Tasks */}
        <Card>
          <div className="px-7 pt-6 pb-4 flex items-center justify-between">
            <SectionHeader title="Overdue Tasks" />
            {overdueTasksList.length > 0 && (
              <span
                className="text-xs px-3 py-1 rounded-full font-semibold"
                style={{ background: "#fee2e2", color: "#b91c1c" }}
              >
                ⚠ {overdueTasksList.length} overdue
              </span>
            )}
          </div>
          {overdueTasksList.length === 0 ? (
            <div className="px-7 py-10 text-center text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              All clear — no overdue tasks in this period.
            </div>
          ) : (
            <>
              <Table
                columns={["Task", "Due Date"]}
                rows={paginatedOverdueTasks.map((t) => [
                  <span key={t.id} className="text-sm font-medium line-clamp-1" style={{ color: "var(--color-foreground)" }}>
                    {t.title}
                  </span>,
                  <span
                    key="due"
                    className="text-xs font-semibold"
                    style={{ fontFamily: "var(--font-mono)", color: "#ef4444" }}
                  >
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "Overdue"}
                  </span>,
                ])}
              />
              <Pagination
                currentPage={clampedOverdueTaskPage}
                totalPages={Math.ceil(overdueTasksList.length / OVERDUE_TASK_PAGE_SIZE)}
                totalCount={overdueTasksList.length}
                pageSize={OVERDUE_TASK_PAGE_SIZE}
                onPageChange={setOverdueTaskPage}
              />
            </>
          )}
        </Card>
      </div>

      {/* Row 7: Monthly Activity */}
      <Card style={{ padding: "26px 30px" }}>
        <h3 className="font-semibold text-base mb-5" style={{ fontFamily: "var(--font-display)" }}>
          Monthly Activity
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={monthlyActivityData} margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fontFamily: "var(--font-mono)" }} />
            <YAxis tick={{ fontSize: 12, fontFamily: "var(--font-mono)" }} />
            <Tooltip />
            <Legend wrapperStyle={{ paddingTop: 10 }} />
            <Line
              type="monotone"
              dataKey="tasksCreated"
              stroke="#1a3896"
              strokeWidth={2.5}
              dot={{ r: 3.5 }}
              name="Tasks Created"
            />
            <Line
              type="monotone"
              dataKey="projectsCreated"
              stroke="#4a8220"
              strokeWidth={2.5}
              dot={{ r: 3.5 }}
              name="Projects Created"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
