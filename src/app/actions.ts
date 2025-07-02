'use server';

import { generateFullSchedule, type GenerateFullScheduleInput, type GenerateFullScheduleOutput } from '@/ai/flows/generate-full-schedule';
import { adjustSchedule, type AdjustScheduleInput, type AdjustScheduleOutput } from '@/ai/flows/adjust-schedule-flow';

type SuccessResponse<T> = { success: true; data: T };
type ErrorResponse = { success: false; error: string };

async function handleAIError(error: unknown): Promise<ErrorResponse> {
    let errorMessage = 'An unexpected error occurred with the AI. Please try again.';
    if (error instanceof Error) {
        if (error.message.includes('GROQ_API_KEY')) {
            errorMessage = 'The Groq API key is not configured. Please set it in your environment variables.';
        } else {
            errorMessage = `An AI error occurred: ${error.message}`;
        }
    }
    console.error(error);
    return { success: false, error: errorMessage };
}

export async function createSchedule(input: GenerateFullScheduleInput): Promise<SuccessResponse<GenerateFullScheduleOutput> | ErrorResponse> {
  try {
    const result = await generateFullSchedule(input);
    return { success: true, data: result };
  } catch (error) {
    return handleAIError(error);
  }
}

export async function refineSchedule(input: AdjustScheduleInput): Promise<SuccessResponse<AdjustScheduleOutput> | ErrorResponse> {
    try {
        const result = await adjustSchedule(input);
        return { success: true, data: result };
    } catch (error) {
        return handleAIError(error);
    }
}
