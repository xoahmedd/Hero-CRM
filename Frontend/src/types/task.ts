export interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  projectId?: number | null;
  projectName?: string | null;
  createdById: number;
  createdByName?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status: string;
  priority: string;
  projectId?: number | null;
  createdById: number;
  dueDate?: string | null;
}

export interface UpdateTaskRequest {
  title: string;
  description?: string;
  status: string;
  priority: string;
  projectId?: number | null;
  createdById: number;
  dueDate?: string | null;
}

export interface TaskAssignee {
  userId: number;
  fullName: string;
  email: string;
  profileImage?: string | null;
  assignedAt: string;
}
export interface UpdateTaskProgressRequest {
  status: string;
  note?: string;
}
