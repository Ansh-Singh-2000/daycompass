
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/storage';
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
import { Compass, ChevronLeft, ChevronRight, Smartphone } from 'lucide-react';
import { addDays, format, parseISO, isValid } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { ToastAction } from '@/components/ui/toast';
import confetti from 'canvas-confetti';
import { useIsMobile } from '@/hooks/use-mobile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Footer from '@/components/day-weaver/Footer';
import LoadingSkeleton from '@/components/day-weaver/LoadingSkeleton';

const initialBlockedTimes: BlockedTime[] = [
    { id: 'bt-1', title: 'Lunch Break', startTime: '13:00', endTime: '14:00' },
    { id: 'bt-2', title: 'Evening Walk', startTime: '18:00', endTime: '18:30' },
];

export default function Home() {
  const { toast } = useToast();
  const actionedToastIds = useRef(new Set<string>());
  const isMobile = useIsMobile();
  
  // --- STATE & HYDRATION ---
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize state with static defaults to prevent hydration mismatch.
  // The actual data will be loaded from localStorage in the useEffect hook.
  const [tasks, setTasks] = useState<Task[]>([]);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('21:00');
  const [wakeTime, setWakeTime] = useState<string>('07:00');
  const [sleepTime, setSleepTime] = useState<string>('23:00');
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>(initialBlockedTimes);
  const [model, setModel] = useState<string>('llama3-70b-8192');
  const [points, setPoints] = useState<{gains: number, losses: number}>({ gains: 0, losses: 0 });

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

  // Effect for loading from localStorage on mount (client-side only).
  // This includes a one-time migration from cookies to localStorage.
  useEffect(() => {
    try {
        // --- START: ONE-TIME COOKIE TO LOCALSTORAGE MIGRATION SCRIPT ---
        const migrationFlag = 'day-compass-migrated-v1';
        if (!loadFromLocalStorage(migrationFlag)) {
            console.log("Checking for data to migrate from cookies...");
            const cookieKeyMap = {
                'day-compass-tasks': 'day-compass-tasks',
                'day-compass-startTime': 'day-compass-startTime',
                'day-compass-endTime': 'day-compass-endTime',
                'day-compass-wakeTime': 'day-compass-wakeTime',
                'day-compass-sleepTime': 'day-compass-sleepTime',
                'day-compass-blockedTimes': 'day-compass-blockedTimes',
                'day-compass-model': 'day-compass-model',
                'day-compass-points': 'day-compass-points'
            };
            
            let migrated = false;
            for (const [cookieKey, localKey] of Object.entries(cookieKeyMap)) {
                const cookieRaw = document.cookie.split('; ').find(row => row.startsWith(`${cookieKey}=`));
                
                if (cookieRaw) {
                    try {
                        if (!loadFromLocalStorage(localKey)) {
                            // The cookie value is the string after the first '='
                            const cookieValue = cookieRaw.substring(cookieKey.length + 1);
                            
                            let valueToStore;
                            try {
                                // First, decode the URL-encoded characters (like %22 for quotes)
                                const decodedValue = decodeURIComponent(cookieValue);
                                // Then, try to parse it as JSON. If it fails, use the decoded string directly.
                                valueToStore = JSON.parse(decodedValue);
                            } catch (e) {
                                // This handles non-JSON values like the model name string
                                valueToStore = decodeURIComponent(cookieValue);
                            }
                            
                            saveToLocalStorage(localKey, valueToStore);
                            migrated = true;
                            console.log(`Migrated ${cookieKey} successfully.`);
                        }
                        
                        // Clean up the old cookie
                        document.cookie = `${cookieKey}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
                    } catch (e) {
                        console.error(`Could not migrate cookie ${cookieKey}`, e);
                    }
                }
            }
            if (migrated) console.log("Migration successful!");
            
            saveToLocalStorage(migrationFlag, true);
        }
        // --- END: ONE-TIME COOKIE TO LOCALSTORAGE MIGRATION SCRIPT ---

        // Now, load from localStorage as usual
        const savedTasks = loadFromLocalStorage<any[]>('day-compass-tasks');
        if (savedTasks && savedTasks.length > 0) {
            setTasks(savedTasks.map((t: any) => ({
                ...t,
                // Ensure deadline is a Date object if it exists
                deadline: t.deadline ? parseISO(t.deadline) : undefined,
            })));
        } else {
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
            setTasks(initialTasks);
        }

        const savedStartTime = loadFromLocalStorage<string>('day-compass-startTime');
        if (savedStartTime) setStartTime(savedStartTime);

        const savedEndTime = loadFromLocalStorage<string>('day-compass-endTime');
        if (savedEndTime) setEndTime(savedEndTime);
        
        const savedWakeTime = loadFromLocalStorage<string>('day-compass-wakeTime');
        if (savedWakeTime) setWakeTime(savedWakeTime);
        
        const savedSleepTime = loadFromLocalStorage<string>('day-compass-sleepTime');
        if (savedSleepTime) setSleepTime(savedSleepTime);

        const savedBlockedTimes = loadFromLocalStorage<BlockedTime[]>('day-compass-blockedTimes');
        if (savedBlockedTimes) setBlockedTimes(savedBlockedTimes);

        const savedModel = loadFromLocalStorage<string>('day-compass-model');
        if (savedModel) setModel(savedModel);

        const savedPoints = loadFromLocalStorage<{gains: number, losses: number}>('day-compass-points');
        if (savedPoints) setPoints(savedPoints);

    } catch (error) {
        console.error("Error during hydration or migration", error);
    } finally {
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
        setIsHydrated(true);
    }
  }, []); 

  // Effects for saving to localStorage whenever state changes.
  useEffect(() => { if(isHydrated) saveToLocalStorage('day-compass-tasks', tasks); }, [tasks, isHydrated]);
  useEffect(() => { if(isHydrated) saveToLocalStorage('day-compass-startTime', startTime); }, [startTime, isHydrated]);
  useEffect(() => { if(isHydrated) saveToLocalStorage('day-compass-endTime', endTime); }, [endTime, isHydrated]);
  useEffect(() => { if(isHydrated) saveToLocalStorage('day-compass-wakeTime', wakeTime); }, [wakeTime, isHydrated]);
  useEffect(() => { if(isHydrated) saveToLocalStorage('day-compass-sleepTime', sleepTime); }, [sleepTime, isHydrated]);
  useEffect(() => { if(isHydrated) saveToLocalStorage('day-compass-blockedTimes', blockedTimes); }, [blockedTimes, isHydrated]);
  useEffect(() => { if(isHydrated) saveToLocalStorage('day-compass-model', model); }, [model, isHydrated]);
  useEffect(() => { if(isHydrated) saveToLocalStorage('day-compass-points', points); }, [points, isHydrated]);
  
  const tasksRef = useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);


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
    Object.values(byDate).forEach(day => day.sort((a,b) => a.startTime!.localeCompare(b.startTime!)));
    return byDate;
  }, [tasks]);

  const dateKey = format(viewedDate, 'yyyy-MM-dd');
  const currentSchedule = scheduledTasksByDate[dateKey] || [];
  const isLoading = isGenerating || isAdjusting;
  const isAdjustDisabled = useMemo(() => {
    // Disable if there are no active (not completed, not missed) scheduled tasks
    return !tasks.some(t => t.startTime && !t.isCompleted && !t.isMissed);
  }, [tasks]);
  const hasTasks = useMemo(() => tasks.some(t => t.startTime), [tasks]);
  
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
        setTasks(prevTasks =>
          prevTasks.map(t =>
            t.id === taskId ? { ...t, isMissed: true } : t
          )
        );
      }
  }, []);

  const checkOverdueTasks = useCallback(() => {
    const now = new Date();
    const newlyOverdueTasks: Task[] = [];
    
    tasksRef.current.forEach(task => {
      if (task.endTime && !task.isCompleted && !task.isMissed && !task.overdueNotified) {
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
    if (!isHydrated) return; 
    const check = () => checkOverdueTasksRef.current();
    const initialCheckTimeout = setTimeout(check, 1000); 
    const intervalId = setInterval(check, 60000); 

    return () => {
      clearTimeout(initialCheckTimeout);
      clearInterval(intervalId);
    };
  }, [isHydrated]);


  const handleAddTask = (task: Omit<Task, 'id'>) => {
    const newTask = { ...task, id: uuidv4() };
    setTasks(prev => [...prev, newTask]);
    setReasoning(null);
  };

  const handleDeleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (!taskToDelete) return;

    if (taskToDelete.startTime && taskToDelete.endTime) {
        const endTime = parseISO(taskToDelete.endTime);
        if (isValid(endTime) && endTime < new Date()) {
            setTasks(currentTasks =>
                currentTasks.map(task =>
                    task.id === id ? { ...task, archived: true } : task
                )
            );
        } else {
            setTasks(currentTasks => currentTasks.filter(task => task.id !== id));
        }
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
    // Tasks to be scheduled are active ones (not completed, not missed)
    const tasksToSchedule = tasks.filter(t => !t.isCompleted && !t.isMissed);
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

    // AI context includes all scheduled items from today onwards
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const scheduleForAI = tasks
      .filter(t => t.startTime && isValid(parseISO(t.startTime)))
      .filter(t => parseISO(t.startTime!) >= startOfToday)
      .map(t => ({
          id: t.id,
          title: t.title,
          startTime: t.startTime!,
          endTime: t.endTime!,
      }));

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
      currentScheduledTasks: scheduleForAI.length > 0 ? scheduleForAI : undefined,
    };

    const result = await createSchedule(input);
    
    if (result.success) {
        const enrichedProposedSchedule = result.data.scheduledTasks.map((scheduledTask) => {
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
        description: result.error,
      });
    }
    setIsGenerating(false);
  };

  const handleOpenAdjustment = () => {
    // The context for adjustment is all scheduled tasks from today onwards
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const currentOnCalendar = tasks
        .filter(t => t.startTime && isValid(parseISO(t.startTime)))
        .filter(t => parseISO(t.startTime!) >= startOfToday)
        .map(t => ({
            id: t.id,
            title: t.title,
            startTime: t.startTime!,
            endTime: t.endTime!,
            priority: t.priority
        }));
    
    // Check if there are any *active* tasks to adjust in the context
    const activeTasksToAdjust = currentOnCalendar.filter(p => {
        const originalTask = tasks.find(t => t.id === p.id);
        return originalTask && !originalTask.isCompleted && !originalTask.isMissed;
    });

    if (activeTasksToAdjust.length === 0) {
        toast({
            title: "Nothing to Adjust",
            description: "There are no active tasks on your calendar for today or the future.",
        });
        return;
    }
    
    setProposedSchedule(currentOnCalendar);
    setReasoning("I've loaded your current schedule. How can I help you adjust it?");
    setIsAdjustDialogOpen(true);
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

        const originalUncompletedTasks = currentTasks.filter(t => !t.isCompleted).map(t => t.id);
        const tasksToUnschedule = originalUncompletedTasks.filter(id => !newScheduleMap.has(id));

        return currentTasks.map(task => {
            if (task.isCompleted) {
                return task;
            }

            if (newScheduleMap.has(task.id)) {
                const scheduledInfo = newScheduleMap.get(task.id)!;
                return {
                    ...task,
                    startTime: scheduledInfo.startTime,
                    endTime: scheduledInfo.endTime,
                    isCompleted: false, 
                    overdueNotified: false, 
                };
            }
            
            if (tasksToUnschedule.includes(task.id)) {
                 return {
                    ...task,
                    startTime: undefined,
                    endTime: undefined,
                };
            }

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

    // The definitive list of tasks that MUST be scheduled are the active ones.
    const tasksToSchedule = tasks.filter(t => !t.isCompleted && !t.isMissed);

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

    if (result.success) {
      if (result.data.scheduledTasks) {
          const enrichedProposedSchedule = result.data.scheduledTasks.map((scheduledTask) => {
            const originalTask = tasks.find(t => t.id === scheduledTask.id);
            return {
                ...scheduledTask,
                priority: originalTask?.priority || 'medium',
            };
          });
          setProposedSchedule(enrichedProposedSchedule);
      }
      if(result.data.reasoning) {
        setReasoning(result.data.reasoning);
      }
    } else {
       toast({
        variant: "destructive",
        title: "Adjustment Failed",
        description: result.error,
      });
    }

    setIsAdjusting(false);
  };
  
  if (!isHydrated) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="lg:h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
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
        wakeTime={wakeTime}
        onWakeTimeChange={setWakeTime}
        sleepTime={sleepTime}
        onSleepTimeChange={setSleepTime}
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
        <div className="px-4 lg:px-6 py-2">
          <Header onSettingsClick={() => setIsSettingsOpen(true)} points={points} />
        </div>
      </header>
      <main className="flex-1 flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-4 lg:overflow-hidden">
        {isMobile && (
          <Alert className="shrink-0">
            <Smartphone className="h-4 w-4" />
            <AlertTitle>Optimized for Desktop</AlertTitle>
            <AlertDescription>
              For the best experience, please use Day Compass on a larger screen.
            </AlertDescription>
          </Alert>
        )}
        <div className="lg:flex-1 flex flex-col lg:flex-row gap-6 lg:min-h-0">
          {/* Left Panel: Task Management */}
          <Card className="lg:w-[400px] lg:shrink-0 xl:w-[480px] flex flex-col">
            <CardHeader>
              <CardTitle>Tasks & Scheduling</CardTitle>
              <CardDescription>Add tasks and generate your AI-powered schedule.</CardDescription>
            </CardHeader>
            <CardContent className="lg:flex-1 flex flex-col gap-4 p-4 pt-0">
              <TaskForm onAddTask={handleAddTask} />
              <div className="lg:flex-1 lg:relative">
                <div className="lg:absolute lg:inset-0">
                  <TaskList tasks={tasks} onDeleteTask={handleDeleteTask} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 border-t">
              <ScheduleControls
                onGenerate={handleGenerateSchedule}
                onAdjust={handleOpenAdjustment}
                isLoading={isGenerating}
                isAdjustDisabled={isAdjustDisabled}
              />
            </CardFooter>
          </Card>

          {/* Right Panel: Schedule */}
          <Card className="lg:flex-1 flex flex-col lg:overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Daily Schedule</CardTitle>
                <CardDescription>Your AI-generated plan for the day.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevDay} disabled={isLoading}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-semibold text-foreground whitespace-nowrap">{format(viewedDate, isMobile ? "MMM d, yyyy" : "PPP")}</span>
                <Button variant="outline" size="icon" onClick={handleNextDay} disabled={isLoading}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="lg:flex-1 flex flex-col gap-4 lg:overflow-y-hidden p-4 pt-0">
              <div className="lg:flex-1 relative lg:min-h-0">
                {isGenerating && (
                  <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10 rounded-lg">
                      <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <p className="text-muted-foreground">Charting your perfect schedule...</p>
                      </div>
                    </div>
                )}
                <ScheduleCalendar
                  schedule={currentSchedule}
                  blockedTimes={blockedTimes}
                  onToggleComplete={handleToggleComplete}
                  startTime={wakeTime}
                  endTime={sleepTime}
                  viewedDate={viewedDate}
                  isLoading={isLoading}
                  hasTasks={hasTasks}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
