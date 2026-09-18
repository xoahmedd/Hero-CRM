import { useState, useEffect } from "react";
import type { User, Role } from "../data/mock";
import { MOCK_USERS } from "../data/mock";
import { usersApi } from "../api/services";
import { Button, Card, Input, Modal, Select, Table } from "../components/ui";

const ROLES: Role[] = ["Admin", "Developer"];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [showCreate, setShowCreate] = useState(false);
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {users.map((user) => (
          <Card key={user.id} style={{ padding: 20 }}>
            <div className="flex items-start justify-between mb-3">
              <div
                className="flex items-center justify-center rounded-full text-white font-bold"
                style={{ width: 48, height: 48, background: user.isActive ? "#1a3896" : "#94a3b8", fontFamily: "var(--font-display)", fontSize: 16 }}
              >
                {user.avatar}
              </div>
              {/* Toggle switch */}
              <button
                onClick={() => toggleActive(user.id)}
                className="relative inline-flex items-center rounded-full transition-colors"
                style={{ width: 36, height: 20, background: user.isActive ? "#1a3896" : "#cbd5e1" }}
              >
                <span
                  className="inline-block rounded-full bg-white shadow transition-transform"
                  style={{ width: 14, height: 14, transform: user.isActive ? "translateX(18px)" : "translateX(3px)" }}
                />
              </button>
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
    </div>
  );
}
