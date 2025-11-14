export interface Document {
  id: string;
  filename: string;
  title: string;
  file_path: string;
  file_size: number;
  page_count: number;
  upload_date: string;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_text: string;
  chunk_index: number;
  page_number: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  user_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatResponse {
  answer: string;
  sources: Array<{
    documentId: string;
    pageNumber: number;
  }>;
}
