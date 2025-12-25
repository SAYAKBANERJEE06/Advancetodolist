export enum Priority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  priority: Priority;
  createdAt: number;
  subtasks?: Task[]; // For AI breakdown
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
