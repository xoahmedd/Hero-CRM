import api from "../api/axios";
import type {
  AuthResponse,
  ChangePasswordRequest,
  CurrentUser,
  UpdateProfileRequest,
} from "../types/auth";

export interface LoginRequest {
  email: string;
  password: string;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/Auth/login", data);
  return response.data;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await api.get<CurrentUser>("/Auth/me");
  return response.data;
}

export async function updateProfile(
  data: UpdateProfileRequest
): Promise<AuthResponse> {
  const response = await api.put<AuthResponse>("/Auth/me", data);
  return response.data;
}

export async function changePassword(
  data: ChangePasswordRequest
): Promise<{ message: string }> {
  const response = await api.post<{ message: string }>(
    "/Auth/change-password",
    data
  );
  return response.data;
}
