'use client';

import { useState } from 'react';
import type { Task, ScheduleItem, BlockedTime, ProposedTask } from '@/lib/types';
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { addDays, format, parseISO } from 'date-fns';

let idCounter = 0;
const mockUuid = () => `mock-uuid-${idCounter++}`;

const today = new Date();
const initialTasks: Task[] = [
  { id: mockUuid(), title: 'Physics - Kinematics Problem Set', estimatedTime: 120, priority: 'high', deadline: addDays(today, 3) },
  { id: mockUuid(), title: 'Chemistry - Chemical Bonding Revision', estimatedTime: 90, priority: 'medium', deadline: addDays(today, 5) },
  { id: mockUuid(), title: 'Maths - Integral Calculus Practice', estimatedTime: 120, priority: 'high', deadline: addDays(today, 2) },
  { id: mockUuid(), title: 'JEE Mock Test - Paper 1', estimatedTime: 180, priority: 'high', deadline: addDays(today, 1) },
  { id: mockUuid(), title: 'Mock Test Analysis', estimatedTime: 60, priority: 'medium', deadline: addDays(today, 1) },
  { id: mockUuid(), title: 'Organic Chemistry - Reaction Mechanisms', estimatedTime: 75, priority: 'high', deadline: addDays(today, 0) },
  { id: mockUuid(), title: 'Physics - Rotational Motion', estimatedTime: 90, priority: 'medium', deadline: addDays(today, 4) },
];

const initialBlockedTimes: BlockedTime[] = [
    { id: 'bt-1', title: 'Lunch Break', startTime: '13:00', endTime: '14:00' },
    { id: 'bt-2', title: 'Evening Walk', startTime: '18:00', endTime: '18:30' },
];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [schedules, setSchedules] = useState<Record<string, ScheduleItem[]>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('21:00');
  const [viewedDate, setViewedDate] = useState(new Date());
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>(initialBlockedTimes);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [proposedSchedule, setProposedSchedule] = useState<ProposedTask[]>([]);
  const [reasoning, setReasoning] = useState<string | null>(null);
  const { toast } = useToast();

  const dateKey = format(viewedDate, 'yyyy-MM-dd');
  const currentSchedule = schedules[dateKey] || [];
  const isLoading = isGenerating || isAdjusting;

  const handleAddTask = (task: Omit<Task, 'id'>) => {
    setTasks(prev => [...prev, { ...task, id: mockUuid() }]);
    setSchedules({}); 
    setReasoning(null);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
    setSchedules({});
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
      tasks: tasks.map(t => ({
          ...t,
          estimatedTime: t.estimatedTime,
          deadline: t.deadline?.toISOString()
      })),
      blockedTimes: blockedTimes.map(({ id, ...rest }) => rest),
      timeConstraints: { startTime, endTime },
      currentDateTime: new Date().toISOString(),
      startDate: format(new Date(), 'yyyy-MM-dd'),
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
        
    for (const scheduledTask of finalSchedule) {
        const taskDate = parseISO(scheduledTask.startTime);
        const dateKey = format(taskDate, 'yyyy-MM-dd');

        if (!newSchedules[dateKey]) {
            newSchedules[dateKey] = [];
        }

        newSchedules[dateKey].push({
            id: scheduledTask.id,
            name: scheduledTask.title,
            startTime: format(parseISO(scheduledTask.startTime), 'HH:mm'),
            endTime: format(parseISO(scheduledTask.endTime), 'HH:mm'),
            isCompleted: false,
        });
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

    toast({
        title: "Schedule Applied!",
        description: "Your new schedule is ready.",
    });
  }

  const handleAdjustSchedule = async (userRequest: string) => {
    setIsAdjusting(true);

    const input = {
      tasks: tasks.map(t => ({
          ...t,
          estimatedTime: t.estimatedTime,
          deadline: t.deadline?.toISOString()
      })),
      blockedTimes: blockedTimes.map(({ id, ...rest }) => rest),
      timeConstraints: { startTime, endTime },
      currentDateTime: new Date().toISOString(),
      startDate: format(new Date(), 'yyyy-MM-dd'),
      currentScheduledTasks: proposedSchedule.map(({priority, ...rest}) => rest),
      userRequest: userRequest
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
    setSchedules(prev => {
      const daySchedule = prev[dateKey];
      if (!daySchedule) return prev;
      return {
        ...prev,
        [dateKey]: daySchedule.map(item =>
          item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
        ),
      };
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <SettingsDialog 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        blockedTimes={blockedTimes}
        setBlockedTimes={setBlockedTimes}
      />
      <AdjustScheduleDialog
        isOpen={isAdjustDialogOpen}
        onClose={() => setIsAdjustDialogOpen(false)}
        proposedSchedule={proposedSchedule}
        reasoning={reasoning}
        onAdjust={handleAdjustSchedule}
        onApply={handleApplySchedule}
        isAdjusting={isAdjusting}
      />
      <header className="shrink-0 border-b">
        <div className="px-4 lg:px-6 py-3">
          <Header onSettingsClick={() => setIsSettingsOpen(true)} />
        </div>
      </header>
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 py-4 lg:px-6 lg:py-4 overflow-hidden">
        {/* Left Panel: Task Management */}
        <Card className="lg:col-span-1 flex flex-col overflow-hidden">
          <CardHeader className="p-4 pb-2">
            <CardTitle>Tasks & Scheduling</CardTitle>
            <CardDescription>Add tasks, set availability, and generate your schedule.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-2 p-4 pt-2 overflow-hidden">
            <div>
              <TaskForm onAddTask={handleAddTask} />
            </div>
            <div className="flex-1 min-h-0">
              <TaskList tasks={tasks} onDeleteTask={handleDeleteTask} onReorderTasks={handleReorderTasks} />
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-2 border-t">
            <ScheduleControls
              onGenerate={handleGenerateSchedule}
              isLoading={isGenerating}
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
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
            {schedules[dateKey] && !isAdjustDialogOpen && (
                 <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>AI Reasoning</AlertTitle>
                    <AlertDescription>
                        This schedule was generated based on your tasks and settings.
                    </AlertDescription>
                </Alert>
            )}
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
