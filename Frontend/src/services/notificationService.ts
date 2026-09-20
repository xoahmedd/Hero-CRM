import api from "../api/axios";
import type {
  CreateNotificationRequest,
  CrmNotification,
} from "../types/notification";

export const NOTIFICATIONS_CHANGED_EVENT =
  "crm-notifications-changed";

function announceNotificationChange() {
  window.dispatchEvent(
    new Event(NOTIFICATIONS_CHANGED_EVENT)
  );
}

export async function getUserNotifications(): Promise<CrmNotification[]> {
  const response = await api.get<CrmNotification[]>(
    "/Notifications/me"
  );

  return response.data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await api.get<{ count: number }>(
    "/Notifications/me/unread-count"
  );

  return response.data.count;
}

export async function createNotification(
  data: CreateNotificationRequest
): Promise<CrmNotification> {
  const response = await api.post<CrmNotification>(
    "/Notifications",
    data
  );

  announceNotificationChange();
  return response.data;
}

export async function markNotificationAsRead(
  notificationId: number
): Promise<void> {
  await api.patch(
    `/Notifications/${notificationId}/read`
  );

  announceNotificationChange();
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await api.patch(
    "/Notifications/me/read-all"
  );

  announceNotificationChange();
}
