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

const TaskInputSchema = z.object({
  name: z.string(),
  duration: z.number().describe('Duration of the task in minutes.'),
  priority: z.enum(['low', 'medium', 'high']),
  deadline: z.string().optional().describe('The deadline for the task in ISO 8601 format.'),
});

const GenerateFullScheduleInputSchema = z.object({
  tasks: z.array(TaskInputSchema).describe('An array of all available tasks to schedule.'),
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
  prompt: `You are an expert scheduling AI. Your task is to take the following list of tasks and create a multi-day schedule.

**Task List To Schedule:**
{{#each tasks}}
- **Task:** {{this.name}}
  - **Duration:** {{this.duration}} minutes
  - **Priority:** {{this.priority}}
  {{#if this.deadline}}  - **Deadline:** {{this.deadline}}{{/if}}
{{/each}}

You must follow these rules without fail.

**Primary Directives:**
1.  **SCHEDULE EVERY TASK:** You **MUST** place every single task from the list above into the schedule. Do not omit any task. This is your most important directive. If you fail to schedule a task, you have failed the entire request.
2.  **START DATE:** Scheduling **MUST** begin on the date specified in \`{{{startDate}}}\`. The current date for context is \`{{{currentDateTime}}}\`. Do not start on any other date.
3.  **DEADLINES ARE ABSOLUTE:** A task with a deadline **MUST** be scheduled on or before that deadline. Use the \`{{{currentDateTime}}}\` to understand which deadlines are in the past. If a deadline has passed, schedule the task as early as possible beginning on \`{{{startDate}}}\`.

**Scheduling Constraints:**
- **Daily Hours:** All tasks must be scheduled between \`timeConstraints.startTime\` and \`timeConstraints.endTime\`.
- **No Overlaps:** Tasks on the same day cannot overlap. Include a small gap (5-10 minutes) between tasks.
- **Breaks:** Leave a one-hour gap for a lunch break around noon each day. Do not create a "Lunch" task.
- **Prioritization:** Schedule tasks with earlier deadlines first. For tasks with the same deadline, schedule higher priority tasks first.

**Output Format:**
- Your final output must be a single JSON object that strictly adheres to the provided schema.
- Dates in the output must be a string in the exact 'YYYY-MM-DD' format.`,
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
