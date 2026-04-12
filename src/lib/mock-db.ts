import type { User, Project, Task, TaskStatus, TaskPriority } from '@/types';

const STORAGE_KEYS = {
  users: 'taskflow_users',
  projects: 'taskflow_projects',
  tasks: 'taskflow_tasks',
};

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

// Seed data
function initializeDB() {
  if (localStorage.getItem(STORAGE_KEYS.users)) return;

  const testUser: User & { password: string } = {
    id: 'usr_1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    created_at: '2026-04-01T10:00:00Z',
  };

  const janeDoe: User & { password: string } = {
    id: 'usr_2',
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'password123',
    created_at: '2026-04-01T10:00:00Z',
  };

  const project: Project = {
    id: 'prj_1',
    name: 'Website Redesign',
    description:
      'Q2 redesign of the company website with modern UI/UX improvements',
    owner_id: 'usr_1',
    created_at: '2026-04-01T10:00:00Z',
  };

  const project2: Project = {
    id: 'prj_2',
    name: 'Mobile App MVP',
    description:
      'Build the first version of our iOS and Android mobile application',
    owner_id: 'usr_1',
    created_at: '2026-04-03T10:00:00Z',
  };

  const tasks: Task[] = [
    {
      id: 'tsk_1',
      title: 'Design homepage mockups',
      description:
        'Create high-fidelity mockups for the new homepage layout including hero section, features grid, and testimonials.',
      status: 'in_progress',
      priority: 'high',
      project_id: 'prj_1',
      assignee_id: 'usr_1',
      due_date: '2026-04-15',
      created_at: '2026-04-02T10:00:00Z',
      updated_at: '2026-04-02T10:00:00Z',
    },
    {
      id: 'tsk_2',
      title: 'Set up CI/CD pipeline',
      description:
        'Configure GitHub Actions for automated testing and deployment to staging.',
      status: 'todo',
      priority: 'medium',
      project_id: 'prj_1',
      assignee_id: 'usr_2',
      due_date: '2026-04-20',
      created_at: '2026-04-02T11:00:00Z',
      updated_at: '2026-04-02T11:00:00Z',
    },
    {
      id: 'tsk_3',
      title: 'Write API documentation',
      description:
        'Document all REST endpoints with request/response examples using OpenAPI spec.',
      status: 'done',
      priority: 'low',
      project_id: 'prj_1',
      assignee_id: 'usr_1',
      due_date: '2026-04-10',
      created_at: '2026-04-01T10:00:00Z',
      updated_at: '2026-04-08T10:00:00Z',
    },
    {
      id: 'tsk_4',
      title: 'Implement user onboarding flow',
      description: 'Build a step-by-step onboarding experience for new users.',
      status: 'todo',
      priority: 'high',
      project_id: 'prj_2',
      assignee_id: null,
      due_date: '2026-04-25',
      created_at: '2026-04-03T12:00:00Z',
      updated_at: '2026-04-03T12:00:00Z',
    },
    {
      id: 'tsk_5',
      title: 'Set up push notifications',
      description:
        'Integrate Firebase Cloud Messaging for push notification support.',
      status: 'in_progress',
      priority: 'medium',
      project_id: 'prj_2',
      assignee_id: 'usr_2',
      due_date: null,
      created_at: '2026-04-04T10:00:00Z',
      updated_at: '2026-04-04T10:00:00Z',
    },
  ];

  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify([testUser, janeDoe]));
  localStorage.setItem(
    STORAGE_KEYS.projects,
    JSON.stringify([project, project2])
  );
  localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
}

// Generic getters/setters
function getItems<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setItems<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

// Simulate network delay
function delay(ms = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms + Math.random() * 200));
}

// ─── Auth ───

export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  await delay();
  const users = getItems<User & { password: string }>(STORAGE_KEYS.users);
  if (users.find(u => u.email === email)) {
    throw { error: 'validation failed', fields: { email: 'already exists' } };
  }
  const user = { id: generateId(), name, email, password, created_at: now() };
  users.push(user);
  setItems(STORAGE_KEYS.users, users);
  const token = btoa(
    JSON.stringify({
      user_id: user.id,
      email: user.email,
      exp: Date.now() + 86400000,
    })
  );
  const { password: _, ...safeUser } = user;
  return { token, user: safeUser };
}

export async function loginUser(email: string, password: string) {
  await delay();
  const users = getItems<User & { password: string }>(STORAGE_KEYS.users);
  const user = users.find(u => u.email === email);
  if (!user || user.password !== password) {
    throw { error: 'Invalid email or password' };
  }
  const token = btoa(
    JSON.stringify({
      user_id: user.id,
      email: user.email,
      exp: Date.now() + 86400000,
    })
  );
  const { password: _, ...safeUser } = user;
  return { token, user: safeUser };
}

export function getAllUsers(): User[] {
  return getItems<User & { password: string }>(STORAGE_KEYS.users).map(
    ({ password, ...u }) => u as unknown as User
  );
}

// ─── Projects ───

export async function getProjects(userId: string): Promise<Project[]> {
  await delay();
  const projects = getItems<Project>(STORAGE_KEYS.projects);
  const tasks = getItems<Task>(STORAGE_KEYS.tasks);
  const taskProjectIds = new Set(
    tasks.filter(t => t.assignee_id === userId).map(t => t.project_id)
  );
  return projects.filter(
    p => p.owner_id === userId || taskProjectIds.has(p.id)
  );
}

export async function getProject(
  projectId: string
): Promise<Project & { tasks: Task[] }> {
  await delay();
  const projects = getItems<Project>(STORAGE_KEYS.projects);
  const project = projects.find(p => p.id === projectId);
  if (!project) throw { error: 'not found' };
  const tasks = getItems<Task>(STORAGE_KEYS.tasks).filter(
    t => t.project_id === projectId
  );
  return { ...project, tasks };
}

export async function createProject(
  name: string,
  description: string | undefined,
  ownerId: string
): Promise<Project> {
  await delay();
  const projects = getItems<Project>(STORAGE_KEYS.projects);
  const project: Project = {
    id: generateId(),
    name,
    description,
    owner_id: ownerId,
    created_at: now(),
  };
  projects.push(project);
  setItems(STORAGE_KEYS.projects, projects);
  return project;
}

export async function updateProject(
  projectId: string,
  data: Partial<Pick<Project, 'name' | 'description'>>,
  userId: string
): Promise<Project> {
  await delay();
  const projects = getItems<Project>(STORAGE_KEYS.projects);
  const idx = projects.findIndex(p => p.id === projectId);
  if (idx === -1) throw { error: 'not found' };
  if (projects[idx].owner_id !== userId) throw { error: 'forbidden' };
  projects[idx] = { ...projects[idx], ...data };
  setItems(STORAGE_KEYS.projects, projects);
  return projects[idx];
}

export async function deleteProject(
  projectId: string,
  userId: string
): Promise<void> {
  await delay();
  const projects = getItems<Project>(STORAGE_KEYS.projects);
  const project = projects.find(p => p.id === projectId);
  if (!project) throw { error: 'not found' };
  if (project.owner_id !== userId) throw { error: 'forbidden' };
  setItems(
    STORAGE_KEYS.projects,
    projects.filter(p => p.id !== projectId)
  );
  const tasks = getItems<Task>(STORAGE_KEYS.tasks);
  setItems(
    STORAGE_KEYS.tasks,
    tasks.filter(t => t.project_id !== projectId)
  );
}

// ─── Tasks ───

export async function getTasks(
  projectId: string,
  filters?: { status?: TaskStatus; assignee?: string }
): Promise<Task[]> {
  await delay();
  let tasks = getItems<Task>(STORAGE_KEYS.tasks).filter(
    t => t.project_id === projectId
  );
  if (filters?.status) tasks = tasks.filter(t => t.status === filters.status);
  if (filters?.assignee)
    tasks = tasks.filter(t => t.assignee_id === filters.assignee);
  return tasks;
}

export async function createTask(
  projectId: string,
  data: {
    title: string;
    description?: string;
    priority: TaskPriority;
    assignee_id?: string | null;
    due_date?: string | null;
  }
): Promise<Task> {
  await delay();
  const tasks = getItems<Task>(STORAGE_KEYS.tasks);
  const task: Task = {
    id: generateId(),
    title: data.title,
    description: data.description,
    status: 'todo',
    priority: data.priority,
    project_id: projectId,
    assignee_id: data.assignee_id || null,
    due_date: data.due_date || null,
    created_at: now(),
    updated_at: now(),
  };
  tasks.push(task);
  setItems(STORAGE_KEYS.tasks, tasks);
  return task;
}

export async function updateTask(
  taskId: string,
  data: Partial<
    Pick<
      Task,
      | 'title'
      | 'description'
      | 'status'
      | 'priority'
      | 'assignee_id'
      | 'due_date'
    >
  >
): Promise<Task> {
  await delay();
  const tasks = getItems<Task>(STORAGE_KEYS.tasks);
  const idx = tasks.findIndex(t => t.id === taskId);
  if (idx === -1) throw { error: 'not found' };
  tasks[idx] = { ...tasks[idx], ...data, updated_at: now() };
  setItems(STORAGE_KEYS.tasks, tasks);
  return tasks[idx];
}

export async function deleteTask(taskId: string): Promise<void> {
  await delay();
  const tasks = getItems<Task>(STORAGE_KEYS.tasks);
  if (!tasks.find(t => t.id === taskId)) throw { error: 'not found' };
  setItems(
    STORAGE_KEYS.tasks,
    tasks.filter(t => t.id !== taskId)
  );
}

export async function getProjectStats(projectId: string) {
  await delay();
  const tasks = getItems<Task>(STORAGE_KEYS.tasks).filter(
    t => t.project_id === projectId
  );
  const byStatus = { todo: 0, in_progress: 0, done: 0 };
  const byAssignee: Record<string, number> = {};
  tasks.forEach(t => {
    byStatus[t.status]++;
    const key = t.assignee_id || 'unassigned';
    byAssignee[key] = (byAssignee[key] || 0) + 1;
  });
  return { total: tasks.length, byStatus, byAssignee };
}

// Initialize on import
initializeDB();
