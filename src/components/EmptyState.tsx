import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className='flex flex-col items-center justify-center py-16 text-center animate-fade-in'>
      <div className='mb-4 rounded-xl bg-muted p-4'>
        <Icon className='h-8 w-8 text-muted-foreground' />
      </div>
      <h3 className='mb-1 text-lg font-medium text-foreground'>{title}</h3>
      <p className='mb-6 max-w-sm text-sm text-muted-foreground'>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size='sm'>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
