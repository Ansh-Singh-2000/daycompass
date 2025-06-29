'use server';

/**
 * @fileOverview AI-powered daily schedule generator.
 *
 * - generateDailySchedule - A function that generates an optimized daily schedule.
 * - GenerateDailyScheduleInput - The input type for the generateDailySchedule function.
 * - GenerateDailyScheduleOutput - The return type for the generateDailySchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDailyScheduleInputSchema = z.object({
  tasks: z
    .array(
      z.object({
        name: z.string().describe('The name of the task.'),
        priority: z.enum(['high', 'medium', 'low']).describe('The priority of the task.'),
        duration: z.number().describe('The estimated duration of the task in minutes.'),
      })
    )
    .describe('A list of tasks to be scheduled.'),
  timeConstraints: z
    .object({
      startTime: z.string().describe('The preferred start time for the schedule in HH:mm format.'),
      endTime: z.string().describe('The preferred end time for the schedule in HH:mm format.'),
    })
    .describe('The time constraints for the schedule.'),
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
  prompt: `You are an AI assistant specialized in generating optimized and realistic daily schedules.

  Given the following tasks, their priorities, and time constraints, generate an efficient daily schedule. It is crucial to include breaks between tasks to make the schedule humanly possible.

  Tasks:
  {{#each tasks}}
  - Name: {{name}}, Priority: {{priority}}, Duration: {{duration}} minutes
  {{/each}}

  Time Constraints:
  - Start Time: {{timeConstraints.startTime}}
  - End Time: {{timeConstraints.endTime}}

  Instructions:
  - Ensure that higher priority tasks are scheduled earlier in the day.
  - Consider the duration of each task when allocating time slots.
  - **Crucially, insert short breaks of 5-10 minutes between tasks.** Do not schedule tasks back-to-back. These breaks are essential for a sustainable study plan. Title these breaks "Short Break" or similar.
  - The output should be a JSON object containing a "schedule" array. Each item in the array is an object with "name", "startTime", and "endTime".
  - Each task and break should be scheduled within the provided time constraints.

  Example Output JSON:
  {
    "schedule": [
      { "name": "Task 1", "startTime": "09:00", "endTime": "10:00" },
      { "name": "Short Break", "startTime": "10:00", "endTime": "10:10" },
      { "name": "Task 2", "startTime": "10:10", "endTime": "11:00" }
    ]
  }
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
