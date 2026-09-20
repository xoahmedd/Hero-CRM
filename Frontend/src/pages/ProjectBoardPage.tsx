import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Plus,
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

import {
  getProject,
} from "../services/projectService";

import {
  getTasksByProject,
  updateTaskStatus,
} from "../services/taskService";

import type { Project } from "../types/project";
import type { Task } from "../types/task";
import ProjectWorkspaceTabs from "../components/ProjectWorkspaceTabs";

const columns = [
  {
    id: "Todo",
    title: "To Do",
    description: "Tasks waiting to start",
  },
  {
    id: "InProgress",
    title: "In Progress",
    description: "Work currently in progress",
  },
  {
    id: "Pending",
    title: "Pending",
    description: "Blocked or waiting tasks",
  },
  {
    id: "Finished",
    title: "Finished",
    description: "Completed work",
  },
];

function TaskCard({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(
      transform
    ),
    transition,
  };

  const priorityClass =
    task.priority.toLowerCase() ===
    "urgent"
      ? "text-red-600"
      : task.priority.toLowerCase() ===
        "high"
      ? "text-orange-600"
      : task.priority.toLowerCase() ===
        "low"
      ? "text-slate-400"
      : "text-blue-600";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={[
        "cursor-grab rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md",
        isDragging
          ? "opacity-40"
          : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        {task.status === "Finished" ? (
          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0 text-green-600"
          />
        ) : (
          <Circle
            size={18}
            className="mt-0.5 shrink-0 text-slate-300"
          />
        )}

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
            {task.title}
          </h3>

          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
              {task.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span
          className={`text-xs font-semibold ${priorityClass}`}
        >
          {task.priority}
        </span>

        {task.dueDate && (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <CalendarDays size={13} />

            {new Date(
              task.dueDate
            ).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
        <User size={13} />

        <span className="truncate">
          {task.createdByName ||
            "Unknown"}
        </span>
      </div>
    </div>
  );
}

function KanbanColumn({
  column,
  tasks,
  onTaskClick,
}: {
  column: (typeof columns)[number];
  tasks: Task[];
  onTaskClick: (id: number) => void;
}) {
  const {
    setNodeRef,
  } = useSortable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className="flex min-h-[500px] min-w-[285px] flex-1 flex-col rounded-2xl bg-slate-100 p-3"
    >
      <div className="mb-3 px-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              {column.title}
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              {column.description}
            </p>
          </div>

          <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-500">
            {tasks.length}
          </span>
        </div>
      </div>

      <SortableContext
        items={tasks.map(
          (task) => task.id
        )}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() =>
                onTaskClick(task.id)
              }
            />
          ))}

          {tasks.length === 0 && (
            <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function ProjectBoardPage() {
  const { id } = useParams();

  const navigate =
    useNavigate();

  const projectId = Number(id);

  const [project, setProject] =
    useState<Project | null>(null);

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [activeTask, setActiveTask] =
    useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (!projectId) {
      return;
    }

    loadBoard();
  }, [projectId]);

  async function loadBoard() {
    try {
      setLoading(true);
      setError("");

      const [
        projectData,
        taskData,
      ] = await Promise.all([
        getProject(projectId),
        getTasksByProject(
          projectId
        ),
      ]);

      setProject(projectData);
      setTasks(taskData);
    } catch {
      setError(
        "Unable to load project board."
      );
    } finally {
      setLoading(false);
    }
  }

  const groupedTasks =
    useMemo(() => {
      return columns.reduce(
        (result, column) => {
          result[column.id] =
            tasks.filter(
              (task) =>
                task.status ===
                column.id
            );

          return result;
        },
        {} as Record<
          string,
          Task[]
        >
      );
    }, [tasks]);

  function findTask(
    taskId: number
  ) {
    return tasks.find(
      (task) =>
        task.id === taskId
    );
  }

  function findColumnForTask(
    taskId: number
  ) {
    const task =
      findTask(taskId);

    return task?.status;
  }

  async function handleDragStart(
    event: {
      active: { id: string | number };
    }
  ) {
    const id =
      Number(event.active.id);

    const task = findTask(id);

    if (task) {
      setActiveTask(task);
    }
  }

  async function handleDragEnd(
    event: DragEndEvent
  ) {
    setActiveTask(null);

    const {
      active,
      over,
    } = event;

    if (!over) {
      return;
    }

    const taskId =
      Number(active.id);

    const task = findTask(taskId);

    if (!task) {
      return;
    }

    const overId =
      String(over.id);

    let newStatus: string | undefined;

    if (
      columns.some(
        (column) =>
          column.id === overId
      )
    ) {
      newStatus = overId;
    } else {
      newStatus =
        findColumnForTask(
          Number(overId)
        );
    }

    if (!newStatus) {
      return;
    }

    if (
      newStatus === task.status
    ) {
      return;
    }

    const oldStatus =
      task.status;

    // Optimistic UI update
    setTasks((current) =>
      current.map((item) =>
        item.id === taskId
          ? {
              ...item,
              status: newStatus!,
            }
          : item
      )
    );

    try {
      await updateTaskStatus(
        taskId,
        newStatus
      );
    } catch {
      // Roll back if API fails
      setTasks((current) =>
        current.map((item) =>
          item.id === taskId
            ? {
                ...item,
                status: oldStatus,
              }
            : item
        )
      );

      setError(
        "Unable to update task status."
      );
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-slate-500">
        Loading board...
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
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {project?.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your project using the Kanban board.
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
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              List
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/projects/${projectId}/board`
                )
              }
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Board
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

      <ProjectWorkspaceTabs projectId={projectId} active="board" />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Board */}
      <div className="overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={
            closestCorners
          }
          onDragStart={
            handleDragStart
          }
          onDragEnd={
            handleDragEnd
          }
        >
          <div className="flex min-w-max gap-4">
            {columns.map(
              (column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={
                    groupedTasks[
                      column.id
                    ] ?? []
                  }
                  onTaskClick={(taskId) =>
                    navigate(
                      `/tasks/${taskId}`
                    )
                  }
                />
              )
            )}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="w-[285px] rotate-2 opacity-90">
                <TaskCard
                  task={
                    activeTask
                  }
                  onClick={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}