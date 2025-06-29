import type { ScheduleItem as ScheduleItemType } from '@/lib/types';
import ScheduleItem from './ScheduleItem';
import { useMemo } from 'react';

type ScheduleViewProps = {
  schedule: ScheduleItemType[];
  onToggleComplete: (id: string) => void;
};

export default function ScheduleView({ schedule, onToggleComplete }: ScheduleViewProps) {
  const progressPercentage = useMemo(() => {
    const completedCount = schedule.filter(item => item.isCompleted).length;
    if (completedCount === 0) return 0;
    if (completedCount === schedule.length) return 100;

    const lastCompletedIndex = schedule.findLastIndex(item => item.isCompleted);
    if (lastCompletedIndex === -1) return 0;

    // We want the progress bar to fill up to the middle of the last completed item.
    const progress = ((lastCompletedIndex + 0.5) / schedule.length) * 100;
    return Math.min(progress, 100);

  }, [schedule]);
  
  return (
    <div className="mt-6">
      <div className="relative pl-8">
        {/* Timeline track */}
        <div className="absolute left-[10px] top-5 h-[calc(100%-2.5rem)] w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
        {/* Progress track */}
        <div 
          className="absolute left-[10px] top-5 w-0.5 bg-primary transition-all duration-500 ease-out" 
          style={{ height: `calc(${progressPercentage}% - 1rem)` }}
          aria-hidden="true" 
        />
        <div className="space-y-4">
          {schedule.map((item) => (
            <ScheduleItem
              key={item.id}
              item={item}
              onToggleComplete={() => onToggleComplete(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
