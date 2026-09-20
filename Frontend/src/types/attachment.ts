export interface Attachment {
  id: number;
  taskItemId: number;
  fileName: string;
  fileUrl: string;
  contentType: string;
  fileSize: number;
  createdAt?: string;
}

export interface CreateAttachmentRequest {
  taskItemId: number;
  fileName: string;
  fileUrl: string;
  contentType: string;
  fileSize: number;
}