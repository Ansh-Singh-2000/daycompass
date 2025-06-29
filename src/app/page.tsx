'use client';

import { useState, useRef } from 'react';
import type { Task, ScheduleItem } from '@/lib/types';
import { createSchedule } from './actions';
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import Header from '@/components/day-weaver/Header';
import TaskForm from '@/components/day-weaver/TaskForm';
import TaskList from '@/components/day-weaver/TaskList';
import ScheduleControls from '@/components/day-weaver/ScheduleControls';
import ScheduleView from '@/components/day-weaver/ScheduleView';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Note: In a real app, you would use a more robust UUID solution.
// For this example, we mock it to ensure consistent IDs for hydration.
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
  const [hasGenerated, setHasGenerated] = useState(false);
  const { toast } = useToast();

  const handleAddTask = (task: Omit<Task, 'id'>) => {
    setTasks(prev => [...prev, { ...task, id: mockUuid() }]);
    setHasGenerated(false);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
    setHasGenerated(false);
  };

  const handleReorderTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    setHasGenerated(false);
  };

  const handleGenerateSchedule = async (startTime: string, endTime: string) => {
    if (tasks.length === 0) {
      toast({
        variant: "destructive",
        title: "No tasks to schedule",
        description: "Please add at least one task before generating a schedule.",
      });
      return;
    }
    
    setIsLoading(true);
    const input = {
      tasks: tasks.map(({ id, ...rest }) => rest), // Remove client-side id before sending to AI
      timeConstraints: { startTime, endTime },
    };

    const result = await createSchedule(input);
    
    if (result.success && result.data) {
      setSchedule(result.data.map(item => ({ ...item, id: mockUuid(), isCompleted: false })));
      setHasGenerated(true);
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
    <div className="flex flex-col items-center min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl mx-auto">
        <Header />
        <main className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">1. Add Your Tasks</h2>
                <p className="text-muted-foreground">List everything you need to accomplish. Don't worry about the order yet.</p>
                <TaskForm onAddTask={handleAddTask} />
              </div>
              <Separator className="my-6" />
              <TaskList tasks={tasks} onDeleteTask={handleDeleteTask} onReorderTasks={handleReorderTasks} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-foreground">2. Set Your Day's Boundaries</h2>
              <p className="text-muted-foreground">Define your working hours, and let our AI find the best slots for your tasks.</p>
              <ScheduleControls onGenerate={handleGenerateSchedule} isLoading={isLoading} />
            </CardContent>
          </Card>

          {schedule && (
            <Card>
              <CardContent className="p-6">
                 <h2 className="text-xl font-semibold text-foreground">3. Your Woven Day</h2>
                 <p className="text-muted-foreground">Here is your optimized schedule. Check off tasks as you complete them.</p>
                 {!hasGenerated && tasks.length > 0 && (
                    <div className="mt-4 p-3 rounded-md bg-yellow-100 border border-yellow-300 text-yellow-800 text-sm">
                      Your tasks have changed. We recommend regenerating your schedule for the best results.
                    </div>
                  )}
                 <ScheduleView schedule={schedule} onToggleComplete={handleToggleComplete} />
              </CardContent>
            </Card>
          )}

          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Weaving your perfect day...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
