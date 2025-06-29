'use server';

/**
 * @fileOverview AI-powered schedule adjuster based on user's natural language feedback.
 * 
 * - adjustSchedule - A function that refines an existing schedule proposal.
 * - AdjustScheduleInput - The input type for the adjustSchedule function.
 * - AdjustScheduleOutput - The return type for the adjustSchedule function (same as GenerateFullScheduleOutput).
 */

import { ai } from '@/ai/genkit';
import { AdjustScheduleInputSchema, GenerateFullScheduleOutputSchema } from '@/ai/schemas';
import { z } from 'genkit';

export type AdjustScheduleInput = z.infer<typeof AdjustScheduleInputSchema>;
export type AdjustScheduleOutput = z.infer<typeof GenerateFullScheduleOutputSchema>;

export async function adjustSchedule(
  input: AdjustScheduleInput
): Promise<AdjustScheduleOutput> {
  return adjustScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adjustSchedulePrompt',
  input: {schema: AdjustScheduleInputSchema},
  output: {schema: GenerateFullScheduleOutputSchema},
  prompt: `You are an expert scheduling AI. A user wants to make a change to a schedule you previously proposed.

**User's Request:**
"{{{userRequest}}}"

**Current Proposed Schedule (to be modified):**
{{#each currentScheduledTasks}}
- **Task:** "{{this.title}}" (ID: {{this.id}}) starts at {{this.startTime}} and ends at {{this.endTime}}
{{/each}}

Based on the user's request, you must generate a NEW, complete schedule.

**Key Constraints (MUST be followed):**
1.  **SCHEDULE ALL TASKS:** You **MUST** place every single task from the original list into the new schedule.
2.  **RESPECT DEADLINES & PRIORITIES:** Use the original task list below for priorities and deadlines.
3.  **AVOID BLOCKED TIMES:** Do not schedule tasks during the user's blocked times.
4.  **DAILY AVAILABILITY:** The user is available from \`{{{timeConstraints.startTime}}}\` to \`{{{timeConstraints.endTime}}}\` each day.

**Original Task List (for reference):**
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

Your response must be a single JSON object that strictly adheres to the provided schema. In the \`reasoning\` field, explain the changes you made based on the user's request.`,
});

const adjustScheduleFlow = ai.defineFlow(
  {
    name: 'adjustScheduleFlow',
    inputSchema: AdjustScheduleInputSchema,
    outputSchema: GenerateFullScheduleOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate an adjusted schedule.');
    }
    return output;
  }
);
