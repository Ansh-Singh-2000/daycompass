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

const GenerateFullScheduleOutputSchema = z.record(
  z.string().describe("A date in 'YYYY-MM-DD' format."),
  z.array(
      z.object({
          name: z.string().describe('The name of the task.'),
          startTime: z.string().describe('The start time of the task in HH:mm format.'),
          endTime: z.string().describe('The end time of the task in HH:mm format.'),
      })
  )
).describe("An object where keys are dates in 'YYYY-MM-DD' format and values are the schedule arrays for that day. This is the top-level object in the JSON response.");


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
  prompt: `You are an expert AI scheduling assistant. Your goal is to create an optimized, multi-day schedule based on a list of tasks and constraints. You must schedule ALL tasks provided.

**Context:**
- **All Tasks (JSON):** {{{tasksAsJson}}}
- **First Day to Schedule:** {{startDate}}
- **Daily Time Window:** {{timeConstraints.startTime}} to {{timeConstraints.endTime}}
- **Current Time:** {{currentDateTime}}

**Core Directives (to be followed strictly):**
1.  **Schedule All Tasks:** Every single task from the input JSON must be placed in the schedule.
2.  **Respect Deadlines:** This is your highest priority. A task must be scheduled on or before its deadline. Tasks with earlier deadlines must be prioritized.
3.  **No Overlapping Events:** Within a single day, tasks must not overlap. The start time of one task must be after the end time of the previous one.
4.  **Prevent Burnout & Add Breaks:**
    - Insert reasonable breaks between tasks. A 15-20 minute gap is appropriate for most tasks. Use a 30+ minute gap for tasks that are 90 minutes or longer.
    - No more than 2 hours of continuous work should be scheduled without a break.
    - A mandatory 60-minute break must be scheduled between 12:00 PM and 2:00 PM (14:00) on every day that contains tasks. Do not schedule any tasks during this lunch window.
5.  **Smart Load Balancing:** If tasks have flexible deadlines, distribute them across multiple days to create a balanced workload. Do not cram everything into the first few days if it's not necessary.
6.  **No Fictional Tasks:** Only schedule tasks from the provided list. Do not create tasks named "Break," "Lunch," "Rest," etc. The breaks are the empty time between scheduled tasks.

Generate the full schedule as a single JSON object where keys are dates ('YYYY-MM-DD') and values are the arrays of tasks for that day.
`,
});

const generateFullScheduleFlow = ai.defineFlow(
  {
    name: 'generateFullScheduleFlow',
    inputSchema: GenerateFullScheduleInputSchema,
    outputSchema: GenerateFullScheduleOutputSchema,
  },
  async (input) => {
    console.log("Calling AI with input:", input);
    const { output } = await prompt(input);
    
    if (!output) {
      console.error('AI did not return a valid structured output.');
      throw new Error('AI failed to generate a schedule.');
    }

    console.log("AI returned structured output:", output);
    return output;
  }
);
