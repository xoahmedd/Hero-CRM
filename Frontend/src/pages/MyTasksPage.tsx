import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Filter,
  FolderKanban,
  RefreshCw,
  Search,
  Plus,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { isAdmin } from "../utils/permissions";

import {
  getMyTasks,
  TASKS_CHANGED_EVENT,
  updateTaskProgress,
} from "../services/taskService";
import { openQuickTask } from "../components/QuickTaskModal";
import type { Task } from "../types/task";

const statuses = [
  "All",
  "Todo",
  "InProgress",
  "Pending",
  "Finished",
];

const priorities = [
  "All",
  "Low",
  "Medium",
  "High",
  "Urgent",
];

type DueFilter =
  | "All"
  | "Overdue"
  | "Today"
  | "Upcoming"
  | "NoDueDate";

type DueCategory = DueFilter | "PastCompleted";

function normalizeStatus(status: string) {
  return status.replace(/\s+/g, "").toLowerCase();
}

function statusClasses(status: string) {
  switch (normalizeStatus(status)) {
    case "finished":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
    case "inprogress":
      return "bg-blue-50 text-blue-700 ring-blue-600/10";
    case "pending":
      return "bg-amber-50 text-amber-700 ring-amber-600/10";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-600/10";
  }
}

function priorityClasses(priority: string) {
  switch (priority.toLowerCase()) {
    case "urgent":
      return "bg-red-50 text-red-700";
    case "high":
      return "bg-orange-50 text-orange-700";
    case "low":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-blue-50 text-blue-700";
  }
}

function startOfDay(value: Date) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate()
  );
}

function getDueCategory(task: Task): DueCategory {
  if (!task.dueDate) {
    return "NoDueDate";
  }

  const today = startOfDay(new Date());
  const due = startOfDay(new Date(task.dueDate));

  if (due.getTime() === today.getTime()) {
    return "Today";
  }

  if (due < today) {
    return normalizeStatus(task.status) === "finished"
      ? "PastCompleted"
      : "Overdue";
  }

  return "Upcoming";
}

function formatDueDate(value?: string | null) {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function MyTasksPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const admin = isAdmin(user);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [dueFilter, setDueFilter] =
    useState<DueFilter>("All");
  const [updatingId, setUpdatingId] =
    useState<number | null>(null);
  const [pendingTaskId, setPendingTaskId] =
    useState<number | null>(null);
  const [pendingNote, setPendingNote] = useState("");
  const [pendingSubmitting, setPendingSubmitting] = useState(false);

  useEffect(() => {
    void loadTasks();

    const handleTasksChanged = () => void loadTasks(true);
    window.addEventListener(TASKS_CHANGED_EVENT, handleTasksChanged);
    return () => window.removeEventListener(TASKS_CHANGED_EVENT, handleTasksChanged);
  }, []);

  async function loadTasks(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      const data = await getMyTasks();
      setTasks(data);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to load your assigned tasks."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const counts = useMemo(() => {
    return {
      total: tasks.length,
      inProgress: tasks.filter(
        (task) =>
          normalizeStatus(task.status) ===
          "inprogress"
      ).length,
      dueToday: tasks.filter(
        (task) => getDueCategory(task) === "Today"
      ).length,
      overdue: tasks.filter(
        (task) => getDueCategory(task) === "Overdue"
      ).length,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        [
          task.title,
          task.description,
          task.projectName,
          task.createdByName,
        ]
          .filter(Boolean)
          .some((value) =>
            value!.toLowerCase().includes(query)
          );

      const matchesStatus =
        status === "All" ||
        normalizeStatus(task.status) ===
          normalizeStatus(status);

      const matchesPriority =
        priority === "All" ||
        task.priority.toLowerCase() ===
          priority.toLowerCase();

      const matchesDue =
        dueFilter === "All" ||
        getDueCategory(task) === dueFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesDue
      );
    });
  }, [tasks, search, status, priority, dueFilter]);

  async function applyProgress(
    taskId: number,
    nextStatus: string,
    note?: string
  ) {
    try {
      setUpdatingId(taskId);
      setError("");

      await updateTaskProgress(taskId, {
        status: nextStatus,
        note: note?.trim() || undefined,
      });

      setTasks((current) =>
        current.map((task) =>
          task.id === taskId
            ? { ...task, status: nextStatus }
            : task
        )
      );
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to update task status."
      );
      throw requestError;
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleStatusChange(
    taskId: number,
    nextStatus: string
  ) {
    if (nextStatus === "Pending") {
      setPendingTaskId(taskId);
      setPendingNote("");
      return;
    }

    try {
      await applyProgress(taskId, nextStatus);
    } catch {
      // Error is already shown in the page alert.
    }
  }

  async function submitPendingStatus() {
    if (pendingTaskId == null || !pendingNote.trim()) {
      return;
    }

    try {
      setPendingSubmitting(true);
      await applyProgress(pendingTaskId, "Pending", pendingNote);
      setPendingTaskId(null);
      setPendingNote("");
    } catch {
      // Error is already shown in the page alert.
    } finally {
      setPendingSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-sm text-slate-500">
          Loading your tasks...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">
            {admin ? "All Tasks" : "My Tasks"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {admin ? "All workspace tasks and assignments." : "Your assigned project and standalone work."}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={openQuickTask}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={17} />
            Add task
          </button>
          <button
            type="button"
            onClick={() => void loadTasks(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Assigned to me"
          value={counts.total}
          icon={<CircleDot size={19} />}
        />
        <SummaryCard
          label="In progress"
          value={counts.inProgress}
          icon={<Clock3 size={19} />}
        />
        <SummaryCard
          label="Due today"
          value={counts.dueToday}
          icon={<CalendarDays size={19} />}
        />
        <SummaryCard
          label="Overdue"
          value={counts.overdue}
          icon={<AlertTriangle size={19} />}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Filter size={17} />
            Find and filter tasks
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_160px_170px]">
            <label className="relative block">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search task, project, creator..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item === "InProgress"
                    ? "In Progress"
                    : item === "All"
                      ? "All statuses"
                      : item}
                </option>
              ))}
            </select>

            <select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {priorities.map((item) => (
                <option key={item} value={item}>
                  {item === "All"
                    ? "All priorities"
                    : item}
                </option>
              ))}
            </select>

            <select
              value={dueFilter}
              onChange={(event) =>
                setDueFilter(
                  event.target.value as DueFilter
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">All due dates</option>
              <option value="Overdue">Overdue</option>
              <option value="Today">Due today</option>
              <option value="Upcoming">Upcoming</option>
              <option value="NoDueDate">No due date</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
          <p className="text-sm text-slate-500">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </p>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <CheckCircle2
              size={36}
              className="mx-auto text-slate-300"
            />
            <h2 className="mt-4 font-semibold text-slate-900">
              No tasks found
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              {tasks.length === 0
                ? "You do not have any tasks yet. Use Add task to create your first standalone or project task."
                : "No assigned tasks match the current search and filters."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTasks.map((task) => {
              const dueCategory = getDueCategory(task);

              return (
                <div
                  key={task.id}
                  className="grid gap-4 px-4 py-4 transition hover:bg-slate-50 sm:px-5 lg:grid-cols-[minmax(0,1fr)_160px_130px_150px_28px] lg:items-center"
                >
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/tasks/${task.id}`)
                    }
                    className="min-w-0 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400">
                        {normalizeStatus(task.status) ===
                        "finished" ? (
                          <CheckCircle2
                            size={17}
                            className="text-emerald-600"
                          />
                        ) : (
                          <CircleDot size={15} />
                        )}
                      </span>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-slate-900">
                          {task.title}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <FolderKanban size={13} />
                            {task.projectName || "Standalone task"}
                          </span>
                          <span>
                            Created by {task.createdByName || "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>

                  <div>
                    <select
                      value={task.status}
                      disabled={updatingId === task.id}
                      onChange={(event) =>
                        void handleStatusChange(
                          task.id,
                          event.target.value
                        )
                      }
                      className={`w-full rounded-lg border-0 px-2.5 py-2 text-xs font-semibold ring-1 ring-inset outline-none ${statusClasses(
                        task.status
                      )}`}
                    >
                      <option value="Todo">To Do</option>
                      <option value="InProgress">
                        In Progress
                      </option>
                      <option value="Pending">Pending</option>
                      <option value="Finished">Finished</option>
                    </select>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClasses(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <div
                    className={`inline-flex items-center gap-1.5 text-sm ${
                      dueCategory === "Overdue"
                        ? "font-medium text-red-600"
                        : dueCategory === "Today"
                          ? "font-medium text-amber-700"
                          : "text-slate-500"
                    }`}
                  >
                    <CalendarDays size={15} />
                    {formatDueDate(task.dueDate)}
                  </div>

                  <button
                    type="button"
                    aria-label={`Open ${task.title}`}
                    onClick={() =>
                      navigate(`/tasks/${task.id}`)
                    }
                    className="hidden rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:block"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {pendingTaskId != null && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pending-reason-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <h2
              id="pending-reason-title"
              className="text-lg font-bold text-slate-950"
            >
              Why is this task pending?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add the blocker, dependency, delay, or reason. This note is saved in the task conversation so your manager can review it and reply.
            </p>

            <textarea
              value={pendingNote}
              onChange={(event) => setPendingNote(event.target.value)}
              rows={4}
              maxLength={2000}
              autoFocus
              placeholder="Example: Waiting for artwork approval from the packaging team."
              className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPendingTaskId(null);
                  setPendingNote("");
                }}
                disabled={pendingSubmitting}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitPendingStatus()}
                disabled={pendingSubmitting || !pendingNote.trim()}
                className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pendingSubmitting ? "Saving..." : "Set Pending & Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <span className="text-slate-400">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}
