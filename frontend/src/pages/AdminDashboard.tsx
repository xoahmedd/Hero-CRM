import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ADMIN_DASHBOARD_DATA, MOCK_PROJECTS } from "../data/mock";
import { dashboardApi, projectsApi } from "../api/services";
import { Badge, Card, KpiCard, ProgressBar, SectionHeader, Table } from "../components/ui";

const DONUT_COLORS = ["#1a3896", "#4a8220", "#06b6d4", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

export default function AdminDashboard() {
  const [d, setD] = useState<any>(ADMIN_DASHBOARD_DATA);
  const [recent, setRecent] = useState<any[]>(MOCK_PROJECTS.slice(0, 5));

  useEffect(() => {
    dashboardApi.getAdminDashboard()
      .then((data) => {
        if (data) setD(data);
      })
      .catch(() => {
        // Fallback to default ADMIN_DASHBOARD_DATA
      });

    projectsApi.getProjects()
      .then((projs) => {
        if (projs && projs.length > 0) setRecent(projs.slice(0, 5));
      })
      .catch(() => {});
  }, []);


  return (
    <div className="space-y-6">
      {/* KPI row 1: Projects */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-display)", marginLeft: 10 }}>
          Projects
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div style={{ marginLeft: 10 }}><KpiCard label="Total Projects" value={d.totalProjects} /></div>
          <KpiCard label="Working" value={d.workingProjects} accent="#1a3896" />
          <KpiCard label="Finished" value={d.finishedProjects} accent="#22c55e" />
          <KpiCard label="Overdue" value={d.overdueProjects} accent="#ef4444" sub="Need attention" />
        </div>
      </div>

      {/* KPI row 2: Tasks */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-display)", marginLeft: 10 }}>
          Tasks
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div style={{ marginLeft: 10 }}><KpiCard label="Total Tasks" value={d.totalTasks} /></div>
          <KpiCard label="Completed" value={d.completedTasks} accent="#22c55e" />
          <KpiCard label="Pending" value={d.pendingTasks} accent="#f59e0b" />
          <KpiCard label="Overdue Tasks" value={d.overdueTasks} accent="#ef4444" />
        </div>
      </div>

      {/* Developer count */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div style={{ marginLeft: 10 }}><KpiCard label="Active Developers" value={d.totalActiveDevelopers} sub="Currently engaged" accent="#1a3896" /></div>

        {/* Donut chart */}
        <Card style={{ padding: 24, gridColumn: "span 2" }}>
          <SectionHeader title="Department Project Distribution" />
          <div className="flex gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={d.departmentRequests || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  dataKey="projectCount"
                  paddingAngle={2}
                >
                  {(d.departmentRequests || []).map((_: any, i: number) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} projects`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {(d.departmentRequests || []).map((dept: any, i: number) => (
                <div key={dept.departmentName} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span className="text-sm" style={{ color: "var(--color-foreground)" }}>{dept.departmentName}</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}>
                    {dept.projectCount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Developer Workloads + Overdue Warning */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="px-6 pt-5 pb-3" style={{ marginLeft: 10 }}>
            <SectionHeader title="Developer Workloads" />
          </div>
          <div style={{ marginLeft: 10 }}>
            <Table
              columns={["Developer", "Projects", "Tasks"]}
              rows={(d.developerWorkloads || []).map((dev: any) => [
                <span className="font-medium" style={{ color: "var(--color-foreground)" }}>{dev.developerName}</span>,
                <span className="font-semibold" style={{ fontFamily: "var(--font-mono)", color: "#1a3896" }}>{dev.activeProjectsCount}</span>,
                <span className="font-semibold" style={{ fontFamily: "var(--font-mono)", color: "#4a8220" }}>{dev.activeTasksCount}</span>,
              ])}
            />
          </div>
        </Card>

        <Card>
          <div className="px-6 pt-5 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: "#fee2e2", color: "#b91c1c" }}>
                ⚠ {(d.overdueItemsNeedingReason || []).length} overdue item{(d.overdueItemsNeedingReason || []).length !== 1 ? "s" : ""} need a justification
              </div>
            </div>
          </div>
          {(d.overdueItemsNeedingReason || []).length === 0 ? (
            <div className="px-4 pb-4 text-sm" style={{ color: "var(--color-muted-foreground)" }}>All clear — no missing reasons.</div>
          ) : (
            <Table
              columns={["Item", "Assigned To", "Due", "Action"]}
              rows={(d.overdueItemsNeedingReason || []).map((item: any) => [
                <div>
                  <Badge label={item.itemType === "Project" ? "Project" : "Task"} />
                  <div className="text-sm font-medium mt-0.5" style={{ color: "var(--color-foreground)" }}>{item.title}</div>
                </div>,
                <span className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>{item.assignedUserName}</span>,
                <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "#ef4444" }}>
                  {new Date(item.dueDate).toLocaleDateString()}
                </span>,
                <button className="text-xs px-2 py-1 rounded" style={{ background: "#fee2e2", color: "#b91c1c" }}>
                  Request
                </button>,
              ])}
            />
          )}
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <div className="px-6 pt-5 pb-3" style={{ marginLeft: 10 }}>
          <SectionHeader title="Recent Projects" />
        </div>
        <div style={{ marginLeft: 10 }}>
        <Table
          columns={["Project", "Owner", "Priority", "Status", "Progress"]}
          rows={recent.map((p) => [
            <span className="font-medium" style={{ color: "var(--color-foreground)" }}>{p.name}</span>,
            <span className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>{p.ownerName || "—"}</span>,
            <Badge label={p.priority} type="priority" />,
            <Badge label={p.status} />,
            <div style={{ width: 100 }}>
              <ProgressBar value={p.progress} />
              <span className="text-xs mt-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}>{p.progress}%</span>
            </div>,
          ])}
        />
        </div>
      </Card>
    </div>
  );
}
