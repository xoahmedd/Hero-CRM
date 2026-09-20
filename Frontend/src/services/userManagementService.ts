import api from "../api/axios";
import type {
  CreateManagedUserRequest,
  ManagedUser,
  UpdateManagedUserRequest,
} from "../types/userManagement";

export async function getManagedUsers(): Promise<ManagedUser[]> {
  const response = await api.get<ManagedUser[]>("/Users/manage");
  return response.data;
}

export async function createManagedUser(
  request: CreateManagedUserRequest
): Promise<ManagedUser> {
  const response = await api.post<ManagedUser>("/Users", request);
  return response.data;
}

export async function updateManagedUser(
  userId: number,
  request: UpdateManagedUserRequest
): Promise<ManagedUser> {
  const response = await api.put<ManagedUser>(`/Users/${userId}`, request);
  return response.data;
}

export async function resetManagedUserPassword(
  userId: number,
  newPassword: string
): Promise<void> {
  await api.post(`/Users/${userId}/reset-password`, { newPassword });
}
