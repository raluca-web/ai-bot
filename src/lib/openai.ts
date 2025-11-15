import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey || apiKey === 'your-openai-api-key-here') {
  console.warn('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in .env file');
}

export const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true
});

export const assistantId = import.meta.env.VITE_ASSISTANT_ID;
