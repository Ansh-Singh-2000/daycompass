export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  estimatedTime: number; // in minutes
  priority: TaskPriority;
  deadline?: Date;
  
  // Schedule-related properties are now optional on the main task object
  startTime?: string; // Full ISO 8601 date string
  endTime?: string; // Full ISO 8601 date string
  isCompleted?: boolean;
  overdueNotified?: boolean;
  archived?: boolean;
}

export interface BlockedTime {
  id: string;
  title: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface ProposedTask {
    id: string;
    title: string;
    startTime: string; // ISO 8601 format
    endTime: string; // ISO 8601 format
    priority: TaskPriority;
}
