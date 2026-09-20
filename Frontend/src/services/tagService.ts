import api from "../api/axios";
import type {
  AssignTagRequest,
  CreateTagRequest,
  Tag,
} from "../types/tag";

export async function getTags(): Promise<Tag[]> {
  const response = await api.get<Tag[]>("/Tags");

  return response.data;
}

export async function getTaskTags(
  taskId: number
): Promise<Tag[]> {
  const response = await api.get<Tag[]>(
    `/Tags/task/${taskId}`
  );

  return response.data;
}

export async function createTag(
  data: CreateTagRequest
): Promise<Tag> {
  const response = await api.post<Tag>("/Tags", data);

  return response.data;
}

export async function assignTagToTask(
  data: AssignTagRequest
): Promise<void> {
  await api.post("/Tags/assign", data);
}

export async function removeTagFromTask(
  taskId: number,
  tagId: number
): Promise<void> {
  await api.delete(
    `/Tags/task/${taskId}/tag/${tagId}`
  );
}

export async function deleteTag(
  tagId: number
): Promise<void> {
  await api.delete(`/Tags/${tagId}`);
}
