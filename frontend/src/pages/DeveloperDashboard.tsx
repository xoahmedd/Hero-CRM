import { useState, useEffect } from "react";
import type { User, Project, Task } from "../data/mock";
import { MOCK_PROJECTS, MOCK_TASKS } from "../data/mock";
import { projectsApi, tasksApi } from "../api/services";
import { Badge, Card, KpiCard, ProgressBar, SectionHeader } from "../components/ui";

interface Props {
  currentUser: User;
  onNavigateProject: (id: number) => void;
}

export default function DeveloperDashboard({ currentUser, onNavigateProject }: Props) {
  const [projectsList, setProjectsList] = useState<Project[]>(MOCK_PROJECTS);
  const [tasksList, setTasksList] = useState<Task[]>(MOCK_TASKS);

  useEffect(() => {
    projectsApi.getProjects()
      .then((res) => { if (res && res.length > 0) setProjectsList(res); })
      .catch(() => {});
    tasksApi.getTasks()
      .then((res) => { if (res && res.length > 0) setTasksList(res); })
      .catch(() => {});
  }, [currentUser.id]);

  const assignedProjects = projectsList.filter(
    (p) => p.ownerId === currentUser.id && p.status !== "Finished" && p.status !== "Submitted"
  );
  const myTasks = tasksList.filter(
    (t) => t.assignees.some((a) => a.id === currentUser.id)
  );
  const activeTasks = myTasks.filter((t) => t.status !== "Completed" && t.status !== "Cancelled");
  const completedTasks = myTasks.filter((t) => t.status === "Completed");
  const overdueTasks = myTasks.filter((t) => {
    const due = new Date(t.dueDate);
    return due < new Date() && t.status !== "Completed" && t.status !== "Cancelled";
  });
  const pendingReasons = projectsList.filter(
    (p) => p.status === "Overdue" && p.ownerId === currentUser.id && !p.missedDeadlineReason
  );

  const upcoming = [...activeTasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 6);


  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label="My Projects" value={assignedProjects.length} />
        <KpiCard label="Active Tasks" value={activeTasks.length} accent="#3b82f6" />
        <KpiCard label="Completed" value={completedTasks.length} accent="#22c55e" />
        <KpiCard label="Overdue Tasks" value={overdueTasks.length} accent={overdueTasks.length > 0 ? "#ef4444" : undefined} />
        <KpiCard label="Notifications" value={3} accent="#f59e0b" />
      </div>

      {/* Pending reason alert */}
      {pendingReasons.length > 0 && (
        <div
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{ background: "#fef2f2", border: "1px solid #fca5a5" }}
        >
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div className="font-semibold text-sm" style={{ color: "#b91c1c", fontFamily: "var(--font-display)" }}>
              Missed deadline justification required
            </div>
            <div className="text-sm mt-0.5" style={{ color: "#991b1b" }}>
              {pendingReasons.map((p) => p.name).join(", ")} — please submit your delay justification.
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming tasks */}
        <Card style={{ padding: 24 }}>
          <SectionHeader title="Upcoming Tasks" />
          {upcoming.length === 0 ? (
            <div className="text-sm text-center py-8" style={{ color: "var(--color-muted-foreground)" }}>No upcoming tasks.</div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((task) => {
                const due = new Date(task.dueDate);
                const isOverdue = due < new Date();
                return (
                  <div
                    key={task.id}
                    className="flex items-start justify-between p-3 rounded-lg"
                    style={{ background: "#f8fafc", border: "1px solid var(--color-border)" }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: "var(--color-foreground)" }}>{task.title}</div>
                      <div className="text-xs mt-0.5 truncate" style={{ color: "var(--color-muted-foreground)" }}>{task.projectName}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <Badge label={task.status} />
                      <span
                        className="text-xs"
                        style={{ fontFamily: "var(--font-mono)", color: isOverdue ? "#ef4444" : "#94a3b8" }}
                      >
                        {due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Assigned projects */}
        <Card style={{ padding: 24 }}>
          <SectionHeader title="My Projects" />
          {assignedProjects.length === 0 ? (
            <div className="text-sm text-center py-8" style={{ color: "var(--color-muted-foreground)" }}>
              No active projects assigned.
            </div>
          ) : (
            <div className="space-y-4">
              {assignedProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onNavigateProject(project.id)}
                  className="w-full text-left p-4 rounded-xl transition-colors hover:bg-slate-50"
                  style={{ border: "1px solid var(--color-border)" }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold text-sm" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}>
                      {project.name}
                    </div>
                    <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                      <Badge label={project.priority} type="priority" />
                      <Badge label={project.status} />
                    </div>
                  </div>
                  <div className="text-xs mb-3" style={{ color: "var(--color-muted-foreground)" }}>
                    Due {new Date(project.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                  <ProgressBar value={project.progress} color={project.status === "Overdue" ? "#ef4444" : "#1a3896"} />
                  <div className="text-xs mt-1" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}>
                    {project.progress}% complete
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
