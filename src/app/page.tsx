
'use client';

import { useState, useEffect, useRef } from 'react';
import type { Task, ScheduleItem, BlockedTime, ProposedTask, TaskPriority } from '@/lib/types';
import { createSchedule, refineSchedule } from './actions';
import { useToast } from "@/hooks/use-toast";
import Header from '@/components/day-weaver/Header';
import TaskForm from '@/components/day-weaver/TaskForm';
import TaskList from '@/components/day-weaver/TaskList';
import ScheduleControls from '@/components/day-weaver/ScheduleControls';
import ScheduleCalendar from '@/components/day-weaver/ScheduleCalendar';
import SettingsDialog from '@/components/day-weaver/SettingsDialog';
import AdjustScheduleDialog from '@/components/day-weaver/AdjustScheduleDialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, format, parseISO, isValid } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { ToastAction } from '@/components/ui/toast';
import confetti from 'canvas-confetti';

const today = new Date();
const initialTasks: Task[] = [
  { id: uuidv4(), title: 'Physics - Kinematics Problem Set', estimatedTime: 120, priority: 'high', deadline: addDays(today, 3) },
  { id: uuidv4(), title: 'Chemistry - Chemical Bonding Revision', estimatedTime: 90, priority: 'medium', deadline: addDays(today, 5) },
  { id: uuidv4(), title: 'Maths - Integral Calculus Practice', estimatedTime: 120, priority: 'high', deadline: addDays(today, 2) },
  { id: uuidv4(), title: 'JEE Mock Test - Paper 1', estimatedTime: 180, priority: 'high', deadline: addDays(today, 1) },
  { id: uuidv4(), title: 'Mock Test Analysis', estimatedTime: 60, priority: 'medium', deadline: addDays(today, 1) },
  { id: uuidv4(), title: 'Organic Chemistry - Reaction Mechanisms', estimatedTime: 75, priority: 'high', deadline: addDays(today, 0) },
  { id: uuidv4(), title: 'Physics - Rotational Motion', estimatedTime: 90, priority: 'medium', deadline: addDays(today, 4) },
];

const initialBlockedTimes: BlockedTime[] = [
    { id: 'bt-1', title: 'Lunch Break', startTime: '13:00', endTime: '14:00' },
    { id: 'bt-2', title: 'Evening Walk', startTime: '18:00', endTime: '18:30' },
];

export default function Home() {
  const { toast } = useToast();

  // --- STATE PERSISTENCE & HYDRATION ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window === 'undefined') return initialTasks;
    try {
        const saved = window.localStorage.getItem('day-weaver-tasks');
        if (saved) {
            const parsed = JSON.parse(saved);
            return parsed.map((t: Task & { deadline: string | undefined }) => ({ ...t, deadline: t.deadline ? parseISO(t.deadline) : undefined }));
        }
    } catch (e) { console.error("Failed to load tasks from localStorage", e); }
    return initialTasks;
  });

  const [schedules, setSchedules] = useState<Record<string, ScheduleItem[]>>(() => {
    if (typeof window === 'undefined') return {};
    try {
        const saved = window.localStorage.getItem('day-weaver-schedules');
        return saved ? JSON.parse(saved) : {};
    } catch (e) { console.error("Failed to load schedules from localStorage", e); }
    return {};
  });

  const [startTime, setStartTime] = useState<string>(() => {
    if (typeof window === 'undefined') return '09:00';
    return window.localStorage.getItem('day-weaver-startTime') || '09:00';
  });

  const [endTime, setEndTime] = useState<string>(() => {
    if (typeof window === 'undefined') return '21:00';
    return window.localStorage.getItem('day-weaver-endTime') || '21:00';
  });

  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>(() => {
    if (typeof window === 'undefined') return initialBlockedTimes;
    try {
        const saved = window.localStorage.getItem('day-weaver-blockedTimes');
        return saved ? JSON.parse(saved) : initialBlockedTimes;
    } catch (e) { console.error("Failed to load blocked times from localStorage", e); }
    return initialBlockedTimes;
  });

  const [model, setModel] = useState<string>(() => {
    if (typeof window === 'undefined') return 'llama3-8b-8192';
    return window.localStorage.getItem('day-weaver-model') || 'llama3-8b-8192';
  });

  const [points, setPoints] = useState<{gains: number, losses: number}>(() => {
    if (typeof window === 'undefined') return { gains: 0, losses: 0 };
    try {
        const saved = window.localStorage.getItem('day-weaver-points');
        return saved ? JSON.parse(saved) : { gains: 0, losses: 0 };
    } catch (e) { console.error("Failed to load points", e); }
    return { gains: 0, losses: 0 };
  });

  // Transient state (not persisted)
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [viewedDate, setViewedDate] = useState(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [proposedSchedule, setProposedSchedule] = useState<ProposedTask[]>([]);
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [timezone, setTimezone] = useState('UTC');
  
  const schedulesRef = useRef(schedules);

  // --- EFFECTS ---

  // Save state to localStorage whenever it changes
  useEffect(() => { localStorage.setItem('day-weaver-tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('day-weaver-schedules', JSON.stringify(schedules)); }, [schedules]);
  useEffect(() => { localStorage.setItem('day-weaver-startTime', startTime); }, [startTime]);
  useEffect(() => { localStorage.setItem('day-weaver-endTime', endTime); }, [endTime]);
  useEffect(() => { localStorage.setItem('day-weaver-blockedTimes', JSON.stringify(blockedTimes)); }, [blockedTimes]);
  useEffect(() => { localStorage.setItem('day-weaver-model', model); }, [model]);
  useEffect(() => { localStorage.setItem('day-weaver-points', JSON.stringify(points)); }, [points]);
  
  // Keep a ref to the latest schedules for callbacks
  useEffect(() => {
    schedulesRef.current = schedules;
  }, [schedules]);

  // Handle day change logic on initial app load
  useEffect(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const lastVisit = localStorage.getItem('day-weaver-last-visit');

    if (lastVisit && lastVisit < todayStr) {
        const tasksToRemove = new Set<string>();

        Object.keys(schedules).forEach(dateKey => {
            if (dateKey < todayStr) {
                schedules[dateKey].forEach(item => tasksToRemove.add(item.id));
            }
        });

        if (tasksToRemove.size > 0) {
            setTasks(prevTasks => prevTasks.filter(task => !tasksToRemove.has(task.id)));
            toast({
                title: "A New Day!",
                description: `Removed ${tasksToRemove.size} past tasks from your inbox. Your schedule history is preserved on the calendar.`,
            });
        }
    }

    localStorage.setItem('day-weaver-last-visit', todayStr);
  }, []); // Runs once on mount, client-side only

  // Set timezone on mount
  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  // Check for overdue tasks
  useEffect(() => {
    const checkOverdueTasks = () => {
        const now = new Date();
        const todayKey = format(now, 'yyyy-MM-dd');

        Object.entries(schedules).forEach(([dateKey, scheduleItems]) => {
            if (dateKey > todayKey) return;

            scheduleItems.forEach(item => {
                const originalTask = tasks.find(t => t.id === item.id);
                if (!originalTask || originalTask.overdueNotified || item.isCompleted) {
                    return;
                }
                
                try {
                    const [endHours, endMinutes] = item.endTime.split(':').map(Number);
                    const itemEndDate = parseISO(dateKey);
                    itemEndDate.setHours(endHours, endMinutes, 0, 0);

                    if (now > itemEndDate) {
                        toast({
                            variant: "destructive",
                            title: "Task Overdue!",
                            description: `"${item.name}" is past its scheduled time. Did you complete it?`,
                            duration: Infinity,
                            action: (
                                <ToastAction altText="Mark as done" onClick={() => handleToggleComplete(item.id)}>
                                    Yes, I did!
                                </ToastAction>
                            ),
                            onOpenChange: (open) => {
                                if (!open) {
                                    const currentSchedules = schedulesRef.current;
                                    const currentItem = currentSchedules[dateKey]?.find((i: ScheduleItem) => i.id === item.id);
                                    
                                    if (currentItem && !currentItem.isCompleted) {
                                        setPoints(p => ({...p, losses: p.losses + 1}));
                                    }

                                    setTasks(prevTasks => prevTasks.map(t =>
                                        t.id === item.id ? { ...t, overdueNotified: true } : t
                                    ));
                                }
                            }
                        });
                        
                        setTasks(prevTasks => prevTasks.map(t =>
                            t.id === item.id ? { ...t, overdueNotified: true } : t
                        ));
                    }
                } catch(e) {
                    console.error("Error checking overdue task, likely malformed time", item);
                }
            });
        });
    };

    const intervalId = setInterval(checkOverdueTasks, 60000);
    checkOverdueTasks(); // Run on mount as well

    return () => clearInterval(intervalId);
  }, [schedules, tasks, toast]);

  const dateKey = format(viewedDate, 'yyyy-MM-dd');
  const currentSchedule = schedules[dateKey] || [];
  const isLoading = isGenerating || isAdjusting;

  const runConfetti = () => {
    confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
    });
  };

  const handleAddTask = (task: Omit<Task, 'id'>) => {
    setTasks(prev => [...prev, { ...task, id: uuidv4() }]);
    setSchedules({}); 
    setReasoning(null);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
    
    setSchedules(prevSchedules => {
      const newSchedules = { ...prevSchedules };
      for (const dateKey in newSchedules) {
        newSchedules[dateKey] = newSchedules[dateKey].filter(item => item.id !== id);
        if (newSchedules[dateKey].length === 0) {
          delete newSchedules[dateKey];
        }
      }
      return newSchedules;
    });

    setReasoning(null);
  };

  const handleReorderTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    setSchedules({});
    setReasoning(null);
  };
  
  const handlePrevDay = () => {
    setViewedDate(current => addDays(current, -1));
  };

  const handleNextDay = () => {
    setViewedDate(current => addDays(current, 1));
  };

  const handleGenerateSchedule = async () => {
    if (tasks.length === 0) {
      toast({
        variant: "destructive",
        title: "No tasks to schedule",
        description: "Please add at least one task before generating a schedule.",
      });
      return;
    }
    
    setIsGenerating(true);
    setReasoning(null);

    const input = {
      model,
      tasks: tasks.map(t => ({
          ...t,
          estimatedTime: t.estimatedTime,
          deadline: t.deadline ? format(t.deadline, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX") : undefined
      })),
      blockedTimes: blockedTimes.map(({ id, ...rest }) => rest),
      timeConstraints: { startTime, endTime },
      currentDateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"),
      startDate: format(new Date(), 'yyyy-MM-dd'),
      timezone,
    };

    const result = await createSchedule(input);
    
    if (result.success && result.data) {
        const enrichedProposedSchedule = result.data.scheduledTasks.map(scheduledTask => {
          const originalTask = tasks.find(t => t.id === scheduledTask.id);
          return {
              ...scheduledTask,
              priority: originalTask?.priority || 'medium',
          };
        });
        setProposedSchedule(enrichedProposedSchedule);
        setReasoning(result.data.reasoning);
        setIsAdjustDialogOpen(true);
    } else {
      toast({
        variant: "destructive",
        title: "Scheduling Failed",
        description: result.error || "An unknown error occurred.",
      });
    }
    setIsGenerating(false);
  };

  const handleApplySchedule = (finalSchedule: ProposedTask[]) => {
    const newSchedules: Record<string, ScheduleItem[]> = {};
    const invalidTasks: string[] = [];
        
    for (const scheduledTask of finalSchedule) {
      try {
        const startDate = parseISO(scheduledTask.startTime);
        const endDate = parseISO(scheduledTask.endTime);

        if (!isValid(startDate) || !isValid(endDate)) {
          throw new Error('Invalid date format');
        }

        const dateKey = format(startDate, 'yyyy-MM-dd');

        if (!newSchedules[dateKey]) {
            newSchedules[dateKey] = [];
        }

        newSchedules[dateKey].push({
            id: scheduledTask.id,
            name: scheduledTask.title,
            startTime: format(startDate, 'HH:mm'),
            endTime: format(endDate, 'HH:mm'),
            isCompleted: false,
            priority: scheduledTask.priority,
        });
      } catch (error) {
        console.error(`Skipping task with invalid date: "${scheduledTask.title}"`, error);
        invalidTasks.push(scheduledTask.title);
      }
    }
    
    Object.values(newSchedules).forEach(day => day.sort((a,b) => a.startTime.localeCompare(b.startTime)));

    setSchedules(newSchedules);
    setReasoning(null);

    const firstDateStr = Object.keys(newSchedules).sort()[0];
    if (firstDateStr) {
        setViewedDate(parseISO(firstDateStr));
    }

    setIsAdjustDialogOpen(false);
    setProposedSchedule([]);

    if (invalidTasks.length > 0) {
      toast({
        variant: "destructive",
        title: "Schedule Partially Applied",
        description: `The AI returned invalid data for: ${invalidTasks.join(', ')}.`,
      });
    } else {
      toast({
          title: "Schedule Applied!",
          description: "Your new schedule is ready.",
      });
    }
  }

  const handleAdjustSchedule = async (userRequest: string) => {
    setIsAdjusting(true);

    const input = {
      model,
      tasks: tasks.map(t => ({
          ...t,
          estimatedTime: t.estimatedTime,
          deadline: t.deadline ? format(t.deadline, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX") : undefined
      })),
      blockedTimes: blockedTimes.map(({ id, ...rest }) => rest),
      timeConstraints: { startTime, endTime },
      currentDateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"),
      startDate: format(new Date(), 'yyyy-MM-dd'),
      currentScheduledTasks: proposedSchedule.map(({priority, ...rest}) => rest),
      userRequest: userRequest,
      timezone,
    };

    const result = await refineSchedule(input);

    if (result.success && result.data) {
        const enrichedProposedSchedule = result.data.scheduledTasks.map(scheduledTask => {
          const originalTask = tasks.find(t => t.id === scheduledTask.id);
          return {
              ...scheduledTask,
              priority: originalTask?.priority || 'medium',
          };
        });
        setProposedSchedule(enrichedProposedSchedule);
        setReasoning(result.data.reasoning);
    } else {
       toast({
        variant: "destructive",
        title: "Adjustment Failed",
        description: result.error || "Could not adjust the schedule.",
      });
    }

    setIsAdjusting(false);
  };

  const handleToggleComplete = (id: string) => {
    let wasIncomplete = false;

    setSchedules(prev => {
        const newSchedules = { ...prev };
        
        for (const dateKey in newSchedules) {
            const itemIndex = newSchedules[dateKey].findIndex(item => item.id === id);
            if (itemIndex > -1) {
                const item = newSchedules[dateKey][itemIndex];
                if (!item.isCompleted) {
                    wasIncomplete = true;
                }
                newSchedules[dateKey][itemIndex] = { ...item, isCompleted: !item.isCompleted };
                break;
            }
        }
        return newSchedules;
    });

    if (wasIncomplete) {
        setPoints(p => ({ ...p, gains: p.gains + 1 }));
        runConfetti();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <SettingsDialog 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        blockedTimes={blockedTimes}
        setBlockedTimes={setBlockedTimes}
        model={model}
        setModel={setModel}
        startTime={startTime}
        onStartTimeChange={setStartTime}
        endTime={endTime}
        onEndTimeChange={setEndTime}
      />
      <AdjustScheduleDialog
        isOpen={isAdjustDialogOpen}
        onClose={() => setIsAdjustDialogOpen(false)}
        proposedSchedule={proposedSchedule}
        reasoning={reasoning}
        onAdjust={handleAdjustSchedule}
        onApply={handleApplySchedule}
        isAdjusting={isAdjusting}
        modelUsed={model}
      />
      <header className="shrink-0 border-b">
        <div className="px-4 lg:px-6 py-3">
          <Header onSettingsClick={() => setIsSettingsOpen(true)} points={points} />
        </div>
      </header>
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 py-4 lg:px-6 lg:py-4 overflow-hidden">
        {/* Left Panel: Task Management */}
        <Card className="lg:col-span-1 flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle>Tasks & Scheduling</CardTitle>
            <CardDescription>Add tasks and generate your AI-powered schedule.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 p-4 pt-0 overflow-hidden">
            <TaskForm onAddTask={handleAddTask} />
            <div className="flex-1 min-h-0">
               <TaskList tasks={tasks} onDeleteTask={handleDeleteTask} onReorderTasks={handleReorderTasks} />
            </div>
          </CardContent>
          <CardFooter className="p-4 border-t">
            <ScheduleControls
              onGenerate={handleGenerateSchedule}
              isLoading={isGenerating}
            />
          </CardFooter>
        </Card>

        {/* Right Panel: Schedule */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Daily Schedule</CardTitle>
              <CardDescription>Your AI-generated plan for the day.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevDay} disabled={isLoading}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-foreground whitespace-nowrap">{format(viewedDate, "PPP")}</span>
              <Button variant="outline" size="icon" onClick={handleNextDay} disabled={isLoading}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 overflow-y-hidden p-4 pt-0">
            <div className="flex-1 relative min-h-0">
              {isGenerating && (
                 <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10 rounded-lg">
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      <p className="text-muted-foreground">Weaving your perfect schedule...</p>
                    </div>
                  </div>
              )}
              {currentSchedule.length > 0 ? (
                  <ScheduleCalendar
                    schedule={currentSchedule}
                    onToggleComplete={handleToggleComplete}
                    startTime={startTime}
                    endTime={endTime}
                  />
                 ) : (
                  !isLoading && (
                    <div className="flex items-center justify-center h-full border-2 border-dashed rounded-lg">
                      <div className="text-center text-muted-foreground">
                        <CalendarDays className="mx-auto h-12 w-12" />
                        <p className="mt-4">
                            {Object.keys(schedules).length > 0 ? "Nothing scheduled for this day." : "Your schedule will appear here."}
                        </p>
                         <p className="text-sm">
                            {Object.keys(schedules).length > 0 ? "The AI kept this day clear." : "Add some tasks and click Generate."}
                        </p>
                      </div>
                    </div>
                  )
                 )
              }
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
