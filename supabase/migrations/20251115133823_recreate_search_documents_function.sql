/*
  # Recreate search_documents function

  1. Changes
    - Drop old search_documents function if exists
    - Create new version that works with document_embeddings table
    - Returns matching chunks with metadata for the chat function
*/

DROP FUNCTION IF EXISTS search_documents(vector, float, int);

CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  document_id uuid,
  content text,
  chunk_index int,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    document_id,
    content,
    chunk_index,
    1 - (embedding <=> query_embedding) as similarity
  FROM document_embeddings
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;