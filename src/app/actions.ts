'use server';

import { generateFullSchedule, type GenerateFullScheduleInput } from '@/ai/flows/generate-full-schedule';
import { adjustSchedule, type AdjustScheduleInput } from '@/ai/flows/adjust-schedule-flow';
import type { AIScheduledTask } from '@/ai/schemas';
import { differenceInMinutes, isBefore, parseISO } from 'date-fns';

async function handleAIError(error: unknown) {
    let errorMessage = 'An unexpected error occurred with the AI. Please try again.';
    if (error instanceof Error) {
        errorMessage = `An AI error occurred: ${error.message}`;
    }
    console.error(error);
    return { success: false, error: errorMessage };
}

function validateSchedule(
    scheduledTasks: AIScheduledTask[], 
    originalTasks: GenerateFullScheduleInput['tasks']
): string | null {
    if (!scheduledTasks) return null;

    // A schedule can be validly empty if there were no original tasks.
    if (scheduledTasks.length === 0 && originalTasks.length === 0) {
      return null;
    }
    
    // 1. Check if all tasks are scheduled
    if (scheduledTasks.length !== originalTasks.length) {
        const scheduledIds = new Set(scheduledTasks.map(t => t.id));
        const missingTasks = originalTasks.filter(t => !scheduledIds.has(t.id));
        if (missingTasks.length > 0) {
          return `AI failed to schedule all tasks. Missing: ${missingTasks.map(t => t.title).join(', ')}.`;
        }
    }

    // 2. Check for correct durations
    for (const task of scheduledTasks) {
        const originalTask = originalTasks.find(t => t.id === task.id);
        if (!originalTask) {
            return `AI scheduled a task with ID "${task.id}" that was not in the original task list.`;
        }
        
        const duration = differenceInMinutes(parseISO(task.endTime), parseISO(task.startTime));
        if (duration !== originalTask.estimatedTime) {
            return `AI scheduled "${task.title}" for ${duration} minutes, but it should be ${originalTask.estimatedTime} minutes.`;
        }
    }

    // 3. Check for overlaps
    const sortedTasks = [...scheduledTasks].sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime());
    for (let i = 0; i < sortedTasks.length - 1; i++) {
        const currentTask = sortedTasks[i];
        const nextTask = sortedTasks[i + 1];

        if (isBefore(parseISO(nextTask.startTime), parseISO(currentTask.endTime))) {
            return `AI created an overlapping schedule: "${currentTask.title}" ends at ${format(parseISO(currentTask.endTime), 'p')}, but "${nextTask.title}" starts at ${format(parseISO(nextTask.startTime), 'p')}.`;
        }
    }


    return null; // All checks passed
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

    const validationError = validateSchedule(result.scheduledTasks, input.tasks);
    if (validationError) {
        const errorMessage = `The AI generated an invalid schedule. Please try again. (Details: ${validationError})`;
        console.error("Schedule validation failed:", errorMessage);
        throw new Error(errorMessage);
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

        const validationError = validateSchedule(result.scheduledTasks, input.tasks);
        if (validationError) {
            const errorMessage = `The AI generated an invalid adjustment. Please try again. (Details: ${validationError})`;
            console.error("Schedule validation failed:", errorMessage);
            throw new Error(errorMessage);
        }

        return { success: true, data: result };
    } catch (error) {
        return handleAIError(error);
    }
}
