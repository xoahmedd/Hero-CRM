import {
  ArrowLeft,
  CalendarDays,
  Crown,
  LayoutList,
  Mail,
  SquareKanban,
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

import {
  getErrorMessage,
} from "../lib/errors";

import {
  useAuth,
} from "../providers/AuthProvider";

import {
  getProject,
} from "../services/projectService";

import {
  addProjectMember,
  getProjectMembers,
  removeProjectMember,
} from "../services/projectMemberService";

import {
  getUsers,
} from "../services/userService";

import type {
  AppUser,
} from "../types/auth";

import type {
  Project,
} from "../types/project";

import type {
  ProjectMember,
} from "../types/projectMember";

import ProjectWorkspaceTabs from "../components/ProjectWorkspaceTabs";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatJoinedAt(value: string) {
  return new Date(value).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}

export default function ProjectMembersPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const projectId = Number(id);

  const hasValidProjectId =
    Number.isFinite(projectId) &&
    projectId > 0;

  const [project, setProject] =
    useState<Project | null>(null);

  const [members, setMembers] =
    useState<ProjectMember[]>([]);

  const [users, setUsers] =
    useState<AppUser[]>([]);

  const [selectedUserId, setSelectedUserId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [adding, setAdding] =
    useState(false);

  const [removingUserId, setRemovingUserId] =
    useState<number | null>(null);

  const canManageMembers = user?.roles.includes("Admin") ?? false;

  useEffect(() => {
    if (!hasValidProjectId) {
      return;
    }

    const loadPage = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          projectData,
          memberData,
          userData,
        ] = await Promise.all([
          getProject(projectId),
          getProjectMembers(projectId),
          canManageMembers ? getUsers() : Promise.resolve([]),
        ]);

        setProject(projectData);
        setMembers(memberData);
        setUsers(userData);
      } catch (loadError) {
        setError(
          getErrorMessage(
            loadError,
            "Unable to load project members."
          )
        );
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [hasValidProjectId, projectId, canManageMembers]);

  const explicitMembers = useMemo(
    () =>
      members.filter(
        (member) =>
          member.userId !==
          project?.ownerId
      ),
    [members, project?.ownerId]
  );

  const memberUserIds = useMemo(
    () =>
      new Set(
        explicitMembers.map(
          (member) => member.userId
        )
      ),
    [explicitMembers]
  );

  const availableUsers = useMemo(
    () =>
      users.filter(
        (candidate) =>
          candidate.userId !==
            project?.ownerId &&
          !memberUserIds.has(
            candidate.userId
          )
      ),
    [
      users,
      project?.ownerId,
      memberUserIds,
    ]
  );

  async function refreshMembers() {
    const data =
      await getProjectMembers(projectId);

    setMembers(data);
  }

  async function handleAddMember() {
    const userId = Number(
      selectedUserId
    );

    if (!Number.isFinite(userId) || userId <= 0) {
      setActionError(
        "Choose a user to add."
      );
      return;
    }

    try {
      setAdding(true);
      setActionError("");

      await addProjectMember(
        projectId,
        userId
      );

      await refreshMembers();
      setSelectedUserId("");
    } catch (addError) {
      setActionError(
        getErrorMessage(
          addError,
          "Unable to add this project member."
        )
      );
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveMember(
    member: ProjectMember
  ) {
    const confirmed = window.confirm(
      `Remove ${member.fullName} from this project?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingUserId(
        member.userId
      );
      setActionError("");

      await removeProjectMember(
        projectId,
        member.userId
      );

      setMembers((current) =>
        current.filter(
          (item) =>
            item.userId !==
            member.userId
        )
      );
    } catch (removeError) {
      setActionError(
        getErrorMessage(
          removeError,
          "Unable to remove this project member."
        )
      );
    } finally {
      setRemovingUserId(null);
    }
  }

  if (!hasValidProjectId) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() =>
            navigate("/projects")
          }
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Back to Projects
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
        Loading project members...
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
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Back to Projects
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
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Back to Project
        </button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users
                size={24}
                className="text-blue-600"
              />

              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {project.name}
              </h1>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Manage the people working on this project.
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
              <LayoutList size={17} />
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
              onClick={() =>
                navigate(
                  `/projects/${projectId}/calendar`
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <CalendarDays size={17} />
              Calendar
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Users size={17} />
              Members
            </button>
          </div>
        </div>
      </div>

      <ProjectWorkspaceTabs projectId={projectId} active="members" />

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Project Owner
          </p>

          <p className="mt-1 text-lg font-bold text-slate-900">
            {project.ownerName ||
              "Unknown owner"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Project Members
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {explicitMembers.length}
          </p>
        </div>
      </div>

      {/* Add member */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <UserPlus
            size={20}
            className="text-blue-600"
          />

          <h2 className="text-lg font-semibold text-slate-900">
            Add project member
          </h2>
        </div>

        {canManageMembers ? (
          <div className="mt-5 flex flex-col gap-3 md:flex-row">
            <select
              value={selectedUserId}
              onChange={(event) =>
                setSelectedUserId(
                  event.target.value
                )
              }
              disabled={
                adding ||
                availableUsers.length === 0
              }
              className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">
                {availableUsers.length === 0
                  ? "All available users are already on this project"
                  : "Choose a user"}
              </option>

              {availableUsers.map(
                (candidate) => (
                  <option
                    key={candidate.userId}
                    value={candidate.userId}
                  >
                    {candidate.fullName} — {candidate.email}
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              onClick={handleAddMember}
              disabled={
                adding ||
                !selectedUserId
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              <UserPlus size={17} />
              {adding
                ? "Adding..."
                : "Add Member"}
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            You can view project members. Adding and removing members requires an Admin role.
          </div>
        )}

        {actionError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {actionError}
          </div>
        )}
      </section>

      {/* Owner */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Project owner
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              The owner is stored separately from the project membership list.
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <Crown size={14} />
            Owner
          </span>
        </div>

        <div className="mt-5 flex items-center gap-4 rounded-xl border border-amber-100 bg-amber-50/40 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
            {getInitials(
              project.ownerName ||
                "Project Owner"
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {project.ownerName ||
                "Unknown owner"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Project owner
            </p>
          </div>
        </div>
      </section>

      {/* Members */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Members
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Users explicitly assigned to this project.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {explicitMembers.length}
          </span>
        </div>

        {explicitMembers.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <Users
              size={28}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              No additional project members yet.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Add an active user above to include them in this project.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {explicitMembers.map(
              (member) => (
                <div
                  key={member.userId}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 p-4"
                >
                  {member.profileImage ? (
                    <img
                      src={member.profileImage}
                      alt={member.fullName}
                      className="h-11 w-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                      {getInitials(
                        member.fullName
                      )}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {member.fullName}
                    </p>

                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <Mail size={13} />
                      <span className="truncate">
                        {member.email}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      Joined {formatJoinedAt(member.joinedAt)}
                    </p>
                  </div>

                  {canManageMembers && (
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveMember(
                          member
                        )
                      }
                      disabled={
                        removingUserId ===
                        member.userId
                      }
                      aria-label={`Remove ${member.fullName}`}
                      title="Remove member"
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-100 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}
