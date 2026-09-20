import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  FolderKanban,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { getMyTasks } from "../services/taskService";
import type { Task } from "../types/task";

const weekDays = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

const statusOptions = [
  "All",
  "Todo",
  "InProgress",
  "Pending",
  "Finished",
];

const priorityOptions = [
  "All",
  "Low",
  "Medium",
  "High",
  "Urgent",
];

function normalizeStatus(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dueDateKey(value: string) {
  return value.slice(0, 10);
}

function getCalendarDays(month: Date) {
  const firstOfMonth = new Date(
    month.getFullYear(),
    month.getMonth(),
    1
  );

  const firstVisible = new Date(
    month.getFullYear(),
    month.getMonth(),
    1 - firstOfMonth.getDay()
  );

  return Array.from({ length: 42 }, (_, index) =>
    new Date(
      firstVisible.getFullYear(),
      firstVisible.getMonth(),
      firstVisible.getDate() + index
    )
  );
}

function taskBadgeClasses(status: string) {
  switch (normalizeStatus(status)) {
    case "finished":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
    case "inprogress":
      return "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100";
  }
}

function priorityDotClasses(priority: string) {
  switch (priority.toLowerCase()) {
    case "urgent":
      return "bg-red-500";
    case "high":
      return "bg-orange-500";
    case "low":
      return "bg-slate-400";
    default:
      return "bg-blue-500";
  }
}

function priorityPillClasses(priority: string) {
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

function formatStatus(status: string) {
  return normalizeStatus(status) === "inprogress"
    ? "In Progress"
    : status;
}


export default function CalendarPage() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState("All");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();

    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    void loadCalendar();
  }, []);

  async function loadCalendar(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      const data = await getMyTasks();
      setTasks(data);
    } catch {
      setError("Unable to load your calendar.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const projects = useMemo(() => {
    const uniqueProjects = new Map<
      number,
      string
    >();

    for (const task of tasks) {
      if (task.projectId != null) {
        uniqueProjects.set(
          task.projectId,
          task.projectName || `Project ${task.projectId}`
        );
      }
    }

    return Array.from(uniqueProjects.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        (task.projectName ?? "")
          .toLowerCase()
          .includes(query) ||
        (task.createdByName ?? "")
          .toLowerCase()
          .includes(query);

      const matchesProject =
        projectId === "All" ||
        (projectId === "Standalone"
          ? task.projectId == null
          : task.projectId === Number(projectId));

      const matchesStatus =
        status === "All" ||
        normalizeStatus(task.status) ===
          normalizeStatus(status);

      const matchesPriority =
        priority === "All" ||
        task.priority.toLowerCase() ===
          priority.toLowerCase();

      return (
        matchesSearch &&
        matchesProject &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [tasks, search, projectId, status, priority]);

  const scheduledTasks = useMemo(
    () => filteredTasks.filter((task) => task.dueDate),
    [filteredTasks]
  );

  const tasksWithoutDueDate = useMemo(
    () => filteredTasks.filter((task) => !task.dueDate),
    [filteredTasks]
  );

  const calendarDays = useMemo(
    () => getCalendarDays(visibleMonth),
    [visibleMonth]
  );

  const tasksByDate = useMemo(() => {
    return scheduledTasks.reduce(
      (result, task) => {
        const key = dueDateKey(task.dueDate!);

        if (!result[key]) {
          result[key] = [];
        }

        result[key].push(task);
        return result;
      },
      {} as Record<string, Task[]>
    );
  }, [scheduledTasks]);

  const today = new Date();
  const todayKey = dateKey(today);
  const monthPrefix = `${visibleMonth.getFullYear()}-${String(
    visibleMonth.getMonth() + 1
  ).padStart(2, "0")}`;

  const tasksThisMonth = scheduledTasks.filter((task) =>
    task.dueDate!.startsWith(monthPrefix)
  );

  const overdueCount = scheduledTasks.filter((task) => {
    if (normalizeStatus(task.status) === "finished") {
      return false;
    }

    return dueDateKey(task.dueDate!) < todayKey;
  }).length;

  const dueTodayCount = scheduledTasks.filter(
    (task) => dueDateKey(task.dueDate!) === todayKey
  ).length;

  const monthTitle = visibleMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  function moveMonth(offset: number) {
    setVisibleMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + offset,
          1
        )
    );
  }

  function goToToday() {
    const now = new Date();
    setVisibleMonth(
      new Date(now.getFullYear(), now.getMonth(), 1)
    );
  }

  function clearFilters() {
    setSearch("");
    setProjectId("All");
    setStatus("All");
    setPriority("All");
  }

  const hasFilters =
    search.trim() !== "" ||
    projectId !== "All" ||
    status !== "All" ||
    priority !== "All";

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
        Loading calendar...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-950">
              Calendar
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Your assigned project and standalone tasks, organized by due date.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadCalendar(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={refreshing ? "animate-spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Scheduled"
          value={scheduledTasks.length}
          icon={<CalendarDays size={19} />}
        />
        <SummaryCard
          label={`Due in ${visibleMonth.toLocaleDateString(undefined, {
            month: "short",
          })}`}
          value={tasksThisMonth.length}
          icon={<Clock3 size={19} />}
        />
        <SummaryCard
          label="Due Today"
          value={dueTodayCount}
          icon={<CheckCircle2 size={19} />}
        />
        <SummaryCard
          label="Overdue"
          value={overdueCount}
          icon={<AlertTriangle size={19} />}
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Filter size={17} />
            Find and filter calendar tasks
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(260px,1fr)_210px_180px_160px_auto]">
            <label className="relative block">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search task, project, creator..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">All tasks</option>
              <option value="Standalone">Standalone tasks</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {item === "All"
                    ? "All statuses"
                    : formatStatus(item)}
                </option>
              ))}
            </select>

            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {priorityOptions.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All priorities" : item}
                </option>
              ))}
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              {monthTitle}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {tasksThisMonth.length} assigned task{tasksThisMonth.length === 1 ? "" : "s"} due this month
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={goToToday}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Today
            </button>

            <button
              type="button"
              aria-label="Previous month"
              onClick={() => moveMonth(-1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              aria-label="Next month"
              onClick={() => moveMonth(1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day) => {
                const key = dateKey(day);
                const dayTasks = tasksByDate[key] ?? [];
                const inVisibleMonth =
                  day.getMonth() === visibleMonth.getMonth();
                const isToday = key === todayKey;
                const visibleTasks = dayTasks.slice(0, 3);
                const hiddenCount = dayTasks.length - visibleTasks.length;

                return (
                  <div
                    key={key}
                    className={[
                      "min-h-36 border-b border-r border-slate-200 p-2.5",
                      inVisibleMonth ? "bg-white" : "bg-slate-50/60",
                    ].join(" ")}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={[
                          "flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                          isToday
                            ? "bg-blue-600 text-white"
                            : inVisibleMonth
                              ? "text-slate-700"
                              : "text-slate-400",
                        ].join(" ")}
                      >
                        {day.getDate()}
                      </span>

                      {dayTasks.length > 0 && (
                        <span className="text-[11px] font-medium text-slate-400">
                          {dayTasks.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {visibleTasks.map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          title={`${task.title} · ${task.projectName ?? "Standalone task"}`}
                          onClick={() => navigate(`/tasks/${task.id}`)}
                          className={[
                            "block w-full rounded-lg border px-2 py-1.5 text-left transition",
                            taskBadgeClasses(task.status),
                          ].join(" ")}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className={[
                                "h-1.5 w-1.5 shrink-0 rounded-full",
                                priorityDotClasses(task.priority),
                              ].join(" ")}
                            />
                            <span className="truncate text-xs font-semibold">
                              {task.title}
                            </span>
                          </div>
                          <div className="mt-0.5 truncate pl-3 text-[10px] opacity-70">
                            {task.projectName ?? "Standalone task"}
                          </div>
                        </button>
                      ))}

                      {hiddenCount > 0 && (
                        <div className="px-1 text-[11px] font-medium text-slate-500">
                          +{hiddenCount} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-semibold text-slate-950">
              Tasks without a due date
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Assigned tasks that cannot appear on the calendar until a due date is set.
            </p>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {tasksWithoutDueDate.length}
          </span>
        </div>

        {tasksWithoutDueDate.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            {filteredTasks.length === 0
              ? "No tasks match the current filters."
              : "Every matching assigned task has a due date."}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tasksWithoutDueDate.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => navigate(`/tasks/${task.id}`)}
                className="flex w-full flex-col gap-3 px-4 py-4 text-left transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {task.title}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <FolderKanban size={13} />
                      {task.projectName ?? "Standalone task"}
                    </span>
                    <span>{formatStatus(task.status)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      priorityPillClasses(task.priority),
                    ].join(" ")}
                  >
                    {task.priority}
                  </span>
                  <span className="text-xs text-slate-400">
                    No due date
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {scheduledTasks.length === 0 && tasksWithoutDueDate.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <CalendarDays className="mx-auto text-slate-300" size={34} />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">
            No assigned tasks to show
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {hasFilters
              ? "Try clearing the calendar filters."
              : "Tasks assigned to you will appear here when they are available."}
          </p>
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
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
        <span className="text-slate-400">{icon}</span>
      </div>
      <div className="mt-4 text-2xl font-bold text-slate-950">
        {value}
      </div>
    </div>
  );
}
