'use client';

import type { ScheduleItem } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const FramerCard = motion(Card);

const timeToMinutes = (time: string): number => {
  if (!time || !time.includes(':')) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

type ScheduleCalendarProps = {
  schedule: ScheduleItem[];
  onToggleComplete: (id: string) => void;
  startTime: string;
  endTime: string;
};

export default function ScheduleCalendar({
  schedule,
  onToggleComplete,
  startTime,
  endTime,
}: ScheduleCalendarProps) {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  const startHour = Math.floor(startMinutes / 60);
  const endHour = Math.ceil(endMinutes / 60);

  if (startHour >= endHour) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Please provide a valid time range.
      </div>
    );
  }

  const hourSegments = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const HOUR_HEIGHT_REM = 6; // h-24

  return (
    <div className="h-full overflow-y-auto rounded-lg border bg-secondary/20">
      <div
        className="relative grid grid-cols-[4rem,1fr]"
        style={{ height: `${hourSegments.length * HOUR_HEIGHT_REM}rem` }}
      >
        {/* Time Column */}
        <div className="border-r">
          {hourSegments.map((hour) => (
            <div
              key={hour}
              className="text-right pr-2 pt-1 border-b"
              style={{ height: `${HOUR_HEIGHT_REM}rem` }}
            >
              <span className="text-sm font-medium text-muted-foreground -translate-y-1/2 relative top-0">
                {hour % 12 === 0 ? 12 : hour % 12}{' '}
                <span className="text-xs">{hour < 12 || hour === 24 ? 'AM' : 'PM'}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Schedule Column */}
        <div className="relative">
          {/* Hour lines */}
          {hourSegments.map((hour, index) => (
            index > 0 && <div
              key={`line-${hour}`}
              className="absolute w-full border-t border-dashed"
              style={{ top: `${index * HOUR_HEIGHT_REM}rem` }}
            />
          ))}

          {/* Schedule Items */}
          {schedule.map((item, index) => {
            const itemStartMinutes = timeToMinutes(item.startTime);
            const itemEndMinutes = timeToMinutes(item.endTime);
            const itemDuration = itemEndMinutes - itemStartMinutes;

            const top = ((itemStartMinutes - startMinutes) / 60) * HOUR_HEIGHT_REM;
            const height = (itemDuration / 60) * HOUR_HEIGHT_REM;

            if (itemStartMinutes < startMinutes || itemEndMinutes > endMinutes || itemDuration <=0) return null;

            return (
              <FramerCard
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'absolute left-2 right-2 p-3 text-sm rounded-lg shadow-lg transition-all duration-300 overflow-hidden',
                  item.isCompleted ? 'bg-green-100 dark:bg-green-900/50 border-green-300' : 'bg-card',
                )}
                style={{
                  top: `${top}rem`,
                  height: `${height}rem`,
                }}
              >
                <div className="flex justify-between items-start h-full">
                  <div className="flex-1 overflow-hidden pr-2">
                    <p className={cn('font-semibold leading-tight', item.isCompleted && 'line-through text-muted-foreground')}>
                      {item.name}
                    </p>
                    <p className={cn('text-xs text-muted-foreground', item.isCompleted && 'line-through')}>
                      {item.startTime} - {item.endTime}
                    </p>
                  </div>
                  <Checkbox
                    checked={item.isCompleted}
                    onCheckedChange={() => onToggleComplete(item.id)}
                    aria-label={`Mark "${item.name}" as ${item.isCompleted ? 'incomplete' : 'complete'}`}
                  />
                </div>
              </FramerCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
