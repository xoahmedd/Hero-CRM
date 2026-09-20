import { CalendarDays, Pencil, Plus, Save, X } from "lucide-react";
import { useEffect, useState } from "react";

import { createSubTask } from "../services/subTaskService";
import { updateTask } from "../services/taskService";
import { getProjects } from "../services/projectService";
import type { Project } from "../types/project";
import type { SubTask } from "../types/subTask";
import type { Task } from "../types/task";

export default function AdvancedTaskControls({
  task,
  onTaskUpdated,
  onSubTaskCreated,
}: {
  task: Task;
  onTaskUpdated: (task: Task) => void;
  onSubTaskCreated: (subTask: SubTask) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate?.slice(0, 10) || "");
  const [projectId, setProjectId] = useState<number | "">(task.projectId ?? "");
  const [projects, setProjects] = useState<Project[]>([]);

  const [subTaskTitle, setSubTaskTitle] = useState("");
  const [subTaskDueDate, setSubTaskDueDate] = useState("");
  const [addingSubTask, setAddingSubTask] = useState(false);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate?.slice(0, 10) || "");
    setProjectId(task.projectId ?? "");
  }, [task]);

  useEffect(() => {
    void getProjects()
      .then(setProjects)
      .catch(() => setProjects([]));
  }, []);

  async function handleSave() {
    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        projectId: projectId === "" ? null : projectId,
        createdById: task.createdById,
        dueDate: dueDate || null,
      });

      onTaskUpdated({
        ...task,
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        dueDate: dueDate || null,
        projectId: projectId === "" ? null : projectId,
        projectName: projectId === ""
          ? null
          : projects.find((project) => project.id === projectId)?.name ?? task.projectName,
        updatedAt: new Date().toISOString(),
      });
      setEditing(false);
    } catch (saveError: any) {
      setError(saveError?.response?.data?.message || "Unable to update task.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateSubTask() {
    const value = subTaskTitle.trim();
    if (!value) return;

    try {
      setAddingSubTask(true);
      setError("");
      const created = await createSubTask({
        taskItemId: task.id,
        title: value,
        dueDate: subTaskDueDate || null,
      });
      onSubTaskCreated(created);
      setSubTaskTitle("");
      setSubTaskDueDate("");
    } catch (createError: any) {
      setError(createError?.response?.data?.message || "Unable to create subtask.");
    } finally {
      setAddingSubTask(false);
    }
  }

  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Task controls</h2>
          <p className="mt-1 text-xs text-slate-500">
            Edit the task or add a subtask without leaving this page.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditing((value) => !value)}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
        >
          {editing ? <X size={16} /> : <Pencil size={16} />}
          {editing ? "Close edit" : "Edit task"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {editing && (
        <div className="mt-4 grid gap-4 rounded-xl border border-blue-100 bg-white p-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Title
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                <option value="Todo">Todo</option>
                <option value="InProgress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Finished">Finished</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</label>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Project</label>
              <select
                value={projectId}
                onChange={(event) =>
                  setProjectId(event.target.value ? Number(event.target.value) : "")
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                <option value="">Standalone / no project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Plus size={16} className="text-blue-600" />
          Quick add subtask
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
          <input
            value={subTaskTitle}
            onChange={(event) => setSubTaskTitle(event.target.value)}
            placeholder="Subtask title"
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <div className="relative">
            <CalendarDays size={15} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
            <input
              type="date"
              value={subTaskDueDate}
              onChange={(event) => setSubTaskDueDate(event.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleCreateSubTask()}
            disabled={addingSubTask || !subTaskTitle.trim()}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {addingSubTask ? "Adding..." : "Add subtask"}
          </button>
        </div>
      </div>
    </section>
  );
}
