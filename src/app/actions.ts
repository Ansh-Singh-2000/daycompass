'use server';

import { generateFullSchedule, GenerateFullScheduleInput } from '@/ai/flows/generate-full-schedule';

export async function createSchedule(input: GenerateFullScheduleInput) {
  console.log("==========================================");
  console.log("=== `createSchedule` SERVER ACTION START ===");
  console.log("==========================================");
  console.log("Received input:", JSON.stringify(input, null, 2));

  try {
    console.log("Calling `generateFullSchedule`...");
    const schedules = await generateFullSchedule(input);
    console.log("`generateFullSchedule` returned successfully.");
    
    if (!schedules || Object.keys(schedules).length === 0) {
      console.error('Validation Error: AI returned an empty or null schedule.');
      throw new Error('AI failed to generate a schedule or returned an empty schedule.');
    }
    
    console.log("Successfully processed schedule:", JSON.stringify(schedules, null, 2));
    console.log("==========================================");
    console.log("=== `createSchedule` SERVER ACTION END (SUCCESS) ===");
    console.log("==========================================");
    return { success: true, data: schedules };

  } catch (error) {
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("!!!   ERROR IN `createSchedule` ACTION    !!!");
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    
    let errorMessage = 'Could not create a schedule. The AI may be busy or the request is invalid. Please check your tasks and try again.';
    
    if (error instanceof Error) {
      console.error('ERROR NAME:', error.name);
      console.error('ERROR MESSAGE:', error.message);
      console.error('ERROR STACK:', error.stack);
      errorMessage = `Could not create a schedule. The AI may be busy or the request is invalid. Please check your tasks and try again. (Details: ${error.message})`;
    } else {
      console.error('An unexpected non-Error object was thrown:', error);
      errorMessage = 'An unknown and unexpected error occurred.';
    }

    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.log("==========================================");
    console.log("=== `createSchedule` SERVER ACTION END (FAILURE) ===");
    console.log("==========================================");
    
    return { success: false, error: errorMessage };
  }
}
