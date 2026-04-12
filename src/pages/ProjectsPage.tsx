import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import type { Project } from '@/types';
import { getProjects, createProject, deleteProject } from '@/lib/mock-db';
import Navbar from '@/components/Navbar';
import ProjectModal from '@/components/ProjectModal';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import {
  Plus,
  FolderOpen,
  Loader2,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchProjects = async () => {
    if (!user) return;
    try {
      const data = await getProjects(user.id);
      setProjects(data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const handleCreate = async (data: { name: string; description?: string }) => {
    if (!user) return;
    try {
      const p = await createProject(data.name, data.description, user.id);
      setProjects(prev => [...prev, p]);
      toast.success('Project created');
    } catch {
      toast.error('Failed to create project');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteProject(id, user.id);
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success('Project deleted');
    } catch (err: any) {
      toast.error(
        err?.error === 'forbidden'
          ? 'Only the owner can delete this project'
          : 'Failed to delete'
      );
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      <Navbar />
      <main className='mx-auto max-w-6xl px-4 py-8 sm:px-6'>
        <div className='mb-8 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight text-foreground'>
              Projects
            </h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              Manage your projects and tasks
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} size='sm'>
            <Plus className='mr-1.5 h-4 w-4' /> New Project
          </Button>
        </div>

        {loading ? (
          <div className='flex items-center justify-center py-20'>
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title='No projects yet'
            description='Create your first project to start organizing tasks.'
            actionLabel='Create Project'
            onAction={() => setModalOpen(true)}
          />
        ) : (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {projects.map(p => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className='group relative rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20 animate-fade-in'
              >
                <div className='absolute right-3 top-3'>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={e => e.preventDefault()}
                    >
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 opacity-0 group-hover:opacity-100'
                      >
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem
                        onClick={e => {
                          e.preventDefault();
                          handleDelete(p.id);
                        }}
                        className='text-destructive focus:text-destructive'
                      >
                        <Trash2 className='mr-2 h-4 w-4' /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className='mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
                  <FolderOpen className='h-5 w-5 text-primary' />
                </div>
                <h3 className='mb-1 font-semibold text-card-foreground'>
                  {p.name}
                </h3>
                {p.description && (
                  <p className='mb-3 line-clamp-2 text-sm text-muted-foreground'>
                    {p.description}
                  </p>
                )}
                <p className='text-xs text-muted-foreground'>
                  Created {format(new Date(p.created_at), 'MMM d, yyyy')}
                </p>
              </Link>
            ))}
          </div>
        )}

        <ProjectModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleCreate}
        />
      </main>
    </div>
  );
}
