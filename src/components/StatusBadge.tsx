import type { TaskStatus } from '@/types';
import { cn } from '@/lib/utils';

const config: Record<TaskStatus, { label: string; dot: string }> = {
  todo: { label: 'To Do', dot: 'bg-muted-foreground' },
  in_progress: { label: 'In Progress', dot: 'bg-primary' },
  done: { label: 'Done', dot: 'bg-success' },
};

export default function StatusBadge({ status }: { status: TaskStatus }) {
  const { label, dot } = config[status];
  return (
    <span className='inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
      <span className={cn('h-2 w-2 rounded-full', dot)} />
      {label}
    </span>
  );
}
