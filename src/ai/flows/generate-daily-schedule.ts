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
  prompt: `You are an expert productivity coach. Your most important goal is to create a balanced, realistic, and sustainable study schedule that prevents burnout.

You will be given a list of tasks and a time window. Your job is to schedule these tasks within the given window.

Tasks to schedule:
{{#each tasks}}
- Name: {{name}}, Priority: {{priority}}, Duration: {{duration}} minutes
{{/each}}

Available time window:
- Start Time: {{timeConstraints.startTime}}
- End Time: {{timeConstraints.endTime}}

**CRITICAL RULES FOR A SMART & SUSTAINABLE SCHEDULE:**

1.  **ABSOLUTE TOP PRIORITY: PREVENT BURNOUT.** This is more important than finishing tasks quickly. The schedule MUST feel manageable and not overwhelming.

2.  **UTILIZE THE ENTIRE DAY.** Do not cram all tasks into the morning. Spread the tasks across the *entire* available time window, from \`startTime\` to \`endTime\`. There should be significant gaps, especially in the middle of the day.

3.  **CREATE STRATEGIC GAPS (BREAKS).** You **MUST NOT** create schedule items for breaks. Instead, create empty time gaps between scheduled tasks. The length of the gap should be proportional to the preceding task's length and intensity.
    -   After a standard task (60-90 mins), leave a gap of 15-20 minutes.
    -   After a long or high-priority task (over 90 mins), leave a substantial gap of at least 30-45 minutes.
    -   **MANDATORY LUNCH BREAK:** You **MUST** ensure there is a long, empty gap of 60-90 minutes around midday (e.g., between 12:00 and 14:00) for lunch. Do this even if it's not in the task list.

4.  **INTELLIGENT TASK PLACEMENT.**
    -   Place high-priority tasks during peak focus times (e.g., mid-morning or late afternoon).
    -   **NEVER** schedule more than two high-priority tasks back-to-back without a significant break. Mix in lower-priority tasks to vary the intensity.

5.  **FINAL OUTPUT FORMAT.** The output must be a valid JSON object with a single "schedule" array. This array should only contain the tasks provided in the input. **Do not add tasks named "Break" or "Lunch".**

Example of a good, spread-out schedule:
{
  "schedule": [
    { "name": "High Priority Task", "startTime": "09:00", "endTime": "10:30" },
    { "name": "Medium Priority Task", "startTime": "11:00", "endTime": "12:00" },
    { "name": "Another Task", "startTime": "13:30", "endTime": "15:00" },
    { "name": "Low Priority Task", "startTime": "16:00", "endTime": "16:45" }
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
