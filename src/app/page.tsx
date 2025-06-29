
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getCookie, setCookie } from '@/lib/cookies';
import type { Task, BlockedTime, ProposedTask, TaskPriority } from '@/lib/types';
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
  const actionedToastIds = useRef(new Set<string>());

  // --- STATE PERSISTENCE & HYDRATION ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window === 'undefined') return initialTasks;
    try {
        const saved = getCookie('day-weaver-tasks');
        if (saved) {
            const parsed = JSON.parse(saved);
            return parsed.map((t: Task & { deadline: string | undefined }) => ({ ...t, deadline: t.deadline ? parseISO(t.deadline) : undefined }));
        }
    } catch (e) { console.error("Failed to load tasks from cookies", e); }
    return initialTasks;
  });

  const [startTime, setStartTime] = useState<string>(() => {
    if (typeof window === 'undefined') return '09:00';
    return getCookie('day-weaver-startTime') || '09:00';
  });

  const [endTime, setEndTime] = useState<string>(() => {
    if (typeof window === 'undefined') return '21:00';
    return getCookie('day-weaver-endTime') || '21:00';
  });

  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>(() => {
    if (typeof window === 'undefined') return initialBlockedTimes;
    try {
        const saved = getCookie('day-weaver-blockedTimes');
        return saved ? JSON.parse(saved) : initialBlockedTimes;
    } catch (e) { console.error("Failed to load blocked times from cookies", e); }
    return initialBlockedTimes;
  });

  const [model, setModel] = useState<string>(() => {
    if (typeof window === 'undefined') return 'llama3-8b-8192';
    return getCookie('day-weaver-model') || 'llama3-8b-8192';
  });

  const [points, setPoints] = useState<{gains: number, losses: number}>(() => {
    if (typeof window === 'undefined') return { gains: 0, losses: 0 };
    try {
        const saved = getCookie('day-weaver-points');
        return saved ? JSON.parse(saved) : { gains: 0, losses: 0 };
    } catch (e) { console.error("Failed to load points from cookies", e); }
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
  
  // --- EFFECTS ---

  // Save state to cookies whenever it changes
  useEffect(() => { setCookie('day-weaver-tasks', JSON.stringify(tasks), 365); }, [tasks]);
  useEffect(() => { setCookie('day-weaver-startTime', startTime, 365); }, [startTime]);
  useEffect(() => { setCookie('day-weaver-endTime', endTime, 365); }, [endTime]);
  useEffect(() => { setCookie('day-weaver-blockedTimes', JSON.stringify(blockedTimes), 365); }, [blockedTimes]);
  useEffect(() => { setCookie('day-weaver-model', model, 365); }, [model]);
  useEffect(() => { setCookie('day-weaver-points', JSON.stringify(points), 365); }, [points]);
  
  // Create a ref to hold the latest tasks array for use in callbacks
  const tasksRef = useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Set timezone on mount
  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  // --- DERIVED STATE ---
  const scheduledTasksByDate = useMemo(() => {
    const byDate: Record<string, (Task & { name: string })[]> = {};
    tasks.forEach(task => {
        if (task.startTime && task.endTime) {
            try {
                const startDate = parseISO(task.startTime);
                if (!isValid(startDate)) return;

                const dateKey = format(startDate, 'yyyy-MM-dd');
                if (!byDate[dateKey]) {
                    byDate[dateKey] = [];
                }
                byDate[dateKey].push({ ...task, name: task.title });
            } catch (e) {
                console.error("Error parsing task start time:", task.title, e);
            }
        }
    });
    // Sort each day's schedule
    Object.values(byDate).forEach(day => day.sort((a,b) => a.startTime!.localeCompare(b.startTime!)));
    return byDate;
  }, [tasks]);

  const dateKey = format(viewedDate, 'yyyy-MM-dd');
  const currentSchedule = scheduledTasksByDate[dateKey] || [];
  const isLoading = isGenerating || isAdjusting;
  
  // --- TASK & SCHEDULE LOGIC ---
  const runConfetti = () => {
    confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
    });
  };

  const handleToggleComplete = useCallback((id: string) => {
    const task = tasksRef.current.find(t => t.id === id);
    if (!task || task.isCompleted) {
      return;
    }
  
    runConfetti();
    setPoints(p => ({ ...p, gains: p.gains + 1 }));
  
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === id ? { ...t, isCompleted: true } : t
      )
    );
  }, []);
  
  const handleToastDismiss = useCallback((taskId: string) => {
      if (actionedToastIds.current.has(taskId)) {
        actionedToastIds.current.delete(taskId);
        return;
      }
      const task = tasksRef.current.find(t => t.id === taskId);
      if (task && !task.isCompleted) {
        setPoints(p => ({ ...p, losses: p.losses + 1 }));
      }
  }, []);

  const checkOverdueTasks = useCallback(() => {
    const now = new Date();
    const newlyOverdueTasks: Task[] = [];
    
    tasksRef.current.forEach(task => {
      if (task.endTime && !task.isCompleted && !task.overdueNotified) {
        const itemEndTime = parseISO(task.endTime);
        if (isValid(itemEndTime) && now > itemEndTime) {
          newlyOverdueTasks.push(task);
        }
      }
    });

    if (newlyOverdueTasks.length > 0) {
      const taskIdsToMark = new Set(newlyOverdueTasks.map(t => t.id));
      setTasks(currentTasks => 
        currentTasks.map(t => 
          taskIdsToMark.has(t.id) ? { ...t, overdueNotified: true } : t
        )
      );

      newlyOverdueTasks.forEach((task) => {
        toast({
          variant: 'destructive',
          title: 'Task Overdue!',
          description: `"${task.title}" is past its scheduled time. Did you complete it?`,
          duration: Infinity,
          action: (
            <ToastAction altText="Mark as done" onClick={() => {
              actionedToastIds.current.add(task.id);
              handleToggleComplete(task.id);
            }}>
              Yes, I did!
            </ToastAction>
          ),
          onOpenChange: (open) => {
            if (!open) {
                handleToastDismiss(task.id);
            }
          },
        });
      });
    }
  }, [toast, handleToggleComplete, handleToastDismiss]);

  const checkOverdueTasksRef = useRef(checkOverdueTasks);
  useEffect(() => {
      checkOverdueTasksRef.current = checkOverdueTasks;
  });

  useEffect(() => {
    const check = () => checkOverdueTasksRef.current();
    const initialCheckTimeout = setTimeout(check, 1000); 
    const intervalId = setInterval(check, 60000); 

    return () => {
      clearTimeout(initialCheckTimeout);
      clearInterval(intervalId);
    };
  }, []);


  const handleAddTask = (task: Omit<Task, 'id'>) => {
    const newTask = { ...task, id: uuidv4() };
    setTasks(prev => [...prev, newTask]);
    setReasoning(null);
  };

  const handleDeleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (taskToDelete?.isCompleted) {
        setTasks(currentTasks => 
            currentTasks.map(task => 
                task.id === id ? { ...task, archived: true } : task
            )
        );
    } else {
        setTasks(currentTasks => currentTasks.filter(task => task.id !== id));
    }
    setReasoning(null);
  };

  const handlePrevDay = () => {
    setViewedDate(current => addDays(current, -1));
  };

  const handleNextDay = () => {
    setViewedDate(current => addDays(current, 1));
  };

  const handleGenerateSchedule = async () => {
    const tasksToSchedule = tasks.filter(t => !t.isCompleted);
    if (tasksToSchedule.length === 0) {
      toast({
        variant: "destructive",
        title: "No tasks to schedule",
        description: "Add some tasks or un-complete existing ones.",
      });
      return;
    }
    
    setIsGenerating(true);
    setReasoning(null);

    const input = {
      model,
      tasks: tasksToSchedule.map(t => ({
          id: t.id,
          title: t.title,
          estimatedTime: t.estimatedTime,
          priority: t.priority,
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
    const invalidTasks: string[] = [];
    const scheduledMap = new Map<string, ProposedTask>();
    finalSchedule.forEach(task => {
        if (!isValid(parseISO(task.startTime)) || !isValid(parseISO(task.endTime))) {
            invalidTasks.push(task.title);
        } else {
            scheduledMap.set(task.id, task);
        }
    });

    setTasks(currentTasks => {
        const newScheduleMap = new Map(finalSchedule.map(t => [t.id, t]));

        // Get IDs of tasks that were part of the generation but are not in the final schedule.
        // This means the AI decided to unschedule them.
        const originalUncompletedTasks = currentTasks.filter(t => !t.isCompleted).map(t => t.id);
        const tasksToUnschedule = originalUncompletedTasks.filter(id => !newScheduleMap.has(id));

        return currentTasks.map(task => {
            // Preserve completed tasks as they are.
            if (task.isCompleted) {
                return task;
            }

            // Update tasks that are in the new schedule.
            if (newScheduleMap.has(task.id)) {
                const scheduledInfo = newScheduleMap.get(task.id)!;
                return {
                    ...task,
                    startTime: scheduledInfo.startTime,
                    endTime: scheduledInfo.endTime,
                    isCompleted: false, // Ensure it's not completed
                    overdueNotified: false, // Reset notification status
                };
            }
            
            // Unschedule tasks that were removed by the AI.
            if (tasksToUnschedule.includes(task.id)) {
                 return {
                    ...task,
                    startTime: undefined,
                    endTime: undefined,
                };
            }

            // Return other tasks (like newly added ones) unmodified.
            return task;
        });
    });
    
    setReasoning(null);
    setIsAdjustDialogOpen(false);
    setProposedSchedule([]);

    const firstDateStr = finalSchedule[0]?.startTime;
    if (firstDateStr) {
        setViewedDate(parseISO(firstDateStr));
    }

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

    setTimeout(() => checkOverdueTasksRef.current(), 100);
  }

  const handleAdjustSchedule = async (userRequest: string) => {
    setIsAdjusting(true);

    const tasksToSchedule = tasks.filter(t => !t.isCompleted);

    const input = {
      model,
      tasks: tasksToSchedule.map(t => ({
          id: t.id,
          title: t.title,
          estimatedTime: t.estimatedTime,
          priority: t.priority,
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
               <TaskList tasks={tasks} onDeleteTask={handleDeleteTask} />
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
                            {Object.keys(scheduledTasksByDate).length > 0 ? "Nothing scheduled for this day." : "Your schedule will appear here."}
                        </p>
                         <p className="text-sm">
                            {Object.keys(scheduledTasksByDate).length > 0 ? "The AI kept this day clear." : "Add some tasks and click Generate."}
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
