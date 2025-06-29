
'use client';

import type { Task } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isValid } from 'date-fns';
import { useMemo } from 'react';

const FramerCard = motion(Card);

const timeToMinutes = (time: string): number => {
  if (!time || !time.includes(':')) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const priorityStyles = {
  high: 'bg-red-200 text-red-900 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800/50',
  medium: 'bg-yellow-200 text-yellow-900 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800/50',
  low: 'bg-green-200 text-green-900 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800/50',
};

// The component now accepts a list of Task objects that have been scheduled for a specific day
type ScheduleCalendarProps = {
  schedule: (Task & { name: string })[]; 
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

  const laidOutSchedule = useMemo(() => {
    if (!schedule) return [];

    const events = schedule
      .map(item => ({
        ...item,
        start: parseISO(item.startTime!),
        end: parseISO(item.endTime!),
      }))
      .filter(e => isValid(e.start) && isValid(e.end));
    
    events.sort((a, b) => a.start.getTime() - b.start.getTime() || b.end.getTime() - a.end.getTime());

    const layoutData = events.map(e => ({ ...e, layout: { columns: 1, column: 0, zIndex: 1 } }));

    for (let i = 0; i < layoutData.length; i++) {
        const currentEvent = layoutData[i];
        const collisions = [];

        for (let j = 0; j < layoutData.length; j++) {
            const otherEvent = layoutData[j];
            if (currentEvent.start < otherEvent.end && currentEvent.end > otherEvent.start) {
                if (!collisions.some(c => c.id === otherEvent.id)) {
                    collisions.push(otherEvent);
                }
            }
        }

        if (collisions.length > 1) {
            collisions.sort((a,b) => a.start.getTime() - b.start.getTime());
            
            const eventColumns: typeof collisions[][] = [];

            collisions.forEach(event => {
                let placed = false;
                for (const col of eventColumns) {
                    if (col[col.length - 1].end.getTime() <= event.start.getTime()) {
                        col.push(event);
                        const originalEvent = layoutData.find(e => e.id === event.id)!;
                        originalEvent.layout.column = eventColumns.indexOf(col);
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    const originalEvent = layoutData.find(e => e.id === event.id)!;
                    originalEvent.layout.column = eventColumns.length;
                    eventColumns.push([event]);
                }
            });

            collisions.forEach(event => {
                const originalEvent = layoutData.find(e => e.id === event.id)!;
                originalEvent.layout.columns = eventColumns.length;
                originalEvent.layout.zIndex = originalEvent.layout.column + 1;
            });
        }
    }
    return layoutData;
  }, [schedule]);


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
          {laidOutSchedule.map((item, index) => {
            const startDate = item.start;
            const endDate = item.end;
            
            const itemStartMinutes = startDate.getHours() * 60 + startDate.getMinutes();
            const itemEndMinutes = endDate.getHours() * 60 + endDate.getMinutes();
            const itemDuration = itemEndMinutes - itemStartMinutes;

            const top = ((itemStartMinutes - startMinutes) / 60) * HOUR_HEIGHT_REM;
            const height = (itemDuration / 60) * HOUR_HEIGHT_REM;

            if (itemStartMinutes < startMinutes || itemEndMinutes > endMinutes || itemDuration <=0) return null;

            const { columns, column, zIndex } = item.layout;
            const widthPercent = 100 / columns;
            const leftPercent = column * widthPercent;

            return (
              <FramerCard
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'absolute p-3 text-sm rounded-lg shadow-lg transition-all duration-300 overflow-hidden',
                  item.isCompleted ? 'bg-green-100 dark:bg-green-900/50 border-green-300' : 'bg-card',
                )}
                style={{
                  top: `${top}rem`,
                  height: `${height}rem`,
                  left: `calc(${leftPercent}% + 2px)`,
                  width: `calc(${widthPercent}% - 4px)`,
                  zIndex: zIndex,
                }}
              >
                <div className="flex justify-between items-start h-full">
                  <div className="flex-1 overflow-hidden pr-2 flex flex-col justify-between h-full">
                    <div>
                      <p className={cn('font-semibold leading-tight', item.isCompleted && 'line-through text-muted-foreground')}>
                        {item.name}
                      </p>
                      <p className={cn('text-xs text-muted-foreground', item.isCompleted && 'line-through')}>
                        {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
                      </p>
                    </div>
                     <Badge variant="outline" className={cn("capitalize w-fit text-xs mt-1", priorityStyles[item.priority])}>
                        {item.priority}
                    </Badge>
                  </div>
                  <Checkbox
                    checked={item.isCompleted}
                    onCheckedChange={() => onToggleComplete(item.id)}
                    disabled={item.isCompleted}
                    aria-label={item.isCompleted ? `Task "${item.name}" is complete` : `Mark "${item.name}" as complete`}
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
