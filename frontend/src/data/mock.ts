export type Role = "Admin" | "Developer";
export type ProjectStatus = "Planning" | "Working" | "Overdue" | "Finished";
export type Priority = "Low" | "Medium" | "High" | "Urgent";
export type TaskStatus = "Assigned" | "Review" | "Completed" | "Cancelled";
export type CustomerStatus = "Lead" | "Active" | "Inactive" | "Archived";
export type NotificationType = "ProjectAssigned" | "TaskAssigned" | "DeadlineApproaching" | "DeadlineMissed";

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  avatar: string;
  isActive: boolean;
  createdAt: string;
}

export interface Customer {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  status: CustomerStatus;
  notes: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  startDate: string;
  dueDate: string;
  ownerId: number;
  ownerName: string;
  customerId: number;
  customerName: string;
  requestingDepartment: string;
  missedDeadlineReason: string | null;
  reasonCategory: string | null;
  progress: number;
  requestedBy?: string;
  businessJustification?: string;
  rejectionReason?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  projectId: number;
  projectName: string;
  assignees: { id: number; name: string; avatar: string }[];
  createdById: number;
  dueDate: string;
  createdAt: string;
}

export interface SubTask {
  id: number;
  taskId: number;
  title: string;
  isCompleted: boolean;
}

export interface Comment {
  id: number;
  taskId: number;
  authorId: number;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  targetId: number;
  targetType: "Project" | "Task";
  createdAt: string;
}

export interface Team {
  id: number;
  name: string;
  description: string;
  memberIds: number[];
}

export const MOCK_USERS: User[] = [
  { id: 1, fullName: "Sarah Chen", email: "sarah.chen@herocrm.com", role: "Admin", avatar: "SC", isActive: true, createdAt: "2025-01-15" },
  { id: 2, fullName: "James Okafor", email: "james.okafor@herocrm.com", role: "Developer", avatar: "JO", isActive: true, createdAt: "2025-02-20" },
  { id: 3, fullName: "Priya Mehta", email: "priya.mehta@herocrm.com", role: "Developer", avatar: "PM", isActive: true, createdAt: "2025-03-10" },
  { id: 4, fullName: "Lucas Rivera", email: "lucas.rivera@herocrm.com", role: "Developer", avatar: "LR", isActive: true, createdAt: "2025-04-05" },
  { id: 5, fullName: "Elena Volkov", email: "elena.volkov@herocrm.com", role: "Developer", avatar: "EV", isActive: false, createdAt: "2025-05-18" },
  { id: 6, fullName: "David Park", email: "david.park@herocrm.com", role: "Developer", avatar: "DP", isActive: true, createdAt: "2025-06-22" },
  { id: 7, fullName: "Aisha Nwosu", email: "aisha.nwosu@herocrm.com", role: "Developer", avatar: "AN", isActive: true, createdAt: "2025-07-01" },
  { id: 8, fullName: "Marco Ferretti", email: "marco.ferretti@herocrm.com", role: "Developer", avatar: "MF", isActive: true, createdAt: "2025-08-14" },
];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 1, name: "Thomas Blackwell", company: "Apex Dynamics", email: "t.blackwell@apexdyn.com", phone: "+1 555-0192", address: "42 Innovation Blvd, Austin TX", status: "Active", notes: "Key enterprise account, quarterly review Q4." },
  { id: 2, name: "Maria Santos", company: "NovaTech Solutions", email: "m.santos@novatech.io", phone: "+1 555-0284", address: "88 Harbor Dr, San Francisco CA", status: "Active", notes: "Interested in expanded API licensing." },
  { id: 3, name: "Yuki Tanaka", company: "SkyBridge Logistics", email: "y.tanaka@skybridge.jp", phone: "+81 3-5555-0142", address: "12-5 Shibuya, Tokyo", status: "Lead", notes: "Warm lead from TechSummit 2026." },
  { id: 4, name: "Omar Hassan", company: "Meridian Financial", email: "o.hassan@meridianfin.com", phone: "+1 555-0376", address: "200 Wall St, New York NY", status: "Inactive", notes: "Contract renewal pending compliance review." },
  { id: 5, name: "Claire Dupont", company: "EuroRetail Group", email: "c.dupont@euroretail.fr", phone: "+33 1 5555 0421", address: "15 Rue du Commerce, Paris", status: "Active", notes: "Expanding to 3 new EU markets." },
  { id: 6, name: "Raj Patel", company: "Quantum Analytics", email: "r.patel@quantumanaly.com", phone: "+1 555-0558", address: "301 Data Center Way, Seattle WA", status: "Lead", notes: "Evaluation period starts October." },
  { id: 7, name: "Sophie Williams", company: "GreenPath Energy", email: "s.williams@greenpath.co", phone: "+44 20 5555 0619", address: "7 Canary Wharf, London", status: "Archived", notes: "Project cancelled; contact retained." },
];

export const MOCK_PROJECTS: Project[] = [
  { id: 1, name: "Apex CRM Portal Redesign", description: "Full redesign of the customer portal with new UX patterns and mobile responsiveness.", status: "Working", priority: "High", startDate: "2026-07-01", dueDate: "2026-10-15", ownerId: 2, ownerName: "James Okafor", customerId: 1, customerName: "Apex Dynamics", requestingDepartment: "IT", missedDeadlineReason: null, reasonCategory: null, progress: 62 },
  { id: 2, name: "NovaTech API Gateway", description: "Build and deploy a unified API gateway for NovaTech microservices architecture.", status: "Working", priority: "Urgent", startDate: "2026-06-15", dueDate: "2026-09-30", ownerId: 3, ownerName: "Priya Mehta", customerId: 2, customerName: "NovaTech Solutions", requestingDepartment: "Engineering", missedDeadlineReason: null, reasonCategory: null, progress: 78 },
  { id: 3, name: "HR Onboarding Automation", description: "Automated onboarding workflow platform for new hire documentation and approvals.", status: "Overdue", priority: "Medium", startDate: "2026-05-01", dueDate: "2026-08-31", ownerId: 4, ownerName: "Lucas Rivera", customerId: 1, customerName: "Apex Dynamics", requestingDepartment: "Human Resources", missedDeadlineReason: null, reasonCategory: null, progress: 45 },
  { id: 4, name: "Meridian Compliance Dashboard", description: "Real-time compliance monitoring and reporting dashboard for financial regulations.", status: "Finished", priority: "High", startDate: "2026-03-01", dueDate: "2026-07-15", ownerId: 2, ownerName: "James Okafor", customerId: 4, customerName: "Meridian Financial", requestingDepartment: "Legal", missedDeadlineReason: null, reasonCategory: null, progress: 100 },
  { id: 5, name: "EuroRetail Market Expansion", description: "Platform localization and EU compliance for 3 new regional market launches.", status: "Planning", priority: "High", startDate: "2026-09-20", dueDate: "2026-12-31", ownerId: 6, ownerName: "David Park", customerId: 5, customerName: "EuroRetail Group", requestingDepartment: "Sales", missedDeadlineReason: null, reasonCategory: null, progress: 8 },
  { id: 6, name: "Quantum Analytics Data Pipeline", description: "ETL pipeline and warehousing solution for large-scale analytics ingestion.", status: "Planning", priority: "Medium", startDate: "2026-10-01", dueDate: "2026-11-30", ownerId: 6, ownerName: "David Park", customerId: 6, customerName: "Quantum Analytics", requestingDepartment: "Data Science", missedDeadlineReason: null, reasonCategory: null, progress: 15 },
  { id: 7, name: "SkyBridge Fleet Tracker", description: "GPS-integrated fleet management and route optimization system.", status: "Planning", priority: "High", startDate: "2026-09-01", dueDate: "2026-10-01", ownerId: 4, ownerName: "Lucas Rivera", customerId: 3, customerName: "SkyBridge Logistics", requestingDepartment: "Operations", missedDeadlineReason: null, reasonCategory: null, progress: 20 },
  { id: 8, name: "Internal Knowledge Base", description: "Wiki-style internal knowledge base with search, versioning, and access control.", status: "Finished", priority: "Low", startDate: "2026-02-01", dueDate: "2026-06-30", ownerId: 8, ownerName: "Marco Ferretti", customerId: 1, customerName: "Apex Dynamics", requestingDepartment: "IT", missedDeadlineReason: null, reasonCategory: null, progress: 100 },
];

export const MOCK_TASKS: Task[] = [
  { id: 1, title: "Design new dashboard wireframes", description: "Create high-fidelity wireframes for the updated admin dashboard layout.", status: "Completed", priority: "High", projectId: 1, projectName: "Apex CRM Portal Redesign", assignees: [{ id: 2, name: "James Okafor", avatar: "JO" }], createdById: 1, dueDate: "2026-07-20", createdAt: "2026-07-05" },
  { id: 2, title: "Implement authentication middleware", description: "JWT validation and refresh token logic for all API routes.", status: "Completed", priority: "Urgent", projectId: 2, projectName: "NovaTech API Gateway", assignees: [{ id: 3, name: "Priya Mehta", avatar: "PM" }], createdById: 1, dueDate: "2026-07-10", createdAt: "2026-06-20" },
  { id: 3, title: "Build rate limiting service", description: "Per-client API rate limiting with configurable thresholds and Redis backing.", status: "Assigned", priority: "High", projectId: 2, projectName: "NovaTech API Gateway", assignees: [{ id: 3, name: "Priya Mehta", avatar: "PM" }, { id: 6, name: "David Park", avatar: "DP" }], createdById: 1, dueDate: "2026-09-20", createdAt: "2026-08-01" },
  { id: 4, title: "Responsive mobile layout", description: "Ensure all portal views are fully responsive down to 375px viewport.", status: "Assigned", priority: "Medium", projectId: 1, projectName: "Apex CRM Portal Redesign", assignees: [{ id: 2, name: "James Okafor", avatar: "JO" }], createdById: 1, dueDate: "2026-09-25", createdAt: "2026-08-15" },
  { id: 5, title: "Document upload workflow", description: "Secure drag-and-drop document upload with virus scan and S3 storage.", status: "Review", priority: "High", projectId: 3, projectName: "HR Onboarding Automation", assignees: [{ id: 4, name: "Lucas Rivera", avatar: "LR" }], createdById: 1, dueDate: "2026-08-28", createdAt: "2026-07-01" },
  { id: 6, title: "Onboarding email triggers", description: "Automated email sequence for new hire steps with configurable delays.", status: "Assigned", priority: "Medium", projectId: 3, projectName: "HR Onboarding Automation", assignees: [{ id: 4, name: "Lucas Rivera", avatar: "LR" }], createdById: 1, dueDate: "2026-09-15", createdAt: "2026-08-05" },
  { id: 7, title: "API gateway load testing", description: "Run k6 load tests up to 10k concurrent requests and document results.", status: "Assigned", priority: "Urgent", projectId: 2, projectName: "NovaTech API Gateway", assignees: [{ id: 8, name: "Marco Ferretti", avatar: "MF" }], createdById: 1, dueDate: "2026-09-28", createdAt: "2026-09-01" },
  { id: 8, title: "EU GDPR compliance audit", description: "Full review of data processing flows against GDPR Article 30 requirements.", status: "Assigned", priority: "High", projectId: 5, projectName: "EuroRetail Market Expansion", assignees: [{ id: 6, name: "David Park", avatar: "DP" }], createdById: 1, dueDate: "2026-10-10", createdAt: "2026-09-10" },
  { id: 9, title: "Customer portal SSO integration", description: "SAML 2.0 SSO with Apex's existing identity provider.", status: "Assigned", priority: "Urgent", projectId: 1, projectName: "Apex CRM Portal Redesign", assignees: [{ id: 2, name: "James Okafor", avatar: "JO" }, { id: 3, name: "Priya Mehta", avatar: "PM" }], createdById: 1, dueDate: "2026-10-01", createdAt: "2026-08-20" },
  { id: 10, title: "Set up CI/CD pipeline", description: "GitHub Actions pipeline with staging and production deployment gates.", status: "Completed", priority: "High", projectId: 2, projectName: "NovaTech API Gateway", assignees: [{ id: 8, name: "Marco Ferretti", avatar: "MF" }], createdById: 1, dueDate: "2026-07-30", createdAt: "2026-06-25" },
];

export const MOCK_SUBTASKS: SubTask[] = [
  { id: 1, taskId: 4, title: "Audit current breakpoint behavior", isCompleted: true },
  { id: 2, taskId: 4, title: "Implement responsive nav drawer", isCompleted: true },
  { id: 3, taskId: 4, title: "Fix table overflow on mobile", isCompleted: false },
  { id: 4, taskId: 4, title: "Test on iOS Safari and Chrome Android", isCompleted: false },
  { id: 5, taskId: 3, title: "Design Redis schema", isCompleted: true },
  { id: 6, taskId: 3, title: "Implement token bucket algorithm", isCompleted: false },
  { id: 7, taskId: 3, title: "Write unit tests for sliding window", isCompleted: false },
  { id: 8, taskId: 9, title: "Configure SAML metadata endpoints", isCompleted: true },
  { id: 9, taskId: 9, title: "Handle assertion consumer service", isCompleted: false },
  { id: 10, taskId: 9, title: "Test attribute mapping with IdP", isCompleted: false },
];

export const MOCK_COMMENTS: Comment[] = [
  { id: 1, taskId: 4, authorId: 2, authorName: "James Okafor", authorAvatar: "JO", content: "Mobile nav drawer complete, now focusing on table overflow on mobile viewports.", createdAt: "2026-09-10T14:30:00Z" },
  { id: 2, taskId: 4, authorId: 1, authorName: "Sarah Chen", authorAvatar: "SC", content: "Great progress! Make sure to test on smaller iPhone SE screens as well.", createdAt: "2026-09-10T15:15:00Z" },
  { id: 3, taskId: 3, authorId: 3, authorName: "Priya Mehta", authorAvatar: "PM", content: "Redis cluster configuration is verified in staging.", createdAt: "2026-09-08T11:00:00Z" },
  { id: 4, taskId: 9, authorId: 2, authorName: "James Okafor", authorAvatar: "JO", content: "Waiting on Apex IT team to provide the SAML metadata XML.", createdAt: "2026-09-09T09:45:00Z" },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 1, title: "Task Assigned", message: "You've been assigned to 'Build rate limiting service'", type: "TaskAssigned", isRead: false, targetId: 3, targetType: "Task", createdAt: "2026-09-10T08:30:00Z" },
  { id: 2, title: "Deadline Approaching", message: "Project 'NovaTech API Gateway' is due in 18 days", type: "DeadlineApproaching", isRead: false, targetId: 2, targetType: "Project", createdAt: "2026-09-11T09:00:00Z" },
  { id: 3, title: "Project Assigned", message: "You've been added to 'EuroRetail Market Expansion'", type: "ProjectAssigned", isRead: true, targetId: 5, targetType: "Project", createdAt: "2026-09-08T14:20:00Z" },
  { id: 4, title: "Deadline Missed", message: "'HR Onboarding Automation' is overdue — please submit a reason", type: "DeadlineMissed", isRead: false, targetId: 3, targetType: "Project", createdAt: "2026-09-01T00:00:00Z" },
  { id: 5, title: "Task Assigned", message: "You've been assigned to 'API gateway load testing'", type: "TaskAssigned", isRead: true, targetId: 7, targetType: "Task", createdAt: "2026-09-01T11:15:00Z" },
];

export const MOCK_TEAMS: Team[] = [
  { id: 1, name: "Core Platform Team", description: "Responsible for backend infrastructure, API design, and core services.", memberIds: [2, 3, 8] },
  { id: 2, name: "Frontend Guild", description: "Owns all user-facing interfaces and design system components.", memberIds: [2, 4, 6] },
  { id: 3, name: "Data & Analytics", description: "Data pipelines, warehousing, reporting, and business intelligence.", memberIds: [3, 6, 8] },
];

export const ADMIN_DASHBOARD_DATA = {
  totalProjects: 8,
  pendingProjects: 2,
  workingProjects: 2,
  finishedProjects: 2,
  overdueProjects: 1,
  totalTasks: 10,
  completedTasks: 3,
  pendingTasks: 3,
  overdueTasks: 1,
  totalActiveDevelopers: 6,
  departmentRequests: [
    { departmentName: "IT", projectCount: 2 },
    { departmentName: "Engineering", projectCount: 1 },
    { departmentName: "Human Resources", projectCount: 1 },
    { departmentName: "Legal", projectCount: 1 },
    { departmentName: "Sales", projectCount: 1 },
    { departmentName: "Data Science", projectCount: 1 },
    { departmentName: "Operations", projectCount: 1 },
  ],
  developerWorkloads: [
    { developerId: 2, developerName: "James Okafor", activeProjectsCount: 2, activeTasksCount: 3 },
    { developerId: 3, developerName: "Priya Mehta", activeProjectsCount: 2, activeTasksCount: 2 },
    { developerId: 4, developerName: "Lucas Rivera", activeProjectsCount: 1, activeTasksCount: 2 },
    { developerId: 6, developerName: "David Park", activeProjectsCount: 1, activeTasksCount: 1 },
    { developerId: 8, developerName: "Marco Ferretti", activeProjectsCount: 0, activeTasksCount: 2 },
  ],
  overdueItemsNeedingReason: [
    { itemType: "Project", id: 3, title: "HR Onboarding Automation", dueDate: "2026-08-31T00:00:00Z", assignedUserId: 4, assignedUserName: "Lucas Rivera", requestingDepartment: "Human Resources", missedDeadlineReason: null, reasonCategory: null },
  ],
};

export const REPORTS_DATA = {
  generatedAt: "2026-09-12T19:00:00Z",
  months: 6,
  summary: { totalCustomers: 7, totalProjects: 8, activeProjects: 2, totalTasks: 10, completedTasks: 3, pendingTasks: 3, overdueTasks: 1, totalUsers: 8, taskCompletionRate: 30 },
  taskStatus: [{ name: "Completed", count: 3 }, { name: "Assigned", count: 6 }, { name: "Review", count: 1 }],
  taskPriority: [{ name: "Urgent", count: 3 }, { name: "High", count: 4 }, { name: "Medium", count: 2 }, { name: "Low", count: 1 }],
  projectStatus: [{ name: "Working", count: 2 }, { name: "Finished", count: 2 }, { name: "Overdue", count: 1 }, { name: "Planning", count: 1 }, { name: "Submitted", count: 2 }],
  customerStatus: [{ name: "Active", count: 3 }, { name: "Lead", count: 2 }, { name: "Inactive", count: 1 }, { name: "Archived", count: 1 }],
  activityTrend: [
    { period: "2026-04", label: "Apr", tasksCreated: 2, projectsCreated: 1, customersCreated: 1 },
    { period: "2026-05", label: "May", tasksCreated: 3, projectsCreated: 2, customersCreated: 2 },
    { period: "2026-06", label: "Jun", tasksCreated: 4, projectsCreated: 1, customersCreated: 0 },
    { period: "2026-07", label: "Jul", tasksCreated: 5, projectsCreated: 1, customersCreated: 2 },
    { period: "2026-08", label: "Aug", tasksCreated: 6, projectsCreated: 2, customersCreated: 1 },
    { period: "2026-09", label: "Sep", tasksCreated: 2, projectsCreated: 1, customersCreated: 1 },
  ],
  projectPerformance: [
    { projectId: 1, projectName: "Apex CRM Portal Redesign", status: "Working", totalTasks: 3, completedTasks: 1, overdueTasks: 0, completionRate: 33 },
    { projectId: 2, projectName: "NovaTech API Gateway", status: "Working", totalTasks: 4, completedTasks: 2, overdueTasks: 0, completionRate: 50 },
    { projectId: 3, projectName: "HR Onboarding Automation", status: "Overdue", totalTasks: 2, completedTasks: 0, overdueTasks: 1, completionRate: 0 },
    { projectId: 4, projectName: "Meridian Compliance Dashboard", status: "Finished", totalTasks: 5, completedTasks: 5, overdueTasks: 0, completionRate: 100 },
    { projectId: 5, projectName: "EuroRetail Market Expansion", status: "Planning", totalTasks: 1, completedTasks: 0, overdueTasks: 0, completionRate: 0 },
    { projectId: 8, projectName: "Internal Knowledge Base", status: "Finished", totalTasks: 3, completedTasks: 3, overdueTasks: 0, completionRate: 100 },
  ],
};
