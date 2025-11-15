import { openai, assistantId } from '../lib/openai';
import type { ChatResponse } from '../types';

export async function sendMessage(message: string): Promise<ChatResponse> {
  if (!assistantId || assistantId === 'your-assistant-id-here') {
    throw new Error('Assistant ID not configured. Please set VITE_ASSISTANT_ID in .env file');
  }

  const thread = await openai.beta.threads.create();

  await openai.beta.threads.messages.create(thread.id, {
    role: 'user',
    content: message,
  });

  const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
    assistant_id: assistantId,
  });

  if (run.status !== 'completed') {
    throw new Error(`Run failed with status: ${run.status}`);
  }

  const messages = await openai.beta.threads.messages.list(thread.id);
  const lastMessage = messages.data[0];

  if (!lastMessage || lastMessage.role !== 'assistant') {
    throw new Error('No assistant response received');
  }

  const textContent = lastMessage.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in assistant response');
  }

  return {
    answer: textContent.text.value,
    sources: [],
  };
}
