import type { Task } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Clock, BarChart3, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type TaskItemProps = {
  task: Task;
  onDelete: () => void;
};

const priorityStyles = {
  high: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800/50',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800/50',
  low: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800/50',
};

export default function TaskItem({ task, onDelete }: TaskItemProps) {
  return (
    <div className={cn(
        "flex items-center gap-4 p-3 rounded-lg border",
        task.isCompleted 
            ? "bg-green-100/60 dark:bg-green-900/30 border-green-200 dark:border-green-800/50" 
            : task.isMissed
            ? "bg-destructive/10 dark:bg-destructive/20 border-destructive/20 dark:border-destructive/40"
            : "bg-secondary/50"
    )}>
      <div className="flex-grow">
        <p className={cn(
            "font-medium text-foreground",
            (task.isCompleted || task.isMissed) && "line-through text-muted-foreground"
        )}>
            {task.title}
        </p>
        <div className={cn(
            "flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1",
            (task.isCompleted || task.isMissed) && "text-muted-foreground/70"
        )}>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{task.estimatedTime} min</span>
          </div>
          <div className="flex items-center gap-1.5">
             <BarChart3 className="h-3.5 w-3.5"/>
             <Badge variant="outline" className={cn("capitalize", priorityStyles[task.priority])}>
               {task.priority}
             </Badge>
          </div>
          {task.deadline && (
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Due: {format(task.deadline, 'MMM dd')}</span>
            </div>
          )}
           {task.isMissed && (
             <Badge variant="destructive" className="capitalize">Missed</Badge>
          )}
           {task.isCompleted && (
             <Badge variant="outline" className={cn("capitalize", priorityStyles.low)}>Completed</Badge>
          )}
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onDelete} aria-label={`Delete task: ${task.title}`}>
        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
      </Button>
    </div>
  );
}
