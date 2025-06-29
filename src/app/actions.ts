'use server';

import { generateFullSchedule, type GenerateFullScheduleInput } from '@/ai/flows/generate-full-schedule';
import { adjustSchedule, type AdjustScheduleInput } from '@/ai/flows/adjust-schedule-flow';

async function handleAIError(error: unknown) {
    let errorMessage = 'An unexpected error occurred with the AI. Please try again.';
    if (error instanceof Error) {
        if (error.message.includes('GEMINI_API_KEY')) {
            errorMessage = 'The Gemini API key is not configured. Please set it in your environment variables.';
        } else {
            errorMessage = `An AI error occurred: ${error.message}`;
        }
    }
    console.error(error);
    return { success: false, error: errorMessage };
}

export async function createSchedule(input: GenerateFullScheduleInput) {
  try {
    const result = await generateFullSchedule(input);
    return { success: true, data: result };
  } catch (error) {
    return handleAIError(error);
  }
}

export async function refineSchedule(input: AdjustScheduleInput) {
    try {
        const result = await adjustSchedule(input);
        return { success: true, data: result };
    } catch (error) {
        return handleAIError(error);
    }
}
