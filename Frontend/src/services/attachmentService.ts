import api from "../api/axios";
import type {
  Attachment,
  CreateAttachmentRequest,
} from "../types/attachment";

export async function getAttachmentsByTask(
  taskId: number
): Promise<Attachment[]> {
  const response = await api.get<Attachment[]>(
    `/Attachments/task/${taskId}`
  );

  return response.data;
}

export async function createAttachment(
  data: CreateAttachmentRequest
): Promise<Attachment> {
  const response = await api.post<Attachment>(
    "/Attachments",
    data
  );

  return response.data;
}

export async function deleteAttachment(
  attachmentId: number
): Promise<void> {
  await api.delete(`/Attachments/${attachmentId}`);
}