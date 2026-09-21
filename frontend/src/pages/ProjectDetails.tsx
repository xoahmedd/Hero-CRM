import { useState, useEffect } from "react";
import type { Task, Project, User, Comment, Priority, TaskStatus, ProjectStatus } from "../types";
import { projectsApi, tasksApi, commentsApi, projectMembersApi, usersApi } from "../api/services";
import { Badge, Button, Card, Modal, ProgressBar, Select, Input, timeAgo } from "../components/ui";
import { PROJECT_STATUSES } from "./ProjectsPage";

const TASK_STATUSES = ["Assigned", "Review", "Completed", "Cancelled"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const REASON_CATEGORIES = [
  "Resource Constraints",
  "Scope Creep",
  "Technical Debt",
  "External Blocker",
  "Client Delay",
  "Other",
];

interface Props {
  projectId: number;
  currentUser?: User;
  onBack: () => void;
}

function safeFormatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

function safeFormatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function checkIsOverdue(task: Task | null | undefined): boolean {
  if (!task) return false;
  if (task.status === "Cancelled") return false;
  if (task.isOverdue) return true;
  if (Boolean(task.missedDeadlineReason)) return true;
  if (!task.dueDate) return false;
  const dueTime = new Date(task.dueDate).getTime();
  if (isNaN(dueTime)) return false;

  if (task.status === "Completed") {
    if (task.completedAt) {
      const compTime = new Date(task.completedAt).getTime();
      if (!isNaN(compTime) && compTime > dueTime) return true;
    }
    return false;
  }

  return dueTime < Date.now();
}

export default function ProjectDetails({ projectId, currentUser, onBack }: Props) {
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState<"tasks" | "members">("tasks");
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedNewMemberId, setSelectedNewMemberId] = useState<number | null>(null);
  const [showReasonModal, setShowReasonModal] = useState<Task | null>(null);
  const [reasonForm, setReasonForm] = useState({ reason: "", category: "Resource Constraints" });

  // Create Task Modal state
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [createTaskForm, setCreateTaskForm] = useState<{
    title: string;
    description: string;
    priority: Priority;
    status: TaskStatus;
    dueDate: string;
    assigneeIds: number[];
  }>({
    title: "",
    description: "",
    priority: "Medium",
    status: "Assigned",
    dueDate: "",
    assigneeIds: [],
  });

  // Edit Task Modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    priority: Priority;
    status: TaskStatus;
    dueDate: string;
    assigneeIds: number[];
  }>({
    title: "",
    description: "",
    priority: "Medium",
    status: "Assigned",
    dueDate: "",
    assigneeIds: [],
  });

  // Edit Project Modal state
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editProjectForm, setEditProjectForm] = useState<{
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

  // Project Reason Modal state
  const [showProjectReasonModal, setShowProjectReasonModal] = useState(false);
  const [projectReasonForm, setProjectReasonForm] = useState({
    reason: "",
  });

  // Delete modals state
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState(false);

  async function handleDeleteProject() {
    if (!project) return;
    setDeletingProject(true);
    try {
      await projectsApi.deleteProject(projectId);
      onBack();
    } catch (err: any) {
      console.error("Failed to delete project:", err);
      alert(err?.message || "Failed to delete project.");
    } finally {
      setDeletingProject(false);
    }
  }

  async function handleDeleteTask() {
    if (!taskToDelete) return;
    setDeletingTask(true);
    try {
      await tasksApi.deleteTask(taskToDelete.id);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      if (selectedTask?.id === taskToDelete.id) {
        setSelectedTask(null);
      }
      setTaskToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete task:", err);
      alert(err?.message || "Failed to delete task.");
    } finally {
      setDeletingTask(false);
    }
  }

  // Auto-sync project status when tasks change
  useEffect(() => {
    if (!project || project.status === "Cancelled") return;
    const safeTasks = (Array.isArray(tasks) ? tasks : []).filter((t): t is Task => Boolean(t && t.id));
    if (safeTasks.length === 0) return;
    const hasCompleted = safeTasks.some((t) => t.status === "Completed");
    const allCompletedOrCancelled = safeTasks.every((t) => t.status === "Completed" || t.status === "Cancelled");
    const isAutoFinished = hasCompleted && allCompletedOrCancelled;

    if (isAutoFinished && project.status !== "Finished") {
      setProject((prev) => (prev ? { ...prev, status: "Finished" } : null));
    } else if (!isAutoFinished && project.status === "Finished") {
      setProject((prev) => (prev ? { ...prev, status: "In Progress" } : null));
    }
  }, [tasks]);

  useEffect(() => {
    setIsLoading(true);
    projectsApi.getProject(projectId)
      .then((p) => {
        if (p) {
          setProject(p);
          if (p.members && p.members.length > 0) {
            setProjectMembers(p.members);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load project:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    projectMembersApi.getMembers(projectId)
      .then((m) => {
        if (Array.isArray(m) && m.length > 0) {
          setProjectMembers(m);
        }
      })
      .catch(() => {});

    tasksApi.getTasksByProject(projectId)
      .then((t) => { if (Array.isArray(t)) setTasks(t); })
      .catch(() => {});

    usersApi.getUsers()
      .then((u) => { if (Array.isArray(u)) setAllUsers(u); })
      .catch(() => {});
  }, [projectId]);

  useEffect(() => {
    if (selectedTask) {
      commentsApi.getComments(selectedTask.id)
        .then((c) => { if (c && c.length > 0) setComments(c); })
        .catch(() => {});
    }
  }, [selectedTask]);

  if (isLoading && !project) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Loading project details…</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-12 text-center space-y-4 bg-white rounded-xl border border-slate-200 shadow-sm max-w-lg mx-auto mt-8">
        <div className="text-lg font-semibold text-slate-800">Project Not Found</div>
        <p className="text-sm text-slate-500">
          This project could not be found or you may not have permission to view it.
        </p>
        <div>
          <Button variant="secondary" onClick={onBack}>
            ← Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser?.role === "Admin";

  const assignedMemberIds = new Set<number>();
  if (project.ownerId) assignedMemberIds.add(project.ownerId);
  (projectMembers || []).forEach((pm) => {
    const id = pm?.userId || pm?.id;
    if (id) assignedMemberIds.add(id);
  });
  if (Array.isArray(project.members)) {
    project.members.forEach((m) => {
      const id = m?.userId || (m as any)?.id;
      if (id) assignedMemberIds.add(id);
    });
  }
  if (Array.isArray(project.memberIds)) {
    project.memberIds.forEach((id) => assignedMemberIds.add(id));
  }

  const assignableUsers = (allUsers || []).filter(
    (u) => Boolean(u && u.id) && (u.role === "Developer" || u.role === "Admin") && assignedMemberIds.has(u.id)
  );

  const nonMemberDevelopers = (allUsers || []).filter(
    (u) =>
      Boolean(u && u.id) &&
      (u.role === "Developer" || u.role === "Admin") &&
      !assignedMemberIds.has(u.id)
  );

  // Filter tasks safely
  const safeTasks = (Array.isArray(tasks) ? tasks : []).filter((t): t is Task => Boolean(t && t.id));

  const displayTasks = isAdmin
    ? safeTasks
    : safeTasks.filter((t) => (t.assignees || []).some((a) => a && a.id === currentUser?.id));

  const sortedDisplayTasks = [...displayTasks].sort((a, b) => {
    const timeA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const timeB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    if (timeA !== timeB) return timeA - timeB;
    return b.id - a.id;
  });

  const tasksByStatus = TASK_STATUSES.reduce<Record<string, Task[]>>((acc, s) => {
    let items = displayTasks.filter((t) => t && t.status === s);
    if (s === "Completed") {
      items = [...items].sort((a, b) => {
        const timeA = a.completedAt ? new Date(a.completedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.completedAt ? new Date(b.completedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });
    } else {
      items = [...items].sort((a, b) => {
        const timeA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const timeB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        if (timeA !== timeB) return timeA - timeB;
        return b.id - a.id;
      });
    }
    acc[s] = items;
    return acc;
  }, {});

  const relevantTasks = displayTasks.filter((t) => t && t.status !== "Cancelled");
  const totalTasks = relevantTasks.length;
  const completed = relevantTasks.filter((t) => t && t.status === "Completed").length;
  const activeCount = relevantTasks.filter((t) => t && (t.status === "Assigned" || t.status === "Review")).length;
  const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

  async function updateTaskStatus(taskId: number, status: string) {
    const isNowCompleted = status === "Completed";
    const nowIso = new Date().toISOString();
    try {
      await tasksApi.updateTaskStatus(taskId, status);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: status as Task["status"],
                completedAt: isNowCompleted ? (t.completedAt || nowIso) : null,
              }
            : t
        )
      );
      if (selectedTask?.id === taskId) {
        setSelectedTask((t) =>
          t
            ? {
                ...t,
                status: status as Task["status"],
                completedAt: isNowCompleted ? (t.completedAt || nowIso) : null,
              }
            : t
        );
      }
      // Re-fetch project tasks to sync backend calculations
      tasksApi.getTasksByProject(projectId).then((updated) => {
        if (Array.isArray(updated)) setTasks(updated);
      }).catch(() => {});
    } catch (err: any) {
      console.error("Failed to update task status:", err);
      alert(err?.message || "Failed to update task status.");
    }
  }

  async function handleAddComment() {
    if (!newComment.trim() || !selectedTask) return;
    const authorId = currentUser?.id || 1;
    try {
      await commentsApi.addComment(selectedTask.id, authorId, newComment);
      const updated = await commentsApi.getComments(selectedTask.id);
      if (updated && updated.length > 0) {
        setComments((prev) => [...prev.filter((c) => c.taskId !== selectedTask.id), ...updated]);
      }
      setNewComment("");
    } catch (err: any) {
      console.error("Failed to add comment:", err);
      alert(err?.message || "Failed to add comment.");
    }
  }

  async function handleAddMember() {
    if (!selectedNewMemberId) return;
    try {
      await projectMembersApi.addMember(projectId, selectedNewMemberId);
      const updated = await projectMembersApi.getMembers(projectId);
      setProjectMembers(updated);
      setShowAddMemberModal(false);
      setSelectedNewMemberId(null);
      window.dispatchEvent(new CustomEvent("refresh-notifications"));
    } catch (err: any) {
      alert(err?.message || "Failed to add member to project.");
    }
  }

  async function handleRemoveMember(userId: number) {
    if (!confirm("Are you sure you want to remove this member from the project?")) return;
    try {
      await projectMembersApi.removeMember(projectId, userId);
      setProjectMembers((prev) => prev.filter((m) => (m.userId || m.id) !== userId));
    } catch (err: any) {
      alert(err?.message || "Failed to remove member from project.");
    }
  }

  async function handleSubmitTaskReason() {
    if (!showReasonModal) return;
    try {
      await tasksApi.submitMissedReason(showReasonModal.id, reasonForm.reason, reasonForm.category);
      const updatedTasks = await tasksApi.getTasksByProject(projectId);
      setTasks(updatedTasks);
      if (selectedTask?.id === showReasonModal.id) {
        setSelectedTask((prev) =>
          prev
            ? {
                ...prev,
                isOverdue: true,
                missedDeadlineReason: reasonForm.reason,
                reasonCategory: reasonForm.category,
              }
            : null
        );
      }
    } catch (err: any) {
      alert(err?.message || "Failed to submit reason");
    }
    setShowReasonModal(null);
    setReasonForm({ reason: "", category: "Resource Constraints" });
  }

  function handleOpenEditProject() {
    if (!project) return;
    const memberIds = (projectMembers || []).map((m) => m?.userId || m?.id).filter(Boolean);
    setEditProjectForm({
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
    setShowEditProjectModal(true);
  }

  async function handleSaveEditProject() {
    if (!project) return;
    if (editProjectForm.memberIds.length === 0) {
      alert("Please select at least one developer or admin.");
      return;
    }
    try {
      await projectsApi.updateProject(projectId, {
        name: editProjectForm.name,
        description: editProjectForm.description,
        status: editProjectForm.status,
        priority: editProjectForm.priority,
        startDate: editProjectForm.startDate,
        dueDate: editProjectForm.dueDate,
        memberIds: editProjectForm.memberIds,
        requestingDepartment: editProjectForm.requestingDepartment,
        missedDeadlineReason: editProjectForm.missedDeadlineReason,
        reasonCategory: null,
      });
      const updated = await projectsApi.getProject(projectId);
      if (updated) setProject(updated);
      const members = await projectMembersApi.getMembers(projectId);
      if (Array.isArray(members)) setProjectMembers(members);
      if (editProjectForm.status === "Cancelled") {
        setTasks((prev) => prev.map((t) => t.status === "Completed" ? t : ({ ...t, status: "Cancelled" as TaskStatus })));
      }
      setShowEditProjectModal(false);
    } catch (err: any) {
      console.error("Failed to update project:", err);
      setProject((prev) =>
        prev
          ? {
              ...prev,
              name: editProjectForm.name,
              description: editProjectForm.description,
              status: editProjectForm.status,
              priority: editProjectForm.priority,
              startDate: editProjectForm.startDate,
              dueDate: editProjectForm.dueDate,
              requestingDepartment: editProjectForm.requestingDepartment,
              missedDeadlineReason: editProjectForm.missedDeadlineReason || prev.missedDeadlineReason,
              reasonCategory: null,
            }
          : null
      );
      if (editProjectForm.status === "Cancelled") {
        setTasks((prev) => prev.map((t) => t.status === "Completed" ? t : ({ ...t, status: "Cancelled" as TaskStatus })));
      }
      setShowEditProjectModal(false);
    }
  }

  function handleOpenProjectReasonModal() {
    if (!project) return;
    setProjectReasonForm({
      reason: project.missedDeadlineReason || "",
    });
    setShowProjectReasonModal(true);
  }

  async function handleSubmitProjectReason() {
    if (!project) return;
    try {
      await projectsApi.submitMissedReason(projectId, projectReasonForm.reason);
      const updated = await projectsApi.getProject(projectId);
      if (updated) setProject(updated);
      setShowProjectReasonModal(false);
    } catch (err: any) {
      console.error("Failed to submit reason:", err);
      alert(err?.message || "Failed to submit reason.");
    }
  }

  function startEditTask(task: Task) {
    setEditingTask(task);
    const validAssigneeIds = (task.assignees || [])
      .map((a) => a.id)
      .filter((id) => assignedMemberIds.has(id));
    setEditForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      assigneeIds: validAssigneeIds,
    });
  }

  async function handleSaveEditTask() {
    if (!editingTask) return;
    if (editForm.assigneeIds.length === 0) {
      alert("Please assign at least one developer or admin to this task.");
      return;
    }
    try {
      await tasksApi.updateTask(editingTask.id, {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        status: isAdmin ? editForm.status : undefined,
        dueDate: editForm.dueDate,
        assigneeIds: editForm.assigneeIds,
      });
      const updatedTasks = await tasksApi.getTasksByProject(projectId);
      setTasks(updatedTasks);
      const updatedSelected = updatedTasks.find((t: Task) => t.id === editingTask.id);
      if (updatedSelected) setSelectedTask(updatedSelected);
      setEditingTask(null);
    } catch (err: any) {
      console.error("Failed to update task:", err);
      const assignable = assignableUsers;
      const selectedAssignees = assignable
        .filter((d) => editForm.assigneeIds.includes(d.id))
        .map((d) => ({ id: d.id, name: d.fullName, avatar: d.avatar }));
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                title: editForm.title,
                description: editForm.description,
                priority: editForm.priority,
                status: (isAdmin ? editForm.status : t.status) as TaskStatus,
                dueDate: editForm.dueDate || t.dueDate,
                assignees: selectedAssignees,
              }
            : t
        )
      );
      if (selectedTask && selectedTask.id === editingTask.id) {
        setSelectedTask((prev) =>
          prev
            ? {
                ...prev,
                title: editForm.title,
                description: editForm.description,
                priority: editForm.priority,
                status: (isAdmin ? editForm.status : prev.status) as TaskStatus,
                dueDate: editForm.dueDate || prev.dueDate,
                assignees: selectedAssignees,
              }
            : null
        );
      }
      setEditingTask(null);
    }
  }

  async function handleCreateTask() {
    if (!createTaskForm.title.trim()) return;
    if (createTaskForm.assigneeIds.length === 0) {
      alert("Please assign at least one developer or admin to this task.");
      return;
    }
    try {
      await tasksApi.createTask({
        title: createTaskForm.title,
        description: createTaskForm.description,
        projectId,
        createdById: currentUser?.id || 1,
        assigneeIds: createTaskForm.assigneeIds,
        dueDate: createTaskForm.dueDate,
        priority: createTaskForm.priority,
        status: createTaskForm.status,
      });
      const updated = await tasksApi.getTasksByProject(projectId);
      setTasks(updated);
    } catch (err: any) {
      console.error("Failed to create task:", err);
      const assignable = assignableUsers;
      const selectedAssignees = assignable
        .filter((d) => createTaskForm.assigneeIds.includes(d.id))
        .map((d) => ({ id: d.id, name: d.fullName, avatar: d.avatar }));
      const newTask: Task = {
        id: Date.now(),
        title: createTaskForm.title,
        description: createTaskForm.description,
        status: createTaskForm.status,
        priority: createTaskForm.priority,
        projectId,
        projectName: project?.name || "",
        assignees: selectedAssignees,
        createdById: currentUser?.id || 1,
        dueDate: createTaskForm.dueDate || new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
    }
    setShowCreateTaskModal(false);
    setCreateTaskForm({
      title: "",
      description: "",
      priority: "Medium",
      status: "Assigned",
      dueDate: "",
      assigneeIds: [],
    });
  }

  const taskComments = selectedTask ? (comments || []).filter((c) => c && c.taskId === selectedTask.id) : [];

  const statusColors: Record<string, string> = {
    Assigned: "#dbeafe",
    Review: "#fef3c7",
    Completed: "#dcfce7",
    Cancelled: "#fee2e2",
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm transition-colors cursor-pointer" style={{ color: "var(--color-muted-foreground)" }}>
        ← Back to Projects
      </button>

      {/* Project Header */}
      <Card style={{ padding: "28px 32px" }}>
        {Boolean(
          project.isOverdue ||
          project.missedDeadlineReason ||
          (project.dueDate && new Date(project.dueDate) < new Date() && project.status !== "Finished" && project.status !== "Cancelled")
        ) && (
          project.missedDeadlineReason ? (
            <div className="mb-4 p-3 rounded-lg text-sm flex items-center justify-between" style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c" }}>
              <span>⚠️ Overdue: "{project.missedDeadlineReason}"</span>
              <button
                type="button"
                onClick={handleOpenProjectReasonModal}
                className="text-xs font-semibold underline ml-2 cursor-pointer hover:text-red-950 flex-shrink-0"
              >
                Edit Reason
              </button>
            </div>
          ) : (
            <div className="mb-4 p-3 rounded-lg text-sm flex items-center justify-between" style={{ background: "#fff7ed", border: "1px solid #fdba74", color: "#c2410c" }}>
              <span>⚠️ This project is overdue. Please submit a reason for the delay.</span>
              <Button size="sm" variant="danger" onClick={handleOpenProjectReasonModal}>
                + Add Overdue Reason
              </Button>
            </div>
          )
        )}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "var(--color-foreground)" }}>
                {project.name}
              </h1>
              <Badge label={project.status || "In Progress"} />
              {Boolean(
                project.isOverdue ||
                project.missedDeadlineReason ||
                (project.dueDate && new Date(project.dueDate) < new Date() && project.status !== "Finished" && project.status !== "Cancelled")
              ) && <Badge label="Overdue" />}
              <Badge label={project.priority || "Medium"} type="priority" />
              {isAdmin && (
                <Button size="sm" variant="secondary" onClick={handleOpenEditProject}>
                  Edit Project
                </Button>
              )}
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={() => setShowDeleteProjectModal(true)}
                  style={{ background: "#dc2626", borderColor: "#dc2626", color: "white" }}
                >
                  Delete Project
                </Button>
              )}
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--color-muted-foreground)" }}>{project.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {[
                {
                  label: "Assigned Developers",
                  value: (projectMembers && projectMembers.length > 0)
                    ? projectMembers.filter(Boolean).map((m) => m?.fullName || m?.name || "Developer").join(", ")
                    : (project.ownerName || "—"),
                },
                { label: "Department", value: project.requestingDepartment || "—" },
                { label: "Due Date", value: safeFormatDate(project.dueDate) },
              ].map((info) => (
                <div key={info.label}>
                  <div className="text-xs mb-0.5" style={{ color: "var(--color-muted-foreground)" }}>{info.label}</div>
                  <div className="font-semibold truncate" style={{ color: "var(--color-foreground)" }}>{info.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-4 min-w-40" style={{ background: "#f8fafc", border: "1px solid var(--color-border)" }}>
            <div className="text-xs mb-1" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-display)" }}>Completion</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, color: "#1a3896" }}>{completionRate}%</div>
            <ProgressBar value={completionRate} />
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              {[
                { label: "Total", val: totalTasks },
                { label: "Done", val: completed, color: "#22c55e" },
                { label: "Active", val: activeCount, color: "#3b82f6" },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 16, color: s.color ?? "var(--color-foreground)" }}>{s.val}</div>
                  <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {(["tasks", "members"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors cursor-pointer"
              style={{
                background: activeTab === tab ? "#1a3896" : "#f1f5f9",
                color: activeTab === tab ? "white" : "#475569",
                fontFamily: "var(--font-display)",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "tasks" && (
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => {
                  if (project.status === "Cancelled") {
                    alert("Cannot add tasks to a cancelled project. Please change project status to In Progress first.");
                    return;
                  }
                  setShowCreateTaskModal(true);
                }}
                disabled={project.status === "Cancelled"}
                title={project.status === "Cancelled" ? "Cannot add tasks to a cancelled project. Reopen the project first." : undefined}
              >
                + Add Task
              </Button>
            )}
            <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
              {(["kanban", "list"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer"
                  style={{
                    background: view === v ? "#0f172a" : "transparent",
                    color: view === v ? "white" : "#475569",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cancelled Project Warning Banner */}
      {activeTab === "tasks" && project.status === "Cancelled" && (
        <div className="p-3.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-sm flex items-center gap-2">
          <span>⚠️ <strong>Project is Cancelled:</strong> Tasks cannot be added or moved to In Progress or Review until this project's status is changed back to In Progress. Completed tasks remain completed.</span>
        </div>
      )}

      {/* Kanban View */}
      {activeTab === "tasks" && view === "kanban" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TASK_STATUSES.map((status) => (
            <div key={status} className="rounded-2xl p-4 shadow-xs" style={{ background: statusColors[status], minHeight: 220 }}>
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-display)", color: "#475569" }}>{status}</span>
                <span className="text-xs px-2 py-0.5 rounded-md font-mono font-semibold" style={{ background: "rgba(0,0,0,0.08)", color: "#334155" }}>
                  {tasksByStatus[status]?.length ?? 0}
                </span>
              </div>
              <div className="space-y-3">
                {(tasksByStatus[status] ?? []).map((task) => {
                  const isTaskOverdue = checkIsOverdue(task);
                  return (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`w-full text-left p-4 rounded-xl bg-white shadow-xs transition-shadow hover:shadow-md cursor-pointer ${
                        isTaskOverdue ? "border-l-4 border-l-rose-500 ring-1 ring-rose-200" : "border border-slate-100/80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="text-sm font-medium leading-snug" style={{ fontFamily: "var(--font-display)", color: "var(--color-foreground)" }}>
                          {task.title}
                        </div>
                        {isAdmin && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setTaskToDelete(task);
                            }}
                            className="text-slate-400 hover:text-red-600 p-0.5 rounded text-xs font-bold leading-none cursor-pointer transition-colors flex-shrink-0"
                            title="Delete task"
                          >
                            ✕
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <div className="flex items-center gap-1">
                          <Badge label={task.priority} type="priority" />
                          {isTaskOverdue && <Badge label="Overdue" />}
                        </div>
                        <span
                          className="text-xs flex items-center gap-1 font-medium"
                          style={{ fontFamily: "var(--font-mono)", color: isTaskOverdue ? "#ef4444" : "var(--color-muted-foreground)" }}
                        >
                          {isTaskOverdue && "⚠️"}
                          {task.dueDate ? safeFormatDate(task.dueDate) : "—"}
                        </span>
                      </div>

                      {/* Completed timestamp */}
                      {task.status === "Completed" && (
                        <div className="text-[11px] text-emerald-700 font-medium mt-1.5 flex items-center gap-1">
                          <span>✓</span>
                          <span>Completed: {safeFormatDateTime(task.completedAt || task.createdAt)}</span>
                        </div>
                      )}

                      {/* Overdue justification snippet */}
                      {isTaskOverdue && task.missedDeadlineReason && (
                        <div className="mt-1.5 p-1.5 rounded bg-rose-50 border border-rose-200 text-[11px] text-rose-800 line-clamp-1 italic">
                          ⚠️ Delay: "{task.missedDeadlineReason}"
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {activeTab === "tasks" && view === "list" && (
        <Card>
          <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {sortedDisplayTasks.map((task) => {
              const isTaskOverdue = checkIsOverdue(task);
              return (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left cursor-pointer ${
                    isTaskOverdue ? "bg-rose-50/40" : ""
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--color-foreground)" }}>
                      {task.title}
                      {isTaskOverdue && <Badge label="Overdue" />}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                      {(task.assignees || []).map((a) => a?.name || "Assignee").join(", ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge label={task.priority} type="priority" />
                    <Badge label={task.status} />
                    {task.status === "Completed" ? (
                      <span className="text-xs font-medium text-emerald-700 font-mono">
                        ✓ {safeFormatDateTime(task.completedAt || task.createdAt)}
                      </span>
                    ) : (
                      <span
                        className="text-xs font-medium"
                        style={{ fontFamily: "var(--font-mono)", color: isTaskOverdue ? "#ef4444" : "var(--color-muted-foreground)" }}
                      >
                        {isTaskOverdue && "⚠️"} {safeFormatDate(task.dueDate)}
                      </span>
                    )}
                    {isAdmin && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setTaskToDelete(task);
                        }}
                        className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 text-xs font-bold leading-none cursor-pointer transition-colors"
                        title="Delete task"
                      >
                        ✕
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Assigned Developers ({projectMembers.length})
            </h3>
            {isAdmin && (
              <Button size="sm" onClick={() => setShowAddMemberModal(true)}>
                + Add Member
              </Button>
            )}
          </div>

          {projectMembers.length === 0 ? (
            <div className="text-sm text-center py-8" style={{ color: "var(--color-muted-foreground)" }}>
              No developers or admins assigned to this project yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {(projectMembers || []).filter(Boolean).map((member) => (
                <Card key={member?.userId || member?.id} style={{ padding: 20, textAlign: "center" }}>
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ background: "#1a3896", fontFamily: "var(--font-display)" }}>
                      {member?.avatar || (typeof member?.fullName === "string" && member.fullName ? member.fullName.split(" ").map((n: string) => n[0]).join("") : "U")}
                    </div>
                  </div>
                  <div className="font-semibold text-sm truncate" style={{ fontFamily: "var(--font-display)" }}>{member?.fullName || member?.name || "User"}</div>
                  <div className="text-xs mt-0.5 truncate" style={{ color: "var(--color-muted-foreground)" }}>{member?.email || ""}</div>
                  {isAdmin && (
                    <button
                      onClick={() => handleRemoveMember(member?.userId || member?.id)}
                      className="mt-3 text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Task Detail Drawer Modal */}
      {selectedTask && (
        <Modal title={selectedTask.title} onClose={() => setSelectedTask(null)} wide>
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge label={selectedTask.priority} type="priority" />
                <Badge label={selectedTask.status} />
                {checkIsOverdue(selectedTask) && <Badge label="Overdue" />}
                <span
                  className="text-sm font-medium"
                  style={{
                    color: checkIsOverdue(selectedTask) ? "#ef4444" : "var(--color-muted-foreground)",
                  }}
                >
                  Due {safeFormatDate(selectedTask.dueDate)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Button size="sm" variant="secondary" onClick={() => startEditTask(selectedTask)}>
                    ✏️ Edit Task
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    size="sm"
                    onClick={() => setTaskToDelete(selectedTask)}
                    style={{ background: "#dc2626", borderColor: "#dc2626", color: "white" }}
                  >
                    Delete Task
                  </Button>
                )}
              </div>
            </div>

            {/* Overdue Delay Justification Banner - persists even when completed! */}
            {checkIsOverdue(selectedTask) && (
              selectedTask.missedDeadlineReason ? (
                <div className="p-3 rounded-lg text-sm bg-rose-50 border border-rose-200 text-rose-800">
                  <div className="flex items-center justify-between">
                    <span>
                      ⚠️ <strong>Overdue Justification ({selectedTask.reasonCategory || "Other"}):</strong> "{selectedTask.missedDeadlineReason}"
                    </span>
                    {(isAdmin ||
                      (selectedTask.assignees || []).some((a) => a?.id === currentUser?.id) ||
                      selectedTask.createdById === currentUser?.id) && (
                      <button
                        onClick={() => {
                          setShowReasonModal(selectedTask);
                          setReasonForm({
                            reason: selectedTask.missedDeadlineReason || "",
                            category: selectedTask.reasonCategory || "Resource Constraints",
                          });
                        }}
                        className="text-xs text-rose-700 hover:text-rose-900 underline font-semibold cursor-pointer ml-2"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg text-sm bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-2">
                  <div>⚠️ <strong>Task is Overdue:</strong> A delay justification must be submitted.</div>
                  {(isAdmin ||
                    (selectedTask.assignees || []).some((a) => a?.id === currentUser?.id) ||
                    selectedTask.createdById === currentUser?.id) && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setShowReasonModal(selectedTask);
                        setReasonForm({ reason: "", category: "Resource Constraints" });
                      }}
                    >
                      Add Reason
                    </Button>
                  )}
                </div>
              )
            )}

            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>{selectedTask.description}</p>

            {/* Completion Timestamp Box */}
            {selectedTask.status === "Completed" && (
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-sm">
                ✓ <strong>Completed</strong> {selectedTask.completedAt ? `on ${safeFormatDateTime(selectedTask.completedAt)}` : ""}
              </div>
            )}

            {/* Workflow & Status Actions */}
            {project?.status === "Cancelled" ? (
              <div className="p-3.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-300 text-sm">
                🔒 <strong>Project Cancelled:</strong> Tasks cannot be moved to In Progress or Review while the project is Cancelled. Reopen the project (set status to In Progress) to resume work on tasks.
              </div>
            ) : isAdmin ? (
              selectedTask.status === "Review" ? (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-muted-foreground)" }}>Admin Review Actions</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      onClick={() => updateTaskStatus(selectedTask.id, "Completed")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      ✓ Approve (Complete)
                    </button>
                    <button
                      onClick={() => updateTaskStatus(selectedTask.id, "Assigned")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors cursor-pointer"
                    >
                      ↺ Send Back (Rework)
                    </button>
                    <button
                      onClick={() => updateTaskStatus(selectedTask.id, "Cancelled")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 transition-colors cursor-pointer"
                    >
                      ✕ Cancel Task
                    </button>
                  </div>
                  <Select
                    value={selectedTask.status}
                    onChange={(v) => updateTaskStatus(selectedTask.id, v)}
                    options={TASK_STATUSES.map((s) => ({ value: s, label: s }))}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-muted-foreground)" }}>Update Status</label>
                  <Select
                    value={selectedTask.status}
                    onChange={(v) => updateTaskStatus(selectedTask.id, v)}
                    options={TASK_STATUSES.map((s) => ({ value: s, label: s }))}
                  />
                </div>
              )
            ) : (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-muted-foreground)" }}>Task Workflow</label>
                {selectedTask.status === "Assigned" && (
                  <Button onClick={() => updateTaskStatus(selectedTask.id, "Review")}>
                    Submit for Review →
                  </Button>
                )}
                {selectedTask.status === "Review" && (
                  <div className="p-3 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-sm">
                    ⏳ <strong>Under Review:</strong> This task has been submitted and is awaiting Admin review and approval.
                  </div>
                )}
                {selectedTask.status === "Cancelled" && (
                  <div className="p-3 rounded-lg bg-rose-50 text-rose-900 border border-rose-200 text-sm">
                    ✕ <strong>Cancelled:</strong> This task was cancelled.
                  </div>
                )}
              </div>
            )}

            {/* Comments */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-muted-foreground)" }}>Discussion</div>
              <div className="space-y-3 mb-3">
                {taskComments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "#1a3896" }}>
                      {c.authorAvatar || (c.authorName ? c.authorName.slice(0, 2).toUpperCase() : "U")}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{c.authorName}</span>
                        <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="text-sm mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: "1px solid var(--color-border)" }}
                  placeholder="Add a comment…"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                />
                <Button size="sm" onClick={handleAddComment}>Post</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <Modal title={`Add Task to "${project.name}"`} onClose={() => setShowCreateTaskModal(false)} wide>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Title</label>
              <Input
                value={createTaskForm.title}
                onChange={(v) => setCreateTaskForm((f) => ({ ...f, title: v }))}
                placeholder="e.g. Implement payment webhook"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Description</label>
              <textarea
                rows={2}
                value={createTaskForm.description}
                onChange={(e) => setCreateTaskForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: "1px solid var(--color-border)", fontFamily: "var(--font-body)", resize: "vertical" }}
                placeholder="Details of the task…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Priority</label>
                <Select
                  value={createTaskForm.priority}
                  onChange={(v) => setCreateTaskForm((f) => ({ ...f, priority: v as Priority }))}
                  options={PRIORITIES.map((p) => ({ value: p, label: p }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Status</label>
                {isAdmin ? (
                  <Select
                    value={createTaskForm.status}
                    onChange={(v) => setCreateTaskForm((f) => ({ ...f, status: v as TaskStatus }))}
                    options={TASK_STATUSES.map((s) => ({ value: s, label: s }))}
                  />
                ) : (
                  <div className="px-3 py-2 rounded-lg text-sm bg-slate-100 text-slate-700 border border-slate-200">
                    Assigned
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Due Date</label>
                <Input
                  type="date"
                  value={createTaskForm.dueDate}
                  onChange={(v) => setCreateTaskForm((f) => ({ ...f, dueDate: v }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
                Assign Developers & Admins (Select one or more)
              </label>
              {assignableUsers.length === 0 ? (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                  ⚠️ No developers or admins are assigned to this project. Please assign developers to the project first before creating tasks.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50 max-h-48 overflow-y-auto">
                  {assignableUsers.map((dev) => {
                    const isSelected = createTaskForm.assigneeIds.includes(dev.id);
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
                              setCreateTaskForm((f) => ({ ...f, assigneeIds: [...f.assigneeIds, dev.id] }));
                            } else {
                              setCreateTaskForm((f) => ({ ...f, assigneeIds: f.assigneeIds.filter((id) => id !== dev.id) }));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0" style={{ background: "#1a3896" }}>
                          {dev.avatar}
                        </span>
                        <span className="truncate">
                          {dev.fullName} {dev.role === "Admin" && <span className="text-[10px] text-blue-600 font-semibold">(Admin)</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              {assignableUsers.length > 0 && createTaskForm.assigneeIds.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Please select at least one developer or admin for this task.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowCreateTaskModal(false)}>Cancel</Button>
              <Button onClick={handleCreateTask} disabled={!createTaskForm.title.trim() || createTaskForm.assigneeIds.length === 0}>
                Create Task
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <Modal title="Add Member to Project" onClose={() => setShowAddMemberModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>
                Select Developer / Admin
              </label>
              <Select
                value={selectedNewMemberId ? String(selectedNewMemberId) : ""}
                onChange={(v) => setSelectedNewMemberId(Number(v))}
                options={[
                  { value: "", label: "-- Choose a developer / admin --" },
                  ...nonMemberDevelopers.map((d) => ({ value: String(d.id), label: `${d.fullName} (${d.role}) - ${d.email}` })),
                ]}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowAddMemberModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMember} disabled={!selectedNewMemberId}>
                Add Member
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <Modal title="Edit Task" onClose={() => setEditingTask(null)} wide>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Title</label>
              <Input value={editForm.title} onChange={(v) => setEditForm((f) => ({ ...f, title: v }))} placeholder="Task title" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Description</label>
              <textarea rows={2} value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: "1px solid var(--color-border)", fontFamily: "var(--font-body)", resize: "vertical" }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Priority</label>
                <Select value={editForm.priority} onChange={(v) => setEditForm((f) => ({ ...f, priority: v as Priority }))} options={PRIORITIES.map((p) => ({ value: p, label: p }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Status</label>
                {isAdmin && project?.status !== "Cancelled" ? (
                  <Select value={editForm.status} onChange={(v) => setEditForm((f) => ({ ...f, status: v as TaskStatus }))} options={TASK_STATUSES.map((s) => ({ value: s, label: s }))} />
                ) : (
                  <div className="px-3 py-2 rounded-lg text-sm bg-slate-100 text-slate-700 border border-slate-200">
                    {editForm.status} {project?.status === "Cancelled" && "(Locked - Project Cancelled)"}
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Due Date</label>
                <Input type="date" value={editForm.dueDate} onChange={(v) => setEditForm((f) => ({ ...f, dueDate: v }))} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
                Assign Developers & Admins (Select one or more)
              </label>
              {assignableUsers.length === 0 ? (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                  ⚠️ No developers or admins are assigned to this project. Please assign developers to the project first.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50 max-h-48 overflow-y-auto">
                  {assignableUsers.map((dev) => {
                    const isSelected = editForm.assigneeIds.includes(dev.id);
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
                              setEditForm((f) => ({ ...f, assigneeIds: [...f.assigneeIds, dev.id] }));
                            } else {
                              setEditForm((f) => ({ ...f, assigneeIds: f.assigneeIds.filter((id) => id !== dev.id) }));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0" style={{ background: "#1a3896" }}>
                          {dev.avatar}
                        </span>
                        <span className="truncate">
                          {dev.fullName} {dev.role === "Admin" && <span className="text-[10px] text-blue-600 font-semibold">(Admin)</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              {assignableUsers.length > 0 && editForm.assigneeIds.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Please select at least one developer or admin for this task.</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <div>
                {isAdmin && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const toDel = editingTask;
                      setEditingTask(null);
                      setTaskToDelete(toDel);
                    }}
                    style={{ background: "#dc2626", borderColor: "#dc2626", color: "white" }}
                  >
                    Delete Task
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setEditingTask(null)}>Cancel</Button>
                <Button onClick={handleSaveEditTask} disabled={!editForm.title.trim() || editForm.assigneeIds.length === 0}>Save Changes</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Task Delay Reason Modal */}
      {showReasonModal && (
        <Modal
          title="Submit Missed Deadline Reason"
          onClose={() => setShowReasonModal(null)}
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500">Task:</span>{" "}
              <strong className="text-slate-800">{showReasonModal.title}</strong>
              <div className="text-slate-500 mt-0.5">
                Due date: {safeFormatDate(showReasonModal.dueDate)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>
                Category
              </label>
              <Select
                value={reasonForm.category}
                onChange={(v) => setReasonForm((f) => ({ ...f, category: v }))}
                options={REASON_CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>
                Delay Justification
              </label>
              <textarea
                rows={3}
                value={reasonForm.reason}
                onChange={(e) => setReasonForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Describe what caused the task delay…"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  border: "1px solid var(--color-border)",
                  fontFamily: "var(--font-body)",
                  resize: "vertical",
                }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowReasonModal(null)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitTaskReason} disabled={!reasonForm.reason.trim()}>
                Submit Reason
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Project Modal */}
      {showEditProjectModal && project && (
        <Modal title="Edit Project" onClose={() => setShowEditProjectModal(false)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  Project Name
                </label>
                <Input
                  value={editProjectForm.name}
                  onChange={(v) => setEditProjectForm((f) => ({ ...f, name: v }))}
                  placeholder="Project name"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  Description
                </label>
                <textarea
                  value={editProjectForm.description}
                  onChange={(e) => setEditProjectForm((f) => ({ ...f, description: e.target.value }))}
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
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  Status
                </label>
                <Select
                  value={editProjectForm.status}
                  onChange={(v) => setEditProjectForm((f) => ({ ...f, status: v as ProjectStatus }))}
                  options={PROJECT_STATUSES.map((s) => ({ value: s, label: s }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  Priority
                </label>
                <Select
                  value={editProjectForm.priority}
                  onChange={(v) => setEditProjectForm((f) => ({ ...f, priority: v as Priority }))}
                  options={["Low", "Medium", "High", "Urgent"].map((s) => ({ value: s, label: s }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  Start Date
                </label>
                <Input
                  type="date"
                  value={editProjectForm.startDate}
                  onChange={(v) => setEditProjectForm((f) => ({ ...f, startDate: v }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  Due Date
                </label>
                <Input
                  type="date"
                  value={editProjectForm.dueDate}
                  onChange={(v) => setEditProjectForm((f) => ({ ...f, dueDate: v }))}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  Department
                </label>
                <Input
                  value={editProjectForm.requestingDepartment}
                  onChange={(v) => setEditProjectForm((f) => ({ ...f, requestingDepartment: v }))}
                  placeholder="e.g. Engineering, IT"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
                  Assigned Developers & Admins (Select one or more)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50 max-h-48 overflow-y-auto">
                  {assignableUsers.map((dev) => {
                    const isSelected = editProjectForm.memberIds.includes(dev.id);
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
                              setEditProjectForm((f) => ({ ...f, memberIds: [...f.memberIds, dev.id] }));
                            } else {
                              setEditProjectForm((f) => ({ ...f, memberIds: f.memberIds.filter((id) => id !== dev.id) }));
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
                {editProjectForm.memberIds.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Please select at least one developer or admin for this project.</p>
                )}
              </div>

              {(project.isOverdue || Boolean(project.missedDeadlineReason) || (project.dueDate && new Date(project.dueDate) < new Date())) && (
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>
                    Overdue Reason
                  </label>
                  <textarea
                    rows={2}
                    value={editProjectForm.missedDeadlineReason}
                    onChange={(e) => setEditProjectForm((f) => ({ ...f, missedDeadlineReason: e.target.value }))}
                    placeholder="Describe what caused the project delay…"
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: "1px solid var(--color-border)", resize: "vertical" }}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowEditProjectModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEditProject} disabled={!editProjectForm.name || editProjectForm.memberIds.length === 0}>
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Project Delay Reason Modal */}
      {showProjectReasonModal && project && (
        <Modal
          title={project.missedDeadlineReason ? "Edit Project Overdue Reason" : "Submit Project Overdue Reason"}
          onClose={() => setShowProjectReasonModal(false)}
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500">Project:</span>{" "}
              <strong className="text-slate-800">{project.name}</strong>
              <div className="text-slate-500 mt-0.5">
                Due date: {safeFormatDate(project.dueDate)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>
                Overdue Reason
              </label>
              <textarea
                rows={3}
                value={projectReasonForm.reason}
                onChange={(e) => setProjectReasonForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Describe what caused the project delay…"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  border: "1px solid var(--color-border)",
                  fontFamily: "var(--font-body)",
                  resize: "vertical",
                }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowProjectReasonModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitProjectReason} disabled={!projectReasonForm.reason.trim()}>
                {project.missedDeadlineReason ? "Save Reason" : "Submit Reason"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Project Confirmation Modal */}
      {showDeleteProjectModal && project && (
        <Modal
          title="Delete Project"
          onClose={() => !deletingProject && setShowDeleteProjectModal(false)}
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
              <p className="font-semibold mb-1">Are you sure you want to delete this project?</p>
              <p className="text-xs text-rose-700">
                This will permanently delete "<strong>{project.name}</strong>", including all its tasks, comments, and member assignments. This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteProjectModal(false)}
                disabled={deletingProject}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteProject}
                disabled={deletingProject}
                style={{ background: "#dc2626", borderColor: "#dc2626", color: "white" }}
              >
                {deletingProject ? "Deleting..." : "Yes, Delete Project"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Task Confirmation Modal */}
      {taskToDelete && (
        <Modal
          title="Delete Task"
          onClose={() => !deletingTask && setTaskToDelete(null)}
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
              <p className="font-semibold mb-1">Are you sure you want to delete this task?</p>
              <p className="text-xs text-rose-700">
                This will permanently delete "<strong>{taskToDelete.title}</strong>", including its comments. This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setTaskToDelete(null)}
                disabled={deletingTask}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteTask}
                disabled={deletingTask}
                style={{ background: "#dc2626", borderColor: "#dc2626", color: "white" }}
              >
                {deletingTask ? "Deleting..." : "Yes, Delete Task"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
