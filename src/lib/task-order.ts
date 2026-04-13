import type { Task, TaskStatus } from '@/types';

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'done'];

const statusRank: Record<TaskStatus, number> = {
  todo: 0,
  in_progress: 1,
  done: 2,
};

/** Order within one Kanban column. */
export function sortColumnTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const dp = a.position - b.position;
    if (dp !== 0) return dp;
    return a.created_at.localeCompare(b.created_at);
  });
}

/** List view: workflow order, then manual order within each status. */
export function sortTasksForDisplay(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const sr = statusRank[a.status] - statusRank[b.status];
    if (sr !== 0) return sr;
    const dp = a.position - b.position;
    if (dp !== 0) return dp;
    return a.created_at.localeCompare(b.created_at);
  });
}

function columnTasks(projectTasks: Task[], status: TaskStatus): Task[] {
  return sortColumnTasks(projectTasks.filter(t => t.status === status));
}

/**
 * Updates tasks for one project after a Kanban drag (reorder and/or change column).
 */
export function applyTaskReorder(
  projectTasks: Task[],
  taskId: string,
  source: { droppableId: TaskStatus; index: number },
  destination: { droppableId: TaskStatus; index: number }
): Task[] {
  if (!projectTasks.some(t => t.id === taskId)) return projectTasks;

  const columns: Record<TaskStatus, Task[]> = {
    todo: columnTasks(projectTasks, 'todo'),
    in_progress: columnTasks(projectTasks, 'in_progress'),
    done: columnTasks(projectTasks, 'done'),
  };

  const src = source.droppableId;
  const dst = destination.droppableId;

  if (src === dst) {
    const list = columns[src];
    const [moved] = list.splice(source.index, 1);
    list.splice(destination.index, 0, moved);
  } else {
    const srcList = columns[src];
    const dstList = columns[dst];
    const [moved] = srcList.splice(source.index, 1);
    dstList.splice(destination.index, 0, { ...moved, status: dst });
  }

  const nextById = new Map<string, Task>();
  for (const status of STATUS_ORDER) {
    columns[status].forEach((t, position) => {
      nextById.set(t.id, { ...t, status, position });
    });
  }

  return projectTasks.map(t => nextById.get(t.id) ?? t);
}
