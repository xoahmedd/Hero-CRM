import { useState, useEffect } from "react";
import type { Project, Priority, ProjectStatus, User } from "../data/mock";
import { MOCK_PROJECTS, MOCK_USERS, MOCK_TASKS } from "../data/mock";
import { projectsApi, usersApi } from "../api/services";
import { Badge, Button, Card, EmptyState, Input, Modal, ProgressBar, Select } from "../components/ui";

const REASON_CATEGORIES = [
  "Resource Constraints",
  "Scope Creep",
  "Third-Party Blocker",
  "Technical Difficulty",
  "Client Delay",
  "Other",
];

export const PROJECT_STATUSES: ProjectStatus[] = ["In Progress", "Finished", "Cancelled"];

interface Props {
  currentUser: User;
  onViewProject: (id: number) => void;
}

export default function ProjectsPage({ currentUser, onViewProject }: Props) {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [usersList, setUsersList] = useState<User[]>(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  useEffect(() => {
    projectsApi
      .getProjects()
      .then((data) => {
        if (data && data.length > 0) setProjects(data);
      })
      .catch(() => {});
    usersApi
      .getUsers()
      .then((data) => {
        if (data && data.length > 0) setUsersList(data);
      })
      .catch(() => {});
  }, []);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showReason, setShowReason] = useState<Project | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState<{
    name: string;
    description: string;
    status: ProjectStatus;
    priority: Priority;
    startDate: string;
    dueDate: string;
    memberIds: number[];
    requestingDepartment: string;
  }>({
    name: "",
    description: "",
    status: "In Progress",
    priority: "Medium",
    startDate: "",
    dueDate: "",
    memberIds: [],
    requestingDepartment: "Engineering",
  });

  // Reason form
  const [reasonForm, setReasonForm] = useState({
    reason: "",
    category: "Resource Constraints",
  });

  const isAdmin = currentUser.role === "Admin";

  const assignedProjects = isAdmin
    ? projects
    : projects.filter(
        (p) =>
          p.ownerId === currentUser.id ||
          p.members?.some((m) => m.userId === currentUser.id) ||
          p.memberIds?.includes(currentUser.id)
      );

  const filtered = assignedProjects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.ownerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.members || []).some((m) => m.fullName.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    const matchPriority = priorityFilter === "All" || p.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  async function handleCreate() {
    if (createForm.memberIds.length === 0) {
      alert("Please select at least one developer.");
      return;
    }
    try {
      await projectsApi.createProject({
        name: createForm.name,
        description: createForm.description,
        status: createForm.status,
        priority: createForm.priority,
        startDate: createForm.startDate,
        dueDate: createForm.dueDate,
        memberIds: createForm.memberIds,
        requestingDepartment: createForm.requestingDepartment,
      });
      const updated = await projectsApi.getProjects();
      setProjects(updated);
    } catch {
      const selectedDevs = usersList.filter((u) => createForm.memberIds.includes(u.id));
      const newProject: Project = {
        id: projects.length + 1,
        ...createForm,
        ownerId: createForm.memberIds[0] || currentUser.id,
        ownerName: selectedDevs.map((d) => d.fullName).join(", "),
        members: selectedDevs.map((d) => ({
          userId: d.id,
          fullName: d.fullName,
          email: d.email,
          avatar: d.avatar,
        })),
        memberIds: createForm.memberIds,
        customerId: 1,
        customerName: "Apex Dynamics",
        missedDeadlineReason: null,
        reasonCategory: null,
        progress: 0,
        status: createForm.status as Project["status"],
        priority: createForm.priority as Project["priority"],
      };
      setProjects((prev) => [newProject, ...prev]);
    }
    setShowCreate(false);
    setCreateForm({
      name: "",
      description: "",
      status: "In Progress",
      priority: "Medium",
      startDate: "",
      dueDate: "",
      memberIds: [],
      requestingDepartment: "Engineering",
    });
  }

  async function handleSubmitReason() {
    if (!showReason) return;
    try {
      await projectsApi.submitMissedReason(showReason.id, reasonForm.reason, reasonForm.category);
      const updated = await projectsApi.getProjects();
      setProjects(updated);
    } catch {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === showReason.id
            ? {
                ...p,
                missedDeadlineReason: reasonForm.reason,
                reasonCategory: reasonForm.category,
              }
            : p
        )
      );
    }
    setShowReason(null);
    setReasonForm({ reason: "", category: "Resource Constraints" });
  }

  const developers = usersList.filter((u) => u.role === "Developer" || u.role === "Admin");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-foreground)" }}
          >
            Projects
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
            Showing {filtered.length} of {assignedProjects.length} {isAdmin ? "total projects" : "assigned projects"}
          </p>
        </div>
        <div>
          {isAdmin && (
            <Button onClick={() => setShowCreate(true)}>+ Create Project</Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div style={{ flex: "1 1 220px" }}>
          <Input placeholder="Search projects or owner…" value={search} onChange={setSearch} />
        </div>
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "All", label: "All Statuses" },
            ...PROJECT_STATUSES.map((s) => ({ value: s, label: s })),
          ]}
        />
        <Select
          value={priorityFilter}
          onChange={setPriorityFilter}
          options={[
            { value: "All", label: "All Priorities" },
            ...["Low", "Medium", "High", "Urgent"].map((s) => ({ value: s, label: s })),
          ]}
        />
      </div>

      {/* Projects grid */}
      {filtered.length === 0 ? (
        <EmptyState message="No projects match your filters." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const isProjectOverdue =
              Boolean(project.isOverdue) ||
              Boolean(project.missedDeadlineReason) ||
              Boolean(
                project.dueDate &&
                new Date(project.dueDate) < new Date() &&
                project.status !== "Finished" &&
                project.status !== "Cancelled"
              );

            return (
              <Card key={project.id} style={{ padding: 24 }}>
                {isProjectOverdue && project.missedDeadlineReason && (
                  <div className="mb-3 p-2.5 rounded-lg text-xs bg-rose-50 border border-rose-200 text-rose-800">
                    ⚠️ Overdue — {project.reasonCategory || "Other"}: "{project.missedDeadlineReason}"
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <h3
                    className="font-semibold text-sm leading-snug"
                    style={{
                      color: "var(--color-foreground)",
                      fontFamily: "var(--font-display)",
                      flex: 1,
                    }}
                  >
                    {project.name}
                  </h3>
                  <div className="flex gap-1 ml-2 flex-shrink-0">
                    <Badge label={project.priority} type="priority" />
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Badge label={project.status} />
                  {isProjectOverdue && <Badge label="Overdue" />}
                  {project.requestingDepartment && (
                    <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                      {project.requestingDepartment}
                    </span>
                  )}
                </div>

                <div className="space-y-1 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                      Progress
                    </span>
                    <span
                      className="text-xs"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}
                    >
                      {project.progress}%
                    </span>
                  </div>
                  <ProgressBar
                    value={project.progress}
                    color={isProjectOverdue ? "#ef4444" : "#1a3896"}
                  />
                </div>

                <div
                  className="grid grid-cols-2 gap-2 mb-4 text-xs"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  <div className="col-span-2">
                    <span className="block font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>
                      Assigned Developers
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {project.members && project.members.length > 0 ? (
                        project.members.map((m) => (
                          <span
                            key={m.userId}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: "#e0e7ff", color: "#1e3a8a" }}
                          >
                            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: "#1a3896" }}>
                              {m.avatar}
                            </span>
                            {m.fullName}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: "var(--color-muted-foreground)" }}>
                          {project.ownerName || "Unassigned"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="block font-semibold" style={{ color: "var(--color-foreground)" }}>
                      {project.customerName || "—"}
                    </span>
                    Customer
                  </div>
                  <div>
                    <span className="block font-semibold" style={{ color: "var(--color-foreground)" }}>
                      {project.dueDate
                        ? new Date(project.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </span>
                    Due date
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => onViewProject(project.id)}>
                    View Details
                  </Button>
                  {isAdmin && isProjectOverdue && !project.missedDeadlineReason && (
                    <Button size="sm" variant="danger" onClick={() => setShowReason(project)}>
                      Add Reason
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreate && (
        <Modal title="Create Project" onClose={() => setShowCreate(false)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Project Name
                </label>
                <Input
                  value={createForm.name}
                  onChange={(v) => setCreateForm((f) => ({ ...f, name: v }))}
                  placeholder="Project name"
                />
              </div>
              <div className="col-span-2">
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    border: "1px solid var(--color-border)",
                    fontFamily: "var(--font-body)",
                    resize: "vertical",
                  }}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Priority
                </label>
                <Select
                  value={createForm.priority}
                  onChange={(v) => setCreateForm((f) => ({ ...f, priority: v as Priority }))}
                  options={["Low", "Medium", "High", "Urgent"].map((s) => ({ value: s, label: s }))}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Status
                </label>
                <Select
                  value={createForm.status}
                  onChange={(v) => setCreateForm((f) => ({ ...f, status: v as ProjectStatus }))}
                  options={PROJECT_STATUSES.map((s) => ({
                    value: s,
                    label: s,
                  }))}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Department
                </label>
                <Input
                  value={createForm.requestingDepartment}
                  onChange={(v) => setCreateForm((f) => ({ ...f, requestingDepartment: v }))}
                  placeholder="e.g. Engineering, IT"
                />
              </div>
              <div className="col-span-2">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Assign Developers & Admins (Select one or more)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50 max-h-48 overflow-y-auto">
                  {developers.map((dev) => {
                    const isSelected = createForm.memberIds.includes(dev.id);
                    return (
                      <label
                        key={dev.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border text-xs transition-colors ${
                          isSelected
                            ? "bg-blue-50 border-blue-400 text-blue-900 font-semibold"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateForm((f) => ({ ...f, memberIds: [...f.memberIds, dev.id] }));
                            } else {
                              setCreateForm((f) => ({ ...f, memberIds: f.memberIds.filter((id) => id !== dev.id) }));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ background: "#1a3896" }}>
                          {dev.avatar}
                        </span>
                        <span className="truncate">
                          {dev.fullName} {dev.role === "Admin" && <span className="text-[10px] text-blue-600 font-semibold">(Admin)</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {createForm.memberIds.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Please select at least one developer or admin for this project.</p>
                )}
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Start Date
                </label>
                <Input
                  type="date"
                  value={createForm.startDate}
                  onChange={(v) => setCreateForm((f) => ({ ...f, startDate: v }))}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Due Date
                </label>
                <Input
                  type="date"
                  value={createForm.dueDate}
                  onChange={(v) => setCreateForm((f) => ({ ...f, dueDate: v }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!createForm.name || createForm.memberIds.length === 0}>
                Create Project
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reason Modal */}
      {showReason && (
        <Modal title="Submit Missed Deadline Reason" onClose={() => setShowReason(null)}>
          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Category
              </label>
              <Select
                value={reasonForm.category}
                onChange={(v) => setReasonForm((f) => ({ ...f, category: v }))}
                options={REASON_CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Reason
              </label>
              <textarea
                rows={3}
                value={reasonForm.reason}
                onChange={(e) => setReasonForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Describe what caused the delay…"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  border: "1px solid var(--color-border)",
                  fontFamily: "var(--font-body)",
                  resize: "vertical",
                }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowReason(null)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitReason} disabled={!reasonForm.reason}>
                Submit Reason
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
