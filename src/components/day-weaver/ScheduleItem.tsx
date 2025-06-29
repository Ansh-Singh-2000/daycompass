import type { ScheduleItem } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';
import { Card } from '../ui/card';

// Lazy load framer-motion
const FramerCard = motion(Card);

type ScheduleItemProps = {
  item: ScheduleItem;
  onToggleComplete: () => void;
};

export default function ScheduleItem({ item, onToggleComplete }: ScheduleItemProps) {
  const { name, startTime, endTime, isCompleted } = item;
  
  return (
    <div className="relative flex items-start gap-4">
      <div className="flex flex-col items-center mt-1">
        <div 
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full border-2 bg-background',
            isCompleted ? 'border-primary' : 'border-gray-300 dark:border-gray-600'
          )}
          aria-hidden="true"
        >
          {isCompleted && <Check className="h-4 w-4 text-primary" />}
        </div>
      </div>
      <FramerCard
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "w-full transition-all duration-300",
          isCompleted ? "bg-muted/50 border-dashed" : "bg-card"
        )}
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <label
              htmlFor={`task-${item.id}`}
              className={cn(
                'font-medium text-foreground transition-colors',
                isCompleted ? 'text-muted-foreground line-through' : ''
              )}
            >
              {name}
            </label>
            <Checkbox
              id={`task-${item.id}`}
              checked={isCompleted}
              onCheckedChange={onToggleComplete}
              aria-label={`Mark "${name}" as ${isCompleted ? 'incomplete' : 'complete'}`}
            />
          </div>
          <p
            className={cn(
              'text-sm text-muted-foreground transition-colors mt-1',
              isCompleted ? 'line-through' : ''
            )}
          >
            {startTime} - {endTime}
          </p>
        </div>
      </FramerCard>
    </div>
  );
}
