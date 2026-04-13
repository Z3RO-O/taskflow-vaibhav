export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Organization {
  id: string;
  name: string;
  /** Case-insensitive match when joining via registration. */
  invite_code: string;
  /** User who created this org; may rename the organization. */
  owner_id: string;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  org_id: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  org_id: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  position: number;
  priority: TaskPriority;
  project_id: string;
  assignee_id?: string | null;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
  fields?: Record<string, string>;
}
