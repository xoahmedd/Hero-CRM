import api from "../api/axios";
import type {
  Department,
  DepartmentActivity,
  DepartmentNote,
  DepartmentPagedResponse,
  DepartmentRequest,
  DepartmentTag,
} from "../types/department";

export async function getDepartments(): Promise<Department[]> {
  const response = await api.get<Department[]>("/Departments");
  return response.data;
}

export async function getDepartmentsPaged(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  ownerId?: number;
}): Promise<DepartmentPagedResponse> {
  const response = await api.get<DepartmentPagedResponse>("/Departments/paged", { params });
  return response.data;
}

export async function getDepartment(id: number): Promise<Department> {
  const response = await api.get<Department>(`/Departments/${id}`);
  return response.data;
}

export async function createDepartment(data: DepartmentRequest): Promise<Department> {
  const response = await api.post<Department>("/Departments", data);
  return response.data;
}

export async function updateDepartment(id: number, data: DepartmentRequest): Promise<void> {
  await api.put(`/Departments/${id}`, data);
}

export async function deleteDepartment(id: number): Promise<void> {
  await api.delete(`/Departments/${id}`);
}

export async function getDepartmentNotes(departmentId: number): Promise<DepartmentNote[]> {
  const response = await api.get<DepartmentNote[]>(`/Departments/${departmentId}/notes`);
  return response.data;
}

export async function createDepartmentNote(departmentId: number, content: string): Promise<DepartmentNote> {
  const response = await api.post<DepartmentNote>(`/Departments/${departmentId}/notes`, { content });
  return response.data;
}

export async function deleteDepartmentNote(departmentId: number, noteId: number): Promise<void> {
  await api.delete(`/Departments/${departmentId}/notes/${noteId}`);
}

export async function getAllDepartmentTags(): Promise<DepartmentTag[]> {
  const response = await api.get<DepartmentTag[]>("/DepartmentTags");
  return response.data;
}

export async function createDepartmentTag(data: { name: string; color?: string | null }): Promise<DepartmentTag> {
  const response = await api.post<DepartmentTag>("/DepartmentTags", data);
  return response.data;
}

export async function getDepartmentTags(departmentId: number): Promise<DepartmentTag[]> {
  const response = await api.get<DepartmentTag[]>(`/DepartmentTags/department/${departmentId}`);
  return response.data;
}

export async function assignDepartmentTag(departmentId: number, tagId: number): Promise<void> {
  await api.post(`/DepartmentTags/department/${departmentId}/tag/${tagId}`);
}

export async function removeDepartmentTag(departmentId: number, tagId: number): Promise<void> {
  await api.delete(`/DepartmentTags/department/${departmentId}/tag/${tagId}`);
}

export async function getDepartmentTimeline(departmentId: number): Promise<DepartmentActivity[]> {
  const response = await api.get<DepartmentActivity[]>(`/Activities/entity/Department/${departmentId}`);
  return response.data;
}
