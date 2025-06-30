# Day Weaver: AI Prompt Engineering Guide

This document provides a detailed breakdown of the prompt engineering strategies used in the Day Weaver application. The core of the AI's intelligence relies on carefully constructed prompts sent to the Groq API to ensure it returns structured, reliable, and helpful JSON data.

---

## Core Philosophy

Instead of complex backend logic, we use highly detailed, rule-based prompts to instruct a general-purpose Large Language Model (LLM). The key principles are:

1.  **Strict JSON Output**: The AI is commanded to return its response *only* as a JSON object that adheres to a provided Zod schema. This is non-negotiable.
2.  **Clear, Unambiguous Rules**: We define a set of "Golden Rules" that the AI must follow. These rules are written in simple language and cover all critical constraints of the scheduling problem.
3.  **Context is Everything**: The prompt provides the AI with all the necessary context in a well-structured format, including the full task list, user settings, and the current date/time.
4.  **Graceful Failure**: The AI is explicitly told how to handle situations where a user's request is impossible to fulfill. Instead of breaking the rules, it must explain its limitations in a friendly `reasoning` field.
5.  **Conversational Tone**: Prompts are tuned to encourage a helpful, friendly, and conversational tone from the AI, making it a more pleasant assistant.

---

## 1. Initial Schedule Generation (`generate-full-schedule.ts`)

### **Goal**
To take a list of tasks and user constraints and generate a complete, optimized, and valid daily schedule.

### **Key Prompt Components**

1.  **Primary Directive**: The prompt immediately establishes that the AI's only valid output is a JSON object matching the `GenerateFullScheduleOutputSchema`. The schema itself is stringified and included in the prompt, giving the AI a perfect template.

2.  **Scheduling Logic**: A step-by-step process is provided:
    *   **Prioritize**: Order tasks by deadline, then by priority.
    *   **Schedule**: Attempt to place every task.
    *   **Validate**: Ensure every placement follows the "Golden Rules".
    *   **Handle Overflows**: If a task cannot be scheduled, it must be omitted from the final `scheduledTasks` array, and the reason must be explained in the `reasoning` field.

3.  **The Golden Rules (Non-Negotiable)**: This is the most critical section.
    *   **Time Accuracy**: The task's duration must be exact.
    *   **No Overlapping**: Tasks cannot overlap with each other or blocked times.
    *   **In-Bounds**: Tasks must fall within the user's defined "working hours".
    *   **Meet Deadlines**: Tasks must be scheduled before their deadline.
    *   **Valid ISO 8601 Format**: All date-time strings must be in the correct format.
    *   **Schedule in the Future**: No tasks can be scheduled in the past.

4.  **Tone and Explanation**: The AI is instructed to provide a friendly summary of its work in the `reasoning` field.

---

## 2. Schedule Adjustment & Conversation (`adjust-schedule-flow.ts`)

### **Goal**
To intelligently modify an existing schedule based on a user's natural language request, or to engage in helpful conversation without changing the schedule.

### **Key Prompt Components**

1.  **Two Modes of Operation**: The prompt explicitly defines two distinct modes to handle the ambiguity of user input.

    *   **Mode 1: Schedule Modification**: Triggered by clear instructions (e.g., "move physics to 7pm").
        - The AI must generate a *new, complete schedule* incorporating the change.
        - It must rigorously validate the new schedule against the Golden Rules.
        - **Crucially**, if the request is impossible (e.g., conflicts with a blocked time), the AI is instructed *not* to make the change. It must keep the schedule identical to the input and use the `reasoning` field to explain why it couldn't fulfill the request (e.g., "I'd love to move that for you, but it looks like that time is already taken...").

    *   **Mode 2: Casual Conversation**: Triggered by questions or vague comments (e.g., "why is this scheduled then?", "looks good").
        - The AI is commanded **not to change the schedule**.
        - Its JSON output's `scheduledTasks` field *must* be identical to the input it received.
        - It uses the `reasoning` field to provide a helpful, conversational response.

2.  **Reinforced Golden Rules**: The same set of Golden Rules from the generation prompt are included to ensure consistency and correctness during modifications.

3.  **Context**: The prompt is given the user's request, the current schedule JSON, and all the original constraints, providing everything it needs to make an informed decision.
