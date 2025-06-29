'use server';

/**
 * @fileOverview AI-powered schedule generator based on tasks and blocked times.
 *
 * - generateFullSchedule - A function that generates an optimized schedule.
 * - GenerateFullScheduleInput - The input type for the generateFullSchedule function.
 * - GenerateFullScheduleOutput - The return type for the generateFullSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFullScheduleInputSchema = z.object({
  tasks: z.array(z.object({
    id: z.string().describe('The unique ID of the task.'),
    title: z.string().describe('The name of the task.'),
    priority: z.enum(['low', 'medium', 'high']),
    estimatedTime: z.number().describe('The estimated time needed for the task in minutes.'),
    deadline: z.string().optional().describe('The deadline for the task in ISO 8601 format.'),
  })).describe('An array of all available tasks to schedule.'),
  blockedTimes: z.array(z.object({
    title: z.string().describe('The name of the blocked event (e.g., "Lunch Break").'),
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
export type GenerateFullScheduleInput = z.infer<typeof GenerateFullScheduleInputSchema>;

const GenerateFullScheduleOutputSchema = z.object({
  scheduledTasks: z.array(z.object({
    id: z.string().describe("The original ID of the task."),
    title: z.string().describe("The original title of the task."),
    startTime: z.string().describe("The suggested start time in ISO 8601 format."),
    endTime: z.string().describe("The suggested end time in ISO 8601 format."),
  })).describe("An array of tasks placed on the calendar."),
  reasoning: z.string().describe("A brief explanation of the scheduling decisions, including prioritization and break handling.")
});
export type GenerateFullScheduleOutput = z.infer<typeof GenerateFullScheduleOutputSchema>;

export async function generateFullSchedule(
  input: GenerateFullScheduleInput
): Promise<GenerateFullScheduleOutput> {
  return generateFullScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFullSchedulePrompt',
  input: {schema: GenerateFullScheduleInputSchema},
  output: {schema: GenerateFullScheduleOutputSchema},
  prompt: `You are an expert scheduling AI. Your task is to take a list of tasks and create a schedule.

**Context:**
- The current date and time is: \`{{{currentDateTime}}}\`
- The schedule must start on or after this date: \`{{{startDate}}}\`
- The user's daily availability is from \`{{{timeConstraints.startTime}}}\` to \`{{{timeConstraints.endTime}}}\`.

**Primary Directives (Must be followed exactly):**
1.  **SCHEDULE ALL TASKS:** You **MUST** place every single task from the list below into the schedule. Do not omit any task.
2.  **RESPECT DEADLINES:** A task with a deadline **MUST** be scheduled to finish on or before its deadline.
3.  **AVOID BLOCKED TIMES:** You **MUST NOT** schedule any task during the user's recurring blocked times listed below.

**Task List to Schedule:**
{{#each tasks}}
- **Task:** "{{this.title}}" (ID: {{this.id}})
  - **Priority:** {{this.priority}}
  - **Estimated Time:** {{this.estimatedTime}} minutes
  {{#if this.deadline}}  - **Deadline:** {{this.deadline}}{{/if}}
{{/each}}

**Recurring Blocked Times (Daily):**
{{#each blockedTimes}}
- {{this.title}}: from {{this.startTime}} to {{this.endTime}}
{{/each}}

**Scheduling Guidelines:**
- **Prioritization:** Prioritize tasks with earlier deadlines. For tasks with similar deadlines, schedule higher priority tasks first.
- **Breaks:** Add a 5-10 minute gap between tasks for short breaks.
- **Output:** Your response must be a single JSON object that strictly adheres to the provided schema. The \`startTime\` and \`endTime\` for each scheduled task must be in full ISO 8601 format. In the \`reasoning\` field, explain your choices.`,
});

const generateFullScheduleFlow = ai.defineFlow(
  {
    name: 'generateFullScheduleFlow',
    inputSchema: GenerateFullScheduleInputSchema,
    outputSchema: GenerateFullScheduleOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate a schedule.');
    }
    return output;
  }
);
