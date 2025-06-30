# Day Weaver: System Logic Documentation

This document explains the core logic behind the **Points System** and the **Overdue Task Notification System** in the Day Weaver application.

---

## 1. Points System

The points system provides positive reinforcement for completing tasks and a small penalty for ignoring overdue ones. The state is managed in `src/app/page.tsx`.

### Point Gains (+1)

-   **Trigger**: A user gains one point every time a task's `isCompleted` status is changed to `true`.
-   **Implementation**: This is handled inside the `handleToggleComplete` function. When a task is marked as complete, `points.gains` is incremented.
-   **Bonus**: A confetti animation (`runConfetti()`) is also triggered for extra positive feedback.

### Point Losses (-1)

-   **Trigger**: A user loses one point **only** when they dismiss an overdue task warning toast *without* having first completed the task.
-   **Implementation**: This logic resides in the `handleToastDismiss` function, which is called via the `onOpenChange` callback of the overdue warning toast. When the toast is closed, the system checks if the associated task is still incomplete. If it is, `points.losses` is incremented, and the task's `isMissed` flag is set to `true`.

---

## 2. Overdue Task Notification System

This system ensures users are actively notified of tasks that have passed their scheduled end time.

### Key `Task` Properties

The logic relies on several optional flags on the `Task` interface:

```typescript
interface Task {
  // ...
  isCompleted?: boolean;
  isMissed?: boolean;
  overdueNotified?: boolean; // System's "memory" to prevent duplicate warnings.
}
```

### The Logic Flow (within `src/app/page.tsx`)

1.  **Detection (`checkOverdueTasks`)**:
    -   This function is triggered by a `setInterval` that runs every minute.
    -   It filters the `tasks` state array to find all tasks that meet *all* of the following criteria:
        -   Have a scheduled `endTime`.
        -   The `endTime` is in the past.
        -   Are not yet completed (`!isCompleted`).
        -   Have not been marked as missed (`!isMissed`).
        -   Have **not** already been notified (`!overdueNotified`).

2.  **Marking for Notification**:
    -   For any newly overdue tasks found, their `overdueNotified` flag is immediately set to `true` and the `tasks` state is updated. This prevents them from being processed again in the next interval.

3.  **Displaying the Warning Toast**:
    -   A toast notification is created for each newly overdue task.
    -   **Persistence**: The toast is configured with `duration: Infinity`, meaning it will not disappear on its own and requires user interaction.
    -   **Style**: The toast uses the `destructive` variant for visual urgency.
    -   **Actions**: The toast has two main interaction points:
        -   **"Yes, I did!" Button (`ToastAction`):** This button's `onClick` handler calls `handleToggleComplete(task.id)`, which completes the task and awards a point. An internal flag (`actionedToastIds`) is set to prevent the `onOpenChange` callback from penalizing the user.
        -   **"Close" Button (X):** This is the default close button on the toast. Its behavior is managed by the `onOpenChange` callback.

4.  **Handling Dismissal (`handleToastDismiss`)**:
    -   This function is called when the toast is closed.
    -   It checks if the toast was closed via the "Yes, I did!" button. If not, it assumes the user clicked the "X" button.
    -   It finds the associated task and, if the task is still incomplete, it increments `points.losses` and sets the task's `isMissed` flag to `true`. This action is what marks a task as "missed" throughout the application.

This closed-loop system ensures that every overdue task is addressed by the user, either by marking it complete or by acknowledging that it was missed.
