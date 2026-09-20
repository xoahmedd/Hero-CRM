export interface SubTask {
  id: number;
  taskItemId: number;
  taskTitle: string;
  title: string;
  isCompleted: boolean;
  dueDate?: string | null;
}