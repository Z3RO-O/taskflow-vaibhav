import { useState, useEffect } from 'react';
import type { Task, TaskPriority, TaskStatus, User } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  users: User[];
  onSave: (data: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignee_id?: string | null;
    due_date?: string | null;
  }) => void;
  onDelete?: () => void;
}

export default function TaskModal({
  open,
  onClose,
  task,
  users,
  onSave,
  onDelete,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState<string>('none');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setAssigneeId(task.assignee_id || 'none');
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
    } else {
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('medium');
      setAssigneeId('none');
      setDueDate(undefined);
    }
    setErrors({});
  }, [task, open]);

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (title.trim().length > 200)
      errs.title = 'Title must be under 200 characters';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      assignee_id: assigneeId === 'none' ? null : assigneeId,
      due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create Task'}</DialogTitle>
        </DialogHeader>

        <div className='mt-4 space-y-4'>
          <div>
            <Label htmlFor='title'>Title</Label>
            <Input
              id='title'
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                setErrors(prev => ({ ...prev, title: '' }));
              }}
              placeholder='Task title'
              className={cn(errors.title && 'border-destructive')}
            />
            {errors.title && (
              <p className='mt-1 text-xs text-destructive'>{errors.title}</p>
            )}
          </div>

          <div>
            <Label htmlFor='desc'>Description</Label>
            <Textarea
              id='desc'
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder='Add a description...'
              rows={3}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={v => setStatus(v as TaskStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='todo'>To Do</SelectItem>
                  <SelectItem value='in_progress'>In Progress</SelectItem>
                  <SelectItem value='done'>Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={v => setPriority(v as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='low'>Low</SelectItem>
                  <SelectItem value='medium'>Medium</SelectItem>
                  <SelectItem value='high'>High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label>Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>Unassigned</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {dueDate ? format(dueDate, 'MMM d, yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className='pointer-events-auto p-3'
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className='mt-6 flex items-center justify-between'>
          {task && onDelete ? (
            <Button
              variant='ghost'
              size='sm'
              onClick={onDelete}
              className='text-destructive hover:text-destructive'
            >
              <Trash2 className='mr-1 h-4 w-4' /> Delete
            </Button>
          ) : (
            <span />
          )}
          <div className='flex gap-2'>
            <Button variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {task ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
