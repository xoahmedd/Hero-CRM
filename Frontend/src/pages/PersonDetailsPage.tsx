import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Edit3,
  FolderKanban,
  Mail,
  MessageSquareText,
  Phone,
  Plus,
  Save,
  Tag as TagIcon,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ErrorState, LoadingState } from "../components/FeedbackState";
import { useAuth } from "../providers/AuthProvider";
import { getDepartments } from "../services/departmentService";
import {
  assignPersonTag,
  createPersonNote,
  createPersonTag,
  deletePerson,
  deletePersonNote,
  getPerson,
  getPersonNotes,
  getPersonProjects,
  getPersonTagCatalog,
  getPersonTags,
  getPersonTimeline,
  removePersonTag,
  updatePerson,
} from "../services/peopleService";
import type { Department } from "../types/department";
import type { PersonActivity, PersonDetails, PersonNote, PersonProject, PersonTag } from "../types/people";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

export default function PersonDetailsPage() {
  const { id } = useParams();
  const personId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [notes, setNotes] = useState<PersonNote[]>([]);
  const [tags, setTags] = useState<PersonTag[]>([]);
  const [tagCatalog, setTagCatalog] = useState<PersonTag[]>([]);
  const [projects, setProjects] = useState<PersonProject[]>([]);
  const [timeline, setTimeline] = useState<PersonActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#2563eb");
  const [tagBusy, setTagBusy] = useState(false);
  const [form, setForm] = useState({ departmentId: "", name: "", jobTitle: "", email: "", phone: "", isPrimary: false });

  async function loadAll() {
    if (!Number.isFinite(personId) || personId <= 0) {
      setError("Invalid person ID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const [personData, departmentData, noteData, tagData, catalogData, projectData, timelineData] = await Promise.all([
        getPerson(personId),
        getDepartments(),
        getPersonNotes(personId),
        getPersonTags(personId),
        getPersonTagCatalog(),
        getPersonProjects(personId),
        getPersonTimeline(personId),
      ]);
      setPerson(personData);
      setDepartments(departmentData);
      setNotes(noteData);
      setTags(tagData);
      setTagCatalog(catalogData);
      setProjects(projectData);
      setTimeline(timelineData);
      setForm({
        departmentId: String(personData.departmentId),
        name: personData.name,
        jobTitle: personData.jobTitle || "",
        email: personData.email || "",
        phone: personData.phone || "",
        isPrimary: personData.isPrimary,
      });
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Unable to load person profile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId]);

  const unassignedTags = useMemo(() => tagCatalog.filter((tag) => !tags.some((item) => item.id === tag.id)), [tagCatalog, tags]);
  const canDeleteAnyNote = user?.roles.includes("Admin") ?? false;

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!person || !form.name.trim() || !Number(form.departmentId)) return;
    try {
      setSaving(true);
      await updatePerson(person.id, {
        departmentId: Number(form.departmentId),
        name: form.name.trim(),
        jobTitle: form.jobTitle.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        isPrimary: form.isPrimary,
      });
      setEditOpen(false);
      await loadAll();
    } catch (requestError: any) {
      alert(requestError?.response?.data?.message || "Unable to update person.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePerson() {
    if (!person || !window.confirm(`Delete ${person.name}'s CRM profile? This also removes their person notes and tag assignments.`)) return;
    try {
      await deletePerson(person.id);
      navigate("/people");
    } catch (requestError: any) {
      alert(requestError?.response?.data?.message || "Unable to delete person.");
    }
  }

  async function handleAddNote(event: React.FormEvent) {
    event.preventDefault();
    const content = noteText.trim();
    if (!content) return;
    try {
      setNoteBusy(true);
      await createPersonNote(personId, content);
      setNoteText("");
      await loadAll();
    } catch (requestError: any) {
      alert(requestError?.response?.data?.message || "Unable to add note.");
    } finally {
      setNoteBusy(false);
    }
  }

  async function handleDeleteNote(note: PersonNote) {
    if (!window.confirm("Delete this note?")) return;
    try {
      await deletePersonNote(personId, note.id);
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
      await assignPersonTag(personId, tagId);
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
      const created = await createPersonTag({ name, color: newTagColor });
      await assignPersonTag(personId, created.id);
      setNewTagName("");
      await loadAll();
    } catch (requestError: any) {
      alert(requestError?.response?.data?.message || "Unable to create tag.");
    } finally {
      setTagBusy(false);
    }
  }

  async function handleRemoveTag(tag: PersonTag) {
    try {
      setTagBusy(true);
      await removePersonTag(personId, tag.id);
      await loadAll();
    } catch (requestError: any) {
      alert(requestError?.response?.data?.message || "Unable to remove tag.");
    } finally {
      setTagBusy(false);
    }
  }

  if (loading) return <LoadingState label="Loading person profile..." />;
  if (error || !person) return <ErrorState title="Person could not be loaded" description={error || "Person not found."} onRetry={() => void loadAll()} />;

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => navigate("/people")} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"><ArrowLeft size={17} /> Back to People</button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><UserRound size={28} /></div>
          <div>
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{person.name}</h1>{person.isPrimary && <Pill>Primary contact</Pill>}</div>
            <p className="mt-1 text-sm text-slate-500">{person.jobTitle || "Contact"} · {person.departmentName}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate(`/follow-ups?contactId=${person.id}`)} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"><CalendarClock size={16} /> Follow-ups</button>
          <button type="button" onClick={() => setEditOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Edit3 size={16} /> Edit profile</button>
          <button type="button" onClick={() => void handleDeletePerson()} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"><Trash2 size={16} /> Delete</button>
        </div>
      </div>

      {editOpen && (
        <form onSubmit={handleSave} className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-slate-900">Edit CRM profile</h2><button type="button" onClick={() => setEditOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button></div>
          <div className="grid gap-3 md:grid-cols-2">
            <select required value={form.departmentId} onChange={(event) => setForm((value) => ({ ...value, departmentId: event.target.value }))} className={inputClass}><option value="">Select department *</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select>
            <input required maxLength={150} value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} placeholder="Name *" className={inputClass} />
            <input maxLength={150} value={form.jobTitle} onChange={(event) => setForm((value) => ({ ...value, jobTitle: event.target.value }))} placeholder="Job title" className={inputClass} />
            <input type="email" maxLength={150} value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} placeholder="Email" className={inputClass} />
            <input maxLength={30} value={form.phone} onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} placeholder="Phone" className={inputClass} />
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={form.isPrimary} onChange={(event) => setForm((value) => ({ ...value, isPrimary: event.target.checked }))} /> Primary contact for this department</label>
          <div className="mt-4 flex justify-end"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={16} /> {saving ? "Saving..." : "Save changes"}</button></div>
        </form>
      )}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card title="Contact details">
            <Detail icon={Building2} label="Department"><Link to={`/departments/${person.departmentId}`} className="text-blue-600 hover:underline">{person.departmentName}</Link></Detail>
            <Detail icon={Mail} label="Email">{person.email ? <a className="text-blue-600 hover:underline" href={`mailto:${person.email}`}>{person.email}</a> : "—"}</Detail>
            <Detail icon={Phone} label="Phone">{person.phone || "—"}</Detail>
          </Card>

          <Card title="Tags" icon={TagIcon}>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 && <span className="text-sm text-slate-400">No person tags yet.</span>}
              {tags.map((tag) => <span key={tag.id} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tag.color || "#94a3b8" }} />{tag.name}<button type="button" disabled={tagBusy} onClick={() => void handleRemoveTag(tag)} className="ml-1 text-slate-400 hover:text-red-500"><X size={12} /></button></span>)}
            </div>
            <div className="mt-4 flex gap-2"><select value={selectedTagId} onChange={(event) => setSelectedTagId(event.target.value)} className={`${inputClass} min-w-0 flex-1`}><option value="">Assign tag...</option>{unassignedTags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select><button type="button" disabled={!selectedTagId || tagBusy} onClick={() => void handleAssignTag()} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Add</button></div>
            <div className="mt-3 grid grid-cols-[1fr_46px_auto] gap-2"><input value={newTagName} onChange={(event) => setNewTagName(event.target.value)} placeholder="New person tag" className={inputClass} /><input type="color" value={newTagColor} onChange={(event) => setNewTagColor(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white p-1" /><button type="button" disabled={!newTagName.trim() || tagBusy} onClick={() => void handleCreateTag()} className="rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 disabled:opacity-40">Create</button></div>
          </Card>

          <Card title={`Related projects (${projects.length})`} icon={FolderKanban}>
            {projects.length === 0 ? <p className="text-sm text-slate-400">No projects linked through this department.</p> : <div className="space-y-2">{projects.map((project) => <Link key={project.id} to={`/projects/${project.id}`} className="block rounded-xl border border-slate-100 p-3 hover:bg-slate-50"><div className="font-medium text-slate-800">{project.name}</div><div className="mt-1 text-xs text-slate-400">{project.status} · {project.priority}{project.dueDate ? ` · due ${formatDate(project.dueDate)}` : ""}</div></Link>)}</div>}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title={`CRM notes (${notes.length})`} icon={MessageSquareText}>
            <form onSubmit={handleAddNote} className="mb-5"><textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} rows={3} maxLength={4000} placeholder="Add context, preferences, decisions, relationship notes or next-step details..." className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /><div className="mt-2 flex justify-end"><button type="submit" disabled={!noteText.trim() || noteBusy} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"><Plus size={15} />{noteBusy ? "Adding..." : "Add note"}</button></div></form>
            {notes.length === 0 ? <p className="text-sm text-slate-400">No notes yet.</p> : <div className="space-y-3">{notes.map((note) => { const canDelete = canDeleteAnyNote || note.userId === user?.userId; return <div key={note.id} className="rounded-xl bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div className="text-sm font-semibold text-slate-700">{note.userName}</div>{canDelete && <button type="button" onClick={() => void handleDeleteNote(note)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{note.content}</p><div className="mt-2 text-xs text-slate-400">{formatDateTime(note.createdAt)}</div></div>; })}</div>}
          </Card>

          <Card title="Activity timeline" icon={CalendarClock}>
            {timeline.length === 0 ? <p className="text-sm text-slate-400">No person activity recorded yet.</p> : <div>{timeline.map((activity, index) => <div key={activity.id} className="relative flex gap-4 pb-5 last:pb-0">{index < timeline.length - 1 && <div className="absolute left-[7px] top-4 h-full w-px bg-slate-200" />}<div className="relative mt-1 h-4 w-4 shrink-0 rounded-full border-4 border-white bg-blue-500 ring-1 ring-blue-200" /><div className="min-w-0"><div className="text-sm font-semibold text-slate-800">{activity.action}</div>{activity.description && <p className="mt-1 text-sm text-slate-500">{activity.description}</p>}<div className="mt-1 text-xs text-slate-400">{activity.userName || "System"} · {formatDateTime(activity.createdAt)}</div></div></div>)}</div>}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon?: typeof UserRound; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">{Icon && <Icon size={18} className="text-blue-600" />}{title}</h2>{children}</section>;
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{children}</span>;
}

function Detail({ icon: Icon, label, children }: { icon: typeof UserRound; label: string; children: React.ReactNode }) {
  return <div className="flex items-start gap-3 border-b border-slate-100 py-3 first:pt-0 last:border-0 last:pb-0"><Icon size={17} className="mt-0.5 shrink-0 text-slate-400" /><div className="min-w-0"><div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div><div className="mt-0.5 break-words text-sm text-slate-700">{children}</div></div></div>;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}
