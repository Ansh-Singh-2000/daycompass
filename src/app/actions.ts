'use server';

import { generateFullSchedule, GenerateFullScheduleInput } from '@/ai/flows/generate-full-schedule';

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
    let errorMessage = 'Could not create a schedule. The AI may be busy or the request is invalid. Please check your tasks and try again.';
    
    if (error instanceof Error) {
      errorMessage = `Could not create a schedule. The AI may be busy or the request is invalid. Please check your tasks and try again. (Details: ${error.message})`;
    } else {
      errorMessage = 'An unknown and unexpected error occurred.';
    }
    
    return { success: false, error: errorMessage };
  }
}
