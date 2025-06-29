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
  prompt: `You are a world-class productivity and study coach. Your single most important mission is to design a daily study schedule that is smart, sustainable, and actively prevents student burnout.

You will be given a list of tasks with their duration and priority, and a time window. Your task is to create an optimized schedule.

Tasks to schedule:
{{#each tasks}}
- Name: {{name}}, Priority: {{priority}}, Duration: {{duration}} minutes
{{/each}}

Available time window:
- Start Time: {{timeConstraints.startTime}}
- End Time: {{timeConstraints.endTime}}

**MANDATORY, NON-NEGOTIABLE SCHEDULING DIRECTIVES:**

1.  **THE PRIME DIRECTIVE: AVOID BURNOUT AT ALL COSTS.** Every other rule serves this goal. The final schedule *must* feel balanced and manageable. A dense, back-to-back schedule is a failure.

2.  **NO CONTINUOUS STUDY FOR MORE THAN 2 HOURS.** You are strictly forbidden from scheduling tasks back-to-back if they result in more than 120 minutes of continuous work. After *any* task that is 90 minutes or longer, you **MUST** insert a significant gap of at least 30 minutes. After shorter tasks (less than 90 minutes), you **MUST** insert a gap of 15-20 minutes. This is not optional.

3.  **MANDATORY LUNCH BREAK.** You **MUST** ensure there is a long, empty gap of at least 60 minutes for lunch, sometime between 12:00 and 14:00. This is a hard requirement.

4.  **INTELLIGENT TASK DISTRIBUTION.**
    *   Spread tasks across the *entire* available time window from \`startTime\` to \`endTime\`. Do not cram tasks in one part of the day.
    *   Vary the intensity. Avoid placing two 'high' priority tasks next to each other, even with a short break. Mix in 'medium' or 'low' priority tasks between them.

5.  **OUTPUT FORMATTING.**
    *   The output must be a valid JSON object with a single "schedule" array.
    *   **CRITICAL: Do not create tasks named "Break" or "Lunch".** The breaks are the *empty spaces* between the scheduled tasks.

**EXAMPLE OF A CORRECTLY GENERATED SCHEDULE:**

This is what a successful schedule looks like. Notice the generous gaps.
{
  "schedule": [
    { "name": "Physics - Kinematics (2 hours)", "startTime": "09:00", "endTime": "11:00" },
    { "name": "Chemistry Revision (90 mins)", "startTime": "11:30", "endTime": "13:00" },
    { "name": "Mock Test Analysis (60 mins)", "startTime": "14:00", "endTime": "15:00" },
    { "name": "Maths Practice (2 hours)", "startTime": "15:15", "endTime": "17:15" }
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
