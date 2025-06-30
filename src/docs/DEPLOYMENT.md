# How to Deploy to Vercel

Vercel is a platform from the creators of Next.js that is specifically designed for hosting Next.js applications. It offers a fast and easy way to get your app online.

### Prerequisites

1.  **A Vercel Account:** If you don't have one, you can sign up for a free account at [vercel.com](https://vercel.com).
2.  **A Git Repository:** Your project code must be hosted on a Git provider like [GitHub](https://github.com), [GitLab](https://gitlab.com), or [Bitbucket](https://bitbucket.org).

---

### Step 1: Push Your Project to a Git Repository

If you haven't already, make sure your project code is pushed to a remote Git repository.

---

### Step 2: Create a New Project on Vercel

1.  Go to your **Vercel Dashboard**.
2.  Click the **"Add New..."** button and select **"Project"**.
3.  The **"Import Git Repository"** screen will appear. Find your project's repository and click the **"Import"** button next to it.
    *   If you haven't connected your Git provider to Vercel yet, it will prompt you to do so.

---

### Step 3: Configure Your Project

Vercel is excellent at automatically detecting Next.js projects, so you usually don't need to change any build settings. The most important step here is to add your secret API key.

1.  After importing, you'll see a **"Configure Project"** screen.
2.  Expand the **"Environment Variables"** section.
3.  This is where you'll add your Groq API key.
    *   **Name:** `GROQ_API_KEY`
    *   **Value:** Paste your secret API key here.
4.  Click **"Add"** to save the environment variable. This keeps your key secure and out of your public code.

![Vercel Environment Variable Setup](https://placehold.co/800x400.png)
*A visual guide to adding an environment variable on Vercel.*

---

### Step 4: Deploy

1.  Once you've added the environment variable, simply click the **"Deploy"** button.
2.  Vercel will start the build process. You can watch the progress in the build logs.
3.  When it's finished, you'll see a confetti celebration, and your site will be live! Vercel will provide you with the public URL.

From now on, every time you push a new commit to your main branch, Vercel will automatically redeploy the site with the latest changes.

Congratulations on your new app!
