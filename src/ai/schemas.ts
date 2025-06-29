/**
 * @fileOverview Shared Zod schemas for AI schedule generation.
 */
import {z} from 'zod';

// Base schema for a scheduled task returned by the AI
export const AIScheduledTaskSchema = z.object({
    id: z.string().describe("The original ID of the task."),
    title: z.string().describe("The original title of the task."),
    startTime: z.string().describe("The suggested start time in ISO 8601 format."),
    endTime: z.string().describe("The suggested end time in ISO 8601 format."),
});

// Input for the main schedule generation flow
export const GenerateFullScheduleInputSchema = z.object({
  tasks: z.array(z.object({
    id: z.string().describe('The unique ID of the task.'),
    title: z.string().describe('The name of the task.'),
    priority: z.enum(['low', 'medium', 'high']),
    estimatedTime: z.number().describe('The estimated time needed for the task in minutes.'),
    deadline: z.string().optional().describe('The deadline for the task in ISO 8601 format.'),
  })).describe('An array of all available tasks to schedule.'),
  blockedTimes: z.array(z.object({
    title: z.string().describe('The name of the event (e.g., "Lunch Break").'),
    startTime: z.string().describe('The start time of the block in HH:mm format.'),
    endTime: z.string().describe('The end time of the block in HH:mm format.'),
  })).describe('An array of recurring daily busy slots.'),
  timeConstraints: z.object({
    startTime: z.string().describe('The preferred start time for each day in HH:mm format.'),
    endTime: z.string().describe('The preferred end time for each day in HH:mm format.'),
  }).describe('The daily time constraints for scheduling.'),
  currentDateTime: z.string().describe('The current date and time in ISO 8601 format, to provide context.'),
  startDate: z.string().describe('The first date to start scheduling on, in YYYY-MM-DD format.'),
});

// Output for both the generation and adjustment flows
export const GenerateFullScheduleOutputSchema = z.object({
  scheduledTasks: z.array(AIScheduledTaskSchema).describe("An array of tasks placed on the calendar."),
  reasoning: z.string().describe("A brief explanation of the scheduling decisions, including prioritization and break handling.")
});

// Input for the schedule adjustment flow
export const AdjustScheduleInputSchema = GenerateFullScheduleInputSchema.extend({
    currentScheduledTasks: GenerateFullScheduleOutputSchema.shape.scheduledTasks.describe("The current proposed schedule that needs to be adjusted."),
    userRequest: z.string().describe("The user's natural language request for a change in the schedule."),
});
