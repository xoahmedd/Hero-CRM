import { Building2, Mail, Phone, Plus, Search, UserRound, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState, ErrorState, LoadingState } from "../components/FeedbackState";
import { getDepartments } from "../services/departmentService";
import { createPerson, getPeople } from "../services/peopleService";
import type { Department } from "../types/department";
import type { Person } from "../types/people";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

export default function PeoplePage() {
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ departmentId: "", name: "", jobTitle: "", email: "", phone: "", isPrimary: false });

  useEffect(() => {
    void getDepartments().then(setDepartments).catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        setPeople(await getPeople({
          search: search.trim() || undefined,
          departmentId: departmentId ? Number(departmentId) : undefined,
        }));
      } catch (requestError: any) {
        setError(requestError?.response?.data?.message || "Unable to load people.");
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search, departmentId, reloadKey]);

  const primaryCount = useMemo(() => people.filter((person) => person.isPrimary).length, [people]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !Number(form.departmentId)) return;
    try {
      setSaving(true);
      const person = await createPerson({
        departmentId: Number(form.departmentId),
        name: form.name.trim(),
        jobTitle: form.jobTitle.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        isPrimary: form.isPrimary,
      });
      setCreateOpen(false);
      setForm({ departmentId: "", name: "", jobTitle: "", email: "", phone: "", isPrimary: false });
      navigate(`/people/${person.id}`);
    } catch (requestError: any) {
      alert(requestError?.response?.data?.message || "Unable to create person.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">People</h1>
          <p className="mt-1 text-sm text-slate-500">CRM profiles for the people connected to your departments and projects.</p>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          <Plus size={17} /> Add person
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Visible people" value={people.length} />
        <Stat label="Primary contacts" value={primaryCount} />
        <Stat label="Departments" value={departments.length} />
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_240px]">
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <Search size={18} className="text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, role, email, phone or department..." className="ml-2 w-full bg-transparent text-sm outline-none" />
        </div>
        <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className={inputClass}>
          <option value="">All departments</option>
          {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
        </select>
      </div>

      {error && <ErrorState description={error} onRetry={() => setReloadKey((value) => value + 1)} />}
      {loading ? <LoadingState label="Loading people..." /> : people.length === 0 ? (
        <EmptyState icon={UsersRound} title="No people found" description="Add a person to a department or change the current filters." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {people.map((person) => (
              <button key={person.id} type="button" onClick={() => navigate(`/people/${person.id}`)} className="grid w-full gap-3 px-5 py-4 text-left hover:bg-slate-50 md:grid-cols-[minmax(220px,1fr)_minmax(200px,1fr)_minmax(180px,1fr)] md:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600"><UserRound size={18} /></div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><span className="truncate font-semibold text-slate-900">{person.name}</span>{person.isPrimary && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Primary</span>}</div>
                    <div className="truncate text-sm text-slate-500">{person.jobTitle || "Contact"}</div>
                  </div>
                </div>
                <div className="min-w-0 space-y-1 text-sm text-slate-500">
                  {person.email && <div className="flex items-center gap-2"><Mail size={14} /><span className="truncate">{person.email}</span></div>}
                  {person.phone && <div className="flex items-center gap-2"><Phone size={14} />{person.phone}</div>}
                  {!person.email && !person.phone && <span className="text-slate-400">No contact details</span>}
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600"><Building2 size={16} className="text-slate-400" /><span className="truncate">{person.departmentName}</span></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={() => setCreateOpen(false)}>
          <form onSubmit={handleCreate} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-900">Add person</h2><p className="mt-1 text-sm text-slate-500">Create a CRM profile connected to a department.</p></div><button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <select required value={form.departmentId} onChange={(event) => setForm((value) => ({ ...value, departmentId: event.target.value }))} className={`${inputClass} sm:col-span-2`}><option value="">Select department *</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select>
              <input required maxLength={150} value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} placeholder="Name *" className={inputClass} />
              <input maxLength={150} value={form.jobTitle} onChange={(event) => setForm((value) => ({ ...value, jobTitle: event.target.value }))} placeholder="Job title" className={inputClass} />
              <input type="email" maxLength={150} value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} placeholder="Email" className={inputClass} />
              <input maxLength={30} value={form.phone} onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} placeholder="Phone" className={inputClass} />
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={form.isPrimary} onChange={(event) => setForm((value) => ({ ...value, isPrimary: event.target.checked }))} /> Primary contact for this department</label>
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setCreateOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button><button type="submit" disabled={saving || !form.name.trim() || !form.departmentId} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Creating..." : "Create person"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-2xl font-bold text-slate-900">{value}</div><div className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div></div>;
}
