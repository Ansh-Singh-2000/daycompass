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
  prompt: `You are an expert scheduling AI. A user wants to discuss or make a change to a schedule you previously proposed.
The user's timezone is: \`{{{timezone}}}\`. All dates and times are in this timezone. Your output must also be in this timezone.

**User's Request:**
"{{{userRequest}}}"

**Current Proposed Schedule (to be modified):**
{{#each currentScheduledTasks}}
- **Task:** "{{this.title}}" (ID: {{this.id}}) starts at {{this.startTime}} and ends at {{this.endTime}}
{{/each}}

**Your Task:**
1.  **Analyze the user's request to determine its intent.**
2.  **Is the user just chatting or asking a question?** If the request is NOT a clear instruction to change the schedule (e.g., it's a question like "why is this scheduled then?", a general comment like "that looks good", or ambiguous like "hi"), then you MUST NOT change the schedule. Your primary goal is to be a helpful assistant.
    - **Action:** Return the \`currentScheduledTasks\` list *exactly as it was given to you*, without any modifications.
    - **Response:** In the \`reasoning\` field, provide a helpful, conversational response to the user's request. Answer their question or acknowledge their comment. If the request was unclear, ask for clarification (e.g., "I'm happy to help with that, could you be more specific about the change you'd like?").
3.  **Is the user requesting a schedule change?** If the request is a clear instruction (e.g., "move physics to 7pm", "reschedule my test for tomorrow"):
    - **Action:** Generate a NEW, complete schedule that incorporates the change.
    - You **MUST** place every single task from the original list into the new schedule.
    - **Conflict Resolution:** If your change causes a time conflict with another task, you **MUST** reschedule the conflicting task to a new, suitable time. Do not simply remove it or place it on top of another task.
    - Respect all deadlines, priorities, and blocked times from the original context. Adhere to the user's timezone ({{{timezone}}}).
    - **Response:** In the \`reasoning\` field, explain the changes you made and why. If you had to move other tasks to resolve a conflict, clearly state which tasks were moved and why.

**Original Task List & Constraints (for reference when making changes):**
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

**Daily Availability:** The user is available from \`{{{timeConstraints.startTime}}}\` to \`{{{timeConstraints.endTime}}}\` each day.

Your response must be a single JSON object that strictly adheres to the provided schema. The \`startTime\` and \`endTime\` for each scheduled task must be in full ISO 8601 format, including the correct timezone offset for the user's timezone ({{{timezone}}}).`,
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
    // If the AI is just chatting, it might not return tasks. We'll return the original ones.
    if (!output.scheduledTasks || output.scheduledTasks.length === 0) {
        output.scheduledTasks = input.currentScheduledTasks.map(({id, title, startTime, endTime}) => ({id, title, startTime, endTime}));
    }
    return output;
  }
);
