-- Supabase SQL: run in Supabase Studio > SQL Editor

CREATE TABLE IF NOT EXISTS comments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  article_id BIGINT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all comments"
ON comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments"
ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON comments FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_comments_article
ON comments(article_id, created_at ASC);
