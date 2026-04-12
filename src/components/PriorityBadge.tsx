import type { TaskPriority } from '@/types';
import { cn } from '@/lib/utils';

const config: Record<TaskPriority, { label: string; className: string }> = {
  high: {
    label: 'High',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  medium: {
    label: 'Medium',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  low: {
    label: 'Low',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

export default function PriorityBadge({
  priority,
}: {
  priority: TaskPriority;
}) {
  const { label, className } = config[priority];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        className
      )}
    >
      {label}
    </span>
  );
}
