export type WorkspaceRole = "Admin" | "User";

export interface ManagedUser {
  userId: number;
  fullName: string;
  email: string;
  profileImage?: string | null;
  isActive: boolean;
  departmentId?: number | null;
  departmentName?: string | null;
  roles: string[];
  createdAt: string;
  updatedAt?: string | null;
  assignedTaskCount: number;
  projectCount: number;
  teamCount: number;
}

export interface CreateManagedUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: WorkspaceRole;
  departmentId?: number | null;
  profileImage?: string | null;
}

export interface UpdateManagedUserRequest {
  fullName: string;
  email: string;
  role: WorkspaceRole;
  departmentId?: number | null;
  isActive: boolean;
  profileImage?: string | null;
}
