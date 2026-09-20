import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Gauge,
  ListChecks,
  Mail,
  Trash2,
  UserPlus,
  Users,
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

import { getErrorMessage } from "../lib/errors";
import { useAuth } from "../providers/AuthProvider";
import {
  addTeamMember,
  getTeamMembers,
  getTeams,
  getTeamWorkload,
  removeTeamMember,
} from "../services/teamService";
import { getUsers } from "../services/userService";
import { getProjects } from "../services/projectService";
import type { AppUser } from "../types/auth";
import type { Project } from "../types/project";
import type {
  Team,
  TeamMember,
  TeamWorkload,
} from "../types/team";

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "U";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TeamDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const teamId = Number(id);
  const hasValidTeamId = Number.isFinite(teamId) && teamId > 0;

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [workload, setWorkload] = useState<TeamWorkload | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [teamProjects, setTeamProjects] = useState<Project[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);

  const canManageMembers =
    user?.roles.some(
      (role) => role === "Admin"
    ) ?? false;

  useEffect(() => {
    if (!hasValidTeamId) {
      setLoading(false);
      return;
    }

    const loadPage = async () => {
      try {
        setLoading(true);
        setError("");

        const [allTeams, memberData, workloadData, userData] = await Promise.all([
          getTeams(),
          getTeamMembers(teamId),
          getTeamWorkload(teamId),
          getUsers(),
        ]);

        const selectedTeam = allTeams.find((item) => item.id === teamId);

        if (!selectedTeam) {
          setError("Team not found.");
          return;
        }

        setTeam(selectedTeam);
        setMembers(memberData);
        setWorkload(workloadData);
        setUsers(userData);

        // Project assignment is useful context, but it must not make the
        // whole Team screen unavailable if the Projects endpoint has a
        // temporary database/schema problem.
        try {
          const projectData = await getProjects();
          setTeamProjects(projectData.filter((project) => project.teamId === teamId));
        } catch {
          setTeamProjects([]);
        }
      } catch (loadError) {
        setError(
          getErrorMessage(loadError, "Unable to load team details.")
        );
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [hasValidTeamId, teamId]);

  const memberUserIds = useMemo(
    () => new Set(members.map((member) => member.userId)),
    [members]
  );

  const availableUsers = useMemo(
    () => users.filter((candidate) => !memberUserIds.has(candidate.userId)),
    [memberUserIds, users]
  );

  function getUserForMember(member: TeamMember) {
    return users.find((candidate) => candidate.userId === member.userId);
  }

  async function refreshMembers() {
    const [memberData, workloadData] = await Promise.all([
      getTeamMembers(teamId),
      getTeamWorkload(teamId),
    ]);
    setMembers(memberData);
    setWorkload(workloadData);
  }

  async function handleAddMember() {
    const userId = Number(selectedUserId);

    if (!Number.isFinite(userId) || userId <= 0) {
      setActionError("Choose a user to add.");
      return;
    }

    try {
      setAdding(true);
      setActionError("");
      await addTeamMember(teamId, userId);
      await refreshMembers();
      setSelectedUserId("");
    } catch (addError) {
      setActionError(
        getErrorMessage(addError, "Unable to add this team member.")
      );
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveMember(member: TeamMember) {
    const memberName = member.userName || member.email || `User ${member.userId}`;
    const confirmed = window.confirm(
      `Remove ${memberName} from this team?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingUserId(member.userId);
      setActionError("");
      await removeTeamMember(teamId, member.userId);
      await refreshMembers();
    } catch (removeError) {
      setActionError(
        getErrorMessage(removeError, "Unable to remove this team member.")
      );
    } finally {
      setRemovingUserId(null);
    }
  }

  if (!hasValidTeamId) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate("/teams")}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Back to Teams
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Invalid team ID.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        Loading team...
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate("/teams")}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Back to Teams
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || "Team not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate("/teams")}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={17} />
        Back to Teams
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Users size={23} />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold text-slate-900 sm:text-3xl">
                  {team.name}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {team.description || "No team description."}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[430px]">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Created by
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {team.createdByName || `User ${team.createdById}`}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Created
              </p>
              <p className="mt-1 flex items-center gap-2 font-semibold text-slate-900">
                <CalendarDays size={16} className="text-slate-400" />
                {formatDate(team.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Team members
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {members.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Available users
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {availableUsers.length}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">Assigned projects</h2>
            <p className="mt-1 text-sm text-slate-500">Projects currently assigned to this team.</p>
          </div>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{teamProjects.length}</span>
        </div>
        {teamProjects.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No projects assigned to this team yet.</div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {teamProjects.map((project) => (
              <button key={project.id} type="button" onClick={() => navigate(`/projects/${project.id}`)} className="rounded-xl border border-slate-200 p-4 text-left hover:border-blue-200 hover:bg-blue-50/40">
                <p className="font-semibold text-slate-900">{project.name}</p>
                <p className="mt-1 text-xs text-slate-500">{project.status} · {project.priority}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {workload && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Gauge size={20} className="text-blue-600" />
                <h2 className="font-semibold text-slate-900">Team workload</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Live workload calculated from assigned tasks, due dates and current task status.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void getTeamWorkload(teamId).then(setWorkload).catch((requestError) => setActionError(getErrorMessage(requestError, "Unable to refresh workload.")))}
              className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Refresh workload
            </button>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Members</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{workload.totalMembers}</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Open team tasks</p>
              <p className="mt-2 text-2xl font-bold text-blue-700">{workload.totalOpenTasks}</p>
            </div>
            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Overdue team tasks</p>
              <p className="mt-2 text-2xl font-bold text-red-700">{workload.totalOverdueTasks}</p>
            </div>
          </div>

          {workload.members.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-7 text-center text-sm text-slate-500">
              Add members to this team to see workload.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-3 font-semibold">Member</th>
                    <th className="px-3 py-3 font-semibold">Load</th>
                    <th className="px-3 py-3 font-semibold">Open</th>
                    <th className="px-3 py-3 font-semibold">In progress</th>
                    <th className="px-3 py-3 font-semibold">Pending</th>
                    <th className="px-3 py-3 font-semibold">Due soon</th>
                    <th className="px-3 py-3 font-semibold">Overdue</th>
                    <th className="px-3 py-3 font-semibold">High priority</th>
                  </tr>
                </thead>
                <tbody>
                  {workload.members.map((row) => (
                    <tr key={row.userId} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-3">
                        <p className="font-semibold text-slate-900">{row.userName}</p>
                        <p className="text-xs text-slate-400">{row.email}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={[
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                          row.utilizationLevel === "Overloaded"
                            ? "bg-red-50 text-red-700"
                            : row.utilizationLevel === "Busy"
                              ? "bg-amber-50 text-amber-700"
                              : row.utilizationLevel === "Balanced"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-emerald-50 text-emerald-700",
                        ].join(" ")}>
                          {row.utilizationLevel}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-800">{row.openTasks}</td>
                      <td className="px-3 py-3">{row.inProgressTasks}</td>
                      <td className="px-3 py-3">{row.pendingTasks}</td>
                      <td className="px-3 py-3">{row.dueSoonTasks}</td>
                      <td className="px-3 py-3">
                        <span className={row.overdueTasks > 0 ? "font-semibold text-red-600" : "text-slate-600"}>
                          {row.overdueTasks}
                        </span>
                      </td>
                      <td className="px-3 py-3">{row.highPriorityOpenTasks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><ListChecks size={14} /> Open load uses tasks not in Finished status.</span>
            <span className="inline-flex items-center gap-1"><AlertTriangle size={14} /> Overdue means an open task whose due date has passed.</span>
          </div>
        </div>
      )}

      {canManageMembers && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus size={20} className="text-blue-600" />
            <h2 className="font-semibold text-slate-900">
              Add team member
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedUserId}
              onChange={(event) => {
                setSelectedUserId(event.target.value);
                setActionError("");
              }}
              disabled={availableUsers.length === 0 || adding}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">
                {availableUsers.length === 0
                  ? "All active users are already in this team"
                  : "Choose a user..."}
              </option>
              {availableUsers.map((candidate) => (
                <option key={candidate.userId} value={candidate.userId}>
                  {candidate.fullName} — {candidate.email}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleAddMember}
              disabled={!selectedUserId || adding}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UserPlus size={17} />
              {adding ? "Adding..." : "Add Member"}
            </button>
          </div>

          {actionError && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {actionError}
            </div>
          )}
        </div>
      )}

      {!canManageMembers && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
          Team membership is read-only for your role. Admins can add or remove members.
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">Members</h2>
            <p className="mt-1 text-sm text-slate-500">
              Users explicitly assigned to this team.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {members.length}
          </span>
        </div>

        {members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <Users size={34} className="mx-auto text-slate-300" />
            <p className="mt-3 font-medium text-slate-800">
              No members in this team yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {canManageMembers
                ? "Choose an active user above to add the first member."
                : "An Admin can add team members."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {members.map((member) => {
              const appUser = getUserForMember(member);
              const memberName =
                member.userName || appUser?.fullName || `User ${member.userId}`;
              const memberEmail = member.email || appUser?.email || "No email";

              return (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"
                >
                  {appUser?.profileImage ? (
                    <img
                      src={appUser.profileImage}
                      alt={memberName}
                      className="h-11 w-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                      {getInitials(memberName)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">
                      {memberName}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-slate-500">
                      <Mail size={14} className="shrink-0" />
                      <span className="truncate">{memberEmail}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Joined {formatDate(member.joinedAt)}
                    </p>
                  </div>

                  {canManageMembers && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member)}
                      disabled={removingUserId === member.userId}
                      title="Remove member"
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
        New teams automatically include their creator as the first team member. Workload is calculated from the current task assignments of all team members.
      </div>
    </div>
  );
}
