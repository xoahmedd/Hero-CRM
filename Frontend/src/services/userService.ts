import api from "../api/axios";

import type {
  AppUser,
} from "../types/auth";

export async function getUsers(): Promise<AppUser[]> {
  const response = await api.get<AppUser[]>(
    "/Users"
  );

  return response.data;
}
