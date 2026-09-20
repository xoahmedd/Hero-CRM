import {
  CalendarDays,
  FolderKanban,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/FeedbackState";
import { useAuth } from "../providers/AuthProvider";
import {
  deleteProject,
  getProjects,
  searchProjects,
} from "../services/projectService";
import type { Project } from "../types/project";
import { canManageProtectedResources } from "../utils/permissions";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canDeleteProjects = canManageProtectedResources(user);

  const loadProjects = useCallback(async (searchValue: string) => {
    try {
      setLoading(true);
      setError("");

      const normalizedSearch = searchValue.trim();
      const data = normalizedSearch
        ? await searchProjects(normalizedSearch)
        : await getProjects();

      setProjects(data);
    } catch {
      setError(
        searchValue.trim()
          ? "Unable to search projects."
          : "Unable to load projects."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProjects(search);
    }, search.trim() ? 350 : 0);

    return () => window.clearTimeout(timer);
  }, [loadProjects, search]);

  async function handleDelete(id: number) {
    if (!canDeleteProjects) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteProject(id);

      setProjects((current) =>
        current.filter((project) => project.id !== id)
      );
    } catch (requestError: any) {
      if (requestError?.response?.status === 403) {
        alert("You don't have permission to delete this project.");
      } else {
        alert(
          requestError?.response?.data?.message ||
            "Unable to delete project."
        );
      }
    } finally {
      setDeletingId(null);
    }
  }

  function getStatusClasses(status: string) {
    switch (status.toLowerCase()) {
      case "active":
      case "inprogress":
      case "in progress":
        return "bg-green-50 text-green-700";
      case "completed":
        return "bg-blue-50 text-blue-700";
      case "onhold":
      case "on hold":
        return "bg-yellow-50 text-yellow-700";
      case "cancelled":
        return "bg-red-50 text-red-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  function getPriorityClasses(priority: string) {
    switch (priority.toLowerCase()) {
      case "high":
        return "text-orange-600";
      case "urgent":
        return "text-red-600";
      case "low":
        return "text-slate-500";
      default:
        return "text-blue-600";
    }
  }

  const sortedProjects = useMemo(
    () =>
      [...projects].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      ),
    [projects]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Projects
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your projects, teams and work.
          </p>
        </div>

        {canDeleteProjects && (
          <button
            type="button"
            onClick={() => navigate("/projects/new")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
          >
            <Plus size={18} aria-hidden="true" />
            New Project
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
          <Search size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
          <span className="sr-only">Search projects</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects..."
            className="ml-2 min-w-0 w-full bg-transparent text-sm outline-none"
          />
        </label>

        <div className="flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600 sm:min-w-28">
          {projects.length} project{projects.length === 1 ? "" : "s"}
        </div>
      </div>

      {error && !loading && (
        <ErrorState
          title="Projects unavailable"
          description={error}
          onRetry={() => void loadProjects(search)}
        />
      )}

      {loading && <LoadingState label="Loading projects..." />}

      {!loading && !error && sortedProjects.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title={search.trim() ? "No matching projects" : "No projects yet"}
          description={
            search.trim()
              ? "Try a different search term."
              : "Create your first project to start organizing work."
          }
          action={
            !search.trim() && canDeleteProjects ? (
              <button
                type="button"
                onClick={() => navigate("/projects/new")}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={17} aria-hidden="true" />
                New Project
              </button>
            ) : undefined
          }
        />
      )}

      {!loading && !error && sortedProjects.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-2 xl:gap-5">
          {sortedProjects.map((project) => (
            <article
              key={project.id}
              className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
            >
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 rounded-xl bg-blue-50 p-2.5 text-blue-600">
                      <FolderKanban size={20} aria-hidden="true" />
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-slate-900 group-hover:text-blue-600 sm:text-lg">
                        {project.name}
                      </h2>

                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {project.description || "No project description."}
                      </p>
                    </div>
                  </div>
                </button>

                {canDeleteProjects && (
                  <button
                    type="button"
                    onClick={() => void handleDelete(project.id)}
                    disabled={deletingId === project.id}
                    className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    title="Delete project"
                    aria-label={`Delete ${project.name}`}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                    project.status
                  )}`}
                >
                  {project.status}
                </span>

                <span
                  className={`text-xs font-semibold ${getPriorityClasses(
                    project.priority
                  )}`}
                >
                  {project.priority}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
                  <User size={16} className="shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {project.ownerName || "No owner"}
                  </span>
                </div>

                <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
                  <FolderKanban size={16} className="shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {project.customerName || "No department"}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <CalendarDays size={15} className="shrink-0" aria-hidden="true" />
                <span>
                  {project.startDate
                    ? new Date(project.startDate).toLocaleDateString()
                    : "No start date"}
                </span>
                <span aria-hidden="true">→</span>
                <span>
                  {project.dueDate
                    ? new Date(project.dueDate).toLocaleDateString()
                    : "No due date"}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
