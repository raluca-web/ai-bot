import { supabase } from '../lib/supabase';
import type { ChatResponse } from '../types';

export async function sendMessage(question: string): Promise<ChatResponse> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get response');
  }

  return await response.json();
}

export async function fetchDocuments() {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('upload_date', { ascending: false });

  if (error) throw error;
  return data;
}
