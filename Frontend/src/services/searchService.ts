import api from "../api/axios";

import type { GlobalSearchResponse } from "../types/search";

export async function globalSearch(
  query: string
): Promise<GlobalSearchResponse> {
  const response = await api.get<GlobalSearchResponse>(
    "/Search",
    {
      params: {
        q: query,
      },
    }
  );

  return response.data;
}
