export interface Tag {
  id: number;
  name: string;
  color: string | null;
}

export interface CreateTagRequest {
  name: string;
  color?: string | null;
}

export interface AssignTagRequest {
  taskItemId: number;
  tagId: number;
}
