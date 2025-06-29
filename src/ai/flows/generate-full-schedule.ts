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

// Schemas are kept to ensure type safety with the calling action.
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


// DEBUGGING: This function now bypasses the AI and returns hardcoded data.
export async function generateFullSchedule(
  input: GenerateFullScheduleInput
): Promise<GenerateFullScheduleOutput> {
  console.log('--- DEBUG: INSIDE `generateFullSchedule` ---');

  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowKey = tomorrow.toISOString().split('T')[0];

  const debugSchedule: GenerateFullScheduleOutput = {
    [todayKey]: [
      { name: 'DEBUG: First Day Task', startTime: '09:00', endTime: '10:00' }
    ],
    [tomorrowKey]: [
      { name: 'DEBUG: Second Day Task', startTime: '11:00', endTime: '12:00' }
    ]
  };
  
  console.log('--- DEBUG: Returning hardcoded schedule. ---');
  return Promise.resolve(debugSchedule);
}


// The original AI flow is commented out for debugging purposes.
/*
const prompt = ai.definePrompt({
  name: 'generateFullSchedulePrompt',
  input: {schema: GenerateFullScheduleInputSchema},
  output: {schema: GenerateFullScheduleOutputSchema},
  prompt: `You are an expert AI assistant that creates multi-day schedules.
Your task is to schedule all tasks from the provided JSON, respecting all constraints.

Here is the context:
- The tasks to schedule are in this JSON string: {{{tasksAsJson}}}
- The current date and time is: {{currentDateTime}}
- The first day for scheduling is: {{startDate}}
- Your daily working hours are from {{timeConstraints.startTime}} to {{timeConstraints.endTime}}.

Follow these rules strictly:
1.  **Deadlines are critical.** Schedule every task on or before its due date. Prioritize tasks with earlier deadlines.
2.  **Distribute the workload.** Balance tasks across multiple days to avoid cramming everything into the start of the week.
3.  **No overlaps.** A task can only start after the previous one on the same day has finished.
4.  **Include breaks.** Leave 15-30 minute gaps between tasks. You MUST schedule a 60-minute lunch break between 12:00 and 14:00 every day. Do not create tasks named "Break" or "Lunch"; they are just empty time slots.

Your output must be a single JSON object matching the requested schema.
`,
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

      if (!output || Object.keys(output).length === 0) {
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
*/