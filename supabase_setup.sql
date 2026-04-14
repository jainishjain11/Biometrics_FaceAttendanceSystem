-- Run this SQL in the Supabase SQL Editor BEFORE starting the backend.
-- It creates the pgvector RPC function used by the face recognition system.

-- 1. Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Ensure the face_data table has the correct embedding column
-- (Only run if you are creating the table fresh. Skip if it already exists.)

CREATE TABLE IF NOT EXISTS face_data (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  embedding   vector(512) NOT NULL,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS face_data_embedding_idx
  ON face_data USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);


-- 3. Create the match_face RPC function (REQUIRED)
CREATE OR REPLACE FUNCTION match_face(query_embedding vector(512), threshold float)
RETURNS TABLE(user_id uuid, score float) AS $$
  SELECT
    f.user_id,
    (1 - (f.embedding <=> query_embedding))::float AS score
  FROM face_data f
  WHERE (1 - (f.embedding <=> query_embedding)) > threshold
  ORDER BY f.embedding <=> query_embedding
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- 4. Grant execute to anon/authenticated roles
GRANT EXECUTE ON FUNCTION match_face(vector, float) TO anon;
GRANT EXECUTE ON FUNCTION match_face(vector, float) TO authenticated;
