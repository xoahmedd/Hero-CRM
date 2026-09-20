import api from "../api/axios";

import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
} from "../types/project";

export async function getProjects(): Promise<Project[]> {
  const response = await api.get<Project[]>("/Projects");

  return response.data;
}

export async function getProject(
  id: number
): Promise<Project> {
  const response = await api.get<Project>(
    `/Projects/${id}`
  );

  return response.data;
}

export async function createProject(
  data: CreateProjectRequest
): Promise<Project> {
  const response = await api.post<Project>(
    "/Projects",
    data
  );

  return response.data;
}

export async function updateProject(
  id: number,
  data: UpdateProjectRequest
) {
  const response = await api.put(
    `/Projects/${id}`,
    data
  );

  return response.data;
}

export async function deleteProject(id: number) {
  const response = await api.delete(
    `/Projects/${id}`
  );

  return response.data;
}

export async function searchProjects(
  search: string
): Promise<Project[]> {
  const response = await api.get<Project[]>(
    "/Projects/search",
    {
      params: {
        search,
      },
    }
  );

  return response.data;
}
export async function getProjectsByCustomer(
  customerId: number
): Promise<Project[]> {
  const response = await api.get<Project[]>(
    `/Projects/customer/${customerId}`
  );

  return response.data;
}

export async function getProjectsByOrganization(
  organizationId: number
): Promise<Project[]> {
  const response = await api.get<Project[]>(
    `/Projects/organization/${organizationId}`
  );

  return response.data;
}

export async function getProjectsByDepartment(
  departmentId: number
): Promise<Project[]> {
  const response = await api.get<Project[]>(
    `/Projects/department/${departmentId}`
  );

  return response.data;
}
