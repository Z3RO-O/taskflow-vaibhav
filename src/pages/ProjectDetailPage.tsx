import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import type { Project, Task, TaskStatus, User } from '@/types';
import {
  getProject,
  updateTask,
  createTask,
  deleteTask,
  getAllUsers,
  updateProject,
} from '@/lib/mock-db';
import Navbar from '@/components/Navbar';
import KanbanBoard from '@/components/KanbanBoard';
import TaskModal from '@/components/TaskModal';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  ArrowLeft,
  Loader2,
  ListTodo,
  LayoutGrid,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import TaskCard from '@/components/TaskCard';
import ProjectModal from '@/components/ProjectModal';
import StatusBadge from '@/components/StatusBadge';

type ViewMode = 'kanban' | 'list';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [projectData, allUsers] = await Promise.all([
        getProject(id),
        Promise.resolve(getAllUsers()),
      ]);
      setProject(projectData);
      setTasks(projectData.tasks);
      setUsers(allUsers);
    } catch {
      setError('Project not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTasks = tasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned' && t.assignee_id) return false;
      if (assigneeFilter !== 'unassigned' && t.assignee_id !== assigneeFilter)
        return false;
    }
    return true;
  });

  // Optimistic status change
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const prev = [...tasks];
    setTasks(ts =>
      ts.map(t =>
        t.id === taskId
          ? { ...t, status: newStatus, updated_at: new Date().toISOString() }
          : t
      )
    );
    try {
      await updateTask(taskId, { status: newStatus });
      toast.success('Task updated');
    } catch {
      setTasks(prev);
      toast.error('Failed to update task');
    }
  };

  const handleSaveTask = async (data: any) => {
    if (!id) return;
    try {
      if (editingTask) {
        const updated = await updateTask(editingTask.id, data);
        setTasks(ts => ts.map(t => (t.id === updated.id ? updated : t)));
        toast.success('Task updated');
      } else {
        const created = await createTask(id, data);
        setTasks(ts => [...ts, created]);
        toast.success('Task created');
      }
    } catch {
      toast.error('Failed to save task');
    }
    setEditingTask(null);
  };

  const handleDeleteTask = async () => {
    if (!editingTask) return;
    try {
      await deleteTask(editingTask.id);
      setTasks(ts => ts.filter(t => t.id !== editingTask.id));
      toast.success('Task deleted');
      setTaskModalOpen(false);
      setEditingTask(null);
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleUpdateProject = async (data: {
    name: string;
    description?: string;
  }) => {
    if (!project || !user) return;
    try {
      const updated = await updateProject(project.id, data, user.id);
      setProject(updated);
      toast.success('Project updated');
    } catch (err: any) {
      toast.error(
        err?.error === 'forbidden'
          ? 'Only the owner can edit'
          : 'Failed to update'
      );
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-background'>
        <Navbar />
        <div className='flex items-center justify-center py-20'>
          <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className='min-h-screen bg-background'>
        <Navbar />
        <div className='flex flex-col items-center justify-center py-20'>
          <p className='text-lg text-muted-foreground'>
            {error || 'Project not found'}
          </p>
          <Button
            variant='outline'
            className='mt-4'
            onClick={() => navigate('/')}
          >
            <ArrowLeft className='mr-2 h-4 w-4' /> Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = project.owner_id === user?.id;

  return (
    <div className='min-h-screen bg-background'>
      <Navbar />
      <main className='mx-auto max-w-6xl px-4 py-8 sm:px-6'>
        {/* Header */}
        <div className='mb-6'>
          <button
            onClick={() => navigate('/')}
            className='mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors'
          >
            <ArrowLeft className='h-4 w-4' /> All Projects
          </button>

          <div className='flex items-start justify-between gap-4'>
            <div>
              <div className='flex items-center gap-2'>
                <h1 className='text-2xl font-bold tracking-tight text-foreground'>
                  {project.name}
                </h1>
                {isOwner && (
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8'
                    onClick={() => setProjectModalOpen(true)}
                  >
                    <Pencil className='h-3.5 w-3.5' />
                  </Button>
                )}
              </div>
              {project.description && (
                <p className='mt-1 text-sm text-muted-foreground'>
                  {project.description}
                </p>
              )}
            </div>
            <Button
              size='sm'
              onClick={() => {
                setEditingTask(null);
                setTaskModalOpen(true);
              }}
            >
              <Plus className='mr-1.5 h-4 w-4' /> Add Task
            </Button>
          </div>
        </div>

        {/* Filters & View Toggle */}
        <div className='mb-6 flex flex-wrap items-center gap-3'>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Statuses</SelectItem>
              <SelectItem value='todo'>To Do</SelectItem>
              <SelectItem value='in_progress'>In Progress</SelectItem>
              <SelectItem value='done'>Done</SelectItem>
            </SelectContent>
          </Select>

          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className='w-[160px]'>
              <SelectValue placeholder='Assignee' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Assignees</SelectItem>
              <SelectItem value='unassigned'>Unassigned</SelectItem>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className='ml-auto flex rounded-lg border bg-muted p-0.5'>
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size='sm'
              className='h-7 px-2.5'
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className='h-3.5 w-3.5' />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size='sm'
              className='h-7 px-2.5'
              onClick={() => setViewMode('list')}
            >
              <ListTodo className='h-3.5 w-3.5' />
            </Button>
          </div>
        </div>

        {/* Content */}
        {tasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title='No tasks yet'
            description='Create your first task to get started.'
            actionLabel='Create Task'
            onAction={() => {
              setEditingTask(null);
              setTaskModalOpen(true);
            }}
          />
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title='No matching tasks'
            description='Try adjusting your filters.'
          />
        ) : viewMode === 'kanban' ? (
          <KanbanBoard
            tasks={filteredTasks}
            users={users}
            onTaskClick={t => {
              setEditingTask(t);
              setTaskModalOpen(true);
            }}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className='space-y-2 animate-fade-in'>
            {filteredTasks.map(t => (
              <TaskCard
                key={t.id}
                task={t}
                users={users}
                onClick={() => {
                  setEditingTask(t);
                  setTaskModalOpen(true);
                }}
              />
            ))}
          </div>
        )}

        {/* Task stats summary */}
        {tasks.length > 0 && (
          <div className='mt-8 flex flex-wrap gap-4 rounded-xl border bg-card p-4'>
            {(['todo', 'in_progress', 'done'] as TaskStatus[]).map(s => {
              const count = tasks.filter(t => t.status === s).length;
              const labels: Record<TaskStatus, string> = {
                todo: 'To Do',
                in_progress: 'In Progress',
                done: 'Done',
              };
              return (
                <div key={s} className='flex items-center gap-2'>
                  <StatusBadge status={s} />
                  <span className='text-sm font-medium text-foreground'>
                    {count}
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    {labels[s]}
                  </span>
                </div>
              );
            })}
            <div className='ml-auto text-sm text-muted-foreground'>
              {tasks.length} total ·{' '}
              {Math.round(
                (tasks.filter(t => t.status === 'done').length / tasks.length) *
                  100
              )}
              % complete
            </div>
          </div>
        )}

        <TaskModal
          open={taskModalOpen}
          onClose={() => {
            setTaskModalOpen(false);
            setEditingTask(null);
          }}
          task={editingTask}
          users={users}
          onSave={handleSaveTask}
          onDelete={editingTask ? handleDeleteTask : undefined}
        />

        <ProjectModal
          open={projectModalOpen}
          onClose={() => setProjectModalOpen(false)}
          project={project}
          onSave={handleUpdateProject}
        />
      </main>
    </div>
  );
}
