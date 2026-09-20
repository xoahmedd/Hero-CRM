import {
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { getErrorMessage } from "../lib/errors";
import { useAuth } from "../providers/AuthProvider";
import {
  createTeam,
  getTeams,
} from "../services/teamService";
import type { Team } from "../types/team";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TeamsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const canManageTeams =
    user?.roles.some(
      (role) => role === "Admin"
    ) ?? false;

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoading(true);
        setError("");
        setTeams(await getTeams());
      } catch (loadError) {
        setError(
          getErrorMessage(loadError, "Unable to load teams.")
        );
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, []);

  const filteredTeams = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return teams;
    }

    return teams.filter((team) =>
      [
        team.name,
        team.description ?? "",
        team.createdByName ?? "",
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [search, teams]);

  async function handleCreateTeam(event: React.FormEvent) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setCreateError("Team name is required.");
      return;
    }

    if (!user) {
      setCreateError("Your session is not available.");
      return;
    }

    try {
      setCreating(true);
      setCreateError("");

      const created = await createTeam({
        name: trimmedName,
        description: description.trim() || null,
        createdById: user.userId,
      });

      setTeams((current) => [created, ...current]);
      setName("");
      setDescription("");
      setShowCreateForm(false);
      navigate(`/teams/${created.id}`);
    } catch (createRequestError) {
      setCreateError(
        getErrorMessage(
          createRequestError,
          "Unable to create this team."
        )
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Teams
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Organize people into teams and manage team membership.
          </p>
        </div>

        {canManageTeams && (
          <button
            type="button"
            onClick={() => {
              setShowCreateForm((current) => !current);
              setCreateError("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {showCreateForm ? <X size={18} /> : <Plus size={18} />}
            {showCreateForm ? "Cancel" : "New Team"}
          </button>
        )}
      </div>

      {showCreateForm && canManageTeams && (
        <form
          onSubmit={handleCreateTeam}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-4">
            <h2 className="font-semibold text-slate-900">
              Create team
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Create the team first, then add members from its details page.
            </p>
          </div>

          {createError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {createError}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr_auto] lg:items-end">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Team name
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={150}
                placeholder="Example: Design Team"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Description
              </span>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={1000}
                placeholder="What does this team work on?"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </label>

            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={17} />
              {creating ? "Creating..." : "Create Team"}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto]">
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search teams by name, description or creator..."
            className="ml-2 w-full bg-transparent text-sm outline-none"
          />
        </div>

        <div className="flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600">
          {teams.length} team{teams.length === 1 ? "" : "s"}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading teams...
        </div>
      )}

      {!loading && !error && filteredTeams.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Users size={42} className="mx-auto text-slate-300" />
          <h2 className="mt-4 font-semibold text-slate-900">
            {teams.length === 0 ? "No teams yet" : "No teams found"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {teams.length === 0
              ? canManageTeams
                ? "Create your first team to start organizing members."
                : "An Admin can create teams."
              : "Try a different search term."}
          </p>
        </div>
      )}

      {!loading && filteredTeams.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTeams.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => navigate(`/teams/${team.id}`)}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <Users size={21} />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-slate-900">
                    {team.name}
                  </h2>
                  <p className="mt-1 line-clamp-2 min-h-10 text-sm text-slate-500">
                    {team.description || "No description"}
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate">
                    Created by {team.createdByName || `User ${team.createdById}`}
                  </span>
                  <span className="shrink-0">{formatDate(team.createdAt)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
