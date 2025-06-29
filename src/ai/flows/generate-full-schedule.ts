'use server';

/**
 * @fileOverview AI-powered schedule generator based on tasks and blocked times.
 *
 * - generateFullSchedule - A function that generates an optimized schedule.
 * - GenerateFullScheduleInput - The input type for the generateFullSchedule function.
 * - GenerateFullScheduleOutput - The return type for the generateFullSchedule function.
 */

import { geminiModel } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateFullScheduleInputSchema, GenerateFullScheduleOutputSchema } from '@/ai/schemas';

export type GenerateFullScheduleInput = z.infer<typeof GenerateFullScheduleInputSchema>;
export type GenerateFullScheduleOutput = z.infer<typeof GenerateFullScheduleOutputSchema>;

function buildPrompt(input: GenerateFullScheduleInput): string {
    const { tasks, blockedTimes, timeConstraints, currentDateTime, startDate, timezone } = input;

    const taskDetails = tasks.map(task => 
        `- **Task:** "${task.title}" (ID: ${task.id})\n  - **Priority:** ${task.priority}\n  - **Estimated Time:** ${task.estimatedTime} minutes\n` +
        (task.deadline ? `  - **Deadline:** ${task.deadline}` : '')
    ).join('\n');

    const blockedTimeDetails = blockedTimes.map(bt => 
        `- ${bt.title}: from ${bt.startTime} to ${bt.endTime}`
    ).join('\n');

    return `You are an expert scheduling AI. Your task is to take a list of tasks and create a complete, valid, and optimized schedule in JSON format.

Your Goal:
Create a JSON object that strictly follows this Zod schema:
\`\`\`json
${JSON.stringify(GenerateFullScheduleOutputSchema.jsonSchema, null, 2)}
\`\`\`
The JSON object must contain a \`scheduledTasks\` array. This array must include every task from the user's list, scheduled according to the critical rules below.

CRITICAL RULES (NON-NEGOTIABLE):
1.  SCHEDULE ALL TASKS: You MUST place every single task from the input \`tasks\` list into the schedule. Do not omit any tasks.
2.  ACCURATE DURATION: The duration for each scheduled task (the time between its \`startTime\` and \`endTime\`) MUST be exactly equal to its \`estimatedTime\` from the input task list. No exceptions.
3.  NO OVERLAPPING: Tasks in the schedule MUST NOT overlap with each other. The \`startTime\` of any task must be greater than or equal to the \`endTime\` of the preceding task.
4.  RESPECT DAILY AVAILABILITY: For every day you schedule a task on, that task must be entirely within the user's daily availability window: from \`${timeConstraints.startTime}\` to \`${timeConstraints.endTime}\`.
5.  AVOID BLOCKED TIMES: For every day you schedule a task on, that task MUST NOT overlap with any of the user's recurring daily blocked times. These apply to every day.
6.  RESPECT DEADLINES: A task with a deadline MUST be scheduled to finish on or before its deadline.

Context:
- The current date and time is: \`${currentDateTime}\`
- The user's timezone is: \`${timezone}\`. All inputs are in this timezone, and all output times must also be in this timezone in ISO 8601 format.
- The schedule must start on or after this date: \`${startDate}\`

INPUTS:

Task List to Schedule:
${taskDetails}

Recurring Daily Blocked Times (apply to every day):
${blockedTimeDetails}

Instructions:
1.  Prioritize tasks with the earliest deadlines. For tasks without deadlines or with the same deadline, schedule higher priority tasks first.
2.  Find the earliest possible valid slot for each task, starting from \`${startDate}\`. A valid slot is one that respects all of the critical rules above.
3.  In the \`reasoning\` field of your JSON output, briefly explain your scheduling choices.
4.  Final Check: Before you output the JSON, double-check your generated \`scheduledTasks\` array against every single critical rule to ensure 100% compliance. If it fails any rule, you must fix it.`;
}

export async function generateFullSchedule(
  input: GenerateFullScheduleInput
): Promise<GenerateFullScheduleOutput> {
  const prompt = buildPrompt(input);
  
  const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
          responseMimeType: 'application/json',
      }
  });

  const responseText = result.response.text();
  const parsedJson = JSON.parse(responseText);
  
  const validationResult = GenerateFullScheduleOutputSchema.safeParse(parsedJson);

  if (!validationResult.success) {
      console.error("Gemini output failed Zod validation:", validationResult.error);
      throw new Error(`AI returned data in an invalid format. ${validationResult.error.message}`);
  }

  return validationResult.data;
}
