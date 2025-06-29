'use client';

import { useState } from 'react';
import type { Task } from '@/lib/types';
import TaskItem from './TaskItem';
import { ScrollArea } from '@/components/ui/scroll-area';

type TaskListProps = {
  tasks: Task[];
  onDeleteTask: (id: string) => void;
  onReorderTasks: (tasks: Task[]) => void;
};

export default function TaskList({ tasks, onDeleteTask, onReorderTasks }: TaskListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const reorderedTasks = [...tasks];
    const [draggedItem] = reorderedTasks.splice(draggedIndex, 1);
    reorderedTasks.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    onReorderTasks(reorderedTasks);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="flex h-full flex-col">
      <h3 className="mb-2 shrink-0 text-lg font-medium">Your Tasks</h3>
      <ScrollArea className="flex-1">
        <ul className="space-y-2 pr-4 h-full">
          {tasks.length === 0 ? (
            <li className="flex h-full items-center justify-center rounded-lg border-2 border-dashed text-center">
              <div>
                  <p className="text-muted-foreground">Your task list is empty.</p>
                  <p className="text-sm text-muted-foreground/80">Add a task above to get started.</p>
              </div>
            </li>
          ) : (
            tasks.map((task, index) => (
              <li 
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`transition-opacity ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}`}
              >
                <TaskItem task={task} onDelete={() => onDeleteTask(task.id)} />
              </li>
            ))
          )}
        </ul>
      </ScrollArea>
    </div>
  );
}
