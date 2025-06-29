'use client';

import { useRef, useState } from 'react';
import type { Task } from '@/lib/types';
import TaskItem from './TaskItem';

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

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">Your task list is empty.</p>
        <p className="text-sm text-muted-foreground/80">Add a task above to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">Your Tasks</h3>
      <ul className="space-y-2">
        {tasks.map((task, index) => (
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
        ))}
      </ul>
    </div>
  );
}
