import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { getErrorMessage } from "../lib/errors";
import { useAuth } from "../providers/AuthProvider";
import { getDepartments } from "../services/departmentService";
import {
  completeFollowUp,
  createFollowUp,
  deleteFollowUp,
  getFollowUps,
  reopenFollowUp,
} from "../services/followUpService";
import { getPeople } from "../services/peopleService";
import { getProjects } from "../services/projectService";
import { getUsers } from "../services/userService";
import type { AppUser } from "../types/auth";
import type { Department } from "../types/department";
import type { FollowUp, FollowUpType } from "../types/followUp";
import type { Person } from "../types/people";
import type { Project } from "../types/project";

const typeOptions: FollowUpType[] = ["FollowUp", "Call", "Email", "Meeting", "CheckIn"];

function toLocalDateTimeInput(value: Date) {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function typeIcon(type: FollowUpType) {
  if (type === "Call") return <Phone size={16} />;
  if (type === "Email") return <Mail size={16} />;
  if (type === "Meeting") return <Video size={16} />;
  if (type === "CheckIn") return <Users size={16} />;
  return <CalendarClock size={16} />;
}

export default function FollowUpsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isManagement = user?.roles.some((role) => role === "Admin") ?? false;

  const initialContactId = Number(searchParams.get("contactId")) || undefined;
  const initialDepartmentId = Number(searchParams.get("departmentId")) || undefined;
  const initialProjectId = Number(searchParams.get("projectId")) || undefined;
  const focusId = Number(searchParams.get("focus")) || undefined;

  const [items, setItems] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"All" | "Open" | "Completed" | "Cancelled">(focusId ? "All" : "Open");
  const [scope, setScope] = useState<"" | "overdue" | "today" | "upcoming">("");
  const [search, setSearch] = useState("");

  const [people, setPeople] = useState<Person[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<FollowUpType>("FollowUp");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [dueAt, setDueAt] = useState(() => toLocalDateTimeInput(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  const [relationType, setRelationType] = useState<"person" | "department" | "project">(
    initialContactId ? "person" : initialProjectId ? "project" : "department"
  );
  const [relatedId, setRelatedId] = useState(() =>
    String(initialContactId ?? initialDepartmentId ?? initialProjectId ?? "")
  );

  async function loadItems() {
    try {
      setLoading(true);
      setError("");
      const data = await getFollowUps({
        status,
        scope,
        search: search.trim() || undefined,
        contactId: initialContactId,
        departmentId: initialDepartmentId,
        projectId: initialProjectId,
      });
      setItems(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Unable to load follow-ups."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, scope, initialContactId, initialDepartmentId, initialProjectId]);

  useEffect(() => {
    if (!focusId || loading) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`followup-${focusId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [focusId, items, loading]);

  useEffect(() => {
    if (!isManagement) return;

    const loadLookups = async () => {
      try {
        const [peopleData, departmentData, projectData, userData] = await Promise.all([
          getPeople(),
          getDepartments(),
          getProjects(),
          getUsers(),
        ]);
        setPeople(peopleData);
        setDepartments(departmentData);
        setProjects(projectData);
        setUsers(userData);
        setOwnerId((current) => current || String(user?.userId ?? userData[0]?.userId ?? ""));
      } catch (lookupError) {
        setActionError(getErrorMessage(lookupError, "Unable to load follow-up options."));
      }
    };

    void loadLookups();
  }, [isManagement, user?.userId]);

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      open: items.filter((item) => item.status === "Open").length,
      overdue: items.filter((item) => item.status === "Open" && new Date(item.dueAt).getTime() < now).length,
      completed: items.filter((item) => item.status === "Completed").length,
    };
  }, [items]);

  const relationOptions = relationType === "person" ? people : relationType === "department" ? departments : projects;

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const owner = Number(ownerId);
    const related = Number(relatedId);

    if (!title.trim() || !Number.isFinite(owner) || owner <= 0 || !Number.isFinite(related) || related <= 0) {
      setActionError("Title, owner, due date, and a related CRM record are required.");
      return;
    }

    try {
      setSaving(true);
      setActionError("");
      await createFollowUp({
        title: title.trim(),
        type,
        description: description.trim() || null,
        ownerId: owner,
        dueAt: new Date(dueAt).toISOString(),
        contactId: relationType === "person" ? related : null,
        departmentId: relationType === "department" ? related : null,
        projectId: relationType === "project" ? related : null,
      });
      setTitle("");
      setDescription("");
      setShowCreate(false);
      await loadItems();
    } catch (createError) {
      setActionError(getErrorMessage(createError, "Unable to create follow-up."));
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(item: FollowUp) {
    const outcome = window.prompt("Outcome / result (optional):", item.outcome ?? "");
    if (outcome === null) return;

    try {
      setActionError("");
      await completeFollowUp(item.id, outcome.trim() || null);
      await loadItems();
    } catch (completeError) {
      setActionError(getErrorMessage(completeError, "Unable to complete follow-up."));
    }
  }

  async function handleDelete(item: FollowUp) {
    if (!window.confirm(`Delete follow-up “${item.title}”?`)) return;
    try {
      setActionError("");
      await deleteFollowUp(item.id);
      await loadItems();
    } catch (deleteError) {
      setActionError(getErrorMessage(deleteError, "Unable to delete follow-up."));
    }
  }

  function relationLabel(item: FollowUp) {
    return item.contactName
      ? `Person: ${item.contactName}`
      : item.departmentName
        ? `Department: ${item.departmentName}`
        : item.projectName
          ? `Project: ${item.projectName}`
          : "CRM follow-up";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Follow-ups</h1>
          <p className="mt-1 text-sm text-slate-500">
            Keep CRM commitments, calls, meetings and check-ins from slipping through the cracks.
          </p>
        </div>
        {isManagement && (
          <button
            type="button"
            onClick={() => {
              setShowCreate((value) => !value);
              setActionError("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {showCreate ? <X size={18} /> : <Plus size={18} />}
            {showCreate ? "Cancel" : "New Follow-up"}
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Open in view</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.open}</p>
        </div>
        <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-400">Overdue in view</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{stats.overdue}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Completed in view</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.completed}</p>
        </div>
      </div>

      {showCreate && isManagement && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block lg:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} placeholder="Follow up on proposal / call contact / confirm next step..." className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Type</span>
              <select value={type} onChange={(event) => setType(event.target.value as FollowUpType)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500">
                {typeOptions.map((option) => <option key={option} value={option}>{option === "CheckIn" ? "Check-in" : option === "FollowUp" ? "Follow-up" : option}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Owner</span>
              <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500">
                <option value="">Choose owner...</option>
                {users.map((candidate) => <option key={candidate.userId} value={candidate.userId}>{candidate.fullName}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Due</span>
              <input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
            </label>

            <div className="grid gap-2 sm:grid-cols-[150px_1fr]">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Link to</span>
                <select value={relationType} onChange={(event) => { setRelationType(event.target.value as typeof relationType); setRelatedId(""); }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500">
                  <option value="person">Person</option>
                  <option value="department">Department</option>
                  <option value="project">Project</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Related record</span>
                <select value={relatedId} onChange={(event) => setRelatedId(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500">
                  <option value="">Choose...</option>
                  {relationOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block lg:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Context / next step</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
            </label>
          </div>

          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving..." : "Create Follow-up"}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto_auto_auto]">
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <Search size={18} className="text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void loadItems(); }} placeholder="Search follow-ups..." className="ml-2 w-full bg-transparent text-sm outline-none" />
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
          <option value="All">All statuses</option>
          <option value="Open">Open</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <select value={scope} onChange={(event) => setScope(event.target.value as typeof scope)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
          <option value="">Any due date</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due today</option>
          <option value="upcoming">Upcoming</option>
        </select>
        <button type="button" onClick={() => void loadItems()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {actionError && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {loading && <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading follow-ups...</div>}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <CalendarClock size={42} className="mx-auto text-slate-300" />
          <h2 className="mt-4 font-semibold text-slate-900">No follow-ups in this view</h2>
          <p className="mt-1 text-sm text-slate-500">Create a CRM follow-up or change the filters.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => {
            const overdue = item.status === "Open" && new Date(item.dueAt).getTime() < Date.now();
            return (
              <div
                id={`followup-${item.id}`}
                key={item.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm ${focusId === item.id ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{typeIcon(item.type)}{item.type === "CheckIn" ? "Check-in" : item.type === "FollowUp" ? "Follow-up" : item.type}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "Completed" ? "bg-emerald-50 text-emerald-700" : item.status === "Cancelled" ? "bg-slate-100 text-slate-600" : overdue ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{overdue ? "Overdue" : item.status}</span>
                    </div>
                    <h2 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{relationLabel(item)} · Owner: {item.ownerName}</p>
                    <p className={`mt-1 flex items-center gap-1.5 text-sm ${overdue ? "font-semibold text-red-600" : "text-slate-500"}`}><Clock3 size={15} />Due {formatDate(item.dueAt)}</p>
                    {item.description && <p className="mt-2 max-w-4xl text-sm text-slate-600">{item.description}</p>}
                    {item.outcome && <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"><strong>Outcome:</strong> {item.outcome}</p>}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {item.status !== "Completed" ? (
                      <button type="button" onClick={() => void handleComplete(item)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"><CheckCircle2 size={16} />Complete</button>
                    ) : (
                      <button type="button" onClick={() => void reopenFollowUp(item.id).then(loadItems).catch((requestError) => setActionError(getErrorMessage(requestError, "Unable to reopen follow-up.")))} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCcw size={16} />Reopen</button>
                    )}
                    {isManagement && (
                      <button type="button" onClick={() => void handleDelete(item)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3.5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"><Trash2 size={16} />Delete</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
