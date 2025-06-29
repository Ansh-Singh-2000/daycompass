'use server';

import { generateDailySchedule, GenerateDailyScheduleInput } from '@/ai/flows/generate-daily-schedule';

export async function createSchedule(input: GenerateDailyScheduleInput) {
  try {
    const { schedule } = await generateDailySchedule(input);
    if (!schedule) {
      throw new Error('AI failed to generate a schedule.');
    }
    return { success: true, data: schedule };
  } catch (error) {
    console.error('Error generating schedule:', error);
    // In a real app, you might want to log this error to a monitoring service.
    // Return a user-friendly error message.
    return { success: false, error: 'Could not create a schedule. The AI may be busy or the request is invalid. Please check your tasks and try again.' };
  }
}
