import { useState, useEffect } from "react";
import type { Task, User } from "../data/mock";
import { MOCK_TASKS, MOCK_PROJECTS } from "../data/mock";
import { tasksApi, projectsApi } from "../api/services";
import { Badge, Button, Card, EmptyState, Input, Modal, Select } from "../components/ui";

const STATUSES = ["Todo", "InProgress", "Review", "Completed", "Cancelled"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const statusColors: Record<string, string> = {
  Todo: "#f1f5f9",
  InProgress: "#dbeafe",
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
  const [activeTab, setActiveTab] = useState<"mine" | "all">("mine");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", description: "", status: "Todo", priority: "Medium", projectId: 1, dueDate: "" });

  useEffect(() => {
    tasksApi.getTasks()
      .then((data) => { if (data && data.length > 0) setTasks(data); })
      .catch(() => {});
    projectsApi.getProjects()
      .then((data) => { if (data && data.length > 0) setProjectsList(data); })
      .catch(() => {});
  }, []);

  const myTasks = tasks.filter((t) => t.assignees.some((a) => a.id === currentUser.id));
  const source = activeTab === "mine" ? myTasks : tasks;
  const filtered = source.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || (t.projectName || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    const matchPriority = priorityFilter === "All" || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const byStatus = STATUSES.reduce<Record<string, Task[]>>((acc, s) => {
    acc[s] = filtered.filter((t) => t.status === s);
    return acc;
  }, {});

  async function updateStatus(taskId: number, status: string) {
    try {
      await tasksApi.updateTask(taskId, { status });
    } catch {}
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: status as Task["status"] } : t)));
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
    setCreateForm({ title: "", description: "", status: "Todo", priority: "Medium", projectId: 1, dueDate: "" });
  }


  return (
    <div className="space-y-5">
      {/* Tabs + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {(["mine", "all"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ background: activeTab === tab ? "#1a3896" : "#f1f5f9", color: activeTab === tab ? "white" : "#475569", fontFamily: "var(--font-display)" }}>
              {tab === "mine" ? `My Tasks (${myTasks.length})` : `All Tasks (${tasks.length})`}
            </button>
          ))}
        </div>
        <Button onClick={() => setShowCreate(true)}>+ New Task</Button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
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
                    <div className="text-sm font-medium mb-1.5" style={{ fontFamily: "var(--font-display)", color: "var(--color-foreground)" }}>{task.title}</div>
                    <div className="text-xs mb-2" style={{ color: "var(--color-muted-foreground)" }}>{task.projectName}</div>
                    <div className="flex items-center justify-between">
                      <Badge label={task.priority} type="priority" />
                      <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}>
                        {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    {task.status !== "Completed" && task.status !== "Cancelled" && (
                      <div className="mt-2">
                        <Select
                          value={task.status}
                          onChange={(v) => updateStatus(task.id, v)}
                          options={STATUSES.map((s) => ({ value: s, label: s }))}
                        />
                      </div>
                    )}
                    <div className="flex mt-2 gap-0.5">
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
      {showCreate && (
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
                <Select value={String(createForm.projectId)} onChange={(v) => setCreateForm((f) => ({ ...f, projectId: Number(v) }))} options={MOCK_PROJECTS.filter((p) => p.status !== "Submitted").map((p) => ({ value: String(p.id), label: p.name }))} />
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
