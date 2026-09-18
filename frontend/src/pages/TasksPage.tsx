import { useState, useEffect } from "react";
import type { Task, User } from "../data/mock";
import { MOCK_TASKS, MOCK_PROJECTS } from "../data/mock";
import { tasksApi, projectsApi } from "../api/services";
import { Badge, Button, Card, EmptyState, Input, Modal, Select } from "../components/ui";

const STATUSES = ["Assigned", "Review", "Completed", "Cancelled"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const statusColors: Record<string, string> = {
  Assigned: "#dbeafe",
  Review: "#fef3c7",
  Completed: "#dcfce7",
  Cancelled: "#fee2e2",
};

interface Props {
  currentUser: User;
}

export default function TasksPage({ currentUser }: Props) {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [projectsList, setProjectsList] = useState(MOCK_PROJECTS);
  const [activeTab, setActiveTab] = useState<"mine" | "all">(currentUser.role === "Admin" ? "all" : "mine");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", description: "", status: "Assigned", priority: "Medium", projectId: 1, dueDate: "" });

  useEffect(() => {
    tasksApi.getTasks()
      .then((data) => { if (Array.isArray(data)) setTasks(data); })
      .catch((err) => { console.warn("Using fallback tasks:", err); });
    projectsApi.getProjects()
      .then((data) => { if (Array.isArray(data)) setProjectsList(data); })
      .catch((err) => { console.warn("Using fallback projects:", err); });
  }, []);

  const isAdmin = currentUser.role === "Admin";
  const myTasks = tasks.filter((t) => t.assignees.some((a) => a.id === currentUser.id));
  const source = isAdmin ? (activeTab === "mine" ? myTasks : tasks) : myTasks;
  const filtered = source.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || (t.projectName || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    const matchPriority = priorityFilter === "All" || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const availableProjects = isAdmin
    ? projectsList
    : projectsList.filter(
        (p) =>
          p.ownerId === currentUser.id ||
          tasks.some((t) => t.projectId === p.id && t.assignees.some((a) => a.id === currentUser.id))
      );

  const byStatus = STATUSES.reduce<Record<string, Task[]>>((acc, s) => {
    acc[s] = filtered.filter((t) => t.status === s);
    return acc;
  }, {});

  async function updateStatus(taskId: number, status: string) {
    try {
      await tasksApi.updateTaskStatus(taskId, status);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: status as Task["status"] } : t)));
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

  async function handleCreate() {
    try {
      await tasksApi.createTask({
        title: createForm.title,
        description: createForm.description,
        projectId: createForm.projectId,
        createdById: currentUser.id,
        assigneeIds: [currentUser.id],
        dueDate: createForm.dueDate,
        priority: createForm.priority,
      });
      const updated = await tasksApi.getTasks();
      setTasks(updated);
    } catch {
      const project = projectsList.find((p) => p.id === createForm.projectId);
      const newTask: Task = {
        id: tasks.length + 100,
        title: createForm.title,
        description: createForm.description,
        status: createForm.status as Task["status"],
        priority: createForm.priority as Task["priority"],
        projectId: createForm.projectId,
        projectName: project?.name ?? "",
        assignees: [{ id: currentUser.id, name: currentUser.fullName, avatar: currentUser.avatar }],
        createdById: currentUser.id,
        dueDate: createForm.dueDate || new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
    }
    setShowCreate(false);
    setCreateForm({ title: "", description: "", status: "Assigned", priority: "Medium", projectId: availableProjects[0]?.id || 1, dueDate: "" });
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
        <Select value={statusFilter} onChange={setStatusFilter} options={[{ value: "All", label: "All Statuses" }, ...STATUSES.map((s) => ({ value: s, label: s }))]} />
        <Select value={priorityFilter} onChange={setPriorityFilter} options={[{ value: "All", label: "All Priorities" }, ...PRIORITIES.map((p) => ({ value: p, label: p }))]} />
      </div>

      {/* Kanban */}
      {filtered.length === 0 ? (
        <EmptyState message="No tasks match your filters." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STATUSES.map((status) => (
            <div key={status} className="rounded-xl p-3" style={{ background: statusColors[status], minHeight: 240 }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wide" style={{ fontFamily: "var(--font-display)", color: "#475569" }}>{status}</span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(0,0,0,0.07)", fontFamily: "var(--font-mono)", color: "#475569" }}>
                  {byStatus[status]?.length ?? 0}
                </span>
              </div>
              <div className="space-y-2">
                {(byStatus[status] ?? []).map((task) => (
                  <div key={task.id} className="p-3 rounded-lg bg-white shadow-sm">
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <div className="text-sm font-medium" style={{ fontFamily: "var(--font-display)", color: "var(--color-foreground)" }}>{task.title}</div>
                      {isAdmin && (
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-0.5 text-xs"
                          title="Delete task"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="text-xs mb-2" style={{ color: "var(--color-muted-foreground)" }}>{task.projectName}</div>
                    <div className="flex items-center justify-between">
                      <Badge label={task.priority} type="priority" />
                      <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}>
                        {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>

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
                ))}
              </div>
            </div>
          ))}
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
                <Select value={String(createForm.projectId)} onChange={(v) => setCreateForm((f) => ({ ...f, projectId: Number(v) }))} options={availableProjects.map((p) => ({ value: String(p.id), label: p.name }))} />
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
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!createForm.title}>Create Task</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
