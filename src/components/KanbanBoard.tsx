import type { Task, TaskStatus, User } from '@/types';
import TaskCard from './TaskCard';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';

const columns: { id: TaskStatus; label: string; dot: string }[] = [
  { id: 'todo', label: 'To Do', dot: 'bg-muted-foreground' },
  { id: 'in_progress', label: 'In Progress', dot: 'bg-primary' },
  { id: 'done', label: 'Done', dot: 'bg-success' },
];

interface KanbanBoardProps {
  tasks: Task[];
  users: User[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

export default function KanbanBoard({
  tasks,
  users,
  onTaskClick,
  onStatusChange,
}: KanbanBoardProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as TaskStatus;
    const taskId = result.draggableId;
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      onStatusChange(taskId, newStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div
              key={col.id}
              className='flex flex-col rounded-xl bg-kanban-bg p-3'
            >
              <div className='mb-3 flex items-center gap-2 px-1'>
                <span className={cn('h-2.5 w-2.5 rounded-full', col.dot)} />
                <span className='text-sm font-medium text-foreground'>
                  {col.label}
                </span>
                <span className='ml-auto rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'>
                  {colTasks.length}
                </span>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'flex min-h-[120px] flex-1 flex-col gap-2 rounded-lg p-1 transition-colors',
                      snapshot.isDraggingOver &&
                        'bg-primary/5 ring-1 ring-primary/20'
                    )}
                  >
                    {colTasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <TaskCard
                              task={task}
                              users={users}
                              onClick={() => onTaskClick(task)}
                              isDragging={snapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
