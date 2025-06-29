
'use client';

import type { Task, BlockedTime } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isValid, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { useMemo } from 'react';
import { CalendarDays } from 'lucide-react';

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
  blockedTimes: BlockedTime[];
  onToggleComplete: (id: string) => void;
  startTime: string;
  endTime: string;
  viewedDate: Date;
  isLoading: boolean;
  hasTasks: boolean;
};

export default function ScheduleCalendar({
  schedule,
  blockedTimes,
  onToggleComplete,
  startTime,
  endTime,
  viewedDate,
  isLoading,
  hasTasks,
}: ScheduleCalendarProps) {
  
  const startHour = Math.floor(timeToMinutes(startTime) / 60);

  const [rawEndHour, rawEndMinutes] = endTime.split(':').map(Number);
  let endHour = rawEndHour;

  if (rawEndMinutes > 0) {
    endHour = rawEndHour + 1;
  }
  if (rawEndHour === 0 && rawEndMinutes === 0) {
    endHour = 24;
  }

  // Use the hour boundaries for all calendar calculations to ensure the view
  // aligns perfectly with the hourly grid, regardless of the minutes in wake/sleep times.
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;

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

  const blockedEvents = useMemo(() => {
    return blockedTimes.map(bt => {
        const [startH, startM] = bt.startTime.split(':').map(Number);
        const [endH, endM] = bt.endTime.split(':').map(Number);

        const start = setMilliseconds(setSeconds(setMinutes(setHours(viewedDate, startH), startM), 0), 0);
        const end = setMilliseconds(setSeconds(setMinutes(setHours(viewedDate, endH), endM), 0), 0);
        
        return { ...bt, start, end };
    });
  }, [blockedTimes, viewedDate]);


  if (startHour >= endHour) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Please provide a valid time range.
      </div>
    );
  }

  const totalHours = endHour - startHour;
  const hourSegments = Array.from({ length: totalHours }, (_, i) => startHour + i);
  const HOUR_HEIGHT_REM = 6; // h-24

  if (!isLoading && schedule.length === 0 && !hasTasks) {
    return (
        <div className="flex items-center justify-center h-full border-2 border-dashed rounded-lg">
          <div className="text-center text-muted-foreground">
            <CalendarDays className="mx-auto h-12 w-12" />
            <p className="mt-4">Your schedule will appear here.</p>
            <p className="text-sm">Add some tasks and click Generate.</p>
          </div>
        </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto rounded-lg border bg-secondary/20">
      <div
        className="relative grid grid-cols-[3.5rem,1fr]"
        style={{ height: `${totalHours * HOUR_HEIGHT_REM}rem` }}
      >
        {/* Time Column */}
        <div className="relative border-b-2 border-slate-200 dark:border-slate-700">
          {hourSegments.map((hour, index) => (
            <div
              key={hour}
              className="text-right pr-2 border-t-2 border-slate-200 dark:border-slate-700"
              style={{ height: `${HOUR_HEIGHT_REM}rem` }}
            >
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 -translate-y-1/2 relative top-0">
                {hour % 12 === 0 ? 12 : hour % 12}{' '}
                <span className="text-xs">{hour < 12 || hour === 24 ? 'AM' : 'PM'}</span>
              </span>
            </div>
          ))}
          <div className="absolute bottom-0 right-0 w-full text-right pr-2 translate-y-1/2">
             <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {endHour % 12 === 0 ? 12 : endHour % 12}{' '}
                <span className="text-xs">{endHour < 12 || endHour === 24 ? 'AM' : 'PM'}</span>
            </span>
          </div>
        </div>

        {/* Schedule Column */}
        <div className="relative border-b-2 border-slate-200 dark:border-slate-700">
          {/* Hour lines */}
          {hourSegments.map((hour, index) => (
            <div
              key={`line-${hour}`}
              className="absolute w-full border-t-2 border-slate-200 dark:border-slate-700"
              style={{ top: `${index * HOUR_HEIGHT_REM}rem` }}
            />
          ))}

          {/* Blocked Times */}
          {blockedEvents.map((item) => {
            const itemStart = item.start;
            const itemEnd = item.end;
            
            const itemStartMinutes = itemStart.getHours() * 60 + itemStart.getMinutes();
            const itemEndMinutes = itemEnd.getHours() * 60 + itemEnd.getMinutes();
            
            if (itemEndMinutes <= startMinutes || itemStartMinutes >= endMinutes) return null;

            const visibleStartMinutes = Math.max(itemStartMinutes, startMinutes);
            const visibleEndMinutes = Math.min(itemEndMinutes, endMinutes);
            const visibleDuration = visibleEndMinutes - visibleStartMinutes;

            if (visibleDuration <= 0) return null;

            const top = ((visibleStartMinutes - startMinutes) / 60) * HOUR_HEIGHT_REM;
            const height = (visibleDuration / 60) * HOUR_HEIGHT_REM;

            return (
              <div
                key={item.id}
                className={cn(
                  'absolute w-full p-2 text-xs rounded-lg overflow-hidden flex items-center justify-center',
                  'bg-primary/10 dark:bg-primary/20 border-y border-dashed border-primary/20 dark:border-primary/40'
                )}
                style={{
                  top: `${top}rem`,
                  height: `${height}rem`,
                  zIndex: 0,
                }}
              >
                <span className="font-semibold text-muted-foreground">{item.title}</span>
              </div>
            );
          })}

          {/* Schedule Items */}
          {laidOutSchedule.map((item, index) => {
            const startDate = item.start;
            const endDate = item.end;
            
            const itemStartMinutes = startDate.getHours() * 60 + startDate.getMinutes();
            const itemEndMinutes = endDate.getHours() * 60 + endDate.getMinutes();

            if (itemEndMinutes <= startMinutes || itemStartMinutes >= endMinutes) return null;

            const visibleStartMinutes = Math.max(itemStartMinutes, startMinutes);
            const visibleEndMinutes = Math.min(itemEndMinutes, endMinutes);
            const visibleDuration = visibleEndMinutes - visibleStartMinutes;
            
            if (visibleDuration <= 0) return null;
            
            const top = ((visibleStartMinutes - startMinutes) / 60) * HOUR_HEIGHT_REM;
            const height = (visibleDuration / 60) * HOUR_HEIGHT_REM;

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
                  item.isCompleted ? 'bg-green-100/80 dark:bg-green-800/30 border border-green-200 dark:border-green-700/50' : 'bg-card dark:bg-slate-800',
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
                      <p className={cn('font-semibold leading-tight', item.isCompleted && 'line-through text-green-900/70 dark:text-green-300/80')}>
                        {item.name}
                      </p>
                      <p className={cn('text-xs', item.isCompleted ? 'line-through text-green-800/70 dark:text-green-400/80' : 'text-muted-foreground')}>
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

           {/* Empty state message if no tasks for this day */}
           {laidOutSchedule.length === 0 && !isLoading && hasTasks && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-muted-foreground">
                  <p className="mt-4 font-semibold">Nothing scheduled for this day</p>
                  <p className="text-sm">The AI kept this day clear.</p>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
