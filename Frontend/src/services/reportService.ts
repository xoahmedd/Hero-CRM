import api from "../api/axios";
import type { WorkspaceReport } from "../types/report";

export async function getWorkspaceReport(
  months = 6
): Promise<WorkspaceReport> {
  const response = await api.get<WorkspaceReport>(
    "/Reports/workspace",
    {
      params: {
        months,
      },
    }
  );

  return response.data;
}
