# Day Compass: System Logic Documentation

This document explains the core logic behind the **Points System** and the **Toast Warning System** in the Day Compass application. This can be used as a reference for implementing similar features in other projects.

## Core Components

The logic is primarily managed within the `useTasks` custom hook (`src/hooks/use-tasks.ts`). It interacts with the `useToast` hook (`src/hooks/use-toast.ts`) to display notifications.

## 1. Points System

The points system is designed to provide positive reinforcement for completing tasks and a small penalty for ignoring overdue ones.

### Point Gains (+1)

- **Trigger:** A user gains one point every time a task's status is changed from incomplete to complete.
- **Implementation:** This is handled inside the `toggleTaskDone` function. When a task is marked as done, `points.gains` is incremented.
- **Bonus:** If the completed task has a `high` priority, a confetti animation (`runConfetti()`) is also triggered for extra positive feedback.

### Point Losses (-1)

- **Trigger:** A user loses one point **only** when they dismiss an overdue task warning toast *without* completing the task.
- **Implementation:** This is handled in the `onOpenChange` callback of the overdue warning toast. When the toast is closed, the system checks if the associated task is still incomplete. If it is, `points.losses` is incremented.

## 2. Toast Warning System

This system ensures users are actively notified of tasks that have passed their scheduled time.

### Key Data Structure

The `Task` interface includes an optional flag:
```typescript
interface Task {
  // ... other properties
  overdueNotified?: boolean;
}
```
This `overdueNotified` flag is the system's "memory." It prevents the app from sending repeated warnings for the same overdue task.

### The Logic Flow

1.  **Detection (`checkOverdueTasks`):**
    - A check runs every minute (`setInterval`) and also once when the app first loads.
    - It filters the task list to find tasks that meet all of the following criteria:
        - Are not done (`!task.isDone`).
        - Have a scheduled time (`!!task.scheduledTime`).
        - Their scheduled end time (`scheduledTime` + `estimatedTime`) is in the past.
        - Have **not** already been notified (`!task.overdueNotified`).

2.  **Displaying the Warning:**
    - For each task found in the detection step, a toast notification is created.
    - **Persistence:** The toast is configured with `duration: Infinity`. This is crucial, as it forces the user to interact with it. The warning will not disappear on its own.
    - **Style:** The toast uses the `destructive` variant to make it look like a clear warning.
    - **Actions:** The toast has two main interaction points:
        - **"Yes, I did!" Button (`ToastAction`):** This button's `onClick` handler calls `toggleTaskDone(task.id)`, which completes the task and awards a point.
        - **"Close" Button (X):** This is the default close button on the toast. Its behavior is managed by the `onOpenChange` callback.

3.  **Handling User Interaction (`onOpenChange` callback):**
    - This callback is the most critical part of the logic. It's triggered when the toast is about to be closed for any reason (clicking "Yes, I did!", clicking the "X", or programmatically).
    - When it runs, it performs these steps:
        - **Check Task Status:** It re-checks the *current* status of the task.
        - **Apply Penalty:** If the task is *still* not done, it means the user clicked the "X" to dismiss the warning without completing the task. The system increments `points.losses`.
        - **Set the Flag:** Regardless of whether a penalty was applied or the task was completed, the system now sets `overdueNotified: true` on the task.

4.  **Persistence:**
    - The entire list of tasks, including the updated `overdueNotified` flags, is saved to a browser cookie (`dayCompassTasks`).
    - When the app is reloaded, it loads this cookie. Because the dealt-with tasks now have `overdueNotified: true`, the detection logic in step 1 will skip them, preventing another warning.
