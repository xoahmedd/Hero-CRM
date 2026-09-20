import api from "../api/axios";
import type { SubTask } from "../types/subTask";

// cspell:ignore uncomplete

export async function getSubTasksByTask(
  taskId: number
): Promise<SubTask[]> {
  const response = await api.get<SubTask[]>(
    `/SubTasks/task/${taskId}`
  );

  return response.data;
}

export async function completeSubTask(
  subTaskId: number
): Promise<void> {
  await api.patch(`/SubTasks/${subTaskId}/complete`);
}

export async function uncompleteSubTask(
  subTaskId: number
): Promise<void> {
  await api.patch(`/SubTasks/${subTaskId}/uncomplete`);
}
export async function createSubTask(data: {
  taskItemId: number;
  title: string;
  dueDate?: string | null;
}): Promise<SubTask> {
  const response = await api.post<SubTask>("/SubTasks", data);
  return response.data;
}

export async function deleteSubTask(subTaskId: number): Promise<void> {
  await api.delete(`/SubTasks/${subTaskId}`);
}
