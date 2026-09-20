import api from "../api/axios";
import type { AppUser } from "../types/auth";
import type {
  Activity,
  Comment,
  Customer,
  CustomerPayload,
  DashboardSummary,
  Notification,
  PagedResult,
  Project,
  ProjectDashboard,
  ProjectPayload,
  SearchResult,
  SubTask,
  Tag,
  TaskAssignee,
  TaskItem,
  TaskPayload,
  Team,
  TeamMember,
} from "../types/crm";

export async function getDashboard() {
  const response = await api.get<DashboardSummary>("/Dashboard");
  return response.data;
}

export async function getProjectDashboard(projectId: number) {
  const response = await api.get<ProjectDashboard>(`/Dashboard/project/${projectId}`);
  return response.data;
}

export async function getUsers() {
  const response = await api.get<AppUser[]>("/Users");
  return response.data;
}

export async function getCustomersPaged(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}) {
  const response = await api.get<PagedResult<Customer>>("/Customers/paged", { params });
  return response.data;
}

export async function getCustomers() {
  const response = await api.get<Customer[]>("/Customers");
  return response.data;
}

export async function getCustomer(id: number) {
  const response = await api.get<Customer>(`/Customers/${id}`);
  return response.data;
}

export async function createCustomer(data: CustomerPayload) {
  const response = await api.post<Customer>("/Customers", data);
  return response.data;
}

export async function updateCustomer(id: number, data: CustomerPayload) {
  await api.put(`/Customers/${id}`, data);
}

export async function deleteCustomer(id: number) {
  await api.delete(`/Customers/${id}`);
}

export async function getProjects() {
  const response = await api.get<Project[]>("/Projects");
  return response.data;
}

export async function getProject(id: number) {
  const response = await api.get<Project>(`/Projects/${id}`);
  return response.data;
}

export async function getProjectsByCustomer(customerId: number) {
  const response = await api.get<Project[]>(`/Projects/customer/${customerId}`);
  return response.data;
}

export async function createProject(data: ProjectPayload) {
  const response = await api.post<Project>("/Projects", data);
  return response.data;
}

export async function updateProject(id: number, data: ProjectPayload) {
  await api.put(`/Projects/${id}`, data);
}

export async function deleteProject(id: number) {
  await api.delete(`/Projects/${id}`);
}

export async function getTasks() {
  const response = await api.get<TaskItem[]>("/Tasks");
  return response.data;
}

export async function getTask(id: number) {
  const response = await api.get<TaskItem>(`/Tasks/${id}`);
  return response.data;
}

export async function getTasksByProject(projectId: number) {
  const response = await api.get<TaskItem[]>(`/Tasks/project/${projectId}`);
  return response.data;
}

export async function createTask(data: TaskPayload) {
  const response = await api.post<TaskItem>("/Tasks", data);
  return response.data;
}

export async function updateTask(id: number, data: TaskPayload) {
  await api.put(`/Tasks/${id}`, data);
}

export async function deleteTask(id: number) {
  await api.delete(`/Tasks/${id}`);
}

export async function updateTaskStatus(id: number, status: string) {
  await api.patch(`/Tasks/${id}/status`, null, { params: { status } });
}

export async function updateTaskPriority(id: number, priority: string) {
  await api.patch(`/Tasks/${id}/priority`, null, { params: { priority } });
}

export async function getTaskAssignees(taskId: number) {
  const response = await api.get<TaskAssignee[]>(`/Tasks/${taskId}/assignees`);
  return response.data;
}

export async function assignUserToTask(taskId: number, userId: number) {
  await api.post(`/Tasks/${taskId}/assignees/${userId}`);
}

export async function removeUserFromTask(taskId: number, userId: number) {
  await api.delete(`/Tasks/${taskId}/assignees/${userId}`);
}

export async function getTeams() {
  const response = await api.get<Team[]>("/Teams");
  return response.data;
}

export async function createTeam(data: {
  name: string;
  description?: string;
  createdById: number;
}) {
  const response = await api.post<Team>("/Teams", data);
  return response.data;
}

export async function getTeamMembers(teamId: number) {
  const response = await api.get<TeamMember[]>(`/Teams/${teamId}/members`);
  return response.data;
}

export async function addTeamMember(teamId: number, userId: number) {
  await api.post(`/Teams/${teamId}/members/${userId}`);
}

export async function removeTeamMember(teamId: number, userId: number) {
  await api.delete(`/Teams/${teamId}/members/${userId}`);
}

export async function getSubTasks(taskId: number) {
  const response = await api.get<SubTask[]>(`/SubTasks/task/${taskId}`);
  return response.data;
}

export async function createSubTask(data: {
  title: string;
  taskItemId: number;
  dueDate?: string;
}) {
  const response = await api.post<SubTask>("/SubTasks", data);
  return response.data;
}

export async function completeSubTask(id: number) {
  await api.patch(`/SubTasks/${id}/complete`);
}

export async function uncompleteSubTask(id: number) {
  await api.patch(`/SubTasks/${id}/uncomplete`);
}

export async function deleteSubTask(id: number) {
  await api.delete(`/SubTasks/${id}`);
}

export async function getComments(taskId: number) {
  const response = await api.get<Comment[]>(`/Comments/task/${taskId}`);
  return response.data;
}

export async function createComment(data: {
  taskItemId: number;
  userId: number;
  content: string;
}) {
  const response = await api.post<Comment>("/Comments", data);
  return response.data;
}

export async function deleteComment(id: number) {
  await api.delete(`/Comments/${id}`);
}

export async function getTags() {
  const response = await api.get<Tag[]>("/Tags");
  return response.data;
}

export async function createTag(data: { name: string; color?: string }) {
  const response = await api.post<Tag>("/Tags", data);
  return response.data;
}

export async function getTaskTags(taskId: number) {
  const response = await api.get<Tag[]>(`/Tags/task/${taskId}`);
  return response.data;
}

export async function assignTag(taskItemId: number, tagId: number) {
  await api.post("/Tags/assign", { taskItemId, tagId });
}

export async function removeTagFromTask(taskId: number, tagId: number) {
  await api.delete(`/Tags/task/${taskId}/tag/${tagId}`);
}

export async function getNotifications(userId: number) {
  const response = await api.get<Notification[]>(`/Notifications/user/${userId}`);
  return response.data;
}

export async function markNotificationRead(id: number) {
  await api.patch(`/Notifications/${id}/read`);
}

export async function markAllNotificationsRead(userId: number) {
  await api.patch(`/Notifications/user/${userId}/read-all`);
}

export async function getEntityActivities(entityType: string, entityId: number) {
  const response = await api.get<Activity[]>(
    `/Activities/entity/${entityType}/${entityId}`
  );
  return response.data;
}

export async function search(q: string) {
  const response = await api.get<SearchResult>("/Search", { params: { q } });
  return response.data;
}
