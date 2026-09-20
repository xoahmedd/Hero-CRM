import { KeyRound, Pencil, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { getErrorMessage } from "../lib/errors";
import {
  createManagedUser,
  getManagedUsers,
  resetManagedUserPassword,
  updateManagedUser,
} from "../services/userManagementService";
import type {
  CreateManagedUserRequest,
  ManagedUser,
  UpdateManagedUserRequest,
  WorkspaceRole,
} from "../types/userManagement";

const ROLES: WorkspaceRole[] = ["Admin", "User"];

type FormState = {
  fullName: string;
  email: string;
  password: string;
  role: WorkspaceRole;
  profileImage: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  fullName: "",
  email: "",
  password: "",
  role: "User",
  profileImage: "",
  isActive: true,
};

function primaryRole(user: ManagedUser): WorkspaceRole {
  return user.roles.includes("Admin") ? "Admin" : "User";
}

export default function UsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [resetUser, setResetUser] = useState<ManagedUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");
      setUsers(await getManagedUsers());
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load users."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return users;
    return users.filter(
      (user) =>
        user.fullName.toLowerCase().includes(value) ||
        user.email.toLowerCase().includes(value) ||
        primaryRole(user).toLowerCase().includes(value)
    );
  }, [query, users]);

  function openCreate() {
    setSelected(null);
    setForm(emptyForm);
    setActionError("");
    setModal("create");
  }

  function openEdit(user: ManagedUser) {
    setSelected(user);
    setForm({
      fullName: user.fullName,
      email: user.email,
      password: "",
      role: primaryRole(user),
      profileImage: user.profileImage ?? "",
      isActive: user.isActive,
    });
    setActionError("");
    setModal("edit");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      setSaving(true);
      setActionError("");

      if (modal === "create") {
        const request: CreateManagedUserRequest = {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          departmentId: null,
          profileImage: form.profileImage.trim() || null,
        };
        const created = await createManagedUser(request);
        setUsers((current) => [...current, created]);
      } else if (selected) {
        const request: UpdateManagedUserRequest = {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          role: form.role,
          departmentId: null,
          isActive: form.isActive,
          profileImage: form.profileImage.trim() || null,
        };
        const updated = await updateManagedUser(selected.userId, request);
        setUsers((current) =>
          current.map((user) => (user.userId === updated.userId ? updated : user))
        );
      }

      setModal(null);
      setSelected(null);
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, "Unable to save this account."));
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(event: FormEvent) {
    event.preventDefault();
    if (!resetUser) return;
    try {
      setResetting(true);
      setActionError("");
      await resetManagedUserPassword(resetUser.userId, newPassword);
      setResetUser(null);
      setNewPassword("");
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, "Unable to reset password."));
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Users</h1>
          <p className="mt-1 text-sm text-slate-500">
            Admins create and manage the accounts that work on projects and tasks.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={17} /> Add user
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total accounts</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{users.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Admins</p>
          <p className="mt-2 text-3xl font-bold text-violet-700">
            {users.filter((user) => primaryRole(user) === "Admin").length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Users</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">
            {users.filter((user) => primaryRole(user) === "User").length}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-xl">
            <Search size={17} className="absolute left-3 top-3 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading users...</div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600">{error}</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((user) => {
              const role = primaryRole(user);
              return (
                <div key={user.userId} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{user.fullName}</p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${role === "Admin" ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700"}`}>
                          {role}
                        </span>
                        {!user.isActive && (
                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">Inactive</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{user.email}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {user.assignedTaskCount} tasks · {user.projectCount} projects · {user.teamCount} teams
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setResetUser(user)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" title="Reset password">
                      <KeyRound size={16} />
                    </button>
                    <button type="button" onClick={() => openEdit(user)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" title="Edit user">
                      <Pencil size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4">
          <form onSubmit={submit} className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{modal === "create" ? "Add user" : "Edit account"}</h2>
                <p className="mt-1 text-sm text-slate-500">Only Admin and User roles are used.</p>
              </div>
              <button type="button" onClick={() => setModal(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="space-y-4 p-5">
              {actionError && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{actionError}</div>}
              <input required value={form.fullName} onChange={(e) => setForm((v) => ({ ...v, fullName: e.target.value }))} placeholder="Full name" className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              <input required type="email" value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} placeholder="Email" className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              {modal === "create" && (
                <input required type="password" minLength={6} value={form.password} onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))} placeholder="Temporary password" className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Role
                  <select value={form.role} onChange={(e) => setForm((v) => ({ ...v, role: e.target.value as WorkspaceRole }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                    {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </label>
                {modal === "edit" && (
                  <label className="text-sm font-medium text-slate-700">
                    Status
                    <select value={form.isActive ? "active" : "inactive"} onChange={(e) => setForm((v) => ({ ...v, isActive: e.target.value === "active" }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                )}
              </div>
              <input value={form.profileImage} onChange={(e) => setForm((v) => ({ ...v, profileImage: e.target.value }))} placeholder="Profile image URL (optional)" className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 p-4">
              <button type="button" onClick={() => setModal(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </div>
      )}

      {resetUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 p-4">
          <form onSubmit={resetPassword} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center gap-2"><KeyRound size={19} className="text-blue-600" /><h2 className="font-bold text-slate-900">Reset password</h2></div>
            <p className="mb-4 text-sm text-slate-500">Set a new password for {resetUser.fullName}.</p>
            <input required minLength={6} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setResetUser(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
              <button type="submit" disabled={resetting} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">{resetting ? "Resetting..." : "Reset password"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
