import { useState, useEffect } from 'react';
import type { Project } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
  onSave: (data: { name: string; description?: string }) => void;
}

export default function ProjectModal({
  open,
  onClose,
  project,
  onSave,
}: ProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
    } else {
      setName('');
      setDescription('');
    }
    setErrors({});
  }, [project, open]);

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Project name is required';
    if (name.trim().length > 100)
      errs.name = 'Name must be under 100 characters';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSave({ name: name.trim(), description: description.trim() || undefined });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        <div className='mt-4 space-y-4'>
          <div>
            <Label htmlFor='pname'>Name</Label>
            <Input
              id='pname'
              value={name}
              onChange={e => {
                setName(e.target.value);
                setErrors({});
              }}
              placeholder='Project name'
              className={cn(errors.name && 'border-destructive')}
            />
            {errors.name && (
              <p className='mt-1 text-xs text-destructive'>{errors.name}</p>
            )}
          </div>
          <div>
            <Label htmlFor='pdesc'>Description</Label>
            <Textarea
              id='pdesc'
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder='Optional description'
              rows={3}
            />
          </div>
        </div>
        <div className='mt-6 flex justify-end gap-2'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{project ? 'Save' : 'Create'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
