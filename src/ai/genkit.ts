import { GoogleGenerativeAI } from '@google/generative-ai';

// IMPORTANT: The user must add their GEMINI_API_KEY to the .env file.
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  // This error will be caught by the server action and displayed to the user.
  throw new Error('GEMINI_API_KEY environment variable not set.');
}

const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash-latest',
});
