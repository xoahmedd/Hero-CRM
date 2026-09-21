export type Role = "Admin" | "Developer";
export type ProjectStatus = "In Progress" | "Finished" | "Cancelled";
export type Priority = "Low" | "Medium" | "High" | "Urgent";
export type TaskStatus = "Assigned" | "Review" | "Completed" | "Cancelled";
export type NotificationType = "ProjectAssigned" | "TaskAssigned" | "DeadlineApproaching" | "DeadlineMissed" | "General";

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  avatar: string;
  isActive: boolean;
  department?: string;
  phoneNumber?: string;
  createdAt: string;
}

export interface ProjectMember {
  userId: number;
  fullName: string;
  email?: string;
  avatar?: string;
  joinedAt?: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  startDate: string;
  dueDate: string;
  ownerId: number;
  ownerName: string;
  requestingDepartment: string;
  missedDeadlineReason: string | null;
  reasonCategory: string | null;
  progress: number;
  requestedBy?: string;
  businessJustification?: string;
  rejectionReason?: string;
  memberIds?: number[];
  members?: ProjectMember[];
  isOverdue?: boolean;
  createdAt?: string;
  completedAt?: string | null;
  updatedAt?: string;
}

export interface TaskAssignee {
  id: number;
  name: string;
  avatar: string;
  email?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  projectId: number;
  projectName: string;
  assignees: TaskAssignee[];
  createdById: number;
  createdByName?: string;
  dueDate: string;
  createdAt: string;
  updatedAt?: string;
  isOverdue?: boolean;
  missedDeadlineReason?: string | null;
  reasonCategory?: string | null;
  completedAt?: string | null;
}

export interface Comment {
  id: number;
  taskId: number;
  authorId: number;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  targetId: number;
  targetType: "Project" | "Task";
  createdAt: string;
}

