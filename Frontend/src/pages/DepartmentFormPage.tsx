import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { LoadingState } from "../components/FeedbackState";
import { createDepartment, getDepartment, updateDepartment } from "../services/departmentService";
import { getUsers } from "../services/userService";
import type { AppUser } from "../types/auth";

const STATUSES = ["Active", "Inactive"];

export default function DepartmentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const departmentId = id ? Number(id) : null;
  const isEdit = departmentId !== null;

  const [users, setUsers] = useState<AppUser[]>([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("Active");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getUsers().then(setUsers).catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    if (!departmentId || !Number.isFinite(departmentId)) {
      setError("Invalid department ID.");
      setLoading(false);
      return;
    }

    getDepartment(departmentId)
      .then((department) => {
        setName(department.name);
        setStatus(department.status || "Active");
        setEmail(department.email || "");
        setPhone(department.phone || "");
        setWebsite(department.website || "");
        setAddress(department.address || "");
        setOwnerId(department.ownerId ? String(department.ownerId) : "");
      })
      .catch((requestError: any) => setError(requestError?.response?.data?.message || "Unable to load department."))
      .finally(() => setLoading(false));
  }, [departmentId, isEdit]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Department name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload = {
        name: name.trim(),
        status,
        email: email.trim() || null,
        phone: phone.trim() || null,
        website: website.trim() || null,
        address: address.trim() || null,
        ownerId: ownerId ? Number(ownerId) : null,
      };

      if (isEdit && departmentId) {
        await updateDepartment(departmentId, payload);
        navigate(`/departments/${departmentId}`);
      } else {
        const created = await createDepartment(payload);
        navigate(`/departments/${created.id}`);
      }
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || `Unable to ${isEdit ? "update" : "create"} department.`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading department..." />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button type="button" onClick={() => navigate(isEdit && departmentId ? `/departments/${departmentId}` : "/departments")} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft size={17} /> Back to Departments
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{isEdit ? "Edit Department" : "New Department"}</h1>
        <p className="mt-1 text-sm text-slate-500">Create an internal Hero department that can sponsor projects and submit IT requests.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Department name" required>
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={150} placeholder="Example: Marketing" className={inputClass} />
          </Field>
          <Field label="Owner">
            <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)} className={inputClass}>
              <option value="">Unassigned</option>
              {users.map((user) => <option key={user.userId} value={user.userId}>{user.fullName} — {user.email}</option>)}
            </select>
          </Field>
          <Field label="Status" required>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
              {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="Department email">
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={150} placeholder="marketing@hero.com" className={inputClass} />
          </Field>
          <Field label="Department phone">
            <input value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={30} className={inputClass} />
          </Field>
          <Field label="Internal page / website">
            <input type="url" value={website} onChange={(event) => setWebsite(event.target.value)} maxLength={300} placeholder="https://..." className={inputClass} />
          </Field>
        </div>

        <Field label="Location / office notes">
          <input value={address} onChange={(event) => setAddress(event.target.value)} maxLength={300} placeholder="Head office - Cairo" className={inputClass} />
        </Field>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => navigate("/departments")} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            <Save size={17} /> {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Department"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

function Field({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">{label}{required ? " *" : ""}</span>{children}</label>;
}
