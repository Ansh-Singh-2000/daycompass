'use server';

/**
 * @fileOverview AI-powered daily schedule generator.
 *
 * - generateDailySchedule - A function that generates an optimized daily schedule.
 * - GenerateDailyScheduleInput - The input type for the generateDailyschedule function.
 * - GenerateDailyScheduleOutput - The return type for the generateDailySchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDailyScheduleInputSchema = z.object({
  tasksAsJson: z
    .string()
    .describe(
      'A JSON string representing an array of all available tasks to choose from. Each task object has name, priority, duration (in minutes), and an optional deadline (ISO 8601 format).'
    ),
  timeConstraints: z
    .object({
      startTime: z.string().describe('The preferred start time for the schedule in HH:mm format.'),
      endTime: z.string().describe('The preferred end time for the schedule in HH:mm format.'),
    })
    .describe('The time constraints for the schedule.'),
  currentDateTime: z.string().describe('The current date and time in ISO 8601 format, to provide context for deadlines.'),
  scheduleDate: z.string().describe('The specific date for which to generate the schedule, in YYYY-MM-DD format.'),
});

export type GenerateDailyScheduleInput = z.infer<typeof GenerateDailyScheduleInputSchema>;

const GenerateDailyScheduleOutputSchema = z.object({
  schedule: z
    .array(
      z.object({
        name: z.string().describe('The name of the task.'),
        startTime: z.string().describe('The start time of the task in HH:mm format.'),
        endTime: z.string().describe('The end time of the task in HH:mm format.'),
      })
    )
    .describe('The generated daily schedule.'),
});

export type GenerateDailyScheduleOutput = z.infer<typeof GenerateDailyScheduleOutputSchema>;

export async function generateDailySchedule(
  input: GenerateDailyScheduleInput
): Promise<GenerateDailyScheduleOutput> {
  return generateDailyScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDailySchedulePrompt',
  input: {schema: GenerateDailyScheduleInputSchema},
  output: {schema: GenerateDailyScheduleOutputSchema},
  prompt: `You are a world-class productivity and study coach. Your single most important mission is to design a daily study schedule for a single, specific day that is smart, sustainable, and actively prevents student burnout.

**CONTEXT:**
- You are creating a schedule ONLY for this specific day: **{{scheduleDate}}**.
- The current date and time is: {{currentDateTime}}. Use this to understand the urgency of tasks relative to their deadlines.
- The available time window for scheduling is from {{timeConstraints.startTime}} to {{timeConstraints.endTime}}.

**YOUR TASK: SELECT & SCHEDULE**
You will be given a complete list of ALL available tasks in JSON format. Your goal is NOT to schedule all of them. Your goal is to select ONLY the most critical and relevant tasks for THIS specific day.

**Here is the JSON list of all available tasks:**
{{{tasksAsJson}}}

**CRITICAL TASK SELECTION LOGIC (IN ORDER OF IMPORTANCE):**
1.  **DEADLINE IS KING:** Your primary filter is the task deadline. Only select tasks whose deadlines are on or very near **{{scheduleDate}}**. Tasks with far-off deadlines (e.g., more than a few days away) should almost always be IGNORED for today's schedule, unless the day is completely empty. It is better to leave a future task unscheduled than to cram it into today.
2.  **URGENCY & PRIORITY:** A 'low' priority task due tomorrow is more urgent to schedule today than a 'high' priority task due next month. Use a combination of deadline and priority to determine true urgency.
3.  **CAPACITY AWARENESS:** Do not overfill the day. A perfect schedule has breathing room. It is better to schedule fewer tasks and complete them well than to create an impossible, cramped schedule.
4.  **DO NOT SCHEDULE PAST-DUE TASKS:** If a task's deadline has already passed (relative to \`currentDateTime\`), do not include it in today's schedule.

**MANDATORY, NON-NEGOTIABLE SCHEDULING DIRECTIVES:**
(These apply to the tasks you have selected for {{scheduleDate}})

1.  **THE PRIME DIRECTIVE: AVOID BURNOUT AT ALL COSTS.** Every other rule serves this goal. The final schedule *must* feel balanced and manageable. A dense, back-to-back schedule is a failure.

2.  **NO OVERLAPPING TASKS.** Generated tasks **MUST NOT** overlap. The \`startTime\` of any task must be after the \`endTime\` of the preceding task.

3.  **NO CONTINUOUS STUDY FOR MORE THAN 2 HOURS.** You are strictly forbidden from scheduling tasks back-to-back if they result in more than 120 minutes of continuous work. After *any* task that is 90 minutes or longer, you **MUST** insert a significant gap of at least 30 minutes. After shorter tasks (less than 90 minutes), you **MUST** insert a gap of 15-20 minutes. This is not optional.

4.  **MANDATORY MIDDAY BREAK.** You **MUST** ensure there is a long, empty gap of at least 60 minutes, sometime between 12:00 and 14:00. Do not schedule any tasks during this time. This is a hard requirement.

5.  **INTELLIGENT TASK DISTRIBUTION.**
    *   Spread tasks across the *entire* available time window from \`startTime\` to \`endTime\`. Do not cram tasks in one part of the day.
    *   Vary the intensity. Avoid placing two 'high' priority tasks next to each other, even with a short break. Mix in 'medium' or 'low' priority tasks between them.

6.  **OUTPUT FORMATTING.**
    *   The output must be a valid JSON object with a single "schedule" array.
    *   **CRITICAL: Your primary directive is to schedule the user's tasks. Do not invent your own tasks. Do not create tasks named "Break", "Lunch", "Rest", "Snack", or any other activity that is not in the provided task list.** The breaks and rest periods are the *empty spaces* between the scheduled tasks in the final output. The only items in the output schedule should be the tasks I provided.
`,
});

const generateDailyScheduleFlow = ai.defineFlow(
  {
    name: 'generateDailyScheduleFlow',
    inputSchema: GenerateDailyScheduleInputSchema,
    outputSchema: GenerateDailyScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
