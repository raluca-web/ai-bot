/*
  # Move Vector Extension from Public to Extensions Schema

  ## Overview
  Properly relocates the pgvector extension from the public schema to the extensions
  schema using ALTER EXTENSION SET SCHEMA command. This is the correct approach for
  moving an already installed extension.

  ## Changes
  1. Alter vector extension schema from public to extensions
  2. Update search_path for functions to include extensions schema

  ## Important Notes
  1. This command moves all extension objects (types, functions, operators) automatically
  2. Existing tables and indexes continue to work without modification
  3. The vector data type remains accessible but is now in extensions schema
*/

-- Move vector extension to extensions schema
ALTER EXTENSION vector SET SCHEMA extensions;

-- Update search_path for functions to ensure they can find vector type
ALTER FUNCTION search_documents(query_embedding vector(1536), match_threshold float, match_count int) 
SET search_path = public, extensions;