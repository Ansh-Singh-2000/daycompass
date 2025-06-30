'use server';

/**
 * @fileOverview AI-powered schedule generator based on tasks and blocked times.
 *
 * - generateFullSchedule - A function that generates an optimized schedule.
 * - GenerateFullScheduleInput - The input type for the generateFullSchedule function.
 * - GenerateFullScheduleOutput - The return type for the generateFullSchedule function.
 */

import { groq } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateFullScheduleInputSchema, GenerateFullScheduleOutputSchema } from '@/ai/schemas';

export type GenerateFullScheduleInput = z.infer<typeof GenerateFullScheduleInputSchema>;
export type GenerateFullScheduleOutput = z.infer<typeof GenerateFullScheduleOutputSchema>;

function buildPrompt(input: GenerateFullScheduleInput): string {
    const { tasks, blockedTimes, timeConstraints, currentDateTime, startDate, timezone, currentScheduledTasks } = input;

    const taskDetails = tasks.map(task => 
        `- **Task:** "${task.title}" (ID: ${task.id})\n  - **Priority:** ${task.priority}\n  - **Estimated Time:** ${task.estimatedTime} minutes\n` +
        (task.deadline ? `  - **Deadline:** ${task.deadline}` : '')
    ).join('\n');

    const blockedTimeDetails = blockedTimes.map(bt => 
        `- ${bt.title}: from ${bt.startTime} to ${bt.endTime}`
    ).join('\n');
    
    const currentScheduleJSON = currentScheduledTasks && currentScheduledTasks.length > 0 ? JSON.stringify(currentScheduledTasks, null, 2) : null;

    return `You are an expert, friendly, and meticulous scheduling AI assistant. Your primary goal is to create a complete, valid, and optimized daily schedule for the user in JSON format. Your tone should be helpful and encouraging.

---
### Your Primary Directive

You MUST generate a JSON object that strictly adheres to the following Zod schema. **This is not optional.**

\`\`\`json
${JSON.stringify(GenerateFullScheduleOutputSchema.jsonSchema, null, 2)}
\`\`\`

---
### The Scheduling Logic (Follow these steps)

1.  **Prioritize:** Order the tasks. First by the earliest deadline, then by priority (high > medium > low).
2.  **Schedule:** Attempt to place *every single task* from the input \`tasks\` list onto the calendar, starting from \`${startDate}\`.
3.  **Validate:** For every task you place, it MUST obey ALL of the "Golden Rules" below. There are no exceptions.
4.  **Handle Overflows:** If you have tried to schedule a task and cannot find ANY valid time slot for it without breaking a Golden Rule, you MUST NOT include that task in the final \`scheduledTasks\` array. You MUST mention this clearly in the \`reasoning\` field, explaining which tasks could not be scheduled and why (e.g., "I've created your schedule, but couldn't find a spot for 'Task X' before its deadline.").

---
### The Golden Rules (NON-NEGOTIABLE)

You MUST follow these rules for every task you place in the \`scheduledTasks\` array. Breaking even one rule is a failure.

1.  **ABSOLUTE TIME ACCURACY:** The duration of each scheduled task (\`endTime\` - \`startTime\`) MUST be *exactly* equal to its \`estimatedTime\` from the input task list. Do not alter the duration.
2.  **NO OVERLAPPING:** Tasks in the schedule MUST NEVER overlap with each other. The \`startTime\` of any task must be greater than or equal to the \`endTime\` of the preceding task.
3.  **RESPECT BLOCKED TIMES:** Tasks MUST NEVER be scheduled during a recurring "blocked time." Check every day.
4.  **STAY IN-BOUNDS:** Tasks MUST be scheduled entirely within the user's daily availability window (from \`${timeConstraints.startTime}\` to \`${timeConstraints.endTime}\`).
5.  **MEET DEADLINES:** A task with a deadline MUST be scheduled to finish on or before that deadline.
6.  **VALID ISO 8601 FORMAT:** All \`startTime\` and \`endTime\` values MUST be complete, valid ISO 8601 date-time strings including the timezone offset (e.g., '2024-07-15T09:00:00.000-07:00').
7.  **MAP ALL FIELDS:** For each task you schedule, you MUST include its original \`id\` and \`title\`.
8.  **SCHEDULE IN THE FUTURE:** All scheduled \`startTime\`s must be after the \`currentDateTime\`. Do not schedule tasks in the past.

---
### Explanations & Tone

In the \`reasoning\` field of your JSON output, provide a concise, friendly explanation of your work.
- If all tasks were scheduled, say something like: "Here is your optimized schedule! I've prioritized your tasks by deadline and made sure everything fits within your available time."
- If some tasks were left unscheduled, explain it clearly as per the "Handle Overflows" rule.
- If you are updating an existing schedule, explain the key changes you made.

---
### User Context

- Current Date & Time: \`${currentDateTime}\`
- User's Timezone: \`${timezone}\`
- Schedule Start Date: \`${startDate}\`
- Daily Availability: \`${timeConstraints.startTime}\` to \`${timeConstraints.endTime}\`
- Recurring Daily Blocked Times:
${blockedTimeDetails}
${currentScheduleJSON ? `
- **IMPORTANT**: The user already has a schedule. Use this as a strong reference. Your goal is to intelligently update it.
  - Keep tasks at their currently scheduled times if possible.
  - Only move tasks if necessary to accommodate new/unscheduled tasks or resolve conflicts.
  - Ensure all tasks from the Task List are present in the final scheduled list, unless impossible.

Current Schedule Reference (JSON):
\`\`\`json
${currentScheduleJSON}
\`\`\`
` : ''}

### Full Task List to Schedule
${taskDetails}

---
Final Check: Before you output the JSON, review your \`scheduledTasks\` against every Golden Rule. If there's a single violation, fix it. Your final output MUST be only the raw JSON object.`;
}

export async function generateFullSchedule(
  input: GenerateFullScheduleInput
): Promise<GenerateFullScheduleOutput> {
  const prompt = buildPrompt(input);
  
  const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: input.model,
      response_format: { type: 'json_object' }
  });

  let responseText = completion.choices[0]?.message?.content;
  if (!responseText) {
    throw new Error('AI returned an empty response.');
  }

  // Handle <think> tags by removing them
  responseText = responseText.replace(/<think>[\s\S]*?<\/think>/, '').trim();

  try {
      const parsedJson = JSON.parse(responseText);
      return parsedJson;
  } catch (e) {
      console.error("Failed to parse AI JSON response in generateFullSchedule:", responseText);
      throw new Error(`The AI returned an invalid response. The raw response was: "${responseText}"`);
  }
}
