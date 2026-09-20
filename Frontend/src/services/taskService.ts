import api from "../api/axios";

import type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskAssignee,
  UpdateTaskProgressRequest,
} from "../types/task";

export async function getMyTasks(): Promise<Task[]> {
  const response = await api.get<Task[]>(
    "/Tasks/my"
  );

  return response.data;
}

export async function getTasksByProject(
  projectId: number
): Promise<Task[]> {
  const response = await api.get<Task[]>(
    `/Tasks/project/${projectId}`
  );

  return response.data;
}

export async function getTask(
  id: number
): Promise<Task> {
  const response = await api.get<Task>(
    `/Tasks/${id}`
  );

  return response.data;
}

export async function createTask(
  data: CreateTaskRequest
): Promise<Task> {
  const response = await api.post<Task>(
    "/Tasks",
    data
  );

  return response.data;
}

export async function updateTask(
  id: number,
  data: UpdateTaskRequest
) {
  const response = await api.put(
    `/Tasks/${id}`,
    data
  );

  return response.data;
}

export async function deleteTask(
  id: number
) {
  const response = await api.delete(
    `/Tasks/${id}`
  );

  return response.data;
}

export async function updateTaskStatus(
  id: number,
  status: string
) {
  const response = await api.patch(
    `/Tasks/${id}/status`,
    null,
    {
      params: {
        status,
      },
    }
  );

  return response.data;
}

export async function updateTaskProgress(
  id: number,
  data: UpdateTaskProgressRequest
) {
  const response = await api.patch(
    `/Tasks/${id}/progress`,
    data
  );

  return response.data;
}

export async function updateTaskPriority(
  id: number,
  priority: string
) {
  const response = await api.patch(
    `/Tasks/${id}/priority`,
    null,
    {
      params: {
        priority,
      },
    }
  );

  return response.data;
}

export async function getTaskAssignees(
  taskId: number
): Promise<TaskAssignee[]> {
  const response =
    await api.get<TaskAssignee[]>(
      `/Tasks/${taskId}/assignees`
    );

  return response.data;
}

export async function assignUserToTask(
  taskId: number,
  userId: number
) {
  const response = await api.post(
    `/Tasks/${taskId}/assignees/${userId}`
  );

  return response.data;
}

export async function removeUserFromTask(
  taskId: number,
  userId: number
) {
  const response = await api.delete(
    `/Tasks/${taskId}/assignees/${userId}`
  );

  return response.data;
}
export const TASKS_CHANGED_EVENT = "crm:tasks-changed";

export function notifyTasksChanged() {
  window.dispatchEvent(new Event(TASKS_CHANGED_EVENT));
}
