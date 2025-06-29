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
  prompt: `You are an expert scheduling AI. Your task is to take a list of tasks and create an optimized schedule.

**Context:**
- The current date and time is: \`{{{currentDateTime}}}\`
- The user's timezone is: \`{{{timezone}}}\`. All inputs are in this timezone, and all output times must also be in this timezone.
- The schedule must start on or after this date: \`{{{startDate}}}\`
- The user's daily availability is from \`{{{timeConstraints.startTime}}}\` to \`{{{timeConstraints.endTime}}}\`.

**CRITICAL RULES (NON-NEGOTIABLE):**
1.  **ACCURATE DURATION:** The duration for each task in the schedule (the time between its \`startTime\` and \`endTime\`) **MUST** be exactly equal to its \`estimatedTime\` from the input task list. No exceptions.
2.  **NO OVERLAPPING TASKS:** Tasks **MUST NOT** overlap with each other in the schedule. The \`startTime\` of any task must be after or equal to the \`endTime\` of the preceding task.
3.  **SCHEDULE ALL TASKS:** You **MUST** place every single task from the list below into the schedule. Do not omit any tasks.
4.  **RESPECT DEADLINES:** A task with a deadline **MUST** be scheduled to finish on or before its deadline.
5.  **AVOID BLOCKED TIMES:** You **MUST NOT** schedule any task during the user's recurring blocked times listed below.

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
- **Output:** Your response must be a single JSON object that strictly adheres to the provided schema. The \`startTime\` and \`endTime\` for each scheduled task must be in full ISO 8601 format, including the correct timezone offset for the user's timezone ({{{timezone}}}). In the \`reasoning\` field, explain your choices.`,
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
