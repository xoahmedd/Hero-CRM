export interface ReportSummary {
  totalDepartments: number;
  totalPeople: number;
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  totalUsers: number;
  openFollowUps: number;
  overdueFollowUps: number;
  taskCompletionRate: number;
}

export interface ReportBreakdownItem {
  name: string;
  count: number;
}

export interface ReportTrendPoint {
  period: string;
  label: string;
  tasksCreated: number;
  projectsCreated: number;
  departmentsCreated: number;
  peopleCreated: number;
  followUpsCreated: number;
}

export interface ProjectPerformanceItem {
  projectId: number;
  projectName: string;
  status: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface UserWorkloadReportItem {
  userId: number;
  userName: string;
  openTasks: number;
  overdueTasks: number;
  dueSoonTasks: number;
}

export interface WorkspaceReport {
  generatedAt: string;
  months: number;
  summary: ReportSummary;
  taskStatus: ReportBreakdownItem[];
  taskPriority: ReportBreakdownItem[];
  projectStatus: ReportBreakdownItem[];
  departmentStatus: ReportBreakdownItem[];
  followUpStatus: ReportBreakdownItem[];
  activityTrend: ReportTrendPoint[];
  projectPerformance: ProjectPerformanceItem[];
  userWorkload: UserWorkloadReportItem[];
}
