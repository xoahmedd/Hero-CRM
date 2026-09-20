export type FollowUpStatus = "Open" | "Completed" | "Cancelled";
export type FollowUpType = "FollowUp" | "Call" | "Email" | "Meeting" | "CheckIn";

export interface FollowUp {
  id: number;
  title: string;
  type: FollowUpType;
  status: FollowUpStatus;
  description?: string | null;
  ownerId: number;
  ownerName: string;
  dueAt: string;
  outcome?: string | null;
  completedAt?: string | null;
  contactId?: number | null;
  contactName?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  projectId?: number | null;
  projectName?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface FollowUpRequest {
  title: string;
  type: FollowUpType;
  description?: string | null;
  ownerId: number;
  dueAt: string;
  contactId?: number | null;
  departmentId?: number | null;
  projectId?: number | null;
}
