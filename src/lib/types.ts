export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  estimatedTime: number; // in minutes
  priority: TaskPriority;
  deadline?: Date;
  overdueNotified?: boolean;
}

export interface BlockedTime {
  id: string;
  title: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
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

export interface ProposedTask {
    id: string;
    title: string;
    startTime: string; // ISO 8601 format
    endTime: string; // ISO 8601 format
    priority: TaskPriority;
}
