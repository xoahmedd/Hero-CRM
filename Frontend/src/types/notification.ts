export interface CrmNotification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface CreateNotificationRequest {
  userId: number;
  title: string;
  message: string;
  type: string;
}
