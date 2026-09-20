export interface Team {
  id: number;
  name: string;
  description: string | null;
  createdById: number;
  createdByName: string | null;
  createdAt: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string | null;
  createdById: number;
}

export interface TeamMember {
  teamId: number;
  userId: number;
  userName: string | null;
  email: string | null;
  joinedAt: string;
}

export interface TeamMemberWorkload {
  userId: number;
  userName: string;
  email: string;
  assignedTasks: number;
  openTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  finishedTasks: number;
  overdueTasks: number;
  dueSoonTasks: number;
  highPriorityOpenTasks: number;
  utilizationLevel: "Available" | "Balanced" | "Busy" | "Overloaded" | string;
}

export interface TeamWorkload {
  teamId: number;
  teamName: string;
  generatedAt: string;
  totalMembers: number;
  totalOpenTasks: number;
  totalOverdueTasks: number;
  members: TeamMemberWorkload[];
}
