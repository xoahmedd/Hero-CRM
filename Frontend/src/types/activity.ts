export interface ActivityItem {
  id: number;
  userId: number;
  userName?: string | null;
  entityType: string;
  entityId: number;
  action: string;
  description?: string | null;
  createdAt: string;
}
