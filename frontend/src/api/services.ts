import { apiClient } from "./apiClient";
import type {
  User,
  Project,
  Task,
  Comment,
  Notification,
  Role,
} from "../data/mock";

// Auth API
export const authApi = {
  async login(email: string, password: string): Promise<User> {
    const res = await apiClient.post<any>("/Auth/login", { email, password });
    if (res.token) {
      localStorage.setItem("hero_crm_token", res.token);
    }
    const role: Role = (res.roles && res.roles[0]) ? (res.roles[0] as Role) : "Developer";
    return {
      id: res.userId,
      fullName: res.fullName,
      email: res.email,
      role,
      avatar: res.profileImage || (res.fullName ? res.fullName.split(" ").map((n: string) => n[0]).join("") : "U"),
      isActive: true,
      createdAt: new Date().toISOString().split("T")[0],
    };
  },

  async register(fullName: string, email: string, password: string): Promise<User> {
    const res = await apiClient.post<any>("/Auth/register", { fullName, email, password });
    if (res.token) {
      localStorage.setItem("hero_crm_token", res.token);
    }
    const role: Role = (res.roles && res.roles[0]) ? (res.roles[0] as Role) : "Developer";
    return {
      id: res.userId,
      fullName: res.fullName,
      email: res.email,
      role,
      avatar: res.profileImage || (res.fullName ? res.fullName.split(" ").map((n: string) => n[0]).join("") : "U"),
      isActive: true,
      createdAt: new Date().toISOString().split("T")[0],
    };
  },

  logout(): void {
    localStorage.removeItem("hero_crm_token");
  },

  async getCurrentUser(userId?: number): Promise<User> {
    const endpoint = userId ? `/Auth/me?userId=${userId}` : "/Auth/me";
    const res = await apiClient.get<any>(endpoint);
    return {
      id: res.id,
      fullName: res.fullName,
      email: res.email,
      role: res.role as Role,
      avatar: res.avatar,
      isActive: res.isActive,
      createdAt: res.createdAt,
    };
  },
};

function normalizeProjectStatus(rawStatus?: any): ProjectStatus {
  if (!rawStatus) return "In Progress";
  const s = String(rawStatus).toLowerCase().replace(/[\s_-]/g, "");
  if (s === "finished" || s === "completed") return "Finished";
  if (s === "cancelled" || s === "canceled" || s === "rejected") return "Cancelled";
  return "In Progress";
}

// Projects API
export const projectsApi = {
  async getProjects(): Promise<Project[]> {
    const res = await apiClient.get<any[]>("/Projects");
    return (Array.isArray(res) ? res : []).map((p) => {
      const status = normalizeProjectStatus(p.status);
      return {
        id: p.id,
        name: p.name,
        description: p.description || "",
        status,
        priority: p.priority,
        startDate: p.startDate ? p.startDate.split("T")[0] : "",
        dueDate: p.dueDate ? p.dueDate.split("T")[0] : "",
        ownerId: p.ownerId,
        ownerName: p.ownerName || "Unassigned",
        requestingDepartment: p.requestingDepartment || "",
        missedDeadlineReason: p.missedDeadlineReason || null,
        reasonCategory: p.reasonCategory || null,
        isOverdue: Boolean(p.isOverdue) || Boolean(p.missedDeadlineReason) || Boolean(p.dueDate && new Date(p.dueDate) < new Date() && status === "In Progress"),
        progress: typeof p.progress === "number" ? p.progress : (status === "Finished" ? 100 : 0),
        requestedBy: p.requestedBy,
        businessJustification: p.businessJustification,
        rejectionReason: p.rejectionReason,
        members: (p.members || []).map((m: any) => ({
          userId: m.userId,
          fullName: m.fullName,
          email: m.email,
          avatar: m.profileImage || (m.fullName ? m.fullName.split(" ").map((n: string) => n[0]).join("") : "U"),
        })),
        memberIds: (p.members || []).map((m: any) => m.userId),
        createdAt: p.createdAt || (p.startDate ? p.startDate : undefined),
      };
    });
  },

  async getProject(id: number): Promise<Project> {
    const p = await apiClient.get<any>(`/Projects/${id}`);
    const status = normalizeProjectStatus(p.status);
    return {
      id: p.id,
      name: p.name,
      description: p.description || "",
      status,
      priority: p.priority,
      startDate: p.startDate ? p.startDate.split("T")[0] : "",
      dueDate: p.dueDate ? p.dueDate.split("T")[0] : "",
      ownerId: p.ownerId,
      ownerName: p.ownerName || "Unassigned",
      requestingDepartment: p.requestingDepartment || "",
      missedDeadlineReason: p.missedDeadlineReason || null,
      reasonCategory: p.reasonCategory || null,
      isOverdue: Boolean(p.isOverdue) || Boolean(p.missedDeadlineReason) || Boolean(p.dueDate && new Date(p.dueDate) < new Date() && status === "In Progress"),
      progress: typeof p.progress === "number" ? p.progress : (status === "Finished" ? 100 : 0),
      requestedBy: p.requestedBy,
      businessJustification: p.businessJustification,
      rejectionReason: p.rejectionReason,
      members: (p.members || []).map((m: any) => ({
        userId: m.userId,
        fullName: m.fullName,
        email: m.email,
        avatar: m.profileImage || (m.fullName ? m.fullName.split(" ").map((n: string) => n[0]).join("") : "U"),
      })),
      memberIds: (p.members || []).map((m: any) => m.userId),
      createdAt: p.createdAt || (p.startDate ? p.startDate : undefined),
    };
  },

  async createProject(data: {
    name: string;
    description: string;
    ownerId?: number;
    memberIds?: number[];
    startDate?: string;
    dueDate?: string;
    priority?: string;
    requestingDepartment?: string;
  }): Promise<Project> {
    const payload = {
      ...data,
      startDate: data.startDate?.trim() ? data.startDate : null,
      dueDate: data.dueDate?.trim() ? data.dueDate : null,
    };
    return await apiClient.post("/Projects", payload);
  },

  async updateProject(id: number, data: any): Promise<any> {
    const payload = {
      ...data,
      startDate: data.startDate?.trim() ? data.startDate : null,
      dueDate: data.dueDate?.trim() ? data.dueDate : null,
    };
    return await apiClient.put(`/Projects/${id}`, payload);
  },

  async updateProjectStatus(id: number, status: string): Promise<any> {
    return await apiClient.patch(`/Projects/${id}/status?status=${encodeURIComponent(status)}`);
  },

  async deleteProject(id: number): Promise<any> {
    return await apiClient.delete(`/Projects/${id}`);
  },

  async submitMissedReason(id: number, reason: string, category?: string): Promise<any> {
    return await apiClient.put(`/Projects/${id}/missed-reason`, { reason, category: category || null });
  },
};

export const projectMembersApi = {
  async getMembers(projectId: number): Promise<any[]> {
    return await apiClient.get<any[]>(`/Projects/${projectId}/members`);
  },

  async addMember(projectId: number, userId: number): Promise<any> {
    return await apiClient.post(`/Projects/${projectId}/members/${userId}`);
  },

  async removeMember(projectId: number, userId: number): Promise<any> {
    return await apiClient.delete(`/Projects/${projectId}/members/${userId}`);
  },
};

// Tasks API
export const tasksApi = {
  async getTasks(): Promise<Task[]> {
    const res = await apiClient.get<any[]>("/Tasks");
    return (Array.isArray(res) ? res : []).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description || "",
      status: t.status,
      priority: t.priority,
      projectId: t.projectId,
      projectName: t.projectName || "General",
      assignees: (t.assignees || []).map((a: any) => ({
        id: a.userId || a.id,
        name: a.fullName || a.name || "Assignee",
        avatar: a.profileImage || (a.fullName ? a.fullName.split(" ").map((n: string) => n[0]).join("") : "A"),
      })),
      createdById: t.createdById,
      dueDate: t.dueDate ? t.dueDate.split("T")[0] : "",
      createdAt: t.createdAt ? t.createdAt.split("T")[0] : "",
      completedAt: t.completedAt ? t.completedAt : (t.status === "Completed" ? (t.updatedAt || t.createdAt || null) : null),
      isOverdue: typeof t.isOverdue === "boolean"
        ? t.isOverdue
        : Boolean(t.missedDeadlineReason) || (
            t.dueDate
              ? (t.status === "Completed"
                  ? (t.completedAt ? new Date(t.completedAt) > new Date(t.dueDate) : false)
                  : (new Date(t.dueDate) < new Date() && t.status !== "Cancelled"))
              : false
          ),
      missedDeadlineReason: t.missedDeadlineReason || null,
      reasonCategory: t.reasonCategory || null,
    }));
  },

  async getTasksByProject(projectId: number): Promise<Task[]> {
    const res = await apiClient.get<any[]>(`/Tasks/project/${projectId}`);
    return (Array.isArray(res) ? res : []).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description || "",
      status: t.status,
      priority: t.priority,
      projectId: t.projectId,
      projectName: t.projectName || "",
      assignees: (t.assignees || []).map((a: any) => ({
        id: a.userId || a.id,
        name: a.fullName || a.name || "Assignee",
        avatar: a.profileImage || (a.fullName ? a.fullName.split(" ").map((n: string) => n[0]).join("") : "A"),
      })),
      createdById: t.createdById,
      dueDate: t.dueDate ? t.dueDate.split("T")[0] : "",
      createdAt: t.createdAt ? t.createdAt.split("T")[0] : "",
      completedAt: t.completedAt ? t.completedAt : (t.status === "Completed" ? (t.updatedAt || t.createdAt || null) : null),
      isOverdue: typeof t.isOverdue === "boolean"
        ? t.isOverdue
        : Boolean(t.missedDeadlineReason) || (
            t.dueDate
              ? (t.status === "Completed"
                  ? (t.completedAt ? new Date(t.completedAt) > new Date(t.dueDate) : false)
                  : (new Date(t.dueDate) < new Date() && t.status !== "Cancelled"))
              : false
          ),
      missedDeadlineReason: t.missedDeadlineReason || null,
      reasonCategory: t.reasonCategory || null,
    }));
  },

  async createTask(data: {
    title: string;
    description?: string;
    projectId: number;
    createdById: number;
    assigneeIds?: number[];
    dueDate?: string;
    priority?: string;
  }): Promise<any> {
    const payload = {
      ...data,
      dueDate: data.dueDate?.trim() ? data.dueDate : null,
    };
    return await apiClient.post("/Tasks", payload);
  },

  async updateTask(id: number, data: any): Promise<any> {
    const payload = {
      ...data,
      dueDate: data.dueDate?.trim() ? data.dueDate : null,
    };
    return await apiClient.put(`/Tasks/${id}`, payload);
  },

  async updateTaskStatus(id: number, status: string): Promise<any> {
    return await apiClient.patch(`/Tasks/${id}/status?status=${encodeURIComponent(status)}`, { status });
  },

  async deleteTask(id: number): Promise<any> {
    return await apiClient.delete(`/Tasks/${id}`);
  },

  async submitMissedReason(id: number, reason: string, category: string): Promise<any> {
    return await apiClient.put(`/Tasks/${id}/missed-reason`, { reason, category });
  },
};

// Comments API
export const commentsApi = {
  async getComments(taskId: number): Promise<Comment[]> {
    const res = await apiClient.get<any[]>(`/Comments/task/${taskId}`);
    return res.map((c) => ({
      id: c.id,
      taskId: c.taskItemId || c.taskId,
      authorId: c.userId || c.authorId,
      authorName: c.userName || c.authorName || "User",
      authorAvatar: c.authorAvatar || "U",
      content: c.content,
      createdAt: c.createdAt,
    }));
  },

  async addComment(taskId: number, authorId: number, content: string): Promise<any> {
    return await apiClient.post("/Comments", { taskItemId: taskId, taskId, userId: authorId, authorId, content });
  },
};



// Users API
export const usersApi = {
  async getUsers(): Promise<User[]> {
    const res = await apiClient.get<any[]>("/Users");
    return res.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: (u.role || "Developer") as Role,
      avatar: u.profileImage || (u.fullName ? u.fullName.split(" ").map((n: string) => n[0]).join("") : "U"),
      isActive: u.isActive,
      createdAt: u.createdAt ? u.createdAt.split("T")[0] : "",
    }));
  },

  async createUser(data: any): Promise<any> {
    return await apiClient.post("/Users", data);
  },

  async updateUser(id: number, data: any): Promise<any> {
    return await apiClient.put(`/Users/${id}`, data);
  },

  async deleteUser(id: number): Promise<any> {
    return await apiClient.delete(`/Users/${id}`);
  },
};



// Dashboard API
export const dashboardApi = {
  async getAdminDashboard(): Promise<any> {
    return await apiClient.get("/Dashboard/admin");
  },

  async getDeveloperDashboard(developerId: number): Promise<any> {
    return await apiClient.get(`/Dashboard/developer/${developerId}`);
  },
};

// Reports API
export const reportsApi = {
  async getSummaryReports(months: number = 6): Promise<any> {
    return await apiClient.get(`/Reports/workspace?months=${months}`);
  },
};

// Notifications API
export const notificationsApi = {
  async getNotifications(userId: number): Promise<Notification[]> {
    const res = await apiClient.get<any[]>(`/Notifications/user/${userId}`);
    return (Array.isArray(res) ? res : []).map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: Boolean(n.isRead),
      targetId: n.projectId || n.taskId || 0,
      targetType: n.projectId ? "Project" : "Task",
      createdAt: n.createdAt,
    }));
  },

  async markAsRead(id: number): Promise<any> {
    return await apiClient.patch(`/Notifications/${id}/read`);
  },

  async markAllAsRead(userId: number): Promise<any> {
    return await apiClient.patch(`/Notifications/user/${userId}/read-all`);
  },
};
