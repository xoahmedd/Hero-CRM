export interface AuthResponse {
  userId: number; fullName: string; email: string; profileImage?: string | null;
  departmentId?: number | null; departmentName?: string | null;
  roles: string[]; token: string; expiresAt: string;
}
export interface CurrentUser {
  userId: number; fullName: string; email: string; profileImage?: string | null;
  departmentId?: number | null; departmentName?: string | null; roles: string[];
}
export interface AppUser { userId: number; fullName: string; email: string; profileImage?: string | null; departmentId?: number | null; departmentName?: string | null; }
export interface UpdateProfileRequest { fullName: string; email: string; profileImage?: string | null; }
export interface ChangePasswordRequest { currentPassword: string; newPassword: string; }
