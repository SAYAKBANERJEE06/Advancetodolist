import { Task, User, Priority } from '../types';

// Keys for local storage
const USERS_KEY = 'smarttasker_users';
const TASKS_PREFIX = 'smarttasker_tasks_';
const CURRENT_USER_KEY = 'smarttasker_current_user';

// Helper to simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const storageService = {
  // --- Auth Methods ---

  async register(email: string, password: string, name: string): Promise<User> {
    await delay(500);
    const usersRaw = localStorage.getItem(USERS_KEY);
    const users: Record<string, any> = usersRaw ? JSON.parse(usersRaw) : {};

    if (users[email]) {
      throw new Error('User already exists');
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      name,
    };

    // In a real app, store a hashed password. Here we just store the user record keyed by email for simplicity.
    // We strictly separate auth data from task data.
    users[email] = { ...newUser, password }; // Storing password in plain text ONLY for this pure-frontend demo.
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    return newUser;
  },

  async login(email: string, password: string): Promise<User> {
    await delay(500);
    const usersRaw = localStorage.getItem(USERS_KEY);
    const users: Record<string, any> = usersRaw ? JSON.parse(usersRaw) : {};

    const user = users[email];
    if (!user || user.password !== password) {
      throw new Error('Invalid credentials');
    }

    const { password: _, ...safeUser } = user;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
    return safeUser;
  },

  async logout(): Promise<void> {
    await delay(200);
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  // --- Task Methods (Data Isolation) ---

  async getTasks(userId: string): Promise<Task[]> {
    await delay(300);
    const raw = localStorage.getItem(`${TASKS_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  },

  async createTask(userId: string, title: string): Promise<Task> {
    await delay(300);
    const tasks = await this.getTasks(userId);
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      isCompleted: false,
      priority: Priority.MEDIUM,
      createdAt: Date.now(),
    };

    tasks.push(newTask);
    this.saveTasks(userId, tasks);
    return newTask;
  },

  async updateTask(userId: string, task: Task): Promise<Task> {
    await delay(200);
    const tasks = await this.getTasks(userId);
    const index = tasks.findIndex((t) => t.id === task.id);
    if (index !== -1) {
      tasks[index] = task;
      this.saveTasks(userId, tasks);
      return task;
    }
    throw new Error('Task not found');
  },

  async deleteTask(userId: string, taskId: string): Promise<void> {
    await delay(200);
    const tasks = await this.getTasks(userId);
    const newTasks = tasks.filter((t) => t.id !== taskId);
    this.saveTasks(userId, newTasks);
  },

  // Internal helper
  saveTasks(userId: string, tasks: Task[]) {
    localStorage.setItem(`${TASKS_PREFIX}${userId}`, JSON.stringify(tasks));
  }
};
