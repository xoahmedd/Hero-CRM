import { useState, useEffect } from "react";
import type { User, Role } from "../data/mock";
import { MOCK_USERS } from "../data/mock";
import { usersApi } from "../api/services";
import { Button, Card, Input, Modal, Select, Table } from "../components/ui";

const ROLES: Role[] = ["Admin", "Developer"];

export default function UsersPage({ currentUser }: { currentUser?: User }) {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [showCreate, setShowCreate] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", role: "Developer" as Role, avatar: "" });

  useEffect(() => {
    usersApi.getUsers()
      .then((data) => { if (data && data.length > 0) setUsers(data); })
      .catch(() => {});
  }, []);

  async function handleCreate() {
    try {
      await usersApi.createUser({
        fullName: form.fullName,
        email: form.email,
        role: form.role,
        isActive: true,
      });
      const updated = await usersApi.getUsers();
      setUsers(updated);
    } catch {
      const initials = form.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
      const newUser: User = {
        id: users.length + 1,
        fullName: form.fullName,
        email: form.email,
        role: form.role,
        avatar: initials,
        isActive: true,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setUsers((prev) => [...prev, newUser]);
    }
    setShowCreate(false);
    setForm({ fullName: "", email: "", role: "Developer", avatar: "" });
  }

  async function handleDeleteUser() {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await usersApi.deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete user:", err);
      alert(err?.message || "Failed to delete user.");
    } finally {
      setDeleting(false);
    }
  }

  async function toggleActive(id: number) {
    const target = users.find((u) => u.id === id);
    if (target) {
      try {
        await usersApi.updateUser(id, { ...target, isActive: !target.isActive });
      } catch {}
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u)));
  }

  const roleColors: Record<Role, { bg: string; color: string }> = {
    Admin: { bg: "#dce8ff", color: "#1a3896" },
    Developer: { bg: "#dcfce7", color: "#15803d" },
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)}>+ Create User</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {users.map((user) => (
          <Card key={user.id} style={{ padding: "24px 26px" }}>
            <div className="flex items-start justify-between mb-3">
              <div
                className="flex items-center justify-center rounded-full text-white font-bold"
                style={{ width: 48, height: 48, background: user.isActive ? "#1a3896" : "#94a3b8", fontFamily: "var(--font-display)", fontSize: 16 }}
              >
                {user.avatar}
              </div>
              {/* Toggle switch and delete button */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => toggleActive(user.id)}
                  title={user.isActive ? "Active (click to deactivate)" : "Inactive (click to activate)"}
                  className="relative inline-flex items-center rounded-full transition-colors cursor-pointer"
                  style={{ width: 36, height: 20, background: user.isActive ? "#1a3896" : "#cbd5e1" }}
                >
                  <span
                    className="inline-block rounded-full bg-white shadow transition-transform"
                    style={{ width: 14, height: 14, transform: user.isActive ? "translateX(18px)" : "translateX(3px)" }}
                  />
                </button>
                {currentUser?.id !== user.id && (
                  <button
                    onClick={() => setUserToDelete(user)}
                    title="Delete user"
                    className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="font-semibold text-sm mb-0.5" style={{ fontFamily: "var(--font-display)", color: "var(--color-foreground)" }}>
              {user.fullName}
            </div>
            <div className="text-xs mb-2" style={{ color: "var(--color-muted-foreground)" }}>{user.email}</div>
            <div className="flex items-center justify-between">
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ ...roleColors[user.role], fontFamily: "var(--font-mono)" }}
              >
                {user.role}
              </span>
              <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>
                {user.createdAt}
              </span>
            </div>
            {!user.isActive && (
              <div className="mt-2 text-xs px-2 py-1 rounded text-center" style={{ background: "#fee2e2", color: "#b91c1c" }}>
                Inactive
              </div>
            )}
          </Card>
        ))}
      </div>

      {showCreate && (
        <Modal title="Create User" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Full Name</label>
              <Input value={form.fullName} onChange={(v) => setForm((f) => ({ ...f, fullName: v }))} placeholder="Jane Smith" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Email</label>
              <Input type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="jane@herocrm.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Role</label>
              <Select value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v as Role }))} options={ROLES.map((r) => ({ value: r, label: r }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!form.fullName || !form.email}>Create User</Button>
            </div>
          </div>
        </Modal>
      )}

      {userToDelete && (
        <Modal title="Delete User" onClose={() => !deleting && setUserToDelete(null)}>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-sm">
              ⚠️ <strong>Warning:</strong> Are you sure you want to delete <strong>{userToDelete.fullName}</strong> ({userToDelete.email})?
              <p className="mt-1 text-xs text-rose-700">
                This will permanently delete their account and unassign them from any active projects and tasks.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setUserToDelete(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button
                onClick={handleDeleteUser}
                disabled={deleting}
                style={{ background: "#dc2626", borderColor: "#dc2626", color: "white" }}
              >
                {deleting ? "Deleting..." : "Delete User"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
