import api from "../api/axios";
import type {
  Person,
  PersonActivity,
  PersonDetails,
  PersonNote,
  PersonProject,
  PersonRequest,
  PersonTag,
} from "../types/people";

export async function getPeople(params?: { departmentId?: number; search?: string }): Promise<Person[]> {
  const response = await api.get<Person[]>("/people", { params });
  return response.data;
}

export async function getPerson(id: number): Promise<PersonDetails> {
  const response = await api.get<PersonDetails>(`/people/${id}`);
  return response.data;
}

export async function createPerson(data: PersonRequest): Promise<Person> {
  const response = await api.post<Person>("/people", data);
  return response.data;
}

export async function updatePerson(id: number, data: PersonRequest): Promise<Person> {
  const response = await api.put<Person>(`/people/${id}`, data);
  return response.data;
}

export async function deletePerson(id: number): Promise<void> {
  await api.delete(`/people/${id}`);
}

export async function getPersonNotes(id: number): Promise<PersonNote[]> {
  const response = await api.get<PersonNote[]>(`/people/${id}/notes`);
  return response.data;
}

export async function createPersonNote(id: number, content: string): Promise<PersonNote> {
  const response = await api.post<PersonNote>(`/people/${id}/notes`, { content });
  return response.data;
}

export async function updatePersonNote(id: number, noteId: number, content: string): Promise<void> {
  await api.put(`/people/${id}/notes/${noteId}`, { content });
}

export async function deletePersonNote(id: number, noteId: number): Promise<void> {
  await api.delete(`/people/${id}/notes/${noteId}`);
}

export async function getPersonTagCatalog(): Promise<PersonTag[]> {
  const response = await api.get<PersonTag[]>("/people/tags");
  return response.data;
}

export async function createPersonTag(data: { name: string; color?: string | null }): Promise<PersonTag> {
  const response = await api.post<PersonTag>("/people/tags", data);
  return response.data;
}

export async function getPersonTags(id: number): Promise<PersonTag[]> {
  const response = await api.get<PersonTag[]>(`/people/${id}/tags`);
  return response.data;
}

export async function assignPersonTag(id: number, tagId: number): Promise<void> {
  await api.post(`/people/${id}/tags/${tagId}`);
}

export async function removePersonTag(id: number, tagId: number): Promise<void> {
  await api.delete(`/people/${id}/tags/${tagId}`);
}

export async function getPersonProjects(id: number): Promise<PersonProject[]> {
  const response = await api.get<PersonProject[]>(`/people/${id}/projects`);
  return response.data;
}

export async function getPersonTimeline(id: number): Promise<PersonActivity[]> {
  const response = await api.get<PersonActivity[]>(`/people/${id}/timeline`);
  return response.data;
}
