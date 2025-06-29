'use client';

import type { Task } from '@/lib/types';
import TaskItem from './TaskItem';
import { ScrollArea } from '@/components/ui/scroll-area';

type TaskListProps = {
  tasks: Task[];
  onDeleteTask: (id: string) => void;
};

export default function TaskList({ tasks, onDeleteTask }: TaskListProps) {
  const tasksToShow = tasks.filter(task => !task.archived);

  return (
    <div className="flex h-full flex-col">
      <h3 className="mb-2 shrink-0 text-base font-semibold">Your Tasks</h3>
      <div className="flex-1 min-h-0">
        {tasksToShow.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed">
              <div className="text-center">
              <p className="text-muted-foreground">Your task list is empty.</p>
              <p className="text-sm text-muted-foreground/80">Add a task above to get started.</p>
              </div>
          </div>
        ) : (
          <ScrollArea className="h-full pr-4">
              <ul className="space-y-2">
              {tasksToShow.map((task) => (
                  <li key={task.id}>
                  <TaskItem task={task} onDelete={() => onDeleteTask(task.id)} />
                  </li>
              ))}
              </ul>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
