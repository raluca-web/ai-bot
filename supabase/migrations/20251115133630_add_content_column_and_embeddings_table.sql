/*
  # Add content column and create embeddings table

  1. Changes
    - Add `content` column to documents table to store extracted text
    - Create `document_embeddings` table for vector embeddings
    - Add RLS policies for secure access
    
  2. Security
    - Enable RLS on document_embeddings table
    - Add policies for public read access (as this is a demo app)
*/

-- Add content column to documents table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'content'
  ) THEN
    ALTER TABLE documents ADD COLUMN content text;
  END IF;
END $$;

-- Create document_embeddings table
CREATE TABLE IF NOT EXISTS document_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content text NOT NULL,
  embedding vector(1536),
  chunk_index integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (demo app)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'document_embeddings' AND policyname = 'Allow public read access'
  ) THEN
    CREATE POLICY "Allow public read access"
      ON document_embeddings FOR SELECT
      USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'document_embeddings' AND policyname = 'Allow public insert access'
  ) THEN
    CREATE POLICY "Allow public insert access"
      ON document_embeddings FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;