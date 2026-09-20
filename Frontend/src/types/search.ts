export interface SearchDepartmentResult {
  id: number;
  name: string;
  status: string;
  ownerName: string | null;
  peopleCount: number;
}

export interface SearchPersonResult {
  id: number;
  name: string;
  jobTitle: string | null;
  email: string | null;
  departmentId: number;
  departmentName: string;
}

export interface SearchProjectResult {
  id: number;
  name: string;
  status: string;
  departmentName: string | null;
}

export interface SearchTaskResult {
  id: number;
  title: string;
  status: string;
  priority: string;
  projectId: number | null;
  projectName: string | null;
}

export interface SearchFollowUpResult {
  id: number;
  title: string;
  type: string;
  status: string;
  dueAt: string;
  contactName: string | null;
  departmentName: string | null;
  projectName: string | null;
}

export interface GlobalSearchResponse {
  query: string;
  departments: SearchDepartmentResult[];
  people: SearchPersonResult[];
  projects: SearchProjectResult[];
  tasks: SearchTaskResult[];
  followUps: SearchFollowUpResult[];
}
