/*
  # Make file_path nullable in documents table

  1. Changes
    - Alter `documents.file_path` column to allow NULL values
    - This allows document uploads without requiring file storage
    - The file content is stored in the `content` column instead
*/

ALTER TABLE documents 
ALTER COLUMN file_path DROP NOT NULL;
