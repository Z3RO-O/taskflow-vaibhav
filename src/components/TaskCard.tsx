import type { Task, User } from '@/types';
import PriorityBadge from './PriorityBadge';
import { Calendar, User as UserIcon } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  users: User[];
  onClick: () => void;
  isDragging?: boolean;
}

export default function TaskCard({
  task,
  users,
  onClick,
  isDragging,
}: TaskCardProps) {
  const assignee = users.find(u => u.id === task.assignee_id);
  const isOverdue =
    task.due_date && isPast(new Date(task.due_date)) && task.status !== 'done';
  const isDueToday = task.due_date && isToday(new Date(task.due_date));

  return (
    <div
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md',
        isDragging && 'rotate-2 shadow-lg ring-2 ring-primary/30'
      )}
    >
      <div className='mb-2 flex items-start justify-between gap-2'>
        <h4 className='text-sm font-medium leading-snug text-card-foreground'>
          {task.title}
        </h4>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description && (
        <p className='mb-3 line-clamp-2 text-xs text-muted-foreground'>
          {task.description}
        </p>
      )}

      <div className='flex items-center justify-between gap-2'>
        {task.due_date ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs',
              isOverdue
                ? 'text-destructive'
                : isDueToday
                  ? 'text-warning'
                  : 'text-muted-foreground'
            )}
          >
            <Calendar className='h-3 w-3' />
            {format(new Date(task.due_date), 'MMM d')}
          </span>
        ) : (
          <span />
        )}

        {assignee ? (
          <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
            <span className='flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary'>
              {assignee.name
                .split(' ')
                .map(n => n[0])
                .join('')}
            </span>
          </span>
        ) : (
          <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
            <UserIcon className='h-3 w-3' />
            <span>Unassigned</span>
          </span>
        )}
      </div>
    </div>
  );
}
