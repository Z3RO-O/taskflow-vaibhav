import type {
  User,
  Project,
  Task,
  TaskStatus,
  TaskPriority,
  Organization,
} from '@/types';
import { applyTaskReorder, sortTasksForDisplay } from './task-order';

const STORAGE_KEYS = {
  users: 'taskflow_users',
  projects: 'taskflow_projects',
  tasks: 'taskflow_tasks',
  orgs: 'taskflow_orgs',
};

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function generateInviteCode(): string {
  const part = () =>
    Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X');
  return `ORG-${part()}-${part()}`;
}

// Seed data (first visit only)
function initializeDB() {
  if (localStorage.getItem(STORAGE_KEYS.users)) return;

  const defaultOrg: Organization = {
    id: 'org_1',
    name: 'Acme Corp',
    invite_code: 'ACME-DEMO',
    owner_id: 'usr_1',
    created_at: '2026-04-01T10:00:00Z',
  };

  const testUser: User & { password: string } = {
    id: 'usr_1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    org_id: defaultOrg.id,
    created_at: '2026-04-01T10:00:00Z',
  };

  const janeDoe: User & { password: string } = {
    id: 'usr_2',
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'password123',
    org_id: defaultOrg.id,
    created_at: '2026-04-01T10:00:00Z',
  };

  const project: Project = {
    id: 'prj_1',
    name: 'Website Redesign',
    description:
      'Q2 redesign of the company website with modern UI/UX improvements',
    owner_id: 'usr_1',
    org_id: defaultOrg.id,
    created_at: '2026-04-01T10:00:00Z',
  };

  const project2: Project = {
    id: 'prj_2',
    name: 'Mobile App MVP',
    description:
      'Build the first version of our iOS and Android mobile application',
    owner_id: 'usr_1',
    org_id: defaultOrg.id,
    created_at: '2026-04-03T10:00:00Z',
  };

  const tasks: Task[] = [
    {
      id: 'tsk_1',
      title: 'Design homepage mockups',
      description:
        'Create high-fidelity mockups for the new homepage layout including hero section, features grid, and testimonials.',
      status: 'in_progress',
      position: 0,
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
      position: 0,
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
      position: 0,
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
      position: 0,
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
      position: 0,
      priority: 'medium',
      project_id: 'prj_2',
      assignee_id: 'usr_2',
      due_date: null,
      created_at: '2026-04-04T10:00:00Z',
      updated_at: '2026-04-04T10:00:00Z',
    },
  ];

  localStorage.setItem(STORAGE_KEYS.orgs, JSON.stringify([defaultOrg]));
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify([testUser, janeDoe]));
  localStorage.setItem(
    STORAGE_KEYS.projects,
    JSON.stringify([project, project2])
  );
  localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
}

/** Upgrade older localStorage that predates organizations. */
function ensureOrgMigration() {
  const usersRaw = localStorage.getItem(STORAGE_KEYS.users);
  if (!usersRaw) return;

  const orgsRaw = localStorage.getItem(STORAGE_KEYS.orgs);
  if (!orgsRaw) {
    const users = JSON.parse(usersRaw) as (User & { password: string })[];
    const projects = getItems<Project & { org_id?: string }>(
      STORAGE_KEYS.projects
    );
    const org: Organization = {
      id: `org_mig_${generateId().slice(0, 8)}`,
      name: 'My organization',
      invite_code: generateInviteCode(),
      owner_id: users[0]?.id ?? '',
      created_at: now(),
    };
    setItems(STORAGE_KEYS.orgs, [org]);
    setItems(
      STORAGE_KEYS.users,
      users.map(u => ({ ...u, org_id: u.org_id ?? org.id }))
    );
    setItems(
      STORAGE_KEYS.projects,
      projects.map(p => ({ ...p, org_id: p.org_id ?? org.id }))
    );
    return;
  }

  const orgs = JSON.parse(orgsRaw) as Organization[];
  const defaultOrgId = orgs[0]?.id;
  if (!defaultOrgId) return;

  const users = JSON.parse(usersRaw) as (User & {
    password: string;
    org_id?: string;
  })[];
  if (users.some(u => !u.org_id)) {
    setItems(
      STORAGE_KEYS.users,
      users.map(u => ({ ...u, org_id: u.org_id ?? defaultOrgId }))
    );
  }

  const projects = getItems<Project & { org_id?: string }>(
    STORAGE_KEYS.projects
  );
  if (projects.some(p => !p.org_id)) {
    setItems(
      STORAGE_KEYS.projects,
      projects.map(p => ({ ...p, org_id: p.org_id ?? defaultOrgId }))
    );
  }

  patchOrganizationOwners();
}

function patchOrganizationOwners() {
  type OrgRow = Organization & { owner_id?: string };
  const orgs = getItems<OrgRow>(STORAGE_KEYS.orgs);
  const users = getItems<User & { password: string }>(STORAGE_KEYS.users);
  let changed = false;
  const next: Organization[] = orgs.map(o => {
    if (o.owner_id) return o as Organization;
    changed = true;
    const firstMember = users.find(u => u.org_id === o.id);
    return {
      ...(o as Organization),
      owner_id: firstMember?.id ?? users[0]?.id ?? '',
    };
  });
  if (changed) setItems(STORAGE_KEYS.orgs, next);
}

// Generic getters/setters
function getItems<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setItems<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

function hydrateTask(raw: Task & { position?: number }): Task {
  return {
    ...raw,
    position: typeof raw.position === 'number' ? raw.position : 0,
  };
}

function loadTasks(): Task[] {
  const data = localStorage.getItem(STORAGE_KEYS.tasks);
  if (!data) return [];
  const parsed = JSON.parse(data) as Task[];
  return parsed.map(hydrateTask);
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
}

function getMemberUser(
  userId: string
): (User & { password: string }) | undefined {
  ensureOrgMigration();
  return getItems<User & { password: string }>(STORAGE_KEYS.users).find(
    u => u.id === userId
  );
}

async function assertProjectInUserOrg(
  userId: string,
  projectId: string
): Promise<Project> {
  const member = getMemberUser(userId);
  if (!member?.org_id) throw { error: 'forbidden' };
  const projects = getItems<Project>(STORAGE_KEYS.projects);
  const project = projects.find(p => p.id === projectId);
  if (!project) throw { error: 'not found' };
  if (project.org_id !== member.org_id) throw { error: 'forbidden' };
  return project;
}

async function assertTaskInUserOrg(
  userId: string,
  taskId: string
): Promise<Task> {
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) throw { error: 'not found' };
  await assertProjectInUserOrg(userId, task.project_id);
  return task;
}

// Simulate network delay
function delay(ms = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms + Math.random() * 200));
}

// ─── Auth ───

export function getSafeUserById(userId: string): User | null {
  ensureOrgMigration();
  const u = getMemberUser(userId);
  if (!u) return null;
  const { password: _, ...safe } = u;
  return safe as User;
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
  inviteCode?: string | null
) {
  await delay();
  ensureOrgMigration();
  const users = getItems<User & { password: string }>(STORAGE_KEYS.users);
  if (users.find(u => u.email === email)) {
    throw { error: 'validation failed', fields: { email: 'already exists' } };
  }

  let org_id: string;
  const newUserId = generateId();
  const trimmedInvite = inviteCode?.trim();
  if (trimmedInvite) {
    const orgs = getItems<Organization>(STORAGE_KEYS.orgs);
    const org = orgs.find(
      o => o.invite_code.toUpperCase() === trimmedInvite.toUpperCase()
    );
    if (!org) {
      throw {
        error: 'validation failed',
        fields: { invite: 'Invalid or unknown invite code' },
      };
    }
    org_id = org.id;
  } else {
    const orgs = getItems<Organization>(STORAGE_KEYS.orgs);
    const newOrg: Organization = {
      id: generateId(),
      name: `${name.trim().split(/\s+/)[0] || 'My'}'s workspace`,
      invite_code: generateInviteCode(),
      owner_id: newUserId,
      created_at: now(),
    };
    orgs.push(newOrg);
    setItems(STORAGE_KEYS.orgs, orgs);
    org_id = newOrg.id;
  }

  const user: User & { password: string } = {
    id: newUserId,
    name,
    email,
    password,
    org_id,
    created_at: now(),
  };
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
  ensureOrgMigration();
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
  return { token, user: safeUser as User };
}

export function getAllUsers(orgId: string): User[] {
  ensureOrgMigration();
  return getItems<User & { password: string }>(STORAGE_KEYS.users)
    .filter(u => u.org_id === orgId)
    .map(({ password, ...u }) => u as unknown as User);
}

// ─── Organizations ───

export async function getOrganization(orgId: string): Promise<Organization> {
  await delay();
  ensureOrgMigration();
  const org = getItems<Organization>(STORAGE_KEYS.orgs).find(
    o => o.id === orgId
  );
  if (!org) throw { error: 'not found' };
  return org;
}

export async function updateOrganization(
  orgId: string,
  userId: string,
  data: { name: string }
): Promise<Organization> {
  await delay();
  ensureOrgMigration();
  const orgs = getItems<Organization>(STORAGE_KEYS.orgs);
  const idx = orgs.findIndex(o => o.id === orgId);
  if (idx === -1) throw { error: 'not found' };
  if (orgs[idx].owner_id !== userId) throw { error: 'forbidden' };
  const trimmed = data.name.trim();
  if (!trimmed)
    throw { error: 'validation failed', fields: { name: 'Required' } };
  orgs[idx] = { ...orgs[idx], name: trimmed };
  setItems(STORAGE_KEYS.orgs, orgs);
  return orgs[idx];
}

export async function updateUserProfile(
  userId: string,
  data: { name: string }
): Promise<User> {
  await delay();
  ensureOrgMigration();
  const all = getItems<User & { password: string }>(STORAGE_KEYS.users);
  const idx = all.findIndex(u => u.id === userId);
  if (idx === -1) throw { error: 'not found' };
  const trimmed = data.name.trim();
  if (!trimmed)
    throw { error: 'validation failed', fields: { name: 'Required' } };
  all[idx] = { ...all[idx], name: trimmed };
  setItems(STORAGE_KEYS.users, all);
  const { password: _, ...safe } = all[idx];
  return safe as User;
}

export async function regenerateOrganizationInviteCode(
  userId: string
): Promise<Organization> {
  await delay();
  const member = getMemberUser(userId);
  if (!member?.org_id) throw { error: 'forbidden' };
  const orgs = getItems<Organization>(STORAGE_KEYS.orgs);
  const idx = orgs.findIndex(o => o.id === member.org_id);
  if (idx === -1) throw { error: 'not found' };
  orgs[idx] = { ...orgs[idx], invite_code: generateInviteCode() };
  setItems(STORAGE_KEYS.orgs, orgs);
  return orgs[idx];
}

// ─── Projects ───

export async function getProjects(userId: string): Promise<Project[]> {
  await delay();
  const member = getMemberUser(userId);
  if (!member?.org_id) return [];
  const projects = getItems<Project>(STORAGE_KEYS.projects);
  return projects.filter(p => p.org_id === member.org_id);
}

export async function getProject(
  projectId: string,
  userId: string
): Promise<Project & { tasks: Task[] }> {
  await delay();
  const project = await assertProjectInUserOrg(userId, projectId);
  const tasks = loadTasks().filter(t => t.project_id === projectId);
  return { ...project, tasks };
}

export async function createProject(
  name: string,
  description: string | undefined,
  ownerId: string
): Promise<Project> {
  await delay();
  const member = getMemberUser(ownerId);
  if (!member?.org_id) throw { error: 'forbidden' };
  const projects = getItems<Project>(STORAGE_KEYS.projects);
  const project: Project = {
    id: generateId(),
    name,
    description,
    owner_id: ownerId,
    org_id: member.org_id,
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
  await assertProjectInUserOrg(userId, projectId);
  const projects = getItems<Project>(STORAGE_KEYS.projects);
  const idx = projects.findIndex(p => p.id === projectId);
  if (idx === -1) throw { error: 'not found' };
  projects[idx] = { ...projects[idx], ...data };
  setItems(STORAGE_KEYS.projects, projects);
  return projects[idx];
}

export async function deleteProject(
  projectId: string,
  userId: string
): Promise<void> {
  await delay();
  await assertProjectInUserOrg(userId, projectId);
  const projects = getItems<Project>(STORAGE_KEYS.projects);
  const project = projects.find(p => p.id === projectId);
  if (!project) throw { error: 'not found' };
  if (project.owner_id !== userId) throw { error: 'forbidden' };
  setItems(
    STORAGE_KEYS.projects,
    projects.filter(p => p.id !== projectId)
  );
  const tasks = loadTasks();
  saveTasks(tasks.filter(t => t.project_id !== projectId));
}

// ─── Tasks ───

export async function getTasks(
  projectId: string,
  filters?: { status?: TaskStatus; assignee?: string }
): Promise<Task[]> {
  await delay();
  let tasks = loadTasks().filter(t => t.project_id === projectId);
  if (filters?.status) tasks = tasks.filter(t => t.status === filters.status);
  if (filters?.assignee)
    tasks = tasks.filter(t => t.assignee_id === filters.assignee);
  return tasks;
}

export async function createTask(
  projectId: string,
  userId: string,
  data: {
    title: string;
    description?: string;
    priority: TaskPriority;
    assignee_id?: string | null;
    due_date?: string | null;
  }
): Promise<Task> {
  await delay();
  const member = getMemberUser(userId);
  if (!member?.org_id) throw { error: 'forbidden' };
  await assertProjectInUserOrg(userId, projectId);
  if (data.assignee_id) {
    const assignee = getMemberUser(data.assignee_id);
    if (!assignee || assignee.org_id !== member.org_id) {
      throw {
        error: 'validation failed',
        fields: { assignee: 'Not in your organization' },
      };
    }
  }
  const tasks = loadTasks();
  const todoPositions = tasks
    .filter(t => t.project_id === projectId && t.status === 'todo')
    .map(t => t.position);
  const position = (todoPositions.length ? Math.max(...todoPositions) : -1) + 1;
  const task: Task = {
    id: generateId(),
    title: data.title,
    description: data.description,
    status: 'todo',
    position,
    priority: data.priority,
    project_id: projectId,
    assignee_id: data.assignee_id || null,
    due_date: data.due_date || null,
    created_at: now(),
    updated_at: now(),
  };
  tasks.push(task);
  saveTasks(tasks);
  return task;
}

export async function updateTask(
  taskId: string,
  userId: string,
  data: Partial<
    Pick<
      Task,
      | 'title'
      | 'description'
      | 'status'
      | 'position'
      | 'priority'
      | 'assignee_id'
      | 'due_date'
    >
  >
): Promise<Task> {
  await delay();
  const member = getMemberUser(userId);
  if (!member?.org_id) throw { error: 'forbidden' };
  await assertTaskInUserOrg(userId, taskId);
  if (data.assignee_id) {
    const assignee = getMemberUser(data.assignee_id);
    if (!assignee || assignee.org_id !== member.org_id) {
      throw {
        error: 'validation failed',
        fields: { assignee: 'Not in your organization' },
      };
    }
  }
  const tasks = loadTasks();
  const idx = tasks.findIndex(t => t.id === taskId);
  if (idx === -1) throw { error: 'not found' };
  const prev = tasks[idx];
  let next: Task = { ...prev, ...data, updated_at: now() };
  if (
    data.status !== undefined &&
    data.status !== prev.status &&
    data.position === undefined
  ) {
    const siblings = tasks.filter(
      t =>
        t.project_id === prev.project_id &&
        t.status === data.status &&
        t.id !== taskId
    );
    const maxPos = siblings.length
      ? Math.max(...siblings.map(t => t.position))
      : -1;
    next = { ...next, position: maxPos + 1 };
  }
  tasks[idx] = next;
  saveTasks(tasks);
  return tasks[idx];
}

export async function reorderProjectTasks(
  projectId: string,
  userId: string,
  taskId: string,
  source: { droppableId: TaskStatus; index: number },
  destination: { droppableId: TaskStatus; index: number }
): Promise<Task[]> {
  await delay();
  await assertProjectInUserOrg(userId, projectId);
  const allTasks = loadTasks();
  const projectTasks = allTasks.filter(t => t.project_id === projectId);
  if (!projectTasks.some(t => t.id === taskId)) throw { error: 'not found' };
  const updatedSubset = applyTaskReorder(
    projectTasks,
    taskId,
    source,
    destination
  );
  const byId = new Map(updatedSubset.map(t => [t.id, t]));
  const merged = allTasks.map(t =>
    t.project_id === projectId ? (byId.get(t.id) ?? t) : t
  );
  saveTasks(merged);
  return sortTasksForDisplay(updatedSubset);
}

export async function deleteTask(
  taskId: string,
  userId: string
): Promise<void> {
  await delay();
  await assertTaskInUserOrg(userId, taskId);
  const tasks = loadTasks();
  saveTasks(tasks.filter(t => t.id !== taskId));
}

export async function getProjectStats(projectId: string) {
  await delay();
  const tasks = loadTasks().filter(t => t.project_id === projectId);
  const byStatus = { todo: 0, in_progress: 0, done: 0 };
  const byAssignee: Record<string, number> = {};
  tasks.forEach(t => {
    byStatus[t.status]++;
    const key = t.assignee_id || 'unassigned';
    byAssignee[key] = (byAssignee[key] || 0) + 1;
  });
  return { total: tasks.length, byStatus, byAssignee };
}

initializeDB();
ensureOrgMigration();
