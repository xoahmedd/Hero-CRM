import { useState, useEffect } from "react";
import type { Task, Project, User, Comment } from "../data/mock";
import { MOCK_PROJECTS, MOCK_TASKS, MOCK_SUBTASKS, MOCK_COMMENTS, MOCK_USERS } from "../data/mock";
import { projectsApi, tasksApi, subtasksApi, commentsApi } from "../api/services";
import { Badge, Button, Card, Modal, ProgressBar, Select } from "../components/ui";

const TASK_STATUSES = ["Assigned", "Review", "Completed", "Cancelled"];

interface Props {
  projectId: number;
  currentUser?: User;
  onBack: () => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ProjectDetails({ projectId, currentUser, onBack }: Props) {
  const [project, setProject] = useState<Project | undefined>(
    MOCK_PROJECTS.find((p) => p.id === projectId)
  );
  const [tasks, setTasks] = useState<Task[]>(
    MOCK_TASKS.filter((t) => t.projectId === projectId)
  );
  const [subtasks, setSubtasks] = useState(
    MOCK_SUBTASKS.filter((s) => tasks.some((t) => t.id === s.taskId))
  );
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState<"tasks" | "members">("tasks");

  useEffect(() => {
    projectsApi.getProject(projectId)
      .then((p) => { if (p) setProject(p); })
      .catch(() => {});
    tasksApi.getTasksByProject(projectId)
      .then((t) => { if (Array.isArray(t)) setTasks(t); })
      .catch(() => {});
  }, [projectId]);

  useEffect(() => {
    if (selectedTask) {
      subtasksApi.getSubTasks(selectedTask.id)
        .then((s) => { if (s) setSubtasks((prev) => [...prev.filter((item) => item.taskId !== selectedTask.id), ...s]); })
        .catch(() => {});
      commentsApi.getComments(selectedTask.id)
        .then((c) => { if (c && c.length > 0) setComments(c); })
        .catch(() => {});
    }
  }, [selectedTask]);

  if (!project) return <div className="p-8 text-center">Project not found.</div>;

  const isAdmin = currentUser?.role === "Admin";
  const isOwner = currentUser && project ? project.ownerId === currentUser.id : false;

  const displayTasks = isAdmin || isOwner
    ? tasks
    : tasks.filter((t) => t.assignees.some((a) => a.id === currentUser?.id));

  const tasksByStatus = TASK_STATUSES.reduce<Record<string, Task[]>>((acc, s) => {
    acc[s] = displayTasks.filter((t) => t.status === s);
    return acc;
  }, {});

  const totalTasks = displayTasks.length;
  const completed = displayTasks.filter((t) => t.status === "Completed").length;
  const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

  async function updateTaskStatus(taskId: number, status: string) {
    try {
      await tasksApi.updateTaskStatus(taskId, status);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: status as Task["status"] } : t)));
      if (selectedTask?.id === taskId) setSelectedTask((t) => t ? { ...t, status: status as Task["status"] } : t);
    } catch (err: any) {
      console.error("Failed to update task status:", err);
      alert(err?.message || "Failed to update task status.");
    }
  }

  async function toggleSubtask(id: number) {
    try {
      await subtasksApi.toggleSubTask(id);
    } catch {}
    setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, isCompleted: !s.isCompleted } : s)));
  }

  async function addSubtask() {
    if (!newSubtask.trim() || !selectedTask) return;
    try {
      const created = await subtasksApi.createSubTask(selectedTask.id, newSubtask);
      setSubtasks((prev) => [...prev, created]);
    } catch {
      setSubtasks((prev) => [...prev, { id: Date.now(), taskId: selectedTask.id, title: newSubtask, isCompleted: false }]);
    }
    setNewSubtask("");
  }

  async function handleAddComment() {
    if (!newComment.trim() || !selectedTask) return;
    const authorId = currentUser?.id || 1;
    try {
      await commentsApi.addComment(selectedTask.id, authorId, newComment);
      const updated = await commentsApi.getComments(selectedTask.id);
      if (updated && updated.length > 0) {
        setComments((prev) => [...prev.filter((c) => c.taskId !== selectedTask.id), ...updated]);
      }
    } catch {
      const fallbackComment: Comment = {
        id: Date.now(),
        taskId: selectedTask.id,
        authorId,
        authorName: currentUser?.fullName || "Sarah Chen",
        authorAvatar: currentUser?.avatar || "SC",
        content: newComment,
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [...prev, fallbackComment]);
    }
    setNewComment("");
  }


  const taskSubtasks = selectedTask ? subtasks.filter((s) => s.taskId === selectedTask.id) : [];
  const taskComments = selectedTask ? comments.filter((c) => c.taskId === selectedTask.id) : [];
  const members = MOCK_USERS.filter((u) => u.role === "Developer").slice(0, 4);

  const statusColors: Record<string, string> = {
    Assigned: "#dbeafe",
    Review: "#fef3c7",
    Completed: "#dcfce7",
    Cancelled: "#fee2e2",
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm transition-colors" style={{ color: "var(--color-muted-foreground)" }}>
        ← Back to Projects
      </button>

      {/* Project Header */}
      <Card style={{ padding: 24 }}>
        {project.status === "Overdue" && project.missedDeadlineReason && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c" }}>
            ⚠ Overdue — {project.reasonCategory}: "{project.missedDeadlineReason}"
          </div>
        )}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "var(--color-foreground)" }}>
                {project.name}
              </h1>
              <Badge label={project.status} />
              <Badge label={project.priority} type="priority" />
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--color-muted-foreground)" }}>{project.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {[
                { label: "Lead Developer", value: project.ownerName || "—" },
                { label: "Customer", value: project.customerName || "—" },
                { label: "Department", value: project.requestingDepartment },
                { label: "Due Date", value: project.dueDate ? new Date(project.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—" },
              ].map((info) => (
                <div key={info.label}>
                  <div className="text-xs mb-0.5" style={{ color: "var(--color-muted-foreground)" }}>{info.label}</div>
                  <div className="font-semibold" style={{ color: "var(--color-foreground)" }}>{info.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-4 min-w-40" style={{ background: "#f8fafc", border: "1px solid var(--color-border)" }}>
            <div className="text-xs mb-1" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-display)" }}>Completion</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, color: "#1a3896" }}>{completionRate}%</div>
            <ProgressBar value={completionRate} />
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              {[
                { label: "Total", val: totalTasks },
                { label: "Done", val: completed, color: "#22c55e" },
                { label: "Active", val: displayTasks.filter((t) => t.status === "Assigned" || t.status === "Review").length, color: "#3b82f6" },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 16, color: s.color ?? "var(--color-foreground)" }}>{s.val}</div>
                  <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["tasks", "members"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors" style={{ background: activeTab === tab ? "#1a3896" : "#f1f5f9", color: activeTab === tab ? "white" : "#475569", fontFamily: "var(--font-display)" }}>
              {tab}
            </button>
          ))}
        </div>
        {activeTab === "tasks" && (
          <div className="flex gap-2">
            {(["kanban", "list"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className="px-3 py-1.5 rounded-lg text-sm capitalize" style={{ background: view === v ? "#0f172a" : "#f1f5f9", color: view === v ? "white" : "#475569" }}>
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === "tasks" && view === "kanban" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TASK_STATUSES.map((status) => (
            <div key={status} className="rounded-xl p-3" style={{ background: statusColors[status], minHeight: 200 }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wide" style={{ fontFamily: "var(--font-display)", color: "#475569" }}>{status}</span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(0,0,0,0.07)", fontFamily: "var(--font-mono)", color: "#475569" }}>
                  {tasksByStatus[status]?.length ?? 0}
                </span>
              </div>
              <div className="space-y-2">
                {(tasksByStatus[status] ?? []).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="w-full text-left p-3 rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--color-foreground)" }}>{task.title}</div>
                    <div className="flex items-center justify-between">
                      <Badge label={task.priority} type="priority" />
                      <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}>
                        {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "tasks" && view === "list" && (
        <Card>
          <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {displayTasks.map((task) => (
              <button key={task.id} onClick={() => setSelectedTask(task)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{task.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>{task.assignees.map((a) => a.name).join(", ")}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge label={task.priority} type="priority" />
                  <Badge label={task.status} />
                  <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}>
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {activeTab === "members" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {members.map((member) => (
            <Card key={member.id} style={{ padding: 20, textAlign: "center" }}>
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ background: "#1a3896", fontFamily: "var(--font-display)" }}>
                  {member.avatar}
                </div>
              </div>
              <div className="font-semibold text-sm" style={{ fontFamily: "var(--font-display)" }}>{member.fullName}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>{member.role}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Task Detail Drawer */}
      {selectedTask && (
        <Modal title={selectedTask.title} onClose={() => setSelectedTask(null)} wide>
          <div className="space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge label={selectedTask.status} />
              <Badge label={selectedTask.priority} type="priority" />
              <span className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                Due {new Date(selectedTask.dueDate).toLocaleDateString()}
              </span>
            </div>

            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>{selectedTask.description}</p>

            {isAdmin ? (
              selectedTask.status === "Review" ? (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-muted-foreground)" }}>Admin Review Actions</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      onClick={() => updateTaskStatus(selectedTask.id, "Completed")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      ✓ Approve (Complete)
                    </button>
                    <button
                      onClick={() => updateTaskStatus(selectedTask.id, "Assigned")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors cursor-pointer"
                    >
                      ↺ Send Back (Rework)
                    </button>
                    <button
                      onClick={() => updateTaskStatus(selectedTask.id, "Cancelled")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 transition-colors cursor-pointer"
                    >
                      ✕ Cancel Task
                    </button>
                  </div>
                  <Select
                    value={selectedTask.status}
                    onChange={(v) => updateTaskStatus(selectedTask.id, v)}
                    options={TASK_STATUSES.map((s) => ({ value: s, label: s }))}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-muted-foreground)" }}>Update Status</label>
                  <Select
                    value={selectedTask.status}
                    onChange={(v) => updateTaskStatus(selectedTask.id, v)}
                    options={TASK_STATUSES.map((s) => ({ value: s, label: s }))}
                  />
                </div>
              )
            ) : (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-muted-foreground)" }}>Task Workflow</label>
                {selectedTask.status === "Assigned" && (
                  <Button onClick={() => updateTaskStatus(selectedTask.id, "Review")}>
                    Submit for Review →
                  </Button>
                )}
                {selectedTask.status === "Review" && (
                  <div className="p-3 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-sm">
                    ⏳ <strong>Under Review:</strong> This task has been submitted and is awaiting Admin review and approval.
                  </div>
                )}
                {selectedTask.status === "Completed" && (
                  <div className="p-3 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-sm">
                    ✓ <strong>Completed:</strong> This task was reviewed and approved by Admin.
                  </div>
                )}
                {selectedTask.status === "Cancelled" && (
                  <div className="p-3 rounded-lg bg-rose-50 text-rose-900 border border-rose-200 text-sm">
                    ✕ <strong>Cancelled:</strong> This task was cancelled.
                  </div>
                )}
              </div>
            )}

            {/* Subtasks */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-muted-foreground)" }}>
                Subtasks ({taskSubtasks.filter((s) => s.isCompleted).length}/{taskSubtasks.length})
              </div>
              <div className="space-y-2 mb-3">
                {taskSubtasks.map((sub) => (
                  <label key={sub.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={sub.isCompleted} onChange={() => toggleSubtask(sub.id)} />
                    <span className="text-sm" style={{ textDecoration: sub.isCompleted ? "line-through" : "none", color: sub.isCompleted ? "var(--color-muted-foreground)" : "var(--color-foreground)" }}>
                      {sub.title}
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
                  style={{ border: "1px solid var(--color-border)" }}
                  placeholder="Add subtask…"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                />
                <Button size="sm" onClick={addSubtask}>Add</Button>
              </div>
            </div>

            {/* Comments */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-muted-foreground)" }}>Discussion</div>
              <div className="space-y-3 mb-3">
                {taskComments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "#1a3896" }}>
                      {c.authorAvatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{c.authorName}</span>
                        <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="text-sm mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: "1px solid var(--color-border)" }}
                  placeholder="Add a comment…"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                />
                <Button size="sm" onClick={handleAddComment}>Post</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
