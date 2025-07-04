import type { ProposedTask } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';

type ProposedScheduleItemProps = {
  task: ProposedTask;
};

const priorityStyles = {
  high: 'bg-red-200 text-red-900 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800/50',
  medium: 'bg-yellow-200 text-yellow-900 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800/50',
  low: 'bg-green-200 text-green-900 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800/50',
};

export default function ProposedScheduleItem({ task }: ProposedScheduleItemProps) {
  const startDate = parseISO(task.startTime);
  const endDate = parseISO(task.endTime);
  const areDatesValid = isValid(startDate) && isValid(endDate);

  return (
    <Card className="p-2 bg-secondary/30">
        <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-card-foreground text-sm">{task.title}</p>
                {areDatesValid ? (
                  <p className="text-xs text-muted-foreground">
                      {format(startDate, "E, MMM d, h:mma")} - {format(endDate, "h:mma")}
                  </p>
                ) : (
                  <p className="text-sm text-destructive">Invalid time from AI</p>
                )}
            </div>
            <Badge variant="outline" className={cn("capitalize flex-shrink-0 text-xs", priorityStyles[task.priority])}>
                {task.priority}
            </Badge>
        </div>
    </Card>
  );
}
