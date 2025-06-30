/**
 * @fileOverview Shared Zod schemas for AI schedule generation.
 */
import {z} from 'zod';

// Base schema for a scheduled task returned by the AI
export const AIScheduledTaskSchema = z.object({
    id: z.string(),
    title: z.string(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
});
export type AIScheduledTask = z.infer<typeof AIScheduledTaskSchema>;

// Input for the main schedule generation flow
export const GenerateFullScheduleInputSchema = z.object({
  model: z.string(),
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
    estimatedTime: z.number(),
    deadline: z.string().optional(),
  })),
  blockedTimes: z.array(z.object({
    title: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  })),
  timeConstraints: z.object({
    startTime: z.string(),
    endTime: z.string(),
  }),
  currentDateTime: z.string(),
  startDate: z.string(),
  timezone: z.string(),
  currentScheduledTasks: z.array(AIScheduledTaskSchema).optional(),
});

// Output for both the generation and adjustment flows
export const GenerateFullScheduleOutputSchema = z.object({
  scheduledTasks: z.array(AIScheduledTaskSchema).describe("The new or updated list of scheduled tasks. In a conversational turn where the schedule is not modified, this should be the same as the input `currentScheduledTasks`."),
  reasoning: z.string().describe("A friendly, conversational explanation of the changes made or the reason a change couldn't be made. This is also used for casual conversation with the user."),
});

// Input for the schedule adjustment flow
export const AdjustScheduleInputSchema = GenerateFullScheduleInputSchema.extend({
    currentScheduledTasks: z.array(AIScheduledTaskSchema),
    userRequest: z.string(),
});
