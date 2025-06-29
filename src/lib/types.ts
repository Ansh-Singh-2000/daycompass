export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  name: string;
  duration: number; // in minutes
  priority: TaskPriority;
  deadline?: Date;
}

export interface Schedule {
  name: string;
  startTime: string;
  endTime: string;
}

export interface ScheduleItem extends Schedule {
  id: string;
  isCompleted: boolean;
}
