import { useState, useEffect } from "react";
import type { Team, User } from "../data/mock";
import { MOCK_TEAMS, MOCK_USERS } from "../data/mock";
import { teamsApi, usersApi } from "../api/services";
import { Button, Card, Modal, Input } from "../components/ui";

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS);
  const [usersList, setUsersList] = useState<User[]>(MOCK_USERS);
  const [manageTeam, setManageTeam] = useState<Team | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });

  useEffect(() => {
    teamsApi.getTeams()
      .then((data) => { if (data && data.length > 0) setTeams(data); })
      .catch(() => {});
    usersApi.getUsers()
      .then((data) => { if (data && data.length > 0) setUsersList(data); })
      .catch(() => {});
  }, []);

  const developers = usersList.filter((u) => u.role === "Developer");

  async function toggleMember(teamId: number, userId: number) {
    const team = teams.find((t) => t.id === teamId);
    const hasMember = team?.memberIds.includes(userId);

    try {
      if (hasMember) {
        await teamsApi.removeTeamMember(teamId, userId);
      } else {
        await teamsApi.addTeamMember(teamId, userId);
      }
    } catch {}

    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== teamId) return t;
        const exists = t.memberIds.includes(userId);
        return {
          ...t,
          memberIds: exists ? t.memberIds.filter((id) => id !== userId) : [...t.memberIds, userId],
        };
      })
    );
    if (manageTeam?.id === teamId) {
      setManageTeam((t) => {
        if (!t) return t;
        const exists = t.memberIds.includes(userId);
        return { ...t, memberIds: exists ? t.memberIds.filter((id) => id !== userId) : [...t.memberIds, userId] };
      });
    }
  }

  async function handleCreate() {
    try {
      await teamsApi.createTeam(createForm.name, createForm.description, []);
      const updated = await teamsApi.getTeams();
      setTeams(updated);
    } catch {
      const newTeam: Team = { id: teams.length + 1, name: createForm.name, description: createForm.description, memberIds: [] };
      setTeams((prev) => [...prev, newTeam]);
    }
    setShowCreate(false);
    setCreateForm({ name: "", description: "" });
  }


  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)}>+ Create Team</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {teams.map((team) => {
          const members = usersList.filter((u) => team.memberIds.includes(u.id));
          return (
            <Card key={team.id} style={{ padding: 24 }}>
              <div className="flex items-start justify-between mb-2">
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--color-foreground)" }}>
                  {team.name}
                </h3>
                <Button size="sm" variant="secondary" onClick={() => setManageTeam(team)}>Manage</Button>
              </div>
              <p className="text-sm mb-4" style={{ color: "var(--color-muted-foreground)" }}>{team.description}</p>

              <div className="flex items-center gap-2 flex-wrap">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs" style={{ background: "#f1f5f9", color: "var(--color-foreground)" }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold" style={{ background: "#1a3896", fontSize: 8, fontFamily: "var(--font-display)" }}>
                      {member.avatar}
                    </div>
                    {member.fullName.split(" ")[0]}
                  </div>
                ))}
                {members.length === 0 && (
                  <span className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>No members yet</span>
                )}
              </div>

              <div className="mt-3 pt-3 border-t text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }}>
                {members.length} member{members.length !== 1 ? "s" : ""}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Manage Members Drawer */}
      {manageTeam && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(15,23,42,0.4)" }} onClick={() => setManageTeam(null)}>
          <div className="w-full max-w-sm h-full overflow-y-auto p-8" style={{ background: "white" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>{manageTeam.name}</h2>
              <button onClick={() => setManageTeam(null)} style={{ fontSize: 22, color: "var(--color-muted-foreground)" }}>×</button>
            </div>
            <p className="text-sm mb-6" style={{ color: "var(--color-muted-foreground)" }}>{manageTeam.description}</p>
            <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ fontFamily: "var(--font-display)", color: "var(--color-muted-foreground)" }}>
              Developers
            </div>
            <div className="space-y-2">
              {developers.map((dev) => {
                const isMember = manageTeam.memberIds.includes(dev.id);
                return (
                  <div key={dev.id} className="flex items-center justify-between p-3 rounded-xl" style={{ border: "1px solid var(--color-border)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold" style={{ background: isMember ? "#1a3896" : "#94a3b8", fontFamily: "var(--font-display)", fontSize: 13 }}>
                        {dev.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{dev.fullName}</div>
                        <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{dev.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleMember(manageTeam.id, dev.id)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                      style={isMember ? { background: "#fee2e2", color: "#b91c1c" } : { background: "#dcfce7", color: "#15803d" }}
                    >
                      {isMember ? "Remove" : "Add"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreate && (
        <Modal title="Create Team" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Team Name</label>
              <Input value={createForm.name} onChange={(v) => setCreateForm((f) => ({ ...f, name: v }))} placeholder="e.g. Mobile Team" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Description</label>
              <textarea
                rows={2}
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: "1px solid var(--color-border)", fontFamily: "var(--font-body)", resize: "vertical" }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!createForm.name}>Create Team</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
