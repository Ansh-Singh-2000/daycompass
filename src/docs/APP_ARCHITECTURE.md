# Day Weaver: Application Architecture

This document provides a high-level overview of the Day Weaver application's architecture, focusing on its structure, state management, and core components.

---

## 1. Overall Philosophy

Day Weaver is a client-centric single-page application built with Next.js and React. Its primary features are:

-   **Client-Side Rendering**: The main page (`/`) is a client component (`'use client'`) to allow for rich, immediate user interactivity.
-   **Server Actions**: All communication with the backend AI logic is handled through Next.js Server Actions (`src/app/actions.ts`), providing a secure and efficient way to call server-side functions from the client without creating API endpoints.
-   **Component-Based UI**: The user interface is built with ShadCN UI components, promoting consistency and reusability.
-   **Local Persistence**: Application state (like tasks and settings) is persisted locally in the user's browser using cookies, making the app feel personal and stateful across sessions.

---

## 2. Key Directories

-   **/src/app/**: Contains the main page (`page.tsx`), global styles (`globals.css`), root layout (`layout.tsx`), and server actions (`actions.ts`).
-   **/src/components/**: Houses all UI components.
    -   **/ui/**: Contains the base, unstyled ShadCN components.
    -   **/day-weaver/**: Contains the custom, application-specific components that compose the UI.
-   **/src/ai/**: Contains all AI-related logic.
    -   **/flows/**: Holds the core functions that build prompts and interact with the Groq AI service.
    -   `genkit.ts`: Configures the Groq client.
    -   `schemas.ts`: Defines the Zod schemas for structured AI input and output.
-   **/src/lib/**: Contains utility functions (`utils.ts`), type definitions (`types.ts`), and cookie helpers (`cookies.ts`).
-   **/src/hooks/**: Contains custom React hooks, such as `use-mobile` and `use-toast`.

---

## 3. Core Component: `src/app/page.tsx`

This file is the heart of the application, acting as the central controller for state and logic.

### State Management (`useState`)

All application state is managed within this component using `useState` hooks.

-   **Persisted State**: State that needs to be remembered across sessions is initialized from cookies and saved back to cookies whenever it changes using a `useEffect` hook.
    -   `tasks`: The master list of all user tasks.
    -   `blockedTimes`: The user's recurring daily blocks.
    -   `startTime`, `endTime`, `wakeTime`, `sleepTime`: User's time preferences.
    -   `model`: The selected AI model.
    -   `points`: The user's score.
-   **Transient State**: State that is temporary and does not need to be saved.
    -   `isGenerating`, `isAdjusting`: Loading flags for AI interactions.
    -   `proposedSchedule`, `reasoning`: Holds the AI's proposed schedule and explanation during the adjustment flow.
    -   `isSettingsOpen`, `isAdjustDialogOpen`: Flags to control dialog visibility.

### Derived State (`useMemo`)

-   `scheduledTasksByDate`: A memoized computation that groups all scheduled tasks by date (`yyyy-MM-dd`). This is a performance optimization that prevents re-calculating the daily schedule on every render. It only re-runs when the master `tasks` array changes.

### Core Logic Functions

This component contains all the handler functions that drive the application's behavior.

-   `handleGenerateSchedule()`: Prepares the input for the AI and calls the `createSchedule` server action.
-   `handleAdjustSchedule()`: Called from the adjustment dialog to send a user's natural language request to the `refineSchedule` server action.
-   `handleApplySchedule()`: Takes the AI's proposed schedule and merges it into the main `tasks` state, updating or unscheduling tasks as needed.
-   `handleAddTask()`, `handleDeleteTask()`: Manages the user's task list.
-   `handleToggleComplete()`: Marks a task as complete and triggers the confetti animation.
-   `checkOverdueTasks()`: The core logic for the notification system, which runs on an interval to find and flag overdue tasks.

### Component Composition

The `Home` component renders all the major UI pieces, passing down the necessary state and callback functions as props. This "prop drilling" is acceptable here due to the co-location of state and logic in this single, central component.

---

## 4. Component Breakdown (`/src/components/day-weaver/`)

-   **Header.tsx**: Displays the app title and the user's points.
-   **TaskForm.tsx**: A controlled form (using `react-hook-form` and `zod`) for adding new tasks.
-   **TaskList.tsx**: Renders the list of `TaskItem` components.
-   **ScheduleCalendar.tsx**: The most complex UI component. It renders the hourly grid and positions scheduled tasks and blocked times on the calendar.
-   **SettingsDialog.tsx**: A dialog for managing user preferences like working hours and the AI model.
-   **AdjustScheduleDialog.tsx**: The interactive chat interface where users can modify the AI's proposed schedule.
