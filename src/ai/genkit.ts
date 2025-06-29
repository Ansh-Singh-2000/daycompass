import Groq from 'groq-sdk';

// IMPORTANT: The user must add their GROQ_API_KEY to the .env file.
const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  // This error will be caught by the server action and displayed to the user.
  throw new Error('GROQ_API_KEY environment variable not set.');
}

export const groq = new Groq({
  apiKey,
});
