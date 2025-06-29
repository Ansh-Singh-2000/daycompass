'use server';

/**
 * @fileOverview AI-powered schedule generator based on tasks and blocked times.
 *
 * - generateFullSchedule - A function that generates an optimized schedule.
 * - GenerateFullScheduleInput - The input type for the generateFullSchedule function.
 * - GenerateFullScheduleOutput - The return type for the generateFullSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { GenerateFullScheduleInputSchema, GenerateFullScheduleOutputSchema } from '@/ai/schemas';

export type GenerateFullScheduleInput = z.infer<typeof GenerateFullScheduleInputSchema>;
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
  prompt: `You are an expert scheduling AI. Your task is to take a list of tasks and create a complete, valid, and optimized schedule.

**Context:**
- The current date and time is: \`{{{currentDateTime}}}\`
- The user's timezone is: \`{{{timezone}}}\`. All inputs are in this timezone, and all output times must also be in this timezone.
- The schedule must start on or after this date: \`{{{startDate}}}\`

**Your Goal:**
Create a JSON object containing a \`scheduledTasks\` array. This array must include **every task** from the user's list, scheduled according to the critical rules below.

**CRITICAL RULES (NON-NEGOTIABLE):**
1.  **SCHEDULE ALL TASKS:** You **MUST** place every single task from the input \`tasks\` list into the schedule. Do not omit any tasks.
2.  **ACCURATE DURATION:** The duration for each scheduled task (the time between its \`startTime\` and \`endTime\`) **MUST** be exactly equal to its \`estimatedTime\` from the input task list. No exceptions.
3.  **NO OVERLAPPING:** Tasks in the schedule **MUST NOT** overlap with each other. The \`startTime\` of any task must be greater than or equal to the \`endTime\` of the preceding task.
4.  **RESPECT DAILY AVAILABILITY:** For every day you schedule a task on, that task must be entirely within the user's daily availability window: from \`{{{timeConstraints.startTime}}}\` to \`{{{timeConstraints.endTime}}}\`.
5.  **AVOID BLOCKED TIMES:** For every day you schedule a task on, that task **MUST NOT** overlap with any of the user's recurring daily blocked times.
6.  **RESPECT DEADLINES:** A task with a deadline **MUST** be scheduled to finish on or before its deadline.

**INPUTS:**

**Task List to Schedule:**
{{#each tasks}}
- **Task:** "{{this.title}}" (ID: {{this.id}})
  - **Priority:** {{this.priority}}
  - **Estimated Time:** {{this.estimatedTime}} minutes
  {{#if this.deadline}}  - **Deadline:** {{this.deadline}}{{/if}}
{{/each}}

**Recurring Daily Blocked Times (apply to every day):**
{{#each blockedTimes}}
- {{this.title}}: from {{this.startTime}} to {{this.endTime}}
{{/each}}

**Instructions:**
1.  Prioritize tasks with the earliest deadlines. For tasks without deadlines or with the same deadline, schedule higher priority tasks first.
2.  Find the earliest possible valid slot for each task, starting from \`{{{startDate}}}\`. A valid slot is one that respects all of the critical rules above.
3.  You can add small gaps (e.g., 5-10 minutes) between tasks for breaks, but this is optional and must not violate any of the other rules.
4.  In the \`reasoning\` field of your JSON output, briefly explain your scheduling choices.
5.  **Final Check:** Before you output the JSON, double-check your generated \`scheduledTasks\` array against every single critical rule to ensure 100% compliance. If it fails any rule, you must fix it.`,
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
