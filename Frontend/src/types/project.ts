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
  requestedById?: number | null;
  requestedByName?: string | null;
  customerId?: number | null;
  customerName?: string | null;
  teamId?: number | null;
  teamName?: string | null;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  status: string;
  priority: string;
  startDate?: string | null;
  dueDate?: string | null;
  customerId?: number | null;
  teamId?: number | null;
  ownerId: number;
}

export interface UpdateProjectRequest {
  name: string;
  description?: string;
  status: string;
  priority: string;
  startDate?: string | null;
  dueDate?: string | null;
  customerId?: number | null;
  teamId?: number | null;
  ownerId: number;
}
