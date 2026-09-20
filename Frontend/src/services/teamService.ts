import api from "../api/axios";

import type {
  CreateTeamRequest,
  Team,
  TeamMember,
} from "../types/team";

export async function getTeams(): Promise<Team[]> {
  const response = await api.get<Team[]>("/Teams");
  return response.data;
}

export async function createTeam(
  data: CreateTeamRequest
): Promise<Team> {
  const response = await api.post<Team>("/Teams", data);
  return response.data;
}

export async function getTeamMembers(
  teamId: number
): Promise<TeamMember[]> {
  const response = await api.get<TeamMember[]>(
    `/Teams/${teamId}/members`
  );

  return response.data;
}

export async function addTeamMember(
  teamId: number,
  userId: number
): Promise<void> {
  await api.post(`/Teams/${teamId}/members/${userId}`);
}

export async function removeTeamMember(
  teamId: number,
  userId: number
): Promise<void> {
  await api.delete(`/Teams/${teamId}/members/${userId}`);
}

export async function getTeamWorkload(teamId: number): Promise<import("../types/team").TeamWorkload> {
  const response = await api.get<import("../types/team").TeamWorkload>(
    `/Teams/${teamId}/workload`
  );
  return response.data;
}
