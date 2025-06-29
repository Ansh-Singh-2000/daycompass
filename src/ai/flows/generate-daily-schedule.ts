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
  prompt: `You are an expert productivity coach. Your job is to create an optimized daily schedule for a student.

  Analyze the provided list of tasks, their priorities, and durations. Then, create a schedule within the given time constraints.

  Tasks:
  {{#each tasks}}
  - Name: {{name}}, Priority: {{priority}}, Duration: {{duration}} minutes
  {{/each}}

  Time Constraints:
  - Start Time: {{timeConstraints.startTime}}
  - End Time: {{timeConstraints.endTime}}

  **CRITICAL INSTRUCTIONS FOR A REALISTIC SCHEDULE:**
  1.  **Prioritize:** Schedule high-priority tasks first.
  2.  **Add Breaks:** This is the most important rule. **You MUST insert a short break (5-15 minutes) after every task.** For tasks longer than 90 minutes, consider a slightly longer break (15-20 minutes) afterward. Do not schedule any two tasks back-to-back without a break. Name the breaks "Short Break" or "Rest".
  3.  **Respect Time:** The entire schedule, including tasks and breaks, must fit between the start and end times.
  4.  **Format:** The output must be a valid JSON object with a "schedule" array.

  Example of a correct output with breaks:
  {
    "schedule": [
      { "name": "High Priority Task", "startTime": "09:00", "endTime": "10:30" },
      { "name": "Short Break", "startTime": "10:30", "endTime": "10:45" },
      { "name": "Medium Priority Task", "startTime": "10:45", "endTime": "11:45" }
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
