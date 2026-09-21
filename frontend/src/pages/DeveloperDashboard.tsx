import { useState, useEffect } from "react";
import type { User, Project, Task } from "../types";
import { projectsApi, tasksApi, notificationsApi } from "../api/services";
import { Badge, Button, Card, KpiCard, Modal, ProgressBar, SectionHeader, Select } from "../components/ui";

const REASON_CATEGORIES = [
  "Resource Constraints",
  "Scope Creep",
  "Technical Debt",
  "External Blocker",
  "Client Delay",
  "Other",
];

interface Props {
  currentUser: User;
  onNavigateProject: (id: number) => void;
}

export default function DeveloperDashboard({ currentUser, onNavigateProject }: Props) {
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [tasksList, setTasksList] = useState<Task[]>([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);
  const [showReasonItem, setShowReasonItem] = useState<{
    type: "Project" | "Task";
    id: number;
    title: string;
    dueDate?: string;
  } | null>(null);
  const [reasonForm, setReasonForm] = useState({ reason: "", category: "Resource Constraints" });

  useEffect(() => {
    projectsApi.getProjects()
      .then((res) => { if (Array.isArray(res)) setProjectsList(res); })
      .catch(() => {});
    tasksApi.getTasks()
      .then((res) => { if (Array.isArray(res)) setTasksList(res); })
      .catch(() => {});
    if (currentUser?.id) {
      notificationsApi.getNotifications(currentUser.id)
        .then((res) => {
          if (Array.isArray(res)) {
            setUnreadNotifsCount(res.filter((n) => !n.isRead).length);
          }
        })
        .catch(() => {});
    }
  }, [currentUser.id]);

  const assignedProjects = projectsList
    .filter(
      (p) =>
        (p.ownerId === currentUser.id ||
          p.members?.some((m) => m.userId === currentUser.id) ||
          p.memberIds?.includes(currentUser.id)) &&
        p.status !== "Finished" &&
        p.status !== "Cancelled"
    )
    .sort((a, b) => {
      const timeA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const timeB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      if (timeA !== timeB) return timeA - timeB;
      return b.id - a.id;
    });
  const myTasks = tasksList.filter(
    (t) => t.assignees.some((a) => a.id === currentUser.id)
  );
  const activeTasks = myTasks.filter((t) => t.status !== "Completed" && t.status !== "Cancelled");
  const completedTasks = myTasks.filter((t) => t.status === "Completed");
  const overdueTasks = myTasks.filter((t) => {
    if (t.status === "Completed" || t.status === "Cancelled") return false;
    const due = new Date(t.dueDate);
    return (Boolean(t.isOverdue) || (Boolean(t.dueDate) && due < new Date()));
  });
  const pendingProjectReasons = projectsList.filter(
    (p) =>
      (Boolean(p.isOverdue) || Boolean(p.dueDate && new Date(p.dueDate) < new Date())) &&
      p.status !== "Finished" &&
      p.status !== "Cancelled" &&
      (p.ownerId === currentUser.id ||
        p.members?.some((m) => m.userId === currentUser.id) ||
        p.memberIds?.includes(currentUser.id)) &&
      !p.missedDeadlineReason
  );
  const pendingTaskReasons = myTasks.filter(
    (t) =>
      (t.isOverdue || (t.dueDate && new Date(t.dueDate) < new Date())) &&
      t.status !== "Completed" &&
      t.status !== "Cancelled" &&
      !t.missedDeadlineReason
  );
  const totalPendingReasons = pendingProjectReasons.length + pendingTaskReasons.length;

  const upcoming = [...activeTasks]
    .sort((a, b) => {
      const timeA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const timeB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      if (timeA !== timeB) return timeA - timeB;
      return b.id - a.id;
    })
    .slice(0, 6);

  async function handleSubmitReason() {
    if (!showReasonItem) return;
    try {
      if (showReasonItem.type === "Project") {
        await projectsApi.submitMissedReason(showReasonItem.id, reasonForm.reason);
        const projs = await projectsApi.getProjects();
        setProjectsList(projs);
      } else {
        await tasksApi.submitMissedReason(showReasonItem.id, reasonForm.reason, reasonForm.category);
        const ts = await tasksApi.getTasks();
        setTasksList(ts);
      }
    } catch (err: any) {
      alert(err?.message || "Failed to submit reason");
    }
    setShowReasonItem(null);
    setReasonForm({ reason: "", category: "Resource Constraints" });
  }

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
        <KpiCard label="My Projects" value={assignedProjects.length} />
        <KpiCard label="Active Tasks" value={activeTasks.length} accent="#3b82f6" />
        <KpiCard label="Completed" value={completedTasks.length} accent="#22c55e" />
        <KpiCard label="Overdue Tasks" value={overdueTasks.length} accent={overdueTasks.length > 0 ? "#ef4444" : undefined} />
        <KpiCard label="Notifications" value={unreadNotifsCount} accent="#f59e0b" />
      </div>

      {/* Pending reason alert */}
      {totalPendingReasons > 0 && (
        <div
          className="flex flex-col gap-3 p-4 rounded-xl"
          style={{ background: "#fef2f2", border: "1px solid #fca5a5" }}
        >
          <div className="flex items-start gap-3">
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div className="flex-1">
              <div className="font-semibold text-sm" style={{ color: "#b91c1c", fontFamily: "var(--font-display)" }}>
                Missed deadline justification required
              </div>
              <div className="text-sm mt-0.5" style={{ color: "#991b1b" }}>
                You have {totalPendingReasons} overdue {totalPendingReasons === 1 ? "item" : "items"} awaiting delay justification.
              </div>
            </div>
          </div>

          <div className="space-y-2 pl-8">
            {pendingProjectReasons.map((p) => (
              <div key={`p-${p.id}`} className="flex items-center justify-between text-xs bg-white/80 p-2 rounded-lg border border-red-200">
                <span>📁 <strong>Project:</strong> {p.name}</span>
                <Button size="sm" variant="danger" onClick={() => setShowReasonItem({ type: "Project", id: p.id, title: p.name, dueDate: p.dueDate })}>
                  Add Reason
                </Button>
              </div>
            ))}
            {pendingTaskReasons.map((t) => (
              <div key={`t-${t.id}`} className="flex items-center justify-between text-xs bg-white/80 p-2 rounded-lg border border-red-200">
                <span>📝 <strong>Task:</strong> {t.title} ({t.projectName})</span>
                <Button size="sm" variant="danger" onClick={() => setShowReasonItem({ type: "Task", id: t.id, title: t.title, dueDate: t.dueDate })}>
                  Add Reason
                </Button>
              </div>
            ))}
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
                const isOverdue =
                  task.status !== "Completed" &&
                  task.status !== "Cancelled" &&
                  (Boolean(task.isOverdue) || (Boolean(task.dueDate) && due < new Date()));
                return (
                  <div
                    key={task.id}
                    className={`flex flex-col gap-2.5 p-4 rounded-xl transition-all ${
                      isOverdue ? "border-l-4 border-l-rose-500 ring-1 ring-rose-200" : ""
                    }`}
                    style={{ background: "#f8fafc", border: isOverdue ? undefined : "1px solid var(--color-border)" }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: "var(--color-foreground)" }}>
                          {task.title}
                        </div>
                        <div className="text-xs mt-0.5 truncate" style={{ color: "var(--color-muted-foreground)" }}>
                          {task.projectName}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        {isOverdue ? <Badge label="Overdue" /> : <Badge label={task.status} />}
                        <span
                          className="text-xs font-medium"
                          style={{ fontFamily: "var(--font-mono)", color: isOverdue ? "#ef4444" : "#94a3b8" }}
                        >
                          {isOverdue && "⚠️"} {due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>

                    {isOverdue && (
                      <div className="flex items-center justify-between pt-1.5 text-xs border-t border-rose-100 mt-1">
                        {task.missedDeadlineReason ? (
                          <span className="text-rose-800 italic truncate max-w-[240px]">
                            Delay ({task.reasonCategory || "Other"}): "{task.missedDeadlineReason}"
                          </span>
                        ) : (
                          <span className="text-rose-700 font-medium">Delay justification required</span>
                        )}
                        <button
                          onClick={() =>
                            setShowReasonItem({
                              type: "Task",
                              id: task.id,
                              title: task.title,
                              dueDate: task.dueDate,
                            })
                          }
                          className="text-xs text-rose-700 hover:text-rose-900 underline font-semibold cursor-pointer ml-auto"
                        >
                          {task.missedDeadlineReason ? "Edit Reason" : "+ Add Reason"}
                        </button>
                      </div>
                    )}
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
                  <ProgressBar
                    value={project.status === "Finished" ? 100 : (project.progress ?? 0)}
                    color={project.status === "Finished" ? "#22c55e" : project.status === "Overdue" ? "#ef4444" : "#1a3896"}
                  />
                  <div
                    className="text-xs mt-1"
                    style={{ fontFamily: "var(--font-mono)", color: project.status === "Finished" ? "#15803d" : "var(--color-muted-foreground)" }}
                  >
                    {project.status === "Finished" ? 100 : (project.progress ?? 0)}% complete
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Reason Modal */}
      {showReasonItem && (
        <Modal
          title={`Submit Missed Deadline Reason (${showReasonItem.type})`}
          onClose={() => setShowReasonItem(null)}
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500">{showReasonItem.type}:</span>{" "}
              <strong className="text-slate-800">{showReasonItem.title}</strong>
              {showReasonItem.dueDate && (
                <div className="text-slate-500 mt-0.5">
                  Due date: {new Date(showReasonItem.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              )}
            </div>
            {showReasonItem.type === "Task" && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  Category
                </label>
                <Select
                  value={reasonForm.category}
                  onChange={(v) => setReasonForm((f) => ({ ...f, category: v }))}
                  options={REASON_CATEGORIES.map((c) => ({ value: c, label: c }))}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>
                Delay Justification
              </label>
              <textarea
                rows={3}
                value={reasonForm.reason}
                onChange={(e) => setReasonForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder={`Describe what caused the ${showReasonItem.type.toLowerCase()} delay…`}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  border: "1px solid var(--color-border)",
                  fontFamily: "var(--font-body)",
                  resize: "vertical",
                }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowReasonItem(null)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitReason} disabled={!reasonForm.reason.trim()}>
                Submit Reason
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
