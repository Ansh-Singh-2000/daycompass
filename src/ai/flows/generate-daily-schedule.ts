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
  prompt: `You are an expert productivity coach specializing in creating balanced and sustainable study schedules for students to prevent burnout. Your primary goal is to generate an optimized daily schedule based on the provided tasks and time constraints.

  Tasks to schedule:
  {{#each tasks}}
  - Name: {{name}}, Priority: {{priority}}, Duration: {{duration}} minutes
  {{/each}}
  
  Available time window:
  - Start Time: {{timeConstraints.startTime}}
  - End Time: {{timeConstraints.endTime}}
  
  **CRITICAL INSTRUCTIONS FOR A REALISTIC & SUSTAINABLE SCHEDULE:**
  
  1.  **No Burnout:** Your main priority is to create a schedule that is effective but also prevents student burnout. This means you should distribute tasks throughout the entire available time window, not just lump them all together.
  2.  **Strategic Gaps (Breaks):** Instead of creating schedule items for breaks (e.g., "Short Break"), you **MUST** create empty time gaps between tasks.
      -   After a task of 60-90 minutes, leave a gap of 15-20 minutes.
      -   After a task longer than 90 minutes, leave a longer gap of at least 30-45 minutes.
      -   Consider including a longer break of about 60-90 minutes around midday (e.g., between 12:00 and 14:00) for lunch, even if it's not in the task list.
  3.  **Prioritization:** Schedule high-priority tasks during times when a student is likely to be most productive (e.g., morning or early afternoon), but don't schedule all high-priority tasks back-to-back.
  4.  **Respect Time Constraints:** The entire schedule of tasks must fit between the provided startTime and endTime. The schedule should utilize the available time, not just the first few hours.
  5.  **Output Format:** The output must be a valid JSON object containing only a "schedule" array. The array should only contain the tasks provided in the input. **Do not add tasks for breaks.**
  
  Example of a correct output with gaps (no break tasks):
  {
    "schedule": [
      { "name": "High Priority Task", "startTime": "09:00", "endTime": "10:30" },
      { "name": "Medium Priority Task", "startTime": "11:00", "endTime": "12:00" },
      { "name": "Another Task", "startTime": "14:00", "endTime": "15:30" }
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
