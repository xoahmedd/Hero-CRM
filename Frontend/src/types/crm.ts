export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface Customer {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CustomerPayload {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  status: string;
  notes?: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  priority: string;
  startDate?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  ownerId: number;
  ownerName?: string | null;
  customerId?: number | null;
  customerName?: string | null;
}

export interface ProjectPayload {
  name: string;
  description?: string;
  status: string;
  priority: string;
  startDate?: string;
  dueDate?: string;
  customerId?: number | null;
  ownerId: number;
}

export interface TaskItem {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  projectId: number;
  projectName?: string | null;
  createdById: number;
  createdByName?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface TaskPayload {
  title: string;
  description?: string;
  status: string;
  priority: string;
  projectId: number;
  createdById: number;
  dueDate?: string;
}

export interface TaskAssignee {
  userId: number;
  fullName: string;
  email: string;
  profileImage?: string | null;
  assignedAt: string;
}

export interface Team {
  id: number;
  name: string;
  description?: string | null;
  createdById: number;
  createdByName?: string | null;
  createdAt: string;
}

export interface TeamMember {
  teamId: number;
  userId: number;
  userName?: string | null;
  email?: string | null;
  joinedAt: string;
}

export interface SubTask {
  id: number;
  taskItemId: number;
  taskTitle?: string | null;
  title: string;
  isCompleted: boolean;
  dueDate?: string | null;
}

export interface Comment {
  id: number;
  taskItemId: number;
  taskTitle?: string | null;
  userId: number;
  userName?: string | null;
  content: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface Tag {
  id: number;
  name: string;
  color?: string | null;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface Activity {
  id: number;
  userId: number;
  userName?: string | null;
  entityType: string;
  entityId: number;
  action: string;
  description?: string | null;
  createdAt: string;
}

export interface DashboardSummary {
  totalCustomers: number;
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  totalUsers: number;
}

export interface ProjectDashboard {
  projectId: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  completionPercentage: number;
}

export interface SearchResult {
  query: string;
  customers: { id: number; name: string; company?: string | null }[];
  projects: { id: number; name: string; status: string }[];
  tasks: { id: number; title: string; status: string; priority: string }[];
}
