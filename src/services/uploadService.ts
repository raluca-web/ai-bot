import { supabase } from '../lib/supabase';

export async function uploadDocument(file: File): Promise<void> {
  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are supported');
  }

  const formData = new FormData();
  formData.append('file', file);

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-document`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Failed to upload document');
  }

  const result = await response.json();
  return result;
}

export async function deleteDocument(documentId: string): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (error) throw error;

  const { error: embeddingError } = await supabase
    .from('document_embeddings')
    .delete()
    .eq('document_id', documentId);

  if (embeddingError) throw embeddingError;
}
