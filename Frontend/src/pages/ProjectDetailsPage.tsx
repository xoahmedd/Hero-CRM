import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Clock3,
  FolderKanban,
  ListChecks,
  Plus,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import ProjectWorkspaceTabs from "../components/ProjectWorkspaceTabs";
import { useAuth } from "../providers/AuthProvider";
import { getEntityActivities } from "../services/activityService";
import { getProjectMembers } from "../services/projectMemberService";
import { getProject, updateProject } from "../services/projectService";
import { getTasksByProject } from "../services/taskService";
import { getTeams } from "../services/teamService";
import type { ActivityItem } from "../types/activity";
import type { Project } from "../types/project";
import type { Team } from "../types/team";
import type { ProjectMember } from "../types/projectMember";
import type { Task } from "../types/task";
import { canManageProtectedResources, canWorkAssignedResources } from "../utils/permissions";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isManagement = canManageProtectedResources(user);
  const canWork = canWorkAssignedResources(user);
  const backRoute = "/projects";
  const projectId = Number(id);

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | "">("");
  const [savingTeam, setSavingTeam] = useState(false);
  const [teamError, setTeamError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isFinite(projectId) || projectId <= 0) return;

    const loadProjectWorkspace = async () => {
      try {
        setLoading(true);
        setError("");

        const [projectData, taskData, memberData, activityData] =
          await Promise.all([
            getProject(projectId),
            getTasksByProject(projectId),
            getProjectMembers(projectId),
            isManagement
              ? getEntityActivities("Project", projectId).catch(() => [])
              : Promise.resolve([]),
          ]);

        setProject(projectData);
        setSelectedTeamId(projectData.teamId ?? "");
        setTasks(taskData);
        setMembers(memberData);
        setActivities(activityData);
      } catch {
        setError("Unable to load project workspace.");
      } finally {
        setLoading(false);
      }
    };

    void loadProjectWorkspace();
    if (isManagement) {
      void getTeams().then(setTeams).catch(() => setTeams([]));
    }
  }, [isManagement, projectId]);

  const stats = useMemo(() => {
    const now = Date.now();
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "Finished").length;
    const inProgress = tasks.filter((task) => task.status === "InProgress").length;
    const overdue = tasks.filter((task) => {
      if (!task.dueDate || task.status === "Finished" || task.status === "Cancelled") {
        return false;
      }
      return new Date(task.dueDate).getTime() < now;
    }).length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    return { total, completed, inProgress, overdue, progress };
  }, [tasks]);

  const recentTasks = useMemo(
    () =>
      [...tasks]
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime()
        )
        .slice(0, 5),
    [tasks]
  );

  async function handleTeamAssignment() {
    if (!project || !isManagement) return;
    try {
      setSavingTeam(true);
      setTeamError("");
      await updateProject(project.id, {
        name: project.name,
        description: project.description ?? undefined,
        status: project.status,
        priority: project.priority,
        startDate: project.startDate ?? null,
        dueDate: project.dueDate ?? null,
        customerId: project.customerId ?? null,
        teamId: selectedTeamId === "" ? null : selectedTeamId,
        ownerId: project.ownerId,
      });
      const team = teams.find((item) => item.id === selectedTeamId);
      setProject({
        ...project,
        teamId: selectedTeamId === "" ? null : selectedTeamId,
        teamName: team?.name ?? null,
        updatedAt: new Date().toISOString(),
      });
    } catch (requestError: any) {
      setTeamError(requestError?.response?.data?.message || "Unable to assign this project to the team.");
    } finally {
      setSavingTeam(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-slate-500">Loading project workspace...</div>;
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(backRoute)}
          className="inline-flex items-center gap-2 text-sm text-slate-500"
        >
          <ArrowLeft size={17} />
          Back to Work
        </button>

        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error || "Project not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(backRoute)}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={17} />
        Back to Work
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <FolderKanban size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {project.name}
                </h1>
                <p className="mt-1 max-w-3xl text-sm text-slate-500">
                  {project.description || "No description."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-700">
              {project.status}
            </span>
            {isManagement && (
              <Link
                to={`/follow-ups?projectId=${project.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                <CalendarClock size={17} />
                Follow-ups
              </Link>
            )}
            {canWork && (
              <Link
                to={`/projects/${project.id}/list`}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={17} />
                Add Task
              </Link>
            )}
          </div>
        </div>

        <div className="mt-7 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2 xl:grid-cols-6">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Owner</div>
            <div className="mt-1 text-sm font-semibold text-slate-800">
              {project.ownerName || "Unknown"}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Department</div>
            <div className="mt-1 text-sm font-semibold text-slate-800">
              {isManagement && project.customerId && project.customerName ? (
                <Link to={`/departments/${project.customerId}`} className="text-blue-600 hover:underline">
                  {project.customerName}
                </Link>
              ) : (
                project.customerName || "No department"
              )}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Team</div>
            <div className="mt-1 text-sm font-semibold text-slate-800">
              {project.teamName || "No team assigned"}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Priority</div>
            <div className="mt-1 text-sm font-semibold text-slate-800">{project.priority}</div>
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Start Date</div>
            <div className="mt-1 text-sm font-semibold text-slate-800">{formatDate(project.startDate)}</div>
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Due Date</div>
            <div className="mt-1 text-sm font-semibold text-slate-800">{formatDate(project.dueDate)}</div>
          </div>
        </div>
      </div>

      {canWork && <ProjectWorkspaceTabs projectId={project.id} active="overview" />}

      {isManagement && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-medium text-slate-700">
              Assigned team
              <select
                value={selectedTeamId}
                onChange={(event) => setSelectedTeamId(event.target.value ? Number(event.target.value) : "")}
                className="mt-1 w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5"
              >
                <option value="">No team assigned</option>
                {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
            </label>
            <button
              type="button"
              onClick={() => void handleTeamAssignment()}
              disabled={savingTeam}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {savingTeam ? "Saving..." : "Assign team"}
            </button>
          </div>
          {teamError && <p className="mt-2 text-sm text-red-600">{teamError}</p>}
          <p className="mt-2 text-xs text-slate-500">Once a team is assigned, individual task assignments are limited to users in that team.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500"><ListChecks size={18} /> Total Tasks</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600"><CircleDot size={18} /> In Progress</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.inProgress}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-green-600"><CheckCircle2 size={18} /> Completed</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.completed}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-red-600"><Clock3 size={18} /> Overdue</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.overdue}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500"><Users size={18} /> Members</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{members.length + 1}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Project progress</h2>
            <p className="mt-1 text-sm text-slate-500">Based on finished tasks.</p>
          </div>
          <span className="text-2xl font-bold text-blue-600">{stats.progress}%</span>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent tasks</h2>
              <p className="mt-1 text-sm text-slate-500">Latest work inside this project.</p>
            </div>
            {isManagement && (
              <Link to={`/projects/${project.id}/list`} className="text-sm font-semibold text-blue-600 hover:underline">
                View all
              </Link>
            )}
          </div>

          <div className="mt-5 divide-y divide-slate-100">
            {recentTasks.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">No tasks yet.</div>
            ) : (
              recentTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{task.title}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {task.priority} · {task.dueDate ? `Due ${formatDate(task.dueDate)}` : "No due date"}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {task.status}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
          <p className="mt-1 text-sm text-slate-500">Project and task changes.</p>

          <div className="mt-5 space-y-4">
            {activities.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                Activity will appear here as the team works on this project.
              </div>
            ) : (
              activities.slice(0, 6).map((activity) => (
                <div key={activity.id} className="border-l-2 border-blue-100 pl-3">
                  <div className="text-sm font-semibold text-slate-800">{activity.action}</div>
                  {activity.description && (
                    <div className="mt-1 text-xs leading-5 text-slate-500">{activity.description}</div>
                  )}
                  <div className="mt-1 text-xs text-slate-400">
                    {activity.userName || "User"} · {new Date(activity.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
