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

const DailyScheduleSchema = z.object({
    date: z.string().describe("The date for this schedule in 'YYYY-MM-DD' format."),
    tasks: z.array(
        z.object({
            name: z.string().describe('The name of the task.'),
            startTime: z.string().describe('The start time of the task in HH:mm format.'),
            endTime: z.string().describe('The end time of the task in HH:mm format.'),
        })
    ).describe("An array of tasks scheduled for this specific day.")
});

const GenerateFullScheduleOutputSchema = z.object({
    schedules: z.array(DailyScheduleSchema).describe("An array of daily schedules, covering all days required to schedule the provided tasks.")
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
  prompt: `You are a master scheduling assistant. Your goal is to create a complete, multi-day schedule based on a list of tasks and user constraints.

Rules:
1.  **Analyze All Tasks:** Review the entire list of tasks provided in \`tasksAsJson\`.
2.  **Distribute Intelligently:** Distribute the tasks across multiple days, starting from \`startDate\`.
3.  **Respect Deadlines:** Tasks with earlier deadlines MUST be scheduled first.
4.  **No Overlaps:** Within a single day, tasks must not overlap. There should be a small gap between each task.
5.  **Daily Hours:** Schedule tasks only within the user's provided \`timeConstraints.startTime\` and \`timeConstraints.endTime\`.
6.  **Include Breaks:** Ensure there's a significant lunch break around noon (e.g., 60 minutes). Do not create a "Lunch" task; simply leave a gap in the schedule.
7.  **Schedule All Tasks:** You MUST schedule every single task provided in \`tasksAsJson\`. Do not omit any tasks. The final schedule must account for all of them.
8.  **Date Format:** Dates in the output must be a string in the exact 'YYYY-MM-DD' format.
9.  **Output Format:** Your final output must be a single JSON object that strictly adheres to the provided schema, with a top-level "schedules" property containing an array of daily schedules.`,
});

const generateFullScheduleFlow = ai.defineFlow(
  {
    name: 'generateFullScheduleFlow',
    inputSchema: GenerateFullScheduleInputSchema,
    outputSchema: GenerateFullScheduleOutputSchema,
  },
  async (input) => {
    console.log("///////////////////////////////////////////");
    console.log("///      INSIDE GENKIT FLOW             ///");
    console.log("///////////////////////////////////////////");
    console.log("Calling AI with input:", JSON.stringify(input, null, 2));

    try {
      const { output } = await prompt(input);
      
      console.log("AI returned structured output:", JSON.stringify(output, null, 2));

      if (!output || !output.schedules) {
        console.error('AI returned an empty or null structured output.');
        throw new Error('AI failed to generate a schedule.');
      }

      return output;
    } catch (e) {
      console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      console.error("!!! ERROR WITHIN THE GENKIT FLOW ITSELF !!!");
      console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      console.error("Error object:", e);
      throw e; // Re-throw the error to be caught by the server action
    }
  }
);
