import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { getProject } from "../services/projectService";
import {
  createTask,
  deleteTask,
  getTasksByProject,
} from "../services/taskService";

import type { Project } from "../types/project";
import type { Task } from "../types/task";

import { useAuth } from "../providers/AuthProvider";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/FeedbackState";
import { canManageProtectedResources } from "../utils/permissions";
import ProjectWorkspaceTabs from "../components/ProjectWorkspaceTabs";

export default function ProjectTaskListPage() {
  const { id } = useParams();

  const projectId = Number(id);

  const navigate = useNavigate();

  const { user } = useAuth();

  const canDeleteTasks = canManageProtectedResources(user);

  const [project, setProject] =
    useState<Project | null>(null);

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [priorityFilter, setPriorityFilter] =
    useState("All");

  const [showCreate, setShowCreate] =
    useState(false);

  const [newTitle, setNewTitle] =
    useState("");

  const [newDescription, setNewDescription] =
    useState("");

  const [newPriority, setNewPriority] =
    useState("Medium");

  const [newStatus, setNewStatus] =
    useState("Todo");

  const [newDueDate, setNewDueDate] =
    useState("");

  const [creating, setCreating] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  useEffect(() => {
    if (!projectId) return;

    loadData();
  }, [projectId]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [projectData, taskData] =
        await Promise.all([
          getProject(projectId),
          getTasksByProject(projectId),
        ]);

      setProject(projectData);
      setTasks(taskData);
    } catch {
      setError(
        "Unable to load project tasks."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredTasks =
    useMemo(() => {
      const value = search
        .trim()
        .toLowerCase();

      return tasks.filter((task) => {
        const matchesSearch =
          !value ||
          [
            task.title,
            task.description,
            task.status,
            task.priority,
            task.createdByName,
          ]
            .filter(Boolean)
            .some((field) =>
              field!.toLowerCase().includes(value)
            );

        const matchesStatus =
          statusFilter === "All" ||
          task.status === statusFilter;

        const matchesPriority =
          priorityFilter === "All" ||
          task.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
      });
    }, [tasks, search, statusFilter, priorityFilter]);

  const getPriorityClass = (
    priority: string
  ) => {
    switch (
      priority.toLowerCase()
    ) {
      case "urgent":
        return "text-red-600";

      case "high":
        return "text-orange-600";

      case "low":
        return "text-slate-500";

      default:
        return "text-blue-600";
    }
  };

  const getStatusBadge = (
    status: string
  ) => {
    switch (
      status.toLowerCase()
    ) {
      case "finished":
        return "bg-green-50 text-green-700";

      case "inprogress":
      case "in progress":
        return "bg-blue-50 text-blue-700";

      case "pending":
        return "bg-amber-50 text-amber-700";

      case "cancelled":
        return "bg-red-50 text-red-700";

      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const handleCreateTask = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!newTitle.trim()) {
      return;
    }

    if (!user) {
      setError(
        "Current user could not be determined."
      );
      return;
    }

    try {
      setCreating(true);
      setError("");

      const task = await createTask({
        title: newTitle.trim(),
        description:
          newDescription.trim() ||
          undefined,
        status: newStatus,
        priority: newPriority,
        projectId,
        createdById: user.userId,
        dueDate:
          newDueDate || null,
      });

      setTasks((current) => [
        task,
        ...current,
      ]);

      setNewTitle("");
      setNewDescription("");
      setNewPriority("Medium");
      setNewStatus("Todo");
      setNewDueDate("");

      setShowCreate(false);
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Unable to create task."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (
    taskId: number
  ) => {
    if (!canDeleteTasks) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this task?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(taskId);

      await deleteTask(taskId);

      setTasks((current) =>
        current.filter(
          (task) =>
            task.id !== taskId
        )
      );
    } catch (error: any) {
      if (
        error?.response?.status === 403
      ) {
        alert(
          "You don't have permission to delete this task."
        );
      } else {
        alert(
          "Unable to delete task."
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <LoadingState label="Loading project tasks..." />;
  }

  if (error && !project) {
    return (
      <ErrorState
        title="Project tasks unavailable"
        description={error}
        onRetry={() => void loadData()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() =>
              navigate(
                `/projects/${projectId}`
              )
            }
            className="mb-3 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to Project
          </button>

          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {project?.name ?? "Project"}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage tasks in this project.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowCreate(
              (value) => !value
            )
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Task
        </button>
      </div>

      <ProjectWorkspaceTabs projectId={projectId} active="list" />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <Search
            size={18}
            className="text-slate-400"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search tasks..."
            className="ml-2 w-full bg-transparent text-sm outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700"
        >
          <option value="All">All statuses</option>
          <option value="Todo">Todo</option>
          <option value="InProgress">In Progress</option>
          <option value="Pending">Pending</option>
          <option value="Finished">Finished</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700"
        >
          <option value="All">All priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>

        <button
          type="button"
          onClick={() =>
            navigate(
              `/projects/${projectId}/board`
            )
          }
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Board View
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Create Task */}
      {showCreate && (
        <form
          onSubmit={handleCreateTask}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Task title
              </label>

              <input
                value={newTitle}
                onChange={(e) =>
                  setNewTitle(
                    e.target.value
                  )
                }
                placeholder="Create dashboard UI"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description
              </label>

              <textarea
                value={newDescription}
                onChange={(e) =>
                  setNewDescription(
                    e.target.value
                  )
                }
                rows={3}
                placeholder="Describe the task..."
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Status
                </label>

                <select
                  value={newStatus}
                  onChange={(e) =>
                    setNewStatus(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                >
                  <option value="Todo">
                    Todo
                  </option>

                  <option value="InProgress">
                    In Progress
                  </option>

                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Finished">
                    Finished
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Priority
                </label>

                <select
                  value={newPriority}
                  onChange={(e) =>
                    setNewPriority(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                >
                  <option value="Low">
                    Low
                  </option>

                  <option value="Medium">
                    Medium
                  </option>

                  <option value="High">
                    High
                  </option>

                  <option value="Urgent">
                    Urgent
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Due date
                </label>

                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) =>
                    setNewDueDate(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowCreate(false)
                }
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={creating}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {creating
                  ? "Creating..."
                  : "Create Task"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Task list */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Desktop header */}
        <div className="hidden border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid md:grid-cols-[minmax(0,2fr)_140px_140px_150px_50px] md:gap-4">
          <div>Task</div>
          <div>Status</div>
          <div>Priority</div>
          <div>Due / Assignee</div>
          <div />
        </div>

        {filteredTasks.length === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyState
              icon={CheckCircle2}
              title={search.trim() ? "No matching tasks" : "No tasks yet"}
              description={
                search.trim()
                  ? "Try a different search term."
                  : "Create a task to start working on this project."
              }
            />
          </div>
        ) : (
          <div>
            {filteredTasks.map(
              (task) => (
                <div
                  key={task.id}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <div className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,2fr)_140px_140px_150px_50px] md:items-center md:gap-4">
                    {/* Task */}
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/tasks/${task.id}`
                        )
                      }
                      className="flex min-w-0 items-start gap-3 text-left"
                    >
                      {task.status.toLowerCase() ===
                      "finished" ? (
                        <CheckCircle2
                          size={20}
                          className="mt-0.5 shrink-0 text-green-600"
                        />
                      ) : (
                        <Circle
                          size={20}
                          className="mt-0.5 shrink-0 text-slate-300"
                        />
                      )}

                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-900 hover:text-blue-600">
                          {task.title}
                        </div>

                        {task.description && (
                          <div className="mt-1 line-clamp-1 text-xs text-slate-400">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Status */}
                    <div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadge(
                          task.status
                        )}`}
                      >
                        {task.status}
                      </span>
                    </div>

                    {/* Priority */}
                    <div
                      className={`text-sm font-semibold ${getPriorityClass(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </div>

                    {/* Due / Assignee */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarDays
                          size={14}
                        />

                        {task.dueDate
                          ? new Date(
                              task.dueDate
                            ).toLocaleDateString()
                          : "No due date"}
                      </div>

                      <div className="flex items-center gap-1.5 truncate text-xs text-slate-500">
                        <User
                          size={14}
                        />

                        <span className="truncate">
                          {task.createdByName ||
                            "Unknown"}
                        </span>
                      </div>
                    </div>

                    {/* Delete is restricted by the backend to Admin. */}
                    {canDeleteTasks && (
                      <button
                        type="button"
                        onClick={() =>
                          void handleDelete(task.id)
                        }
                        disabled={deletingId === task.id}
                        className="justify-self-start rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 md:justify-self-end"
                        title="Delete task"
                        aria-label={`Delete ${task.title}`}
                      >
                        {deletingId === task.id ? (
                          <Clock3
                            size={17}
                            className="animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Trash2 size={17} aria-hidden="true" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}