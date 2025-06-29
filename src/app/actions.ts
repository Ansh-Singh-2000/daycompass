'use server';

import { generateFullSchedule, type GenerateFullScheduleInput } from '@/ai/flows/generate-full-schedule';
import { adjustSchedule, type AdjustScheduleInput } from '@/ai/flows/adjust-schedule-flow';

async function handleAIError(error: unknown) {
    let errorMessage = 'An unexpected error occurred with the AI. Please try again.';
    if (error instanceof Error) {
        errorMessage = `An AI error occurred: ${error.message}`;
    }
    console.error(error);
    return { success: false, error: errorMessage };
}

export async function createSchedule(input: GenerateFullScheduleInput) {
  try {
    const result = await generateFullSchedule(input);
    
    if (!result || !result.scheduledTasks || !result.reasoning) {
      throw new Error('AI returned an incomplete or invalid schedule object.');
    }
    
    if (result.scheduledTasks.length === 0 && input.tasks.length > 0) {
        throw new Error('AI failed to schedule any tasks. It may have determined no valid schedule was possible.');
    }
    
    return { success: true, data: result };

  } catch (error) {
    return handleAIError(error);
  }
}

export async function refineSchedule(input: AdjustScheduleInput) {
    try {
        const result = await adjustSchedule(input);

        if (!result || !result.scheduledTasks || !result.reasoning) {
            throw new Error('AI returned an incomplete or invalid adjusted schedule object.');
        }

        return { success: true, data: result };
    } catch (error) {
        return handleAIError(error);
    }
}
