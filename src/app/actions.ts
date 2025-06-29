'use server';

import { generateFullSchedule, GenerateFullScheduleInput } from '@/ai/flows/generate-full-schedule';

export async function createSchedule(input: GenerateFullScheduleInput) {
  try {
    const schedules = await generateFullSchedule(input);
    if (!schedules || Object.keys(schedules).length === 0) {
      throw new Error('AI failed to generate a schedule or returned an empty schedule.');
    }
    return { success: true, data: schedules };
  } catch (error) {
    console.error('Error generating schedule:', error);
    // In a real app, you might want to log this error to a monitoring service.
    // Return a user-friendly error message.
    return { success: false, error: 'Could not create a schedule. The AI may be busy or the request is invalid. Please check your tasks and try again.' };
  }
}
