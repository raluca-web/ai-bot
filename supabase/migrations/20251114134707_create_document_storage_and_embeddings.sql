/*
  # AI Document Q&A System - Database Schema

  ## Overview
  This migration sets up a complete system for storing PDF documents and their vectorized content
  to enable AI-powered question answering with semantic search capabilities.

  ## New Tables
  
  ### `documents`
  Stores metadata about uploaded PDF documents
  - `id` (uuid, primary key) - Unique identifier for each document
  - `filename` (text) - Original name of the PDF file
  - `title` (text) - Human-readable title extracted or provided
  - `file_path` (text) - Storage path in Supabase Storage
  - `file_size` (bigint) - Size of file in bytes
  - `page_count` (integer) - Number of pages in the PDF
  - `upload_date` (timestamptz) - When the document was uploaded
  - `created_at` (timestamptz) - Record creation timestamp
  
  ### `document_chunks`
  Stores text chunks extracted from documents with vector embeddings for semantic search
  - `id` (uuid, primary key) - Unique identifier for each chunk
  - `document_id` (uuid, foreign key) - Reference to parent document
  - `chunk_text` (text) - The actual text content of this chunk
  - `chunk_index` (integer) - Sequential position within the document
  - `page_number` (integer) - Page number where this chunk appears
  - `embedding` (vector(1536)) - OpenAI embedding vector for semantic search
  - `created_at` (timestamptz) - Record creation timestamp
  
  ### `chat_conversations`
  Stores conversation history for each user session
  - `id` (uuid, primary key) - Unique identifier for the conversation
  - `user_id` (uuid) - Reference to authenticated user (nullable for anonymous)
  - `title` (text) - Auto-generated or user-provided conversation title
  - `created_at` (timestamptz) - When conversation started
  - `updated_at` (timestamptz) - Last message timestamp
  
  ### `chat_messages`
  Stores individual messages within conversations
  - `id` (uuid, primary key) - Unique identifier for the message
  - `conversation_id` (uuid, foreign key) - Reference to parent conversation
  - `role` (text) - Either 'user' or 'assistant'
  - `content` (text) - The message text
  - `created_at` (timestamptz) - Message timestamp

  ## Extensions
  - `vector` - Enables vector data type and similarity search operations

  ## Indexes
  - HNSW index on embeddings for fast similarity search
  - Index on document_id for efficient chunk retrieval
  - Index on conversation_id for message history queries

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Public read access to documents and chunks (knowledge base is public)
  - Users can only access their own conversations and messages
  - Anonymous users can read documents but cannot save conversations

  ## Important Notes
  1. Vector dimension is 1536 (OpenAI text-embedding-3-small model)
  2. Chunks are created with overlap to maintain context continuity
  3. All timestamps use UTC timezone
  4. Foreign key constraints ensure referential integrity
*/

-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  title text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  page_count integer NOT NULL DEFAULT 0,
  upload_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Document chunks with embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_text text NOT NULL,
  chunk_index integer NOT NULL,
  page_number integer NOT NULL,
  embedding vector(1536),
  created_at timestamptz DEFAULT now()
);

-- Chat conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text DEFAULT 'New Conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);

-- Create HNSW index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks 
USING hnsw (embedding vector_cosine_ops);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents (public read)
CREATE POLICY "Anyone can view documents"
  ON documents FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can upload documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for document_chunks (public read)
CREATE POLICY "Anyone can view document chunks"
  ON document_chunks FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create chunks"
  ON document_chunks FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for chat_conversations
CREATE POLICY "Users can view own conversations"
  ON chat_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON chat_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON chat_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON chat_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their conversations"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

-- Function to update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp on new message
CREATE TRIGGER update_conversation_timestamp_trigger
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();