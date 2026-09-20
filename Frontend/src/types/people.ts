export interface Person {
  id: number;
  departmentId: number;
  departmentName: string;
  name: string;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface PersonDetails extends Person {
  noteCount: number;
  tagCount: number;
  relatedProjectCount: number;
}

export interface PersonRequest {
  departmentId: number;
  name: string;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  isPrimary: boolean;
}

export interface PersonNote {
  id: number;
  personId: number;
  userId: number;
  userName: string;
  content: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface PersonTag {
  id: number;
  name: string;
  color?: string | null;
}

export interface PersonProject {
  id: number;
  name: string;
  status: string;
  priority: string;
  startDate?: string | null;
  dueDate?: string | null;
}

export interface PersonActivity {
  id: number;
  userId: number;
  userName: string;
  action: string;
  description?: string | null;
  createdAt: string;
}
