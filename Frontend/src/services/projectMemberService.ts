import api from "../api/axios";

import type {
  ProjectMember,
} from "../types/projectMember";

export async function getProjectMembers(
  projectId: number
): Promise<ProjectMember[]> {
  const response = await api.get<ProjectMember[]>(
    `/Projects/${projectId}/members`
  );

  return response.data;
}

export async function addProjectMember(
  projectId: number,
  userId: number
) {
  const response = await api.post(
    `/Projects/${projectId}/members/${userId}`
  );

  return response.data;
}

export async function removeProjectMember(
  projectId: number,
  userId: number
) {
  const response = await api.delete(
    `/Projects/${projectId}/members/${userId}`
  );

  return response.data;
}
