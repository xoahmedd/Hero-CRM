import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  Plus,
  SquareKanban,
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

import {
  getProject,
} from "../services/projectService";

import {
  getTasksByProject,
} from "../services/taskService";

import type {
  Project,
} from "../types/project";

import type {
  Task,
} from "../types/task";

import ProjectWorkspaceTabs from "../components/ProjectWorkspaceTabs";

const weekDays = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDueDateKey(
  dueDate: string
) {
  return dueDate.slice(0, 10);
}

function getCalendarDays(
  month: Date
) {
  const firstDay = new Date(
    month.getFullYear(),
    month.getMonth(),
    1
  );

  const firstVisibleDay = new Date(
    month.getFullYear(),
    month.getMonth(),
    1 - firstDay.getDay()
  );

  return Array.from(
    { length: 42 },
    (_, index) =>
      new Date(
        firstVisibleDay.getFullYear(),
        firstVisibleDay.getMonth(),
        firstVisibleDay.getDate() + index
      )
  );
}

function getStatusClass(
  status: string
) {
  switch (
    status.toLowerCase()
  ) {
    case "finished":
      return "border-green-200 bg-green-50 text-green-700 hover:bg-green-100";

    case "inprogress":
    case "in progress":
      return "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100";

    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100";

    case "cancelled":
      return "border-red-200 bg-red-50 text-red-700 hover:bg-red-100";

    default:
      return "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100";
  }
}

function getPriorityClass(
  priority: string
) {
  switch (
    priority.toLowerCase()
  ) {
    case "urgent":
      return "text-red-600";

    case "high":
      return "text-orange-600";

    case "low":
      return "text-slate-400";

    default:
      return "text-blue-600";
  }
}

export default function ProjectCalendarPage() {
  const { id } = useParams();

  const projectId = Number(id);

  const hasValidProjectId =
    Number.isFinite(projectId) &&
    projectId > 0;

  const navigate = useNavigate();

  const [project, setProject] =
    useState<Project | null>(null);

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [visibleMonth, setVisibleMonth] =
    useState(() => {
      const now = new Date();

      return new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );
    });

  useEffect(() => {
    if (!hasValidProjectId) {
      return;
    }

    const loadCalendar = async () => {
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
          "Unable to load project calendar."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCalendar();
  }, [hasValidProjectId, projectId]);

  const calendarDays = useMemo(
    () =>
      getCalendarDays(
        visibleMonth
      ),
    [visibleMonth]
  );

  const tasksByDate = useMemo(() => {
    return tasks.reduce(
      (result, task) => {
        if (!task.dueDate) {
          return result;
        }

        const key = getDueDateKey(
          task.dueDate
        );

        if (!result[key]) {
          result[key] = [];
        }

        result[key].push(task);

        return result;
      },
      {} as Record<string, Task[]>
    );
  }, [tasks]);

  const tasksWithoutDueDate =
    useMemo(
      () =>
        tasks.filter(
          (task) => !task.dueDate
        ),
      [tasks]
    );

  const monthPrefix = `${visibleMonth.getFullYear()}-${String(
    visibleMonth.getMonth() + 1
  ).padStart(2, "0")}`;

  const tasksThisMonth = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.dueDate?.startsWith(
            monthPrefix
          )
      ),
    [tasks, monthPrefix]
  );

  const todayKey = getDateKey(
    new Date()
  );

  const monthTitle =
    visibleMonth.toLocaleDateString(
      undefined,
      {
        month: "long",
        year: "numeric",
      }
    );

  function moveMonth(
    offset: number
  ) {
    setVisibleMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() +
            offset,
          1
        )
    );
  }

  function goToToday() {
    const now = new Date();

    setVisibleMonth(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      )
    );
  }

  if (!hasValidProjectId) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() =>
            navigate("/projects")
          }
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Back to Projects
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Invalid project ID.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        Loading project calendar...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() =>
            navigate("/projects")
          }
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Back to Projects
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error ||
            "Project not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() =>
            navigate(
              `/projects/${projectId}`
            )
          }
          className="w-fit text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Back to Project
        </button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays
                size={24}
                className="text-blue-600"
              />

              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {project.name}
              </h1>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              View project tasks by their due date.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/projects/${projectId}/list`
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <List size={17} />
              List
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/projects/${projectId}/board`
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <SquareKanban size={17} />
              Board
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <CalendarDays size={17} />
              Calendar
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/projects/${projectId}/list`
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Plus size={17} />
              Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Total Tasks
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {tasks.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Due This Month
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {tasksThisMonth.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            No Due Date
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {tasksWithoutDueDate.length}
          </p>
        </div>
      </div>

      <ProjectWorkspaceTabs projectId={projectId} active="calendar" />

      {/* Calendar */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {monthTitle}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Click a task to open its details.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                moveMonth(-1)
              }
              aria-label="Previous month"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              onClick={goToToday}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() =>
                moveMonth(1)
              }
              aria-label="Next month"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {weekDays.map(
                (day) => (
                  <div
                    key={day}
                    className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {day}
                  </div>
                )
              )}
            </div>

            <div className="grid grid-cols-7 gap-px bg-slate-200">
              {calendarDays.map(
                (day) => {
                  const key =
                    getDateKey(day);

                  const dayTasks =
                    tasksByDate[key] ??
                    [];

                  const isCurrentMonth =
                    day.getMonth() ===
                      visibleMonth.getMonth() &&
                    day.getFullYear() ===
                      visibleMonth.getFullYear();

                  const isToday =
                    key === todayKey;

                  return (
                    <div
                      key={key}
                      className={`min-h-36 bg-white p-2.5 ${
                        isCurrentMonth
                          ? ""
                          : "bg-slate-50/70"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                            isToday
                              ? "bg-blue-600 text-white"
                              : isCurrentMonth
                              ? "text-slate-700"
                              : "text-slate-400"
                          }`}
                        >
                          {day.getDate()}
                        </span>

                        {dayTasks.length >
                          0 && (
                          <span className="text-[11px] font-medium text-slate-400">
                            {dayTasks.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        {dayTasks
                          .slice(0, 4)
                          .map(
                            (task) => (
                              <button
                                key={task.id}
                                type="button"
                                title={task.title}
                                onClick={() =>
                                  navigate(
                                    `/tasks/${task.id}`
                                  )
                                }
                                className={`block w-full truncate rounded-lg border px-2 py-1.5 text-left text-xs font-semibold transition ${getStatusClass(
                                  task.status
                                )}`}
                              >
                                {task.title}
                              </button>
                            )
                          )}

                        {dayTasks.length >
                          4 && (
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/projects/${projectId}/list`
                              )
                            }
                            className="px-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            +
                            {dayTasks.length -
                              4}{" "}
                            more
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tasks without due dates */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Tasks without due dates
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              These tasks cannot appear on the calendar until a due date is assigned.
            </p>
          </div>

          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {tasksWithoutDueDate.length}
          </span>
        </div>

        {tasksWithoutDueDate.length ===
        0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Every task in this project has a due date.
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {tasksWithoutDueDate.map(
              (task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/tasks/${task.id}`
                    )
                  }
                  className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 truncate text-sm font-semibold text-slate-900">
                      {task.title}
                    </h3>

                    <span
                      className={`shrink-0 text-xs font-semibold ${getPriorityClass(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                      {task.status}
                    </span>

                    <span className="truncate text-slate-400">
                      {task.createdByName ||
                        "Unknown creator"}
                    </span>
                  </div>
                </button>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}
