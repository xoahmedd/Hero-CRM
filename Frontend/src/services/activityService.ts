import api from "../api/axios";
import type { ActivityItem } from "../types/activity";

export async function getEntityActivities(
  entityType: string,
  entityId: number
): Promise<ActivityItem[]> {
  const response = await api.get<ActivityItem[]>(
    `/Activities/entity/${encodeURIComponent(entityType)}/${entityId}`
  );

  return response.data;
}
