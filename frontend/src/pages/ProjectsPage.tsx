import { useState, useEffect } from "react";
import type { Project, Priority, ProjectStatus, User } from "../types";
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  useEffect(() => {
    projectsApi
      .getProjects()
      .then((data) => {
        setProjects(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    usersApi
      .getUsers()
      .then((data) => {
        setUsersList(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showReason, setShowReason] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState(false);

  async function handleDeleteProject() {
    if (!projectToDelete) return;
    setDeletingProject(true);
    try {
      await projectsApi.deleteProject(projectToDelete.id);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setProjectToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete project:", err);
      alert(err?.message || "Failed to delete project.");
    } finally {
      setDeletingProject(false);
    }
  }

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

  // Edit form state
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    status: ProjectStatus;
    priority: Priority;
    startDate: string;
    dueDate: string;
    memberIds: number[];
    requestingDepartment: string;
    missedDeadlineReason: string;
  }>({
    name: "",
    description: "",
    status: "In Progress",
    priority: "Medium",
    startDate: "",
    dueDate: "",
    memberIds: [],
    requestingDepartment: "Engineering",
    missedDeadlineReason: "",
  });

  // Reason form
  const [reasonForm, setReasonForm] = useState({
    reason: "",
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

  const filtered = assignedProjects
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.ownerName || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.members || []).some((m) => m.fullName.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === "All" || p.status === statusFilter;
      const matchPriority = priorityFilter === "All" || p.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    })
    .sort((a, b) => {
      if (statusFilter === "In Progress") {
        const timeA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const timeB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        if (timeA !== timeB) return timeA - timeB;
        return b.id - a.id;
      } else {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.startDate ? new Date(a.startDate).getTime() : 0);
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.startDate ? new Date(b.startDate).getTime() : 0);
        if (dateA !== dateB) return dateB - dateA;
        return b.id - a.id;
      }
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
      window.dispatchEvent(new CustomEvent("refresh-notifications"));
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
    } catch (err: any) {
      console.error("Failed to create project:", err);
      alert(err?.message || "Failed to create project on server.");
    }
  }

  function handleOpenEditModal(project: Project) {
    setEditingProject(project);
    const memberIds = project.members?.map((m) => m.userId) || project.memberIds || [];
    setEditForm({
      name: project.name,
      description: project.description || "",
      status: (project.status || "In Progress") as ProjectStatus,
      priority: (project.priority || "Medium") as Priority,
      startDate: project.startDate ? project.startDate.split("T")[0] : "",
      dueDate: project.dueDate ? project.dueDate.split("T")[0] : "",
      memberIds: memberIds.length > 0 ? memberIds : [project.ownerId],
      requestingDepartment: project.requestingDepartment || "Engineering",
      missedDeadlineReason: project.missedDeadlineReason || "",
    });
  }

  async function handleSaveEdit() {
    if (!editingProject) return;
    if (editForm.memberIds.length === 0) {
      alert("Please select at least one developer or admin.");
      return;
    }
    try {
      await projectsApi.updateProject(editingProject.id, {
        name: editForm.name,
        description: editForm.description,
        status: editForm.status,
        priority: editForm.priority,
        startDate: editForm.startDate,
        dueDate: editForm.dueDate,
        memberIds: editForm.memberIds,
        requestingDepartment: editForm.requestingDepartment,
        missedDeadlineReason: editForm.missedDeadlineReason,
        reasonCategory: null,
      });
      const updated = await projectsApi.getProjects();
      setProjects(updated);
      setEditingProject(null);
    } catch (err: any) {
      console.error("Failed to update project:", err);
      alert(err?.message || "Failed to update project on server.");
    }
  }

  function handleOpenReasonModal(project: Project) {
    setShowReason(project);
    setReasonForm({
      reason: project.missedDeadlineReason || "",
    });
  }

  async function handleSubmitReason() {
    if (!showReason) return;
    try {
      await projectsApi.submitMissedReason(showReason.id, reasonForm.reason);
      const updated = await projectsApi.getProjects();
      setProjects(updated);
      setShowReason(null);
      setReasonForm({ reason: "" });
    } catch (err: any) {
      console.error("Failed to submit reason:", err);
      alert(err?.message || "Failed to submit reason.");
    }
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
            Showing {filtered.length} of {assignedProjects.length} {isAdmin ? "total projects" : "assigned projects"} • Sorted by {statusFilter === "In Progress" ? "nearest due date" : "newest added"}
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((project) => {
            const isProjectOverdue =
              project.status !== "Finished" &&
              project.status !== "Cancelled" &&
              (Boolean(project.isOverdue) ||
               Boolean(project.dueDate && new Date(project.dueDate) < new Date()));

            return (
              <Card key={project.id} style={{ padding: "26px 28px" }}>
                {isProjectOverdue && project.missedDeadlineReason && (
                  <div className="mb-3 p-2.5 rounded-lg text-xs bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
                    <span>⚠️ Overdue: "{project.missedDeadlineReason}"</span>
                    <button
                      type="button"
                      onClick={() => handleOpenReasonModal(project)}
                      className="text-xs font-semibold underline ml-2 cursor-pointer hover:text-rose-950 flex-shrink-0"
                    >
                      Edit Reason
                    </button>
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
                      style={{ fontFamily: "var(--font-mono)", color: project.status === "Finished" ? "#15803d" : "var(--color-muted-foreground)" }}
                    >
                      {project.status === "Finished" ? 100 : (project.progress ?? 0)}%
                    </span>
                  </div>
                  <ProgressBar
                    value={project.status === "Finished" ? 100 : (project.progress ?? 0)}
                    color={project.status === "Finished" ? "#22c55e" : isProjectOverdue ? "#ef4444" : "#1a3896"}
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
                      {project.requestingDepartment || "—"}
                    </span>
                    Department
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
                  {project.status === "Finished" && (
                    <div className="col-span-2 pt-2 mt-1 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-medium text-emerald-700">Completed at</span>
                      <span className="font-semibold text-emerald-800" style={{ fontFamily: "var(--font-mono)" }}>
                        {project.completedAt
                          ? new Date(project.completedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : (project.updatedAt
                              ? new Date(project.updatedAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "—")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5 mt-2">
                  <Button size="sm" variant="secondary" onClick={() => onViewProject(project.id)}>
                    View Details
                  </Button>
                  {isAdmin && (
                    <Button size="sm" variant="secondary" onClick={() => handleOpenEditModal(project)}>
                      Edit
                    </Button>
                  )}
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="secondary"
                      style={{ color: "#dc2626", borderColor: "#fecaca" }}
                      onClick={() => setProjectToDelete(project)}
                    >
                      Delete
                    </Button>
                  )}
                  {isProjectOverdue && (
                    <Button
                      size="sm"
                      variant={project.missedDeadlineReason ? "secondary" : "danger"}
                      onClick={() => handleOpenReasonModal(project)}
                    >
                      {project.missedDeadlineReason ? "Edit Reason" : "Add Reason"}
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

      {/* Edit Project Modal */}
      {editingProject && (
        <Modal title="Edit Project" onClose={() => setEditingProject(null)} wide>
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
                  value={editForm.name}
                  onChange={(v) => setEditForm((f) => ({ ...f, name: v }))}
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
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
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
                  Status
                </label>
                <Select
                  value={editForm.status}
                  onChange={(v) => setEditForm((f) => ({ ...f, status: v as ProjectStatus }))}
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
                  Priority
                </label>
                <Select
                  value={editForm.priority}
                  onChange={(v) => setEditForm((f) => ({ ...f, priority: v as Priority }))}
                  options={["Low", "Medium", "High", "Urgent"].map((p) => ({
                    value: p,
                    label: p,
                  }))}
                />
              </div>
              {(editForm.status === "Finished" || editingProject?.status === "Finished") && (
                <div className="col-span-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between text-emerald-900">
                  <span className="font-semibold">Completed at:</span>
                  <span className="font-mono font-medium">
                    {editingProject?.completedAt
                      ? new Date(editingProject.completedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : (editingProject?.updatedAt
                          ? new Date(editingProject.updatedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Upon saving")}
                  </span>
                </div>
              )}
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Start Date
                </label>
                <Input
                  type="date"
                  value={editForm.startDate}
                  onChange={(v) => setEditForm((f) => ({ ...f, startDate: v }))}
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
                  value={editForm.dueDate}
                  onChange={(v) => setEditForm((f) => ({ ...f, dueDate: v }))}
                />
              </div>
              <div className="col-span-2">
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Department
                </label>
                <Input
                  value={editForm.requestingDepartment}
                  onChange={(v) => setEditForm((f) => ({ ...f, requestingDepartment: v }))}
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
                    const isSelected = editForm.memberIds.includes(dev.id);
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
                              setEditForm((f) => ({ ...f, memberIds: [...f.memberIds, dev.id] }));
                            } else {
                              setEditForm((f) => ({ ...f, memberIds: f.memberIds.filter((id) => id !== dev.id) }));
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
                {editForm.memberIds.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Please select at least one developer or admin for this project.</p>
                )}
              </div>

              {(editingProject.isOverdue || Boolean(editingProject.missedDeadlineReason) || (editingProject.dueDate && new Date(editingProject.dueDate) < new Date())) && (
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>
                    Overdue Reason
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.missedDeadlineReason}
                    onChange={(e) => setEditForm((f) => ({ ...f, missedDeadlineReason: e.target.value }))}
                    placeholder="Describe what caused the project delay…"
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: "1px solid var(--color-border)", resize: "vertical" }}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setEditingProject(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={!editForm.name || editForm.memberIds.length === 0}>
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reason Modal */}
      {showReason && (
        <Modal
          title={showReason.missedDeadlineReason ? "Edit Overdue Reason" : "Submit Overdue Reason"}
          onClose={() => setShowReason(null)}
        >
          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Overdue Reason
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
              <Button onClick={handleSubmitReason} disabled={!reasonForm.reason.trim()}>
                {showReason.missedDeadlineReason ? "Save Reason" : "Submit Reason"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Project Confirmation Modal */}
      {projectToDelete && (
        <Modal title="Delete Project" onClose={() => !deletingProject && setProjectToDelete(null)}>
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-rose-50 text-rose-900 border border-rose-200 text-sm">
              ⚠️ <strong>Warning:</strong> Are you sure you want to delete project <strong>"{projectToDelete.name}"</strong>?
              <p className="mt-1 text-xs text-rose-700">
                This will permanently delete the project and all associated tasks, assignments, and discussions. This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setProjectToDelete(null)} disabled={deletingProject}>
                Cancel
              </Button>
              <Button
                onClick={handleDeleteProject}
                disabled={deletingProject}
                style={{ background: "#dc2626", borderColor: "#dc2626", color: "white" }}
              >
                {deletingProject ? "Deleting..." : "Delete Project"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
