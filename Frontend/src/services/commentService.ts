import api from "../api/axios";
import type {
  Comment,
  CreateCommentRequest,
} from "../types/comment";

export async function getCommentsByTask(
  taskId: number
): Promise<Comment[]> {
  const response = await api.get<Comment[]>(
    `/Comments/task/${taskId}`
  );

  return response.data;
}

export async function createComment(
  data: CreateCommentRequest
): Promise<Comment> {
  const response = await api.post<Comment>(
    "/Comments",
    data
  );

  return response.data;
}