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
  z.string(), // Loosened validation to prevent crashes from minor AI formatting deviations.
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
  prompt: `You are an AI scheduling assistant. Your task is to generate a multi-day schedule based on a list of tasks and constraints. You must schedule ALL tasks provided.

**INPUT DATA:**
- **Tasks (JSON):** {{{tasksAsJson}}}
- **Start Date:** {{startDate}}
- **Daily Time Window:** {{timeConstraints.startTime}} to {{timeConstraints.endTime}}
- **Current DateTime:** {{currentDateTime}}

**RULES (STRICTLY ENFORCED):**
1.  **Output Format:** Your output MUST be a valid JSON object. The keys MUST be date strings in "YYYY-MM-DD" format. The values MUST be an array of task objects scheduled for that day.
2.  **Schedule All Tasks:** Every task from the input JSON must be scheduled.
3.  **Deadlines are Absolute:** A task must be scheduled on or before its deadline. Tasks with earlier deadlines have higher priority.
4.  **No Overlapping:** Tasks on any given day MUST NOT overlap. There must be a gap between the end time of one task and the start time of the next.
5.  **Burnout Prevention:**
    - Insert breaks between tasks. A 15-20 minute gap for tasks under 90 minutes, and a 30+ minute gap for tasks 90 minutes or longer.
    - No more than 2 hours of continuous scheduled work is allowed.
    - A mandatory 60-minute break must be scheduled between 12:00 and 14:00 on every day that contains tasks. Do not schedule any tasks during this time.
6.  **Load Balancing:** Distribute tasks across multiple days if their deadlines permit. Avoid cramming all work into the first few days.
7.  **No Invented Tasks:** The output schedule must ONLY contain tasks from the input list. Do NOT create tasks named "Break," "Lunch," "Rest," etc. The breaks are the empty time between scheduled tasks.

Your entire response must be ONLY the JSON object, without any surrounding text, explanations, or markdown formatting like \`\`\`json.
`,
});

const generateFullScheduleFlow = ai.defineFlow(
  {
    name: 'generateFullScheduleFlow',
    inputSchema: GenerateFullScheduleInputSchema,
    outputSchema: GenerateFullScheduleOutputSchema,
  },
  async (input) => {
    const response = await prompt(input);
    const rawOutput = response.text;

    console.log('--- AI RAW OUTPUT ---');
    console.log(rawOutput);
    console.log('---------------------');
    
    try {
      // Find the JSON block within the raw output, even if there's text around it.
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON object found in the AI response.');
        throw new Error('AI returned invalid JSON format.');
      }
      
      const jsonString = jsonMatch[0];
      const parsedJson = JSON.parse(jsonString);
      const validatedOutput = GenerateFullScheduleOutputSchema.parse(parsedJson);
      return validatedOutput;
    } catch (e) {
      console.error('Failed to parse or validate AI output.', e);
      console.error('Original AI output was:', rawOutput);
      throw new Error('AI returned invalid JSON format.');
    }
  }
);
