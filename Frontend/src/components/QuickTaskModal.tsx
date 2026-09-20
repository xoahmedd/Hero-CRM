import { CalendarDays, FolderKanban, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "../providers/AuthProvider";
import { createTask, notifyTasksChanged } from "../services/taskService";
import { getProjects } from "../services/projectService";
import type { Project } from "../types/project";

export const OPEN_QUICK_TASK_EVENT = "crm:open-quick-task";

export function openQuickTask() {
  window.dispatchEvent(new Event(OPEN_QUICK_TASK_EVENT));
}

export default function QuickTaskModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<number | "">("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener(OPEN_QUICK_TASK_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_QUICK_TASK_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    void getProjects().then(setProjects).catch(() => setProjects([]));
  }, [open]);

  function close() {
    if (saving) return;
    setOpen(false);
    setError("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !title.trim()) return;

    try {
      setSaving(true);
      setError("");
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        status: "Todo",
        priority,
        projectId: projectId === "" ? null : projectId,
        createdById: user.userId,
        dueDate: dueDate || null,
      });

      setTitle("");
      setDescription("");
      setProjectId("");
      setPriority("Medium");
      setDueDate("");
      setOpen(false);
      notifyTasksChanged();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Unable to create task.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold text-slate-950">
              <Plus size={20} className="text-blue-600" />
              Quick add task
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Create a task now. Linking it to an assigned project is optional.
            </p>
          </div>
          <button type="button" onClick={close} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <X size={19} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Task</label>
            <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} placeholder="What needs to be done?" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={2000} placeholder="Optional details..." className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500"><FolderKanban size={13} /> Project</span>
              <select value={projectId} onChange={(event) => setProjectId(event.target.value ? Number(event.target.value) : "")} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
                <option value="">Standalone</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</span>
              <select value={priority} onChange={(event) => setPriority(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500"><CalendarDays size={13} /> Due date</span>
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-4">
          <p className="text-xs text-slate-500">Users work on assigned projects and tasks; Admins manage team and task assignments.</p>
          <div className="flex gap-2">
            <button type="button" onClick={close} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving || !title.trim()} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Creating..." : "Create task"}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
