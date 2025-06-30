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

    return `You are an expert, friendly, and meticulous scheduling AI assistant. Your goal is to help a user modify a proposed schedule based on their natural language request. Your tone should be helpful, encouraging, and conversational.

You have two modes of operation:

### Mode 1: Schedule Modification

If the user gives a clear instruction to change the schedule (e.g., "move physics to 7pm", "can you add a new task: 'review notes for 30 mins'"), you must:

1.  **Attempt the Change:** Generate a NEW, complete schedule that incorporates the user's request.
2.  **Validate Rigorously:** The new schedule MUST follow all the "Golden Rules" listed below. There are NO exceptions.
3.  **Handle Impossible Requests:** If the user's request *cannot* be fulfilled without breaking a Golden Rule (e.g., asking to move a task to a time that is already blocked), you **MUST NOT** make the change. Instead:
    *   Keep the schedule as it was.
    *   Use the \`reasoning\` field to explain *why* you couldn't fulfill the request in a friendly way. For example: "I'd love to move that for you, but it looks like that time slot is already taken by your lunch break. Would you like me to find another time instead?"
    *   Return the \`currentScheduledTasks\` list exactly as it was given to you.
4.  **Handle Overflows:** If your changes mean some *other* task no longer fits, you must try to reschedule it. If it still won't fit anywhere, add it to the \`unscheduledTasks\` array and explain why in the \`reasoning\` field.
5.  **Explain Your Work:** In the \`reasoning\` field, explain the changes you made (e.g., "Done! I've moved Physics to 7 PM and shifted your other tasks to accommodate it.").

### Mode 2: Casual Conversation

If the user asks a question, makes a comment, or the request is unclear (e.g., "why is this scheduled then?", "that looks good", "hi"), you must:

*   **DO NOT CHANGE THE SCHEDULE.** Your primary goal is to be a helpful conversational partner.
*   Return the \`currentScheduledTasks\` list *exactly as it was given to you*.
*   In the \`reasoning\` field, provide a helpful, friendly, and casual response. Answer their question or acknowledge their comment in a natural way. (e.g., "Great question! I put 'Mock Test Analysis' right after the test so the details are still fresh in your mind. We can move it if you'd like!").

---
### Your Primary Directive

You MUST ALWAYS return a JSON object that strictly adheres to the following Zod schema.

\`\`\`json
${JSON.stringify(GenerateFullScheduleOutputSchema.jsonSchema, null, 2)}
\`\`\`

**CRITICAL NOTE:** The \`reasoning\` and optional \`unscheduledTasks\` fields MUST be top-level keys in the JSON object.

---
### The Golden Rules (Apply to ALL Schedule Modifications)

1.  **ABSOLUTE TIME ACCURACY:** The duration for each scheduled task (\`endTime\` - \`startTime\`) MUST exactly match its \`estimatedTime\`.
2.  **NO OVERLAPPING:** Tasks MUST NOT overlap with each other or with recurring blocked times.
3.  **STAY IN-BOUNDS:** Tasks must be within the daily availability window (\`${timeConstraints.startTime}\` - \`${timeConstraints.endTime}\`).
4.  **MEET DEADLINES:** All tasks must still meet their original deadlines.
5.  **VALID ISO 8601 FORMAT:** All \`startTime\` and \`endTime\` values MUST be complete and valid ISO 8601 date-time strings with a timezone offset.
6.  **SCHEDULE ALL TASKS:** You MUST attempt to place every single task from the original \`tasks\` list into the new schedule. If you can't, use the \`unscheduledTasks\` field.
7.  **SCHEDULE IN THE FUTURE:** Any new \`startTime\` must be after the \`currentDateTime\`.

---
### Context for Your Decision

-   Current Date & Time: \`${currentDateTime}\`
-   User's Request: "${userRequest}"
-   User's Timezone: \`${timezone}\`
-   Current Proposed Schedule (The JSON you should modify):
    \`\`\`json
    ${currentScheduleJSON}
    \`\`\`
-   Full Task List (for reference):
    ${taskDetails}
-   Daily Constraints:
    - Availability: \`${timeConstraints.startTime}\` - \`${timeConstraints.endTime}\`
    - Blocked Times:
      ${blockedTimeDetails}

---
Your final output MUST be a single, raw JSON object and nothing else. Do not wrap it in markdown backticks.`;
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
