export interface Comment {
  id: number;
  taskItemId: number;
  taskTitle: string;
  userId: number;
  userName: string;
  content: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateCommentRequest {
  taskItemId: number;
  content: string;
}