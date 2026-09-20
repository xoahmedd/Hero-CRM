export interface Department {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  status: string;
  ownerId?: number | null;
  ownerName?: string | null;
  peopleCount: number;
  projectCount: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface DepartmentRequest {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  status: string;
  ownerId?: number | null;
}

export interface DepartmentPagedResponse {
  items: Department[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface DepartmentNote {
  id: number;
  departmentId: number;
  userId: number;
  userName: string;
  content: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface DepartmentTag {
  id: number;
  name: string;
  color?: string | null;
}

export interface DepartmentActivity {
  id: number;
  userId: number;
  userName?: string | null;
  entityType: string;
  entityId: number;
  action: string;
  description?: string | null;
  createdAt: string;
}
