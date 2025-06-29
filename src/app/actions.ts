'use server';

import { generateFullSchedule, GenerateFullScheduleInput } from '@/ai/flows/generate-full-schedule';

export async function createSchedule(input: GenerateFullScheduleInput) {
  console.log("Attempting to create schedule with input:", JSON.stringify(input, null, 2));
  try {
    const schedules = await generateFullSchedule(input);
    
    if (!schedules || Object.keys(schedules).length === 0) {
      console.error('AI returned an empty or null schedule.');
      throw new Error('AI failed to generate a schedule or returned an empty schedule.');
    }
    
    console.log("Successfully generated schedule:", JSON.stringify(schedules, null, 2));
    return { success: true, data: schedules };
  } catch (error) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('!!!      ERROR GENERATING SCHEDULE      !!!');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    
    let errorMessage = 'Could not create a schedule. The AI may be busy or the request is invalid. Please check your tasks and try again.';
    
    if (error instanceof Error) {
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      if (error.message.includes('AI returned invalid JSON format')) {
        errorMessage = 'The AI returned a schedule in an unexpected format. Please try again.';
      }
    } else {
      console.error('An unexpected error object was thrown:', error);
    }
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    
    return { success: false, error: errorMessage };
  }
}
