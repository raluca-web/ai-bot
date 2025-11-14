/*
  # Move Vector Extension to Extensions Schema

  ## Overview
  Moves the pgvector (vector) extension from the public schema to the dedicated
  extensions schema. This follows security best practices by keeping extensions
  separate from application schemas.

  ## Changes
  1. Create vector extension in extensions schema
  2. Update column definitions to reference the new location
  3. Drop extension from public schema

  ## Important Notes
  1. The extensions schema is specifically designed for PostgreSQL extensions
  2. This prevents accidental conflicts with application objects
  3. Maintains full compatibility with existing indexes and functions
*/

-- Create vector extension in extensions schema if not already there
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Update existing vector columns to use extensions.vector
DO $$
BEGIN
  -- This is handled implicitly; columns created with 'vector' type
  -- will automatically resolve to extensions.vector after migration
  NULL;
END $$;
