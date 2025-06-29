# General Guide: Migrating a Next.js App from Genkit to Groq

This guide provides a general methodology for transitioning a Next.js application from using Google's Genkit framework to a direct integration with the Groq API. This approach increases flexibility, simplifies the stack, and provides more direct control over the AI interactions.

---

### Step 1: De-Integrate Genkit and Set Up Groq

The first step is to remove the Genkit abstraction layer and introduce the Groq SDK.

1.  **Update `package.json`**:
    *   Identify and **remove** all Genkit-related dependencies (e.g., `@google/genkit`, `genkit-tools`, `genkitx-googleai`).
    *   **Add** the Groq SDK dependency: `"groq-sdk": "^0.5.0"`.

2.  **Create a Centralized Groq Client**:
    *   Create a new file (e.g., `src/ai/groq.ts` or a similar location).
    *   In this file, instantiate and export the Groq client.
    *   Ensure the client is configured to use an API key from your environment variables (`.env` file). For security and clarity, throw a descriptive error if the `GROQ_API_KEY` is not set.

    ```typescript
    // Example: src/ai/groq.ts
    import Groq from 'groq-sdk';

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable not set.');
    }

    export const groq = new Groq({ apiKey });
    ```

---

### Step 2: Refactor AI Backend Logic

Convert Genkit "flows" into standard asynchronous functions.

1.  **Identify Flow Files**: Locate the files that use `ai.defineFlow` and `ai.definePrompt`.

2.  **Refactor into Async Functions**:
    *   Rewrite each flow as a standard `async` function (e.g., `export async function getAiResponse(input: MyInputType) {...}`).
    *   This function should now accept the desired `model` name as a string parameter within its input object.

3.  **Implement Direct API Call**:
    *   Inside your new function, build the prompt string that was previously defined in `ai.definePrompt`.
    *   Make a direct API call: `await groq.chat.completions.create({...})`.
    *   To ensure structured output, set `response_format: { type: 'json_object' }` in the API call parameters.

4.  **Sanitize the AI Response**:
    *   AI models can sometimes return non-JSON artifacts along with the response. Before parsing, always clean the response string. This is a critical step for robustness.
    *   A good practice is to use a regular expression to remove common patterns like XML-style "thinking" tags: `responseText.replace(/<think>[\s\S]*?<\/think>/, '').trim()`.

5.  **Add Safe JSON Parsing**:
    *   Wrap the `JSON.parse()` call in a `try...catch` block. If parsing fails, throw a new, more user-friendly error explaining that the AI returned an invalid format.

---

### Step 3: Implement a Flexible Frontend UI

Provide users with control over the AI model being used.

1.  **Create a Settings Component**:
    *   Build a settings component, such as a dialog, to house configuration options. Using tabs (`<Tabs>`) is a good way to organize settings if you have multiple categories (e.g., General, AI, Appearance).
    *   **To prevent the dialog from resizing** when switching tabs, apply a fixed height to the dialog's main content area and use flexbox properties (`flex-1`, `min-h-0`) on child containers to manage space. Use a `<ScrollArea>` for any content that might overflow.

2.  **Implement a `Combobox` for Model Selection**:
    *   Instead of a simple dropdown, use a `Combobox` component for model selection. This gives users the flexibility to choose from a predefined list or type in a custom model name.
    *   The state for the selected model should be managed in a high-level component (like the main page) and passed down via props.

---

### Step 4: Enhance Client-Side Error Handling

The application must be resilient to partially incorrect data from the AI.

1.  **Isolate Parsing Logic**: When you receive a list of items from the AI (e.g., a schedule), do not process them all in one go. Loop through the list.

2.  **Use `try...catch` per Item**: Inside the loop, wrap the processing of *each individual item* in a `try...catch` block. This is especially important for operations that can fail, like parsing dates (`parseISO`) or validating data.

3.  **Collect and Report Errors**:
    *   If an item fails to process, `catch` the error. Instead of crashing, add the name or ID of the failed item to an array (e.g., `invalidItems`).
    *   Continue the loop to process the rest of the items.
    *   After the loop, check if the `invalidItems` array has any entries. If it does, use a toast notification to inform the user which specific items could not be processed. This provides a much better user experience than a full application crash.

---

### Step 5: Provide Visual Confirmation

Build user trust by showing that their settings are being applied.

1.  **Pass the Model Name**: Ensure the `model` name from your state is passed down to any component that displays AI-generated content.
2.  **Display the Active Model**: In the UI where the AI's output is shown (e.g., in a dialog header), add a small, non-intrusive text element that displays the name of the model used for that specific generation. Example: `<p>Generated with: <code>{modelUsed}</code></p>`. This provides clear and immediate feedback.
