import api from "../api/axios";
import type { FollowUp, FollowUpRequest, FollowUpStatus } from "../types/followUp";

export interface FollowUpFilters {
  status?: FollowUpStatus | "All";
  scope?: "overdue" | "today" | "upcoming" | "";
  ownerId?: number;
  contactId?: number;
  departmentId?: number;
  projectId?: number;
  search?: string;
}

export async function getFollowUps(filters?: FollowUpFilters): Promise<FollowUp[]> {
  const response = await api.get<FollowUp[]>("/followups", { params: filters });
  return response.data;
}

export async function createFollowUp(data: FollowUpRequest): Promise<FollowUp> {
  const response = await api.post<FollowUp>("/followups", data);
  return response.data;
}

export async function updateFollowUp(
  id: number,
  data: FollowUpRequest & { status: FollowUpStatus; outcome?: string | null }
): Promise<FollowUp> {
  const response = await api.put<FollowUp>(`/followups/${id}`, data);
  return response.data;
}

export async function completeFollowUp(id: number, outcome?: string | null): Promise<FollowUp> {
  const response = await api.post<FollowUp>(`/followups/${id}/complete`, { outcome });
  return response.data;
}

export async function reopenFollowUp(id: number): Promise<FollowUp> {
  const response = await api.post<FollowUp>(`/followups/${id}/reopen`);
  return response.data;
}

export async function deleteFollowUp(id: number): Promise<void> {
  await api.delete(`/followups/${id}`);
}
