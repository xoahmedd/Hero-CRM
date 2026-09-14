import { useState, useEffect } from "react";
import type { Project, Priority, ProjectStatus, User } from "../data/mock";
import { MOCK_PROJECTS, MOCK_USERS } from "../data/mock";
import { projectsApi, usersApi } from "../api/services";
import { Badge, Button, Card, EmptyState, Input, Modal, ProgressBar, Select, SectionHeader } from "../components/ui";

const REASON_CATEGORIES = ["Resource Constraints", "Scope Creep", "Third-Party Blocker", "Technical Difficulty", "Client Delay", "Other"];

interface Props {
  currentUser: User;
  onViewProject: (id: number) => void;
}

export default function ProjectsPage({ currentUser, onViewProject }: Props) {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [usersList, setUsersList] = useState<User[]>(MOCK_USERS);
  const [activeTab, setActiveTab] = useState<"active" | "requests">("active");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  useEffect(() => {
    projectsApi.getProjects()
      .then((data) => { if (data && data.length > 0) setProjects(data); })
      .catch(() => {});
    usersApi.getUsers()
      .then((data) => { if (data && data.length > 0) setUsersList(data); })
      .catch(() => {});
  }, []);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [showApprove, setShowApprove] = useState<Project | null>(null);
  const [showReject, setShowReject] = useState<Project | null>(null);
  const [showReason, setShowReason] = useState<Project | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState<{ name: string; description: string; status: ProjectStatus; priority: Priority; startDate: string; dueDate: string; ownerId: number; requestingDepartment: string }>({ name: "", description: "", status: "Planning", priority: "Medium", startDate: "", dueDate: "", ownerId: 2, requestingDepartment: "IT" });
  // Request form
  const [requestForm, setRequestForm] = useState<{ name: string; description: string; requestingDepartment: string; businessJustification: string; targetDeadline: string; priority: Priority }>({ name: "", description: "", requestingDepartment: "", businessJustification: "", targetDeadline: "", priority: "Medium" });
  // Approve form
  const [approveForm, setApproveForm] = useState<{ ownerId: number; startDate: string; dueDate: string; priority: Priority }>({ ownerId: 2, startDate: "", dueDate: "", priority: "High" });

  // Reject form
  const [rejectReason, setRejectReason] = useState("");
  // Reason form
  const [reasonForm, setReasonForm] = useState({ reason: "", category: "Resource Constraints" });

  const isAdmin = currentUser.role === "Admin";

  const active = projects.filter((p) => p.status !== "Submitted" && p.status !== "Rejected");
  const submitted = projects.filter((p) => p.status === "Submitted");

  const filtered = active.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.ownerName || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    const matchPriority = priorityFilter === "All" || p.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  async function handleCreate() {
    try {
      await projectsApi.createProject(createForm);
      const updated = await projectsApi.getProjects();
      setProjects(updated);
    } catch {
      const newProject: Project = {
        id: projects.length + 1,
        ...createForm,
        ownerId: createForm.ownerId,
        ownerName: usersList.find((u) => u.id === createForm.ownerId)?.fullName ?? "",
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
    setCreateForm({ name: "", description: "", status: "Planning", priority: "Medium", startDate: "", dueDate: "", ownerId: 2, requestingDepartment: "IT" });
  }

  async function handleRequest() {
    try {
      await projectsApi.submitDepartmentRequest({
        ...requestForm,
        requestedBy: currentUser.fullName,
      });
      const updated = await projectsApi.getProjects();
      setProjects(updated);
    } catch {
      const newProject: Project = {
        id: projects.length + 1,
        name: requestForm.name,
        description: requestForm.description,
        status: "Submitted",
        priority: requestForm.priority as Project["priority"],
        startDate: "",
        dueDate: requestForm.targetDeadline,
        ownerId: currentUser.id,
        ownerName: currentUser.fullName,
        customerId: 0,
        customerName: "",
        requestingDepartment: requestForm.requestingDepartment,
        missedDeadlineReason: null,
        reasonCategory: null,
        progress: 0,
        requestedBy: currentUser.fullName,
        businessJustification: requestForm.businessJustification,
      };
      setProjects((prev) => [...prev, newProject]);
    }
    setShowRequest(false);
  }

  async function handleApprove() {
    if (!showApprove) return;
    try {
      await projectsApi.approveRequest(
        showApprove.id,
        approveForm.ownerId,
        approveForm.startDate,
        approveForm.dueDate,
        approveForm.priority
      );
      const updated = await projectsApi.getProjects();
      setProjects(updated);
    } catch {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === showApprove.id
            ? {
                ...p,
                status: "Working",
                ownerId: approveForm.ownerId,
                startDate: approveForm.startDate,
                dueDate: approveForm.dueDate,
                priority: approveForm.priority as Project["priority"],
                ownerName: usersList.find((u) => u.id === approveForm.ownerId)?.fullName ?? "",
              }
            : p
        )
      );
    }
    setShowApprove(null);
  }


  async function handleReject() {
    if (!showReject) return;
    try {
      await projectsApi.rejectRequest(showReject.id, rejectReason);
      const updated = await projectsApi.getProjects();
      setProjects(updated);
    } catch {
      setProjects((prev) =>
        prev.map((p) => (p.id === showReject.id ? { ...p, status: "Rejected", rejectionReason: rejectReason } : p))
      );
    }
    setShowReject(null);
    setRejectReason("");
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
          p.id === showReason.id ? { ...p, missedDeadlineReason: reasonForm.reason, reasonCategory: reasonForm.category } : p
        )
      );
    }
    setShowReason(null);
    setReasonForm({ reason: "", category: "Resource Constraints" });
  }

  const developers = usersList.filter((u) => u.role === "Developer");


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {["active", "requests"].map((tab) => {
            if (tab === "requests" && !isAdmin) return null;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as "active" | "requests")}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: activeTab === tab ? "#1a3896" : "#f1f5f9",
                  color: activeTab === tab ? "white" : "#475569",
                  fontFamily: "var(--font-display)",
                }}
              >
                {tab === "active" ? `Projects (${active.length})` : `Requests (${submitted.length})`}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          {currentUser.role === "DepartmentUser" && (
            <Button onClick={() => setShowRequest(true)}>+ Submit Request</Button>
          )}
          {isAdmin && (
            <>
              <Button variant="secondary" onClick={() => setShowRequest(true)}>Submit Request</Button>
              <Button onClick={() => setShowCreate(true)}>+ Create Project</Button>
            </>
          )}
        </div>
      </div>

      {activeTab === "active" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div style={{ flex: "1 1 220px" }}>
              <Input placeholder="Search projects or owner…" value={search} onChange={setSearch} />
            </div>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={[{ value: "All", label: "All Statuses" }, ...["Planning", "Working", "Overdue", "Finished"].map((s) => ({ value: s, label: s }))]}
            />
            <Select
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={[{ value: "All", label: "All Priorities" }, ...["Low", "Medium", "High", "Urgent"].map((s) => ({ value: s, label: s }))]}
            />
          </div>

          {/* Projects grid */}
          {filtered.length === 0 ? (
            <EmptyState message="No projects match your filters." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((project) => (
                <Card key={project.id} style={{ padding: 24 }}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-sm leading-snug" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)", flex: 1 }}>
                      {project.name}
                    </h3>
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      <Badge label={project.priority} type="priority" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge label={project.status} />
                    <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{project.requestingDepartment}</span>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Progress</span>
                      <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}>{project.progress}%</span>
                    </div>
                    <ProgressBar value={project.progress} color={project.status === "Overdue" ? "#ef4444" : "#1a3896"} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                    <div>
                      <span className="block font-semibold" style={{ color: "var(--color-foreground)" }}>{project.ownerName || "—"}</span>
                      Owner
                    </div>
                    <div>
                      <span className="block font-semibold" style={{ color: "var(--color-foreground)" }}>{project.customerName || "—"}</span>
                      Customer
                    </div>
                    <div>
                      <span className="block font-semibold" style={{ color: "var(--color-foreground)" }}>
                        {project.dueDate ? new Date(project.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </span>
                      Due date
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onViewProject(project.id)}>
                      View Details
                    </Button>
                    {isAdmin && project.status === "Overdue" && !project.missedDeadlineReason && (
                      <Button size="sm" variant="danger" onClick={() => setShowReason(project)}>
                        Add Reason
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "requests" && isAdmin && (
        <div className="space-y-3">
          {submitted.length === 0 ? (
            <EmptyState message="No pending department requests." />
          ) : (
            submitted.map((project) => (
              <Card key={project.id} style={{ padding: 24 }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--color-foreground)" }}>
                        {project.name}
                      </h3>
                      <Badge label={project.priority} type="priority" />
                    </div>
                    <p className="text-sm mb-2" style={{ color: "var(--color-muted-foreground)" }}>{project.description}</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div><span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Requested by</span><br />{project.requestedBy}</div>
                      <div><span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Department</span><br />{project.requestingDepartment}</div>
                      <div><span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Target deadline</span><br />
                        {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "—"}
                      </div>
                    </div>
                    {project.businessJustification && (
                      <div className="mt-2 text-sm p-3 rounded-lg" style={{ background: "#f8fafc", color: "var(--color-muted-foreground)", fontStyle: "italic" }}>
                        "{project.businessJustification}"
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    <Button size="sm" onClick={() => setShowApprove(project)}>Approve</Button>
                    <Button size="sm" variant="danger" onClick={() => setShowReject(project)}>Reject</Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreate && (
        <Modal title="Create Project" onClose={() => setShowCreate(false)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Project Name</label>
                <Input value={createForm.name} onChange={(v) => setCreateForm((f) => ({ ...f, name: v }))} placeholder="Project name" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: "1px solid var(--color-border)", fontFamily: "var(--font-body)", resize: "vertical" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Priority</label>
                <Select value={createForm.priority} onChange={(v) => setCreateForm((f) => ({ ...f, priority: v as Priority }))} options={["Low","Medium","High","Urgent"].map((s) => ({ value: s, label: s }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Status</label>
                <Select value={createForm.status} onChange={(v) => setCreateForm((f) => ({ ...f, status: v as ProjectStatus }))} options={["Planning","Working","Overdue","Finished"].map((s) => ({ value: s, label: s }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Lead Developer</label>
                <Select value={String(createForm.ownerId)} onChange={(v) => setCreateForm((f) => ({ ...f, ownerId: Number(v) }))} options={developers.map((u) => ({ value: String(u.id), label: u.fullName }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Department</label>
                <Input value={createForm.requestingDepartment} onChange={(v) => setCreateForm((f) => ({ ...f, requestingDepartment: v }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Start Date</label>
                <Input type="date" value={createForm.startDate} onChange={(v) => setCreateForm((f) => ({ ...f, startDate: v }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Due Date</label>
                <Input type="date" value={createForm.dueDate} onChange={(v) => setCreateForm((f) => ({ ...f, dueDate: v }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!createForm.name}>Create Project</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Department Request Modal */}
      {showRequest && (
        <Modal title="Submit Department Request" onClose={() => setShowRequest(false)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Project Name</label>
                <Input value={requestForm.name} onChange={(v) => setRequestForm((f) => ({ ...f, name: v }))} placeholder="Proposed project name" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Description</label>
                <textarea rows={2} value={requestForm.description} onChange={(e) => setRequestForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: "1px solid var(--color-border)", fontFamily: "var(--font-body)", resize: "vertical" }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Department</label>
                <Input value={requestForm.requestingDepartment} onChange={(v) => setRequestForm((f) => ({ ...f, requestingDepartment: v }))} placeholder="Your department" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Priority</label>
                <Select value={requestForm.priority} onChange={(v) => setRequestForm((f) => ({ ...f, priority: v as Priority }))} options={["Low","Medium","High","Urgent"].map((s) => ({ value: s, label: s }))} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Business Justification</label>
                <textarea rows={2} value={requestForm.businessJustification} onChange={(e) => setRequestForm((f) => ({ ...f, businessJustification: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: "1px solid var(--color-border)", fontFamily: "var(--font-body)", resize: "vertical" }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Target Deadline</label>
                <Input type="date" value={requestForm.targetDeadline} onChange={(v) => setRequestForm((f) => ({ ...f, targetDeadline: v }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowRequest(false)}>Cancel</Button>
              <Button onClick={handleRequest} disabled={!requestForm.name || !requestForm.requestingDepartment}>Submit Request</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Approve Modal */}
      {showApprove && (
        <Modal title={`Approve: ${showApprove.name}`} onClose={() => setShowApprove(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Lead Developer</label>
              <Select value={String(approveForm.ownerId)} onChange={(v) => setApproveForm((f) => ({ ...f, ownerId: Number(v) }))} options={developers.map((u) => ({ value: String(u.id), label: u.fullName }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Start Date</label>
                <Input type="date" value={approveForm.startDate} onChange={(v) => setApproveForm((f) => ({ ...f, startDate: v }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Due Date</label>
                <Input type="date" value={approveForm.dueDate} onChange={(v) => setApproveForm((f) => ({ ...f, dueDate: v }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Priority</label>
              <Select value={approveForm.priority} onChange={(v) => setApproveForm((f) => ({ ...f, priority: v as Priority }))} options={["Low","Medium","High","Urgent"].map((s) => ({ value: s, label: s }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowApprove(null)}>Cancel</Button>
              <Button onClick={handleApprove}>Approve Project</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {showReject && (
        <Modal title={`Reject: ${showReject.name}`} onClose={() => setShowReject(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Rejection Reason</label>
              <textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Explain why this request is being rejected…" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: "1px solid var(--color-border)", fontFamily: "var(--font-body)", resize: "vertical" }} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowReject(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleReject} disabled={!rejectReason}>Reject Request</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reason Modal */}
      {showReason && (
        <Modal title="Submit Missed Deadline Reason" onClose={() => setShowReason(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Category</label>
              <Select value={reasonForm.category} onChange={(v) => setReasonForm((f) => ({ ...f, category: v }))} options={REASON_CATEGORIES.map((c) => ({ value: c, label: c }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Reason</label>
              <textarea rows={3} value={reasonForm.reason} onChange={(e) => setReasonForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Describe what caused the delay…" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: "1px solid var(--color-border)", fontFamily: "var(--font-body)", resize: "vertical" }} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowReason(null)}>Cancel</Button>
              <Button onClick={handleSubmitReason} disabled={!reasonForm.reason}>Submit Reason</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
