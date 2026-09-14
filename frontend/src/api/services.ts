import { apiClient } from "./apiClient";
import type {
  User,
  Project,
  Task,
  SubTask,
  Comment,
  Customer,
  Team,
  Notification,
  Role,
} from "../data/mock";

// Auth API
export const authApi = {
  async login(email: string, password: string): Promise<User> {
    const res = await apiClient.post<any>("/Auth/login", { email, password });
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

  async getCurrentUser(userId: number): Promise<User> {
    const res = await apiClient.get<any>(`/Auth/me?userId=${userId}`);
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

// Projects API
export const projectsApi = {
  async getProjects(): Promise<Project[]> {
    const res = await apiClient.get<any[]>("/Projects");
    return res.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || "",
      status: p.status,
      priority: p.priority,
      startDate: p.startDate ? p.startDate.split("T")[0] : "",
      dueDate: p.dueDate ? p.dueDate.split("T")[0] : "",
      ownerId: p.ownerId,
      ownerName: p.ownerName || "Unassigned",
      customerId: p.customerId || 0,
      customerName: p.customerName || "N/A",
      requestingDepartment: p.requestingDepartment || "",
      missedDeadlineReason: p.missedDeadlineReason || null,
      reasonCategory: p.reasonCategory || null,
      progress: p.status === "Finished" || p.status === "Completed" ? 100 : 50,
      requestedBy: p.requestedBy,
      businessJustification: p.businessJustification,
      rejectionReason: p.rejectionReason,
    }));
  },

  async getProject(id: number): Promise<Project> {
    const p = await apiClient.get<any>(`/Projects/${id}`);
    return {
      id: p.id,
      name: p.name,
      description: p.description || "",
      status: p.status,
      priority: p.priority,
      startDate: p.startDate ? p.startDate.split("T")[0] : "",
      dueDate: p.dueDate ? p.dueDate.split("T")[0] : "",
      ownerId: p.ownerId,
      ownerName: p.ownerName || "Unassigned",
      customerId: p.customerId || 0,
      customerName: p.customerName || "N/A",
      requestingDepartment: p.requestingDepartment || "",
      missedDeadlineReason: p.missedDeadlineReason || null,
      reasonCategory: p.reasonCategory || null,
      progress: p.status === "Finished" || p.status === "Completed" ? 100 : 50,
      requestedBy: p.requestedBy,
      businessJustification: p.businessJustification,
      rejectionReason: p.rejectionReason,
    };
  },

  async createProject(data: {
    name: string;
    description: string;
    ownerId: number;
    customerId?: number;
    startDate?: string;
    dueDate?: string;
    priority?: string;
    requestingDepartment?: string;
  }): Promise<Project> {
    return await apiClient.post("/Projects", data);
  },

  async updateProject(id: number, data: any): Promise<any> {
    return await apiClient.put(`/Projects/${id}`, data);
  },

  async deleteProject(id: number): Promise<any> {
    return await apiClient.delete(`/Projects/${id}`);
  },

  async submitDepartmentRequest(data: {
    name: string;
    description?: string;
    requestingDepartment: string;
    requestedBy: string;
    businessJustification?: string;
    targetDeadline?: string;
    priority?: string;
  }): Promise<any> {
    return await apiClient.post("/Projects/request", data);
  },

  async approveRequest(id: number, ownerId: number, startDate?: string, dueDate?: string, priority?: string): Promise<any> {
    return await apiClient.patch(`/Projects/${id}/approve`, { ownerId, startDate, dueDate, priority });
  },

  async rejectRequest(id: number, rejectionReason: string): Promise<any> {
    return await apiClient.patch(`/Projects/${id}/reject`, { rejectionReason });
  },

  async submitMissedReason(id: number, reason: string, category: string): Promise<any> {
    return await apiClient.put(`/Projects/${id}/missed-reason`, { reason, category });
  },
};

// Tasks API
export const tasksApi = {
  async getTasks(): Promise<Task[]> {
    const res = await apiClient.get<any[]>("/Tasks");
    return res.map((t) => ({
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
    }));
  },

  async getTasksByProject(projectId: number): Promise<Task[]> {
    const res = await apiClient.get<any[]>(`/Tasks/project/${projectId}`);
    return res.map((t) => ({
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
        avatar: a.profileImage || "A",
      })),
      createdById: t.createdById,
      dueDate: t.dueDate ? t.dueDate.split("T")[0] : "",
      createdAt: t.createdAt ? t.createdAt.split("T")[0] : "",
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
    return await apiClient.post("/Tasks", data);
  },

  async updateTask(id: number, data: any): Promise<any> {
    return await apiClient.put(`/Tasks/${id}`, data);
  },

  async deleteTask(id: number): Promise<any> {
    return await apiClient.delete(`/Tasks/${id}`);
  },
};

// SubTasks API
export const subtasksApi = {
  async getSubTasks(taskId: number): Promise<SubTask[]> {
    const res = await apiClient.get<any[]>(`/SubTasks/task/${taskId}`);
    return res.map((s) => ({
      id: s.id,
      taskId: s.taskId,
      title: s.title,
      isCompleted: s.isCompleted,
    }));
  },

  async createSubTask(taskId: number, title: string): Promise<SubTask> {
    return await apiClient.post("/SubTasks", { taskId, title });
  },

  async toggleSubTask(id: number): Promise<any> {
    return await apiClient.patch(`/SubTasks/${id}/toggle`);
  },
};

// Comments API
export const commentsApi = {
  async getComments(taskId: number): Promise<Comment[]> {
    const res = await apiClient.get<any[]>(`/Comments/task/${taskId}`);
    return res.map((c) => ({
      id: c.id,
      taskId: c.taskId,
      authorId: c.authorId,
      authorName: c.authorName || "User",
      authorAvatar: c.authorAvatar || "U",
      content: c.content,
      createdAt: c.createdAt,
    }));
  },

  async addComment(taskId: number, authorId: number, content: string): Promise<any> {
    return await apiClient.post("/Comments", { taskId, authorId, content });
  },
};

// Customers API
export const customersApi = {
  async getCustomers(): Promise<Customer[]> {
    const res = await apiClient.get<any[]>("/Customers");
    return res.map((c) => ({
      id: c.id,
      name: c.name,
      company: c.company || "",
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
      status: c.status,
      notes: c.notes || "",
    }));
  },

  async createCustomer(data: Omit<Customer, "id">): Promise<Customer> {
    return await apiClient.post("/Customers", data);
  },

  async updateCustomer(id: number, data: Partial<Customer>): Promise<any> {
    return await apiClient.put(`/Customers/${id}`, data);
  },

  async deleteCustomer(id: number): Promise<any> {
    return await apiClient.delete(`/Customers/${id}`);
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
};

// Teams API
export const teamsApi = {
  async getTeams(): Promise<Team[]> {
    const res = await apiClient.get<any[]>("/Teams");
    return res.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description || "",
      memberIds: (t.members || []).map((m: any) => m.userId || m.id),
    }));
  },

  async createTeam(name: string, description: string, memberIds: number[]): Promise<any> {
    return await apiClient.post("/Teams", { name, description, memberIds });
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
  async getSummaryReports(): Promise<any> {
    return await apiClient.get("/Reports/summary");
  },
};

// Notifications API
export const notificationsApi = {
  async getNotifications(userId: number): Promise<Notification[]> {
    const res = await apiClient.get<any[]>(`/Notifications/user/${userId}`);
    return res.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      targetId: n.projectId || n.taskId || 0,
      targetType: n.projectId ? "Project" : "Task",
      createdAt: n.createdAt,
    }));
  },

  async markAsRead(id: number): Promise<any> {
    return await apiClient.put(`/Notifications/${id}/read`);
  },
};
