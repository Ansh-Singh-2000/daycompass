testtesttesttesttestteddst

# ✨ Day Compass ✨

**An intelligent daily planner that uses AI to help you chart the perfect day.**

Day Compass is a smart, interactive single-page application designed to help users, particularly students, manage their tasks and optimize their daily schedules. It leverages a powerful AI assistant to automatically generate and refine schedules based on task priority, duration, and deadlines, all while adapting to the user's personal constraints like working hours and recurring breaks.

---

## 🚀 Key Features

-   **🤖 AI-Powered Scheduling**: Automatically generates an optimized daily schedule from your task list, respecting your priorities and constraints.
-   **💬 Conversational Adjustments**: Modify your schedule using natural language. Just chat with the AI assistant to move tasks, add new ones, or ask questions.
-   **🗓️ Interactive Calendar View**: Visualize your entire day on a dynamic, hourly calendar that clearly shows scheduled tasks and blocked-off time.
-   **🏆 Gamified Task Management**: Stay motivated with a simple points system that rewards you for completing tasks and keeps track of missed ones.
-   **🔔 Overdue Task Notifications**: Get smart alerts for tasks that have passed their scheduled time, ensuring you never lose track.
-   **🎨 Customizable & Persistent**: Personalize your working hours, calendar display, and even the AI model used. All your tasks and settings are saved locally in your browser.
-   **📱 Responsive Design**: A clean, modern interface that works on both desktop and mobile devices.

---

## 🛠️ Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (with App Router)
-   **UI Library**: [React](https://reactjs.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
-   **AI**: [Groq API](https://groq.com/) for real-time inference
-   **State Management**: React Hooks (`useState`, `useEffect`, `useCallback`, etc.)
-   **Form Handling**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation

---

## ⚙️ Getting Started

### Prerequisites

-   Node.js (v18 or later recommended)
-   An API key from [Groq](https://console.groq.com/keys)

### Local Development

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your environment variables:**
    -   Create a new file named `.env` in the root of the project.
    -   Add your Groq API key to this file:
        ```
        GROQ_API_KEY="your-secret-groq-api-key"
        ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:9002`.

---

## 📚 Documentation

To help you understand, maintain, and extend this project, we've included comprehensive documentation on its architecture and logic.

-   **[Application Architecture](./src/docs/APP_ARCHITECTURE.md)**: A high-level overview of the project structure, state management, and component model.
-   **[AI Prompt Engineering](./src/docs/AI_PROMPT_ENGINEERING.md)**: A deep dive into how the AI prompts are constructed to ensure reliable and intelligent scheduling.
-   **[System Logic Guide](./src/docs/SYSTEM_LOGIC.md)**: An explanation of the core business logic, including the points system and overdue task notifications.
-   **[Deployment Guide](./src/docs/DEPLOYMENT.md)**: Step-by-step instructions on how to deploy this application to the web using Vercel.

---

Made with ❤️ by Ansh Singh
