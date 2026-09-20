export interface ProjectMember {
  projectId: number;
  userId: number;
  fullName: string;
  email: string;
  profileImage?: string | null;
  joinedAt: string;
}
