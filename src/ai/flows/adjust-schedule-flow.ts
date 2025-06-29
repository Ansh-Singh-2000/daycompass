'use server';

/**
 * @fileOverview AI-powered schedule adjuster based on user's natural language feedback.
 * 
 * - adjustSchedule - A function that refines an existing schedule proposal.
 * - AdjustScheduleInput - The input type for the adjustSchedule function.
 * - AdjustScheduleOutput - The return type for the adjustSchedule function (same as GenerateFullScheduleOutput).
 */

import { groq } from '@/ai/genkit';
import { AdjustScheduleInputSchema, GenerateFullScheduleOutputSchema } from '@/ai/schemas';
import { z } from 'zod';

export type AdjustScheduleInput = z.infer<typeof AdjustScheduleInputSchema>;
export type AdjustScheduleOutput = z.infer<typeof GenerateFullScheduleOutputSchema>;

function buildPrompt(input: AdjustScheduleInput): string {
    const { tasks, blockedTimes, timeConstraints, currentScheduledTasks, userRequest, timezone, currentDateTime } = input;
    
    const taskDetails = tasks.map(task => 
        `- "${task.title}" (ID: ${task.id}), Estimated Time: ${task.estimatedTime} min, Priority: ${task.priority}` +
        (task.deadline ? `, Deadline: ${task.deadline}` : '')
    ).join('\n');

    const blockedTimeDetails = blockedTimes.map(bt => 
        `- ${bt.title}: ${bt.startTime} - ${bt.endTime}`
    ).join('\n');

    const currentScheduleJSON = JSON.stringify(currentScheduledTasks, null, 2);

    return `You are an expert scheduling AI assistant. A user wants to make a change to a schedule you previously proposed.

Your goal is to process the user's request and ALWAYS return a JSON object that strictly follows this Zod schema:
\`\`\`json
${JSON.stringify(GenerateFullScheduleOutputSchema.jsonSchema, null, 2)}
\`\`\`

You have two modes of operation:

1.  **Command Mode**: If the user provides a clear instruction to change the schedule (e.g., "move physics to 7pm", "can you find a spot for a new task: 'review notes for 30 mins'"):
    *   Generate a NEW, complete schedule that incorporates the change.
    *   The new schedule MUST follow all the CRITICAL RULES listed below.
    *   In the \`reasoning\` field, explain the changes you made.

2.  **Conversational Mode**: If the user asks a question, makes a comment, or the request is unclear (e.g., "why is this scheduled then?", "that looks good", "hi"):
    *   DO NOT CHANGE THE SCHEDULE. Your primary goal is to be helpful and conversational.
    *   Return the \`currentScheduledTasks\` list *exactly as it was given to you* in the \`scheduledTasks\` field of your JSON output.
    *   In the \`reasoning\` field, provide a helpful, conversational response. Answer their question or acknowledge their comment.

CRITICAL RULES FOR SCHEDULE MODIFICATION (apply ONLY if you change the schedule):
1.  SCHEDULE ALL TASKS: You MUST place every single task from the original \`tasks\` list into the new schedule.
2.  MAP ALL FIELDS: For each scheduled task, you MUST include its original \`id\` and \`title\` in the corresponding fields of the JSON output.
3.  ACCURATE DURATION: The duration for each scheduled task (\`endTime\` - \`startTime\`) MUST exactly match its \`estimatedTime\` from the original task list.
4.  ISO 8601 FORMAT: All \`startTime\` and \`endTime\` values MUST be complete and valid ISO 8601 date-time strings that include the timezone offset (e.g., '2024-07-15T09:00:00.000-07:00').
5.  NO OVERLAPPING: Tasks MUST NOT overlap with each other, with recurring blocked times, or fall outside the daily availability window.
6.  RESOLVE CONFLICTS: If a user's requested change causes a time conflict with another task, you MUST reschedule the conflicting task to a new, suitable, non-overlapping time.
7.  RESPECT DEADLINES: All tasks must still meet their original deadlines.
8.  SCHEDULE IN THE FUTURE: Any newly scheduled or rescheduled \`startTime\` must be in the future, occurring after the \`currentDateTime\`. Do not move tasks to a time in the past.

---
CONTEXT:

- Current Date & Time: \`${currentDateTime}\`

User's Request:
"${userRequest}"

Current Proposed Schedule (JSON to be modified if necessary):
\`\`\`json
${currentScheduleJSON}
\`\`\`

Full Task List (for reference, ensure all these are scheduled if you make changes):
${taskDetails}

Constraints (apply to every day):
- Daily Availability: \`${timeConstraints.startTime}\` - \`${timeConstraints.endTime}\`
- Recurring Blocked Times:
${blockedTimeDetails}
- Timezone: \`${timezone}\`
---
Your final output MUST be a single, raw JSON object and nothing else. Do not wrap it in markdown backticks or any other text.`;
}

export async function adjustSchedule(
  input: AdjustScheduleInput
): Promise<AdjustScheduleOutput> {
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
      console.error("Failed to parse AI JSON response in adjustSchedule:", responseText);
      throw new Error(`The AI returned an invalid response. The raw response was: "${responseText}"`);
  }
}
