import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Edit3,
  FolderKanban,
  Globe2,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Plus,
  Save,
  Tag as TagIcon,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { EmptyState, ErrorState, LoadingState } from "../components/FeedbackState";
import { useAuth } from "../providers/AuthProvider";
import {
  assignDepartmentTag,
  createDepartmentNote,
  createDepartmentTag,
  deleteDepartmentNote,
  getAllDepartmentTags,
  getDepartment,
  getDepartmentNotes,
  getDepartmentTags,
  getDepartmentTimeline,
  removeDepartmentTag,
} from "../services/departmentService";
import { createPerson, deletePerson, getPeople, updatePerson } from "../services/peopleService";
import { getProjectsByDepartment } from "../services/projectService";
import type {
  Department,
  DepartmentActivity,
  DepartmentNote,
  DepartmentTag,
} from "../types/department";
import type { Person } from "../types/people";
import type { Project } from "../types/project";

interface PersonFormState {
  id?: number;
  name: string;
  jobTitle: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

const emptyPerson: PersonFormState = {
  name: "",
  jobTitle: "",
  email: "",
  phone: "",
  isPrimary: false,
};

export default function DepartmentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const departmentId = Number(id);

  const [department, setDepartment] = useState<Department | null>(null);
  const [requesters, setRequesters] = useState<Person[]>([]);
  const [notes, setNotes] = useState<DepartmentNote[]>([]);
  const [tags, setTags] = useState<DepartmentTag[]>([]);
  const [allTags, setAllTags] = useState<DepartmentTag[]>([]);
  const [timeline, setTimeline] = useState<DepartmentActivity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [requesterFormOpen, setRequesterFormOpen] = useState(false);
  const [requesterForm, setRequesterForm] = useState<PersonFormState>(emptyPerson);
  const [savingRequester, setSavingRequester] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#2563eb");
  const [tagBusy, setTagBusy] = useState(false);

  const canDeleteAnyNote = user?.roles.includes("Admin") ?? false;

  async function loadAll() {
    if (!Number.isFinite(departmentId) || departmentId <= 0) {
      setError("Invalid department ID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const [departmentData, requesterData, noteData, tagData, allTagData, activityData, projectData] = await Promise.all([
        getDepartment(departmentId),
        getPeople({ departmentId }),
        getDepartmentNotes(departmentId),
        getDepartmentTags(departmentId),
        getAllDepartmentTags(),
        getDepartmentTimeline(departmentId),
        getProjectsByDepartment(departmentId),
      ]);

      setDepartment(departmentData);
      setRequesters(requesterData);
      setNotes(noteData);
      setTags(tagData);
      setAllTags(allTagData);
      setTimeline(activityData);
      setProjects(projectData);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Unable to load department details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId]);

  const unassignedTags = useMemo(
    () => allTags.filter((tag) => !tags.some((assigned) => assigned.id === tag.id)),
    [allTags, tags]
  );

  function openNewRequester() {
    setRequesterForm(emptyPerson);
    setRequesterFormOpen(true);
  }

  function openEditRequester(requester: Person) {
    setRequesterForm({
      id: requester.id,
      name: requester.name,
      jobTitle: requester.jobTitle || "",
      email: requester.email || "",
      phone: requester.phone || "",
      isPrimary: requester.isPrimary,
    });
    setRequesterFormOpen(true);
  }

  async function handleRequesterSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!requesterForm.name.trim()) return;

    try {
      setSavingRequester(true);
      const payload = {
        departmentId,
        name: requesterForm.name.trim(),
        jobTitle: requesterForm.jobTitle.trim() || null,
        email: requesterForm.email.trim() || null,
        phone: requesterForm.phone.trim() || null,
        isPrimary: requesterForm.isPrimary,
      };

      if (requesterForm.id) {
        await updatePerson(requesterForm.id, payload);
      } else {
        await createPerson(payload);
      }

      setRequesterFormOpen(false);
      setRequesterForm(emptyPerson);
      await loadAll();
    } catch (requestError: any) {
      alert(requestError?.response?.data?.message || "Unable to save person.");
    } finally {
      setSavingRequester(false);
    }
  }

  async function handleDeleteRequester(requester: Person) {
    if (!window.confirm(`Remove ${requester.name} from this department?`)) return;
    try {
      await deletePerson(requester.id);
      await loadAll();
    } catch (requestError: any) {
      alert(requestError?.response?.data?.message || "Unable to remove person.");
    }
  }

  async function handleAddNote(event: React.FormEvent) {
    event.preventDefault();
    const content = noteText.trim();
    if (!content) return;
    try {
      setSavingNote(true);
      await createDepartmentNote(departmentId, content);
      setNoteText("");
      await loadAll();
    } catch (requestError: any) {
      alert(requestError?.response?.data?.message || "Unable to add note.");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleDeleteNote(note: DepartmentNote) {
    if (!window.confirm("Delete this note?")) return;
    try {
      await deleteDepartmentNote(departmentId, note.id);
      await loadAll();
    } catch (requestError: any) {
      alert(requestError?.response?.data?.message || "Unable to delete note.");
    }
  }

  async function handleAssignTag() {
    const tagId = Number(selectedTagId);
    if (!tagId) return;
    try {
      setTagBusy(true);
      await assignDepartmentTag(departmentId, tagId);
      setSelectedTagId("");
      await loadAll();
    } catch (requestError: any) {
      alert(requestError?.response?.data?.message || "Unable to assign tag.");
    } finally {
      setTagBusy(false);
    }
  }

  async function handleCreateTag() {
    const name = newTagName.trim();
    if (!name) return;
    try {
      setTagBusy(true);
      const created = await createDepartmentTag({ name, color: newTagColor });
      await assignDepartmentTag(departmentId, created.id);
      setNewTagName("");
      await loadAll();
    } catch (requestError: any) {
      alert(requestError?.response?.data?.message || "Unable to create tag.");
    } finally {
      setTagBusy(false);
    }
  }

  async function handleRemoveTag(tag: DepartmentTag) {
    try {
      setTagBusy(true);
      await removeDepartmentTag(departmentId, tag.id);
      await loadAll();
    } catch (requestError: any) {
      alert(requestError?.response?.data?.message || "Unable to remove tag.");
    } finally {
      setTagBusy(false);
    }
  }

  if (loading) return <LoadingState label="Loading department..." />;
  if (error || !department) {
    return <ErrorState title="Department could not be loaded" description={error || "Department not found."} onRetry={() => void loadAll()} />;
  }

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => navigate("/departments")} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft size={17} /> Back to Departments
      </button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-blue-50 p-4 text-blue-600"><Building2 size={28} /></div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{department.name}</h1>
              <Pill>{department.status}</Pill>
            </div>
            <p className="mt-1 text-sm text-slate-500">Owner: {department.ownerName || "Unassigned"}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate(`/follow-ups?departmentId=${department.id}`)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100">
            <CalendarClock size={17} /> Follow-ups
          </button>
          <button type="button" onClick={() => navigate(`/departments/${department.id}/edit`)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Edit3 size={17} /> Edit Department
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card title="Department details">
            <Detail icon={Mail} label="Email" value={department.email} />
            <Detail icon={Phone} label="Phone" value={department.phone} />
            <Detail icon={Globe2} label="Internal page / website" value={department.website} link />
            <Detail icon={MapPin} label="Location / office" value={department.address} />
          </Card>

          <Card title="Tags" icon={TagIcon}>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 && <span className="text-sm text-slate-400">No tags yet.</span>}
              {tags.map((tag) => (
                <span key={tag.id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-400" style={tag.color ? { backgroundColor: tag.color } : undefined} />
                  {tag.name}
                  <button type="button" disabled={tagBusy} onClick={() => void handleRemoveTag(tag)} className="text-slate-400 hover:text-red-600" aria-label={`Remove ${tag.name}`}><X size={13} /></button>
                </span>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <select value={selectedTagId} onChange={(event) => setSelectedTagId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <option value="">Assign existing tag...</option>
                {unassignedTags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
              </select>
              <button type="button" disabled={!selectedTagId || tagBusy} onClick={() => void handleAssignTag()} className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Add</button>
            </div>
            <div className="mt-3 grid grid-cols-[1fr_44px_auto] gap-2">
              <input value={newTagName} onChange={(event) => setNewTagName(event.target.value)} placeholder="New tag" className="min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <input type="color" value={newTagColor} onChange={(event) => setNewTagColor(event.target.value)} className="h-10 w-11 rounded-lg border border-slate-200 bg-white p-1" aria-label="Tag color" />
              <button type="button" disabled={!newTagName.trim() || tagBusy} onClick={() => void handleCreateTag()} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40">Create</button>
            </div>
          </Card>

          <Card title="Linked projects" icon={FolderKanban}>
            {projects.length === 0 ? <p className="text-sm text-slate-400">No projects linked yet.</p> : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <Link key={project.id} to={`/projects/${project.id}`} className="block rounded-xl border border-slate-100 p-3 hover:bg-slate-50">
                    <div className="font-medium text-slate-800">{project.name}</div>
                    <div className="mt-1 text-xs text-slate-400">{project.status} · {project.priority}</div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            title={`People (${requesters.length})`}
            icon={UsersRound}
            action={<button type="button" onClick={openNewRequester} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"><Plus size={14} /> Add person</button>}
          >
            {requesterFormOpen && (
              <form onSubmit={handleRequesterSubmit} className="mb-5 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">{requesterForm.id ? "Edit person" : "Add person"}</h3>
                  <button type="button" onClick={() => setRequesterFormOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={17} /></button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={requesterForm.name} onChange={(event) => setRequesterForm((value) => ({ ...value, name: event.target.value }))} placeholder="Name *" className={smallInputClass} />
                  <input value={requesterForm.jobTitle} onChange={(event) => setRequesterForm((value) => ({ ...value, jobTitle: event.target.value }))} placeholder="Role / job title" className={smallInputClass} />
                  <input type="email" value={requesterForm.email} onChange={(event) => setRequesterForm((value) => ({ ...value, email: event.target.value }))} placeholder="Email" className={smallInputClass} />
                  <input value={requesterForm.phone} onChange={(event) => setRequesterForm((value) => ({ ...value, phone: event.target.value }))} placeholder="Phone" className={smallInputClass} />
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={requesterForm.isPrimary} onChange={(event) => setRequesterForm((value) => ({ ...value, isPrimary: event.target.checked }))} /> Primary contact for this department
                </label>
                <div className="mt-3 flex justify-end">
                  <button type="submit" disabled={!requesterForm.name.trim() || savingRequester} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"><Save size={14} />{savingRequester ? "Saving..." : "Save person"}</button>
                </div>
              </form>
            )}

            {requesters.length === 0 ? (
              <EmptyState icon={UserRound} title="No people yet" description="Add CRM contacts connected to this department." />
            ) : (
              <div className="divide-y divide-slate-100">
                {requesters.map((requester) => (
                  <div key={requester.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-600">{requester.name.charAt(0).toUpperCase()}</div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><Link to={`/people/${requester.id}`} className="font-medium text-slate-900 hover:text-blue-600 hover:underline">{requester.name}</Link>{requester.isPrimary && <Pill>Primary</Pill>}</div>
                        <div className="text-sm text-slate-500">{requester.jobTitle || "Contact"}</div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">{requester.email && <span>{requester.email}</span>}{requester.phone && <span>{requester.phone}</span>}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEditRequester(requester)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label={`Edit ${requester.name}`}><Edit3 size={15} /></button>
                      <button type="button" onClick={() => void handleDeleteRequester(requester)} className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50" aria-label={`Remove ${requester.name}`}><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Department notes" icon={MessageSquareText}>
            <form onSubmit={handleAddNote} className="mb-5">
              <textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} rows={3} maxLength={4000} placeholder="Write an internal CRM note about this department, key context, decisions, relationships, or working arrangements..." className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
              <div className="mt-2 flex justify-end"><button type="submit" disabled={!noteText.trim() || savingNote} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{savingNote ? "Adding..." : "Add note"}</button></div>
            </form>
            {notes.length === 0 ? <p className="text-sm text-slate-400">No department notes yet.</p> : (
              <div className="space-y-3">
                {notes.map((note) => {
                  const canDelete = canDeleteAnyNote || note.userId === user?.userId;
                  return (
                    <div key={note.id} className="rounded-xl bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3"><div className="text-sm font-semibold text-slate-700">{note.userName}</div>{canDelete && <button type="button" onClick={() => void handleDeleteNote(note)} className="text-slate-400 hover:text-red-600" aria-label="Delete note"><Trash2 size={14} /></button>}</div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{note.content}</p>
                      <div className="mt-2 text-xs text-slate-400">{formatDateTime(note.createdAt)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card title="Activity timeline" icon={CalendarClock}>
            {timeline.length === 0 ? <p className="text-sm text-slate-400">No activity recorded yet.</p> : (
              <div className="space-y-0">
                {timeline.map((activity, index) => (
                  <div key={activity.id} className="relative flex gap-4 pb-5 last:pb-0">
                    {index < timeline.length - 1 && <div className="absolute left-[7px] top-4 h-full w-px bg-slate-200" />}
                    <div className="relative mt-1 h-4 w-4 shrink-0 rounded-full border-4 border-white bg-blue-500 ring-1 ring-blue-200" />
                    <div className="min-w-0"><div className="text-sm font-semibold text-slate-800">{activity.action}</div>{activity.description && <p className="mt-1 text-sm text-slate-500">{activity.description}</p>}<div className="mt-1 text-xs text-slate-400">{activity.userName || "System"} · {formatDateTime(activity.createdAt)}</div></div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

const smallInputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400";

function Card({ title, icon: Icon, action, children }: { title: string; icon?: typeof Building2; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-semibold text-slate-900">{Icon && <Icon size={18} className="text-blue-600" />}{title}</h2>{action}</div>{children}</section>;
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{children}</span>;
}

function Detail({ icon: Icon, label, value, link = false }: { icon: typeof Building2; label: string; value?: string | null; link?: boolean }) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 py-3 first:pt-0 last:border-0 last:pb-0">
      <Icon size={17} className="mt-0.5 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
        {link && value ? <a href={value} target="_blank" rel="noreferrer" className="mt-0.5 block truncate text-sm text-blue-600 hover:underline">{value}</a> : <div className="mt-0.5 break-words text-sm text-slate-700">{value || "—"}</div>}
      </div>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
