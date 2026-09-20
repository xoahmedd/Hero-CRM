import { useState, useEffect } from "react";
import type { Task, User, Project } from "../types";
import { tasksApi, projectsApi, usersApi } from "../api/services";
import { Badge, Button, Card, EmptyState, Input, Modal, Select } from "../components/ui";

const STATUSES = ["Assigned", "Review", "Completed", "Cancelled"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const PAGE_SIZE = 4;

const REASON_CATEGORIES = [
  "Resource Constraints",
  "Scope Creep",
  "Technical Debt",
  "External Blocker",
  "Client Delay",
  "Other",
];

const statusColors: Record<string, string> = {
  Assigned: "#dbeafe",
  Review: "#fef3c7",
  Completed: "#dcfce7",
  Cancelled: "#fee2e2",
};

function safeFormatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

function safeFormatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function checkIsOverdue(task: Task | null | undefined): boolean {
  if (!task) return false;
  if (task.status === "Cancelled") return false;
  if (task.isOverdue) return true;
  if (Boolean(task.missedDeadlineReason)) return true;
  if (!task.dueDate) return false;
  const dueTime = new Date(task.dueDate).getTime();
  if (isNaN(dueTime)) return false;

  if (task.status === "Completed") {
    if (task.completedAt) {
      const compTime = new Date(task.completedAt).getTime();
      if (!isNaN(compTime) && compTime > dueTime) return true;
    }
    return false;
  }

  return dueTime < Date.now();
}

interface Props {
  currentUser: User;
}

export default function TasksPage({ currentUser }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<"mine" | "all">(currentUser.role === "Admin" ? "all" : "mine");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [showReasonTask, setShowReasonTask] = useState<Task | null>(null);
  const [reasonForm, setReasonForm] = useState({ reason: "", category: "Resource Constraints" });
  const [pageByStatus, setPageByStatus] = useState<Record<string, number>>({
    Assigned: 1,
    Review: 1,
    Completed: 1,
    Cancelled: 1,
  });

  function setStatusPage(status: string, page: number) {
    setPageByStatus((prev) => ({
      ...prev,
      [status]: page,
    }));
  }

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
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<{
    title: string;
    description: string;
    status: string;
    priority: string;
    projectId: number;
    dueDate: string;
    assigneeIds: number[];
  }>({
    title: "",
    description: "",
    status: "Assigned",
    priority: "Medium",
    projectId: 1,
    dueDate: "",
    assigneeIds: [],
  });

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    status: string;
    priority: string;
    projectId: number;
    dueDate: string;
    assigneeIds: number[];
  }>({
    title: "",
    description: "",
    status: "Assigned",
    priority: "Medium",
    projectId: 1,
    dueDate: "",
    assigneeIds: [],
  });

  useEffect(() => {
    tasksApi.getTasks()
      .then((data) => { if (Array.isArray(data)) setTasks(data); })
      .catch((err) => { console.warn("Using fallback tasks:", err); });
    projectsApi.getProjects()
      .then((data) => { if (Array.isArray(data)) setProjectsList(data); })
      .catch((err) => { console.warn("Using fallback projects:", err); });
    usersApi.getUsers()
      .then((data) => { if (Array.isArray(data) && data.length > 0) setUsersList(data); })
      .catch((err) => { console.warn("Using fallback users:", err); });
  }, []);

  const isAdmin = currentUser.role === "Admin";
  const myTasks = tasks.filter((t) => t.assignees.some((a) => a.id === currentUser.id));
  const source = isAdmin ? (activeTab === "mine" ? myTasks : tasks) : myTasks;
  const filtered = source.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || (t.projectName || "").toLowerCase().includes(search.toLowerCase());
    const matchPriority = priorityFilter === "All" || t.priority === priorityFilter;
    return matchSearch && matchPriority;
  });

  const availableProjects = (isAdmin
    ? projectsList
    : projectsList.filter(
        (p) =>
          p.ownerId === currentUser.id ||
          p.members?.some((m) => m.userId === currentUser.id) ||
          p.memberIds?.includes(currentUser.id) ||
          tasks.some((t) => t.projectId === p.id && t.assignees.some((a) => a.id === currentUser.id))
      )
  ).sort((a, b) => {
    const timeA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const timeB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    if (timeA !== timeB) return timeA - timeB;
    return b.id - a.id;
  });

  const createAvailableProjects = availableProjects.filter((p) => p.status !== "Cancelled");
  const developers = usersList.filter((u) => u.role === "Developer" || u.role === "Admin");
  const selectedProject = createAvailableProjects.find((p) => p.id === createForm.projectId) || availableProjects.find((p) => p.id === createForm.projectId);
  const editSelectedProject = availableProjects.find((p) => p.id === editForm.projectId);

  function getProjectAssignees(proj?: Project | null): User[] {
    if (!proj) return [];
    const memberIds = new Set<number>();
    if (proj.ownerId) memberIds.add(proj.ownerId);
    if (Array.isArray(proj.members)) {
      proj.members.forEach((m) => {
        const id = m?.userId || (m as any)?.id;
        if (id) memberIds.add(id);
      });
    }
    if (Array.isArray(proj.memberIds)) {
      proj.memberIds.forEach((id) => memberIds.add(id));
    }
    return developers.filter((d) => memberIds.has(d.id));
  }

  const projectDevelopers = getProjectAssignees(selectedProject);
  const editProjectDevelopers = getProjectAssignees(editSelectedProject);

  const byStatus = STATUSES.reduce<Record<string, Task[]>>((acc, s) => {
    let items = filtered.filter((t) => t.status === s);
    if (s === "Completed") {
      items = [...items].sort((a, b) => {
        const timeA = a.completedAt ? new Date(a.completedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.completedAt ? new Date(b.completedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });
    } else {
      items = [...items].sort((a, b) => {
        const timeA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const timeB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        if (timeA !== timeB) return timeA - timeB;
        return b.id - a.id;
      });
    }
    acc[s] = items;
    return acc;
  }, {});

  async function updateStatus(taskId: number, status: string) {
    const isNowCompleted = status === "Completed";
    const nowIso = new Date().toISOString();
    try {
      await tasksApi.updateTaskStatus(taskId, status);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: status as Task["status"],
                completedAt: isNowCompleted ? (t.completedAt || nowIso) : null,
              }
            : t
        )
      );
      tasksApi.getTasks().then((updated) => {
        if (Array.isArray(updated)) setTasks(updated);
      }).catch(() => {});
    } catch (err: any) {
      console.error("Failed to update task status:", err);
      alert(err?.message || "Failed to update task status.");
    }
  }

  async function deleteTask(taskId: number) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await tasksApi.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err: any) {
      console.error("Failed to delete task:", err);
      alert(err?.message || "Failed to delete task.");
    }
  }

  async function handleSubmitReason() {
    if (!showReasonTask) return;
    try {
      await tasksApi.submitMissedReason(showReasonTask.id, reasonForm.reason, reasonForm.category);
      const updated = await tasksApi.getTasks();
      setTasks(updated);
    } catch {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === showReasonTask.id
            ? {
                ...t,
                missedDeadlineReason: reasonForm.reason,
                reasonCategory: reasonForm.category,
              }
            : t
        )
      );
    }
    setShowReasonTask(null);
    setReasonForm({ reason: "", category: "Resource Constraints" });
  }

  async function handleCreate() {
    if (createForm.assigneeIds.length === 0) {
      alert("Please assign at least one developer to this task.");
      return;
    }
    try {
      await tasksApi.createTask({
        title: createForm.title,
        description: createForm.description,
        projectId: createForm.projectId,
        createdById: currentUser.id,
        assigneeIds: createForm.assigneeIds,
        dueDate: createForm.dueDate,
        priority: createForm.priority,
      });
      const updated = await tasksApi.getTasks();
      setTasks(updated);
      setShowCreate(false);
      setCreateForm({
        title: "",
        description: "",
        status: "Assigned",
        priority: "Medium",
        projectId: createAvailableProjects[0]?.id || availableProjects[0]?.id || 1,
        dueDate: "",
        assigneeIds: [],
      });
    } catch (err: any) {
      console.error("Failed to create task:", err);
      alert(err?.message || "Failed to create task.");
    }
  }

  function startEdit(task: Task) {
    setEditingTask(task);
    const proj = availableProjects.find((p) => p.id === task.projectId);
    const validDevIds = new Set(getProjectAssignees(proj).map((d) => d.id));
    setEditForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      projectId: task.projectId,
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      assigneeIds: task.assignees.map((a) => a.id).filter((id) => validDevIds.has(id)),
    });
  }

  async function handleSaveEdit() {
    if (!editingTask) return;
    if (editForm.assigneeIds.length === 0) {
      alert("Please assign at least one developer or admin to this task.");
      return;
    }
    try {
      await tasksApi.updateTask(editingTask.id, {
        title: editForm.title,
        description: editForm.description,
        projectId: editForm.projectId,
        priority: editForm.priority,
        status: isAdmin ? editForm.status : undefined,
        dueDate: editForm.dueDate,
        assigneeIds: editForm.assigneeIds,
      });
      const updated = await tasksApi.getTasks();
      setTasks(updated);
      setEditingTask(null);
    } catch (err: any) {
      console.error("Failed to update task:", err);
      alert(err?.message || "Failed to update task.");
    }
  }


  return (
    <div className="space-y-5">
      {/* Tabs + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {isAdmin ? (
          <div className="flex gap-2">
            {(["mine", "all"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                style={{
                  background: activeTab === tab ? "#1a3896" : "#f1f5f9",
                  color: activeTab === tab ? "white" : "#475569",
                  fontFamily: "var(--font-display)",
                }}
              >
                {tab === "mine" ? `My Tasks (${myTasks.length})` : `All Tasks (${tasks.length})`}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{
                background: "#1a3896",
                color: "white",
                fontFamily: "var(--font-display)",
              }}
            >
              My Assigned Tasks ({myTasks.length})
            </span>
          </div>
        )}
        {isAdmin && <Button onClick={() => setShowCreate(true)}>+ New Task</Button>}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div style={{ flex: "1 1 200px" }}>
          <Input placeholder="Search tasks or projects…" value={search} onChange={setSearch} />
        </div>
        <Select value={priorityFilter} onChange={setPriorityFilter} options={[{ value: "All", label: "All Priorities" }, ...PRIORITIES.map((p) => ({ value: p, label: p }))]} />
      </div>

      {/* Kanban */}
      {filtered.length === 0 ? (
        <EmptyState message="No tasks match your filters." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUSES.map((status) => {
            const statusTasks = byStatus[status] ?? [];
            const totalCount = statusTasks.length;
            const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
            const currentPage = Math.min(pageByStatus[status] || 1, totalPages);
            const startIndex = (currentPage - 1) * PAGE_SIZE;
            const pagedTasks = statusTasks.slice(startIndex, startIndex + PAGE_SIZE);

            return (
              <div
                key={status}
                className="rounded-2xl p-4 flex flex-col justify-between shadow-xs"
                style={{ background: statusColors[status], minHeight: 300 }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-display)", color: "#475569" }}>
                      {status}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md font-mono font-semibold" style={{ background: "rgba(0,0,0,0.08)", color: "#334155" }}>
                      {totalCount}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {pagedTasks.length === 0 ? (
                      <div className="text-xs text-center py-10 text-slate-500 italic">
                        No tasks
                      </div>
                    ) : (
                      pagedTasks.map((task) => {
                        const isTaskOverdue = checkIsOverdue(task);
                        const canSubmitReason =
                          isAdmin ||
                          task.assignees.some((a) => a.id === currentUser.id) ||
                          task.createdById === currentUser.id;

                        return (
                          <div
                            key={task.id}
                            className={`p-4 rounded-xl bg-white shadow-xs transition-all ${
                              isTaskOverdue ? "border-l-4 border-l-rose-500 ring-1 ring-rose-200" : "border border-slate-100/80"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1 mb-1.5">
                              <div
                                className="text-sm font-medium"
                                style={{ fontFamily: "var(--font-display)", color: "var(--color-foreground)" }}
                              >
                                {task.title}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {isAdmin && (
                                  <button
                                    onClick={() => startEdit(task)}
                                    className="text-slate-400 hover:text-blue-600 transition-colors p-0.5 text-xs cursor-pointer"
                                    title="Edit task"
                                  >
                                    ✏️
                                  </button>
                                )}
                                {isAdmin && (
                                  <button
                                    onClick={() => deleteTask(task.id)}
                                    className="text-slate-400 hover:text-red-600 transition-colors p-0.5 text-xs cursor-pointer"
                                    title="Delete task"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="text-xs mb-2" style={{ color: "var(--color-muted-foreground)" }}>
                              {task.projectName}
                            </div>
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <div className="flex items-center gap-1.5">
                                <Badge label={task.priority} type="priority" />
                                {isTaskOverdue && (
                                  <Badge label="Overdue" />
                                )}
                              </div>
                              <span
                                className="text-xs flex items-center gap-1 font-medium"
                                style={{
                                  fontFamily: "var(--font-mono)",
                                  color: isTaskOverdue ? "#ef4444" : "var(--color-muted-foreground)",
                                }}
                              >
                                {isTaskOverdue && "⚠️"}
                                {safeFormatDate(task.dueDate)}
                              </span>
                            </div>

                            {/* Completed timestamp */}
                            {task.status === "Completed" && (
                              <div className="text-[11px] text-emerald-700 font-medium mt-1.5 flex items-center gap-1">
                                <span>✓</span>
                                <span>Completed: {safeFormatDateTime(task.completedAt || task.createdAt)}</span>
                              </div>
                            )}

                            {/* Overdue delay reason info or button */}
                            {isTaskOverdue && (
                              <div className="mt-2.5">
                                {task.missedDeadlineReason ? (
                                  <div className="p-2 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-900">
                                    <div className="font-semibold text-[11px] text-rose-700 flex items-center gap-1">
                                      <span>⚠️ Delay:</span>
                                      <span className="font-medium bg-rose-200/60 px-1 rounded text-[10px]">
                                        {task.reasonCategory || "Other"}
                                      </span>
                                    </div>
                                    <div className="mt-1 text-slate-700 italic line-clamp-2">
                                      "{task.missedDeadlineReason}"
                                    </div>
                                    {canSubmitReason && (
                                      <button
                                        onClick={() => {
                                          setShowReasonTask(task);
                                          setReasonForm({
                                            reason: task.missedDeadlineReason || "",
                                            category: task.reasonCategory || "Resource Constraints",
                                          });
                                        }}
                                        className="mt-1 text-[11px] text-rose-700 hover:text-rose-900 underline font-medium cursor-pointer"
                                      >
                                        Edit reason
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  canSubmitReason && (
                                    <button
                                      onClick={() => {
                                        setShowReasonTask(task);
                                        setReasonForm({ reason: "", category: "Resource Constraints" });
                                      }}
                                      className="w-full py-1 px-2 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                                    >
                                      ⚠️ Add Delay Reason
                                    </button>
                                  )
                                )}
                              </div>
                            )}

                          {/* Status Actions based on Role & Workflow */}
                          {isAdmin ? (
                            task.status === "Review" ? (
                              <div className="mt-2.5 space-y-1">
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => updateStatus(task.id, "Completed")}
                                    className="flex-1 py-1 px-2 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                                    title="Approve and mark as Completed"
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    onClick={() => updateStatus(task.id, "Assigned")}
                                    className="flex-1 py-1 px-2 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer"
                                    title="Send back for rework"
                                  >
                                    ↺ Rework
                                  </button>
                                </div>
                                <button
                                  onClick={() => updateStatus(task.id, "Cancelled")}
                                  className="w-full py-1 px-2 text-xs font-semibold rounded bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer border border-rose-200"
                                >
                                  ✕ Cancel Task
                                </button>
                              </div>
                            ) : (
                              <div className="mt-2">
                                <Select
                                  value={task.status}
                                  onChange={(v) => updateStatus(task.id, v)}
                                  options={STATUSES.map((s) => ({ value: s, label: s }))}
                                />
                              </div>
                            )
                          ) : (
                            <div className="mt-2">
                              {task.status === "Assigned" && (
                                <button
                                  onClick={() => updateStatus(task.id, "Review")}
                                  className="w-full py-1.5 px-2 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                                >
                                  Submit for Review →
                                </button>
                              )}
                              {task.status === "Review" && (
                                <div className="py-1 px-2 text-xs font-medium text-amber-800 bg-amber-50 rounded border border-amber-200 text-center">
                                  ⏳ Pending Admin Approval
                                </div>
                              )}
                              {task.status === "Completed" && (
                                <div className="py-1 px-2 text-xs font-medium text-emerald-800 bg-emerald-50 rounded border border-emerald-200 text-center">
                                  ✓ Completed
                                </div>
                              )}
                              {task.status === "Cancelled" && (
                                <div className="py-1 px-2 text-xs font-medium text-rose-800 bg-rose-50 rounded border border-rose-200 text-center">
                                  ✕ Cancelled
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex mt-2.5 gap-0.5">
                            {task.assignees.map((a) => (
                              <div key={a.id} className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "#1a3896", fontSize: 8 }}>
                                {a.avatar}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                  </div>
                </div>

                {/* Independent pagination for this status */}
                {totalPages > 1 && (
                  <div className="pt-3.5 mt-3.5 border-t border-slate-300/60 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-slate-600 font-medium px-1">
                      <span>
                        {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, totalCount)} of {totalCount}
                      </span>
                      <span className="font-mono text-xs">
                        Pg {currentPage}/{totalPages}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setStatusPage(status, currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-7 min-w-7 px-2 rounded-lg bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold shadow-xs transition-colors cursor-pointer border border-slate-200"
                        title="Previous page"
                      >
                        ‹
                      </button>

                      {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                        p === "..." ? (
                          <span key={`ellipsis-${idx}`} className="px-1 text-slate-500 text-xs select-none">
                            ...
                          </span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setStatusPage(status, Number(p))}
                            className={`min-w-7 h-7 px-2 rounded-lg text-xs transition-colors cursor-pointer font-medium border ${
                              p === currentPage
                                ? "bg-[#1a3896] text-white border-[#1a3896] font-bold shadow-xs"
                                : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200 shadow-xs"
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}

                      <button
                        onClick={() => setStatusPage(status, currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="h-7 min-w-7 px-2 rounded-lg bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold shadow-xs transition-colors cursor-pointer border border-slate-200"
                        title="Next page"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreate && isAdmin && (
        <Modal title="Create Task" onClose={() => setShowCreate(false)} wide>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Title</label>
              <Input value={createForm.title} onChange={(v) => setCreateForm((f) => ({ ...f, title: v }))} placeholder="Task title" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Description</label>
              <textarea rows={2} value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: "1px solid var(--color-border)", fontFamily: "var(--font-body)", resize: "vertical" }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Project</label>
                <Select
                  value={String(createForm.projectId)}
                  onChange={(v) => {
                    const newProjId = Number(v);
                    const newProj = createAvailableProjects.find((p) => p.id === newProjId) || availableProjects.find((p) => p.id === newProjId);
                    const validDevIds = new Set(getProjectAssignees(newProj).map((d) => d.id));
                    setCreateForm((f) => ({
                      ...f,
                      projectId: newProjId,
                      assigneeIds: f.assigneeIds.filter((id) => validDevIds.has(id)),
                    }));
                  }}
                  options={createAvailableProjects.map((p) => ({ value: String(p.id), label: p.name }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Priority</label>
                <Select value={createForm.priority} onChange={(v) => setCreateForm((f) => ({ ...f, priority: v }))} options={PRIORITIES.map((p) => ({ value: p, label: p }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Status</label>
                <Select value={createForm.status} onChange={(v) => setCreateForm((f) => ({ ...f, status: v }))} options={STATUSES.map((s) => ({ value: s, label: s }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Due Date</label>
                <Input type="date" value={createForm.dueDate} onChange={(v) => setCreateForm((f) => ({ ...f, dueDate: v }))} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
                Assign Developers & Admins (Project Members Only)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50 max-h-40 overflow-y-auto">
                {projectDevelopers.length === 0 ? (
                  <div className="col-span-full py-4 text-center text-xs text-amber-700 font-medium">
                    No developers or admins are assigned to this project. Please assign developers to the project first.
                  </div>
                ) : (
                  projectDevelopers.map((dev) => {
                    const isSelected = createForm.assigneeIds.includes(dev.id);
                    return (
                      <label
                        key={dev.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border text-xs transition-colors ${
                          isSelected
                            ? "bg-blue-50 border-blue-400 text-blue-900 font-semibold"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateForm((f) => ({ ...f, assigneeIds: [...f.assigneeIds, dev.id] }));
                            } else {
                              setCreateForm((f) => ({ ...f, assigneeIds: f.assigneeIds.filter((id) => id !== dev.id) }));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ background: "#1a3896" }}>
                          {dev.avatar}
                        </span>
                        <span className="truncate">
                          {dev.fullName} {dev.role === "Admin" && <span className="text-[10px] text-blue-600 font-semibold">(Admin)</span>}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
              {createForm.assigneeIds.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Please select at least one developer or admin for this task.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!createForm.title || createForm.assigneeIds.length === 0}>Create Task</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <Modal title="Edit Task" onClose={() => setEditingTask(null)} wide>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Title</label>
              <Input value={editForm.title} onChange={(v) => setEditForm((f) => ({ ...f, title: v }))} placeholder="Task title" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Description</label>
              <textarea rows={2} value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: "1px solid var(--color-border)", fontFamily: "var(--font-body)", resize: "vertical" }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Project</label>
                {isAdmin ? (
                  <Select
                    value={String(editForm.projectId)}
                    onChange={(v) => {
                      const newProjId = Number(v);
                      const newProj = availableProjects.find((p) => p.id === newProjId);
                      const validDevIds = new Set(getProjectAssignees(newProj).map((d) => d.id));
                      setEditForm((f) => ({
                        ...f,
                        projectId: newProjId,
                        assigneeIds: f.assigneeIds.filter((id) => validDevIds.has(id)),
                      }));
                    }}
                    options={availableProjects.map((p) => ({ value: String(p.id), label: p.name }))}
                  />
                ) : (
                  <div className="px-3 py-2 rounded-lg text-sm bg-slate-100 text-slate-700 border border-slate-200">
                    {availableProjects.find((p) => p.id === editForm.projectId)?.name || editingTask.projectName}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Priority</label>
                <Select value={editForm.priority} onChange={(v) => setEditForm((f) => ({ ...f, priority: v }))} options={PRIORITIES.map((p) => ({ value: p, label: p }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Status</label>
                {isAdmin && editSelectedProject?.status !== "Cancelled" ? (
                  <Select value={editForm.status} onChange={(v) => setEditForm((f) => ({ ...f, status: v }))} options={STATUSES.map((s) => ({ value: s, label: s }))} />
                ) : (
                  <div className="px-3 py-2 rounded-lg text-sm bg-slate-100 text-slate-700 border border-slate-200">
                    {editForm.status} {editSelectedProject?.status === "Cancelled" && "(Locked - Project Cancelled)"}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Due Date</label>
                <Input type="date" value={editForm.dueDate} onChange={(v) => setEditForm((f) => ({ ...f, dueDate: v }))} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
                Assign Developers & Admins (Project Members Only)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50 max-h-40 overflow-y-auto">
                {editProjectDevelopers.length === 0 ? (
                  <div className="col-span-full py-4 text-center text-xs text-amber-700 font-medium">
                    No developers or admins are assigned to this project. Please assign developers to the project first.
                  </div>
                ) : (
                  editProjectDevelopers.map((dev) => {
                    const isSelected = editForm.assigneeIds.includes(dev.id);
                    return (
                      <label
                        key={dev.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border text-xs transition-colors ${
                          isSelected
                            ? "bg-blue-50 border-blue-400 text-blue-900 font-semibold"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditForm((f) => ({ ...f, assigneeIds: [...f.assigneeIds, dev.id] }));
                            } else {
                              setEditForm((f) => ({ ...f, assigneeIds: f.assigneeIds.filter((id) => id !== dev.id) }));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ background: "#1a3896" }}>
                          {dev.avatar}
                        </span>
                        <span className="truncate">
                          {dev.fullName} {dev.role === "Admin" && <span className="text-[10px] text-blue-600 font-semibold">(Admin)</span>}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
              {editForm.assigneeIds.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Please select at least one developer or admin for this task.</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <div>
                {isAdmin && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const id = editingTask.id;
                      setEditingTask(null);
                      deleteTask(id);
                    }}
                    style={{ background: "#dc2626", borderColor: "#dc2626", color: "white" }}
                  >
                    Delete Task
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setEditingTask(null)}>Cancel</Button>
                <Button onClick={handleSaveEdit} disabled={!editForm.title || editForm.assigneeIds.length === 0}>Save Changes</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Submit Delay Reason Modal */}
      {showReasonTask && (
        <Modal title="Submit Missed Deadline Reason" onClose={() => setShowReasonTask(null)}>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500">Task:</span>{" "}
              <strong className="text-slate-800">{showReasonTask.title}</strong>
              <div className="text-slate-500 mt-0.5">
                Due date: {safeFormatDate(showReasonTask.dueDate)}
              </div>
            </div>
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
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>
                Reason Description
              </label>
              <textarea
                rows={3}
                value={reasonForm.reason}
                onChange={(e) => setReasonForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Describe what caused the task delay…"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  border: "1px solid var(--color-border)",
                  fontFamily: "var(--font-body)",
                  resize: "vertical",
                }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowReasonTask(null)}>
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
