'use client';

import { useState } from 'react';
import type { Task, ScheduleItem } from '@/lib/types';
import { createSchedule } from './actions';
import { useToast } from "@/hooks/use-toast";
import Header from '@/components/day-weaver/Header';
import TaskForm from '@/components/day-weaver/TaskForm';
import TaskList from '@/components/day-weaver/TaskList';
import ScheduleControls from '@/components/day-weaver/ScheduleControls';
import ScheduleCalendar from '@/components/day-weaver/ScheduleCalendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, format } from 'date-fns';

let idCounter = 0;
const mockUuid = () => `mock-uuid-${idCounter++}`;

const today = new Date();
const initialTasks: Task[] = [
  { id: mockUuid(), name: 'Physics - Kinematics Problem Set', duration: 120, priority: 'high', deadline: addDays(today, 3) },
  { id: mockUuid(), name: 'Chemistry - Chemical Bonding Revision', duration: 90, priority: 'medium', deadline: addDays(today, 5) },
  { id: mockUuid(), name: 'Maths - Integral Calculus Practice', duration: 120, priority: 'high', deadline: addDays(today, 2) },
  { id: mockUuid(), name: 'JEE Mock Test - Paper 1', duration: 180, priority: 'high', deadline: addDays(today, 1) },
  { id: mockUuid(), name: 'Mock Test Analysis', duration: 60, priority: 'medium', deadline: addDays(today, 1) },
];


export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [schedule, setSchedule] = useState<ScheduleItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('21:00');
  const [viewedDate, setViewedDate] = useState(new Date());
  const { toast } = useToast();

  const handleAddTask = (task: Omit<Task, 'id'>) => {
    setTasks(prev => [...prev, { ...task, id: mockUuid() }]);
    setSchedule(null);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
    setSchedule(null);
  };

  const handleReorderTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    setSchedule(null);
  };
  
  const handlePrevDay = () => {
    setViewedDate(current => addDays(current, -1));
    setSchedule(null);
  };

  const handleNextDay = () => {
    setViewedDate(current => addDays(current, 1));
    setSchedule(null);
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
    
    setIsLoading(true);
    setSchedule(null);

    const input = {
      tasks: tasks.map(({ id, deadline, ...rest }) => ({ 
        ...rest,
        deadline: deadline?.toISOString()
      })),
      timeConstraints: { startTime, endTime },
      currentDateTime: new Date().toISOString(),
      scheduleDate: viewedDate.toISOString().split('T')[0],
    };

    const result = await createSchedule(input);
    
    if (result.success && result.data) {
      setSchedule(result.data.map(item => ({ ...item, id: mockUuid(), isCompleted: false })));
    } else {
      toast({
        variant: "destructive",
        title: "Scheduling Failed",
        description: result.error || "An unknown error occurred.",
      });
      setSchedule(null);
    }
    setIsLoading(false);
  };

  const handleToggleComplete = (id: string) => {
    setSchedule(prev => 
      prev 
        ? prev.map(item => item.id === id ? { ...item, isCompleted: !item.isCompleted } : item) 
        : null
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <div className="px-4 pt-4 lg:px-6 lg:pt-6">
        <Header />
      </div>
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 pb-4 lg:px-6 lg:pb-6 overflow-hidden">
        {/* Left Panel: Task Management */}
        <Card className="lg:col-span-1 flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle>Tasks &amp; Scheduling</CardTitle>
            <CardDescription>Add tasks, set availability, and generate your schedule.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 overflow-y-auto p-4 pt-2">
            <TaskForm onAddTask={handleAddTask} />
            <Separator />
            <div className="flex-1 min-h-0">
              <TaskList tasks={tasks} onDeleteTask={handleDeleteTask} onReorderTasks={handleReorderTasks} />
            </div>
          </CardContent>
          <CardFooter className="p-4 border-t">
            <ScheduleControls
              onGenerate={handleGenerateSchedule}
              isLoading={isLoading}
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
            <div className="flex-1 relative min-h-0">
              {isLoading && (
                 <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10 rounded-lg">
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      <p className="text-muted-foreground">Weaving your perfect day...</p>
                    </div>
                  </div>
              )}
              {schedule ? (
                 schedule.length > 0 ? (
                  <ScheduleCalendar
                    schedule={schedule}
                    onToggleComplete={handleToggleComplete}
                    startTime={startTime}
                    endTime={endTime}
                  />
                 ) : (
                  !isLoading && (
                    <div className="flex items-center justify-center h-full border-2 border-dashed rounded-lg">
                      <div className="text-center text-muted-foreground">
                        <CalendarDays className="mx-auto h-12 w-12" />
                        <p className="mt-4">Nothing scheduled for this day.</p>
                        <p className="text-sm">Try generating a schedule or check another date.</p>
                      </div>
                    </div>
                  )
                 )
              ) : (
                !isLoading && (
                  <div className="flex items-center justify-center h-full border-2 border-dashed rounded-lg">
                    <div className="text-center text-muted-foreground">
                      <CalendarDays className="mx-auto h-12 w-12" />
                      <p className="mt-4">Your schedule will appear here once generated.</p>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
