'use client';

import { useState } from 'react';
import type { Task, ScheduleItem } from '@/lib/types';
import { createSchedule } from './actions';
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import Header from '@/components/day-weaver/Header';
import TaskForm from '@/components/day-weaver/TaskForm';
import TaskList from '@/components/day-weaver/TaskList';
import ScheduleControls from '@/components/day-weaver/ScheduleControls';
import ScheduleCalendar from '@/components/day-weaver/ScheduleCalendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays } from 'lucide-react';

// Mocking UUID for consistent IDs during server/client render.
// In a real app, a database-generated ID would be used.
let idCounter = 0;
const mockUuid = () => `mock-uuid-${idCounter++}`;

const initialTasks: Task[] = [
  { id: mockUuid(), name: 'Physics - Kinematics Problem Set', duration: 120, priority: 'high' },
  { id: mockUuid(), name: 'Chemistry - Chemical Bonding Revision', duration: 90, priority: 'medium' },
  { id: mockUuid(), name: 'Maths - Integral Calculus Practice', duration: 120, priority: 'high' },
  { id: mockUuid(), name: 'Short break & snack', duration: 20, priority: 'low' },
  { id: mockUuid(), name: 'JEE Mock Test - Paper 1', duration: 180, priority: 'high' },
  { id: mockUuid(), name: 'Mock Test Analysis', duration: 60, priority: 'medium' },
];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [schedule, setSchedule] = useState<ScheduleItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const { toast } = useToast();

  const handleAddTask = (task: Omit<Task, 'id'>) => {
    setTasks(prev => [...prev, { ...task, id: mockUuid() }]);
    setSchedule(null); // Invalidate schedule on task change
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
    setSchedule(null);
  };

  const handleReorderTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
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
      tasks: tasks.map(({ id, ...rest }) => rest),
      timeConstraints: { startTime, endTime },
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
          <CardContent className="flex-1 flex flex-col gap-4 overflow-y-auto p-4">
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
          <CardHeader>
            <CardTitle>Daily Schedule</CardTitle>
            <CardDescription>Your AI-generated schedule for the day.</CardDescription>
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
