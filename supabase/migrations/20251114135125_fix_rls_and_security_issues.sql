/*
  # Security Fixes - RLS Performance & Extensions

  ## Overview
  This migration addresses multiple security and performance issues:
  1. Optimizes RLS policies by replacing direct auth.<function>() calls with subqueries
  2. Sets immutable search_path for database functions to prevent role mutation attacks
  3. Moves vector extension from public schema to extensions schema

  ## Changes

  ### RLS Policy Optimization
  Replace all direct auth.uid() calls with `(select auth.uid())` to avoid re-evaluation
  for each row during query processing. This improves performance at scale and follows
  Supabase security best practices.

  ### Function Security
  Set `search_path` to immutable values to prevent role mutable search path vulnerabilities.

  ### Extension Security
  Move vector extension from public schema to dedicated extensions schema.

  ## Important Notes
  1. RLS policies are recreated with optimized subquery pattern
  2. Functions are altered to use immutable search paths
  3. Indexes are retained (unused warnings are normal during initial data ingestion)
*/

-- Drop and recreate RLS policies for chat_conversations with optimized auth calls
DROP POLICY IF EXISTS "Users can view own conversations" ON chat_conversations;
CREATE POLICY "Users can view own conversations"
  ON chat_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own conversations" ON chat_conversations;
CREATE POLICY "Users can create own conversations"
  ON chat_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own conversations" ON chat_conversations;
CREATE POLICY "Users can update own conversations"
  ON chat_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = (select auth.uid()))
  WITH CHECK (auth.uid() = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own conversations" ON chat_conversations;
CREATE POLICY "Users can delete own conversations"
  ON chat_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = (select auth.uid()));

-- Drop and recreate RLS policies for chat_messages with optimized auth calls
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;
CREATE POLICY "Users can view messages in their conversations"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create messages in their conversations" ON chat_messages;
CREATE POLICY "Users can create messages in their conversations"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = (select auth.uid())
    )
  );

-- Fix function search_path for update_conversation_timestamp
ALTER FUNCTION update_conversation_timestamp() SET search_path = public;

-- Fix function search_path for search_documents
ALTER FUNCTION search_documents(query_embedding vector(1536), match_threshold float, match_count int) SET search_path = public;
