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
Your primary goal is to be a helpful assistant. First, you must determine the user's intent.

**CRITICAL RULES FOR SCHEDULE MODIFICATION (NON-NEGOTIABLE):**
If you decide to modify the schedule, the new schedule you generate **MUST** follow these rules:
1.  **SCHEDULE ALL TASKS:** You **MUST** place every single task from the original \`tasks\` list into the new schedule.
2.  **ACCURATE DURATION:** The duration for each scheduled task (\`endTime\` - \`startTime\`) **MUST** exactly match its \`estimatedTime\` from the original task list.
3.  **NO OVERLAPPING:** Tasks **MUST NOT** overlap with each other, with recurring blocked times, or fall outside the daily availability window.
4.  **RESOLVE CONFLICTS:** If a user's requested change causes a time conflict with another task, you **MUST** reschedule the conflicting task to a new, suitable, non-overlapping time.
5.  **RESPECT DEADLINES:** All tasks must still meet their original deadlines.

**User's Request:**
"{{{userRequest}}}"

**Current Proposed Schedule (to be modified):**
{{#each currentScheduledTasks}}
- **Task:** "{{this.title}}" (ID: {{this.id}}) starts at {{this.startTime}} and ends at {{this.endTime}}
{{/each}}

**Your Task (Two-Step Process):**
1.  **Analyze Intent:** Read the user's request. Is it a clear instruction to change the schedule (e.g., "move physics to 7pm", "reschedule my test for tomorrow")? Or is it just a question, a comment, or a vague statement (e.g., "why is this scheduled then?", "that looks good", "hi")?

2.  **Act on Intent:**
    - **If the user is NOT requesting a change:**
        - **Action:** DO NOT CHANGE THE SCHEDULE. Return the \`currentScheduledTasks\` list *exactly as it was given to you*.
        - **Response:** In the \`reasoning\` field, provide a helpful, conversational response. Answer their question or acknowledge their comment. If the request was unclear, ask for clarification (e.g., "I'm happy to help with that, could you be more specific about the change you'd like to make?").

    - **If the user IS requesting a change:**
        - **Action:** Generate a NEW, complete schedule that incorporates the change. This new schedule must follow all the **CRITICAL RULES** listed at the top.
        - **Response:** In the \`reasoning\` field, explain the changes you made and why. If you had to move other tasks to resolve a conflict, clearly state which tasks were moved and what their new times are.
        - **Final Check:** Before outputting the JSON, verify your new schedule against all the critical rules.

**Reference Data:**
- **Original Task List:**
  {{#each tasks}}
  - "{{this.title}}" (ID: {{this.id}}), Estimated Time: {{this.estimatedTime}} min, Priority: {{this.priority}}{{#if this.deadline}}, Deadline: {{this.deadline}}{{/if}}
  {{/each}}
- **Daily Availability:** \`{{{timeConstraints.startTime}}}\` - \`{{{timeConstraints.endTime}}}\`
- **Recurring Daily Blocked Times:**
  {{#each blockedTimes}}
  - {{this.title}}: {{this.startTime}} - {{this.endTime}}
  {{/each}}
- **Timezone:** \`{{{timezone}}}\` (All output times must be in this timezone in ISO 8601 format).`,
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
