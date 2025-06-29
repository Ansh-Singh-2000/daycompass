'use server';

/**
 * @fileOverview AI-powered multi-day schedule generator.
 *
 * - generateFullSchedule - A function that generates an optimized schedule across multiple days.
 * - GenerateFullScheduleInput - The input type for the generateFullSchedule function.
 * - GenerateFullScheduleOutput - The return type for the generateFullSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFullScheduleInputSchema = z.object({
  tasksAsJson: z
    .string()
    .describe(
      'A JSON string representing an array of all available tasks to schedule. Each task object has name, priority, duration (in minutes), and an optional deadline (ISO 8601 format).'
    ),
  timeConstraints: z
    .object({
      startTime: z.string().describe('The preferred start time for each day in HH:mm format.'),
      endTime: z.string().describe('The preferred end time for each day in HH:mm format.'),
    })
    .describe('The daily time constraints for scheduling.'),
  currentDateTime: z.string().describe('The current date and time in ISO 8601 format, to provide context for deadlines.'),
  startDate: z.string().describe('The first date to start scheduling on, in YYYY-MM-DD format.'),
});

export type GenerateFullScheduleInput = z.infer<typeof GenerateFullScheduleInputSchema>;

const GenerateFullScheduleOutputSchema = z.object({
  schedules: z.record(
    z.string(),
    z.array(
        z.object({
            name: z.string().describe('The name of the task.'),
            startTime: z.string().describe('The start time of the task in HH:mm format.'),
            endTime: z.string().describe('The end time of the task in HH:mm format.'),
        })
    )
  ).describe("An object where keys are dates in 'YYYY-MM-DD' format and values are the schedule arrays for that day.")
});


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
  prompt: `You are a world-class productivity and study coach. Your single most important mission is to design a complete, multi-day study schedule that is smart, sustainable, and actively prevents student burnout. You must schedule ALL provided tasks.

**CONTEXT:**
- You are creating a schedule starting from **{{startDate}}** and continuing for as many days as needed to schedule all tasks.
- The current date and time is: **{{currentDateTime}}**. Use this to understand the urgency of tasks.
- The available time window for scheduling on *each day* is from **{{timeConstraints.startTime}}** to **{{timeConstraints.endTime}}**.

**YOUR TASK: ASSIGN & SCHEDULE ALL TASKS**
You will be given a complete list of ALL available tasks in JSON format. Your goal is to assign every single task to an intelligent date and time slot.

**Here is the JSON list of all available tasks:**
{{{tasksAsJson}}}

**CRITICAL TASK DISTRIBUTION LOGIC (IN ORDER OF IMPORTANCE):**
1.  **DEADLINE IS KING:** A task *must* be scheduled on or before its deadline. This is a hard constraint. Use the deadline to determine which day a task should be placed on. Tasks with earlier deadlines must be scheduled first.
2.  **URGENCY & PRIORITY:** Within a given day, use task priority to order tasks. A 'high' priority task should generally be done before a 'low' priority task, but be smart about it (e.g., don't put two high-effort tasks back-to-back).
3.  **CAPACITY AWARENESS & LOAD BALANCING:** Do not cram all tasks into the first few days. If deadlines allow, distribute the workload evenly across multiple days to create a sustainable pace. A perfect schedule has breathing room every day.

**MANDATORY, NON-NEGOTIABLE SCHEDULING DIRECTIVES FOR EACH DAY:**
(These apply to the schedule you generate for *every single day*)

1.  **THE PRIME DIRECTIVE: AVOID BURNOUT AT ALL COSTS.** Every other rule serves this goal. The final schedule for each day *must* feel balanced and manageable. A dense, back-to-back schedule is a failure.

2.  **NO OVERLAPPING TASKS.** This is the most critical failure condition. Generated tasks on any given day **MUST NOT** overlap. The \`startTime\` of any task must be after the \`endTime\` of the preceding task.

3.  **NO CONTINUOUS STUDY FOR MORE THAN 2 HOURS.** You are strictly forbidden from scheduling tasks back-to-back if they result in more than 120 minutes of continuous work. After *any* task that is 90 minutes or longer, you **MUST** insert a significant gap of at least 30 minutes. After shorter tasks (less than 90 minutes), you **MUST** insert a gap of 15-20 minutes. This is not optional.

4.  **MANDATORY MIDDAY BREAK.** On every scheduled day, you **MUST** ensure there is a long, empty gap of at least 60 minutes, sometime between 12:00 and 14:00. Do not schedule any tasks during this time. This is a hard requirement for every day that has tasks.

5.  **INTELLIGENT TASK DISTRIBUTION (DAILY).**
    *   Spread tasks across the *entire* available time window from \`startTime\` to \`endTime\`. Do not cram tasks in one part of the day.
    *   Vary the intensity. Avoid placing two 'high' priority tasks next to each other, even with a short break. Mix in 'medium' or 'low' priority tasks between them.

6.  **OUTPUT FORMATTING.**
    *   The output must be a valid JSON object with a single "schedules" object.
    *   The keys of the "schedules" object **MUST** be date strings in 'YYYY-MM-DD' format.
    *   The values **MUST** be arrays of the scheduled tasks for that corresponding date.
    *   **CRITICAL: Your primary directive is to schedule the user's tasks. Do not invent your own tasks. Do not create tasks named "Break", "Lunch", "Rest", "Snack", or any other activity that is not in the provided task list.** The breaks and rest periods are the *empty spaces* between the scheduled tasks in the final output. The only items in the output schedule should be the tasks I provided.
`,
});

const generateFullScheduleFlow = ai.defineFlow(
  {
    name: 'generateFullScheduleFlow',
    inputSchema: GenerateFullScheduleInputSchema,
    outputSchema: GenerateFullScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
